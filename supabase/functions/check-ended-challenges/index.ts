// @ts-nocheck - Deno runtime (Supabase Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// How many hours before end_date we settle hold payments early.
// Stripe holds expire exactly 7 days after creation. Our authorize cron runs at :30
// and our settle cron runs at :00, so in the worst case settlement runs ~30 min after
// the hold expires. Settling 2 hours early gives a safe buffer while keeping the
// window short enough that completion data is effectively final.
const EARLY_SETTLE_HOURS = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const nowISO = now.toISOString();

    // Two hours into the future — used to early-settle holds before they expire.
    const settleWindowISO = new Date(now.getTime() + EARLY_SETTLE_HOURS * 60 * 60 * 1000).toISOString();

    console.log(`🔍 Running check-ended-challenges at ${nowISO}`);
    console.log(`   Settling holds for challenges ending before: ${settleWindowISO}`);

    // ─── Phase 1: Early payment settlement ───────────────────────────────────
    // Find challenges that end within the next 2 hours (or have already ended)
    // and still have unsettled hold-based participants.
    // settle-challenge-payments is idempotent (skips payment_settled = true rows),
    // so it is safe to call early and again when the challenge officially closes.
    const { data: challengesToSettle, error: settleQueryError } = await supabase
      .from('challenges')
      .select('id, title, end_date')
      .lte('end_date', settleWindowISO)   // ends within the next 2 hours (or already ended)
      .is('approval_status', null)
      .in('status', ['upcoming', 'active']);

    if (settleQueryError) {
      console.error('Error fetching challenges for early settlement:', settleQueryError);
    } else if (challengesToSettle && challengesToSettle.length > 0) {
      console.log(`💳 Found ${challengesToSettle.length} challenge(s) needing hold settlement`);

      for (const challenge of challengesToSettle) {
        const minutesUntilEnd = Math.round((new Date(challenge.end_date).getTime() - now.getTime()) / 60000);
        const label = minutesUntilEnd > 0
          ? `ends in ${minutesUntilEnd} min (early settle)`
          : `ended ${Math.abs(minutesUntilEnd)} min ago`;

        try {
          const settleResponse = await fetch(
            `${supabaseUrl}/functions/v1/settle-challenge-payments`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ challengeId: challenge.id }),
            }
          );
          const settleResult = await settleResponse.json();
          if (settleResult.settled > 0) {
            console.log(`💳 Settled ${settleResult.settled} hold(s) for "${challenge.title}" (${label}):`, {
              winners: settleResult.winners,
              losers: settleResult.losers,
              totalCaptured: settleResult.totalCaptured,
            });
          } else {
            console.log(`ℹ️ No unsettled holds for "${challenge.title}" (${label})`);
          }
        } catch (settleErr: any) {
          console.error(`⚠️ Early settlement failed for "${challenge.title}":`, settleErr.message);
        }
      }
    }

    // ─── Phase 2: Close challenges that have officially ended ─────────────────
    // Mark as pending admin review. Payment settlement above will have already
    // run (or will run in the same pass for challenges that just ended).
    const { data: endedChallenges, error } = await supabase
      .from('challenges')
      .select('id, title, end_date, status')
      .lt('end_date', nowISO)
      .is('approval_status', null)
      .in('status', ['upcoming', 'active', 'completed']);

    if (error) {
      console.error('Error fetching ended challenges:', error);
      throw error;
    }

    if (!endedChallenges || endedChallenges.length === 0) {
      console.log('✅ No challenges need to be marked for review');
      return new Response(
        JSON.stringify({ success: true, message: 'No challenges to process', settled: challengesToSettle?.length ?? 0, closed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${endedChallenges.length} challenge(s) to close`);

    let successCount = 0;
    const errors: any[] = [];

    for (const challenge of endedChallenges) {
      try {
        // Settle any remaining holds that weren't caught by Phase 1
        // (e.g. challenges that ended between cron runs without entering the 2-hour window).
        try {
          const settleResponse = await fetch(
            `${supabaseUrl}/functions/v1/settle-challenge-payments`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ challengeId: challenge.id }),
            }
          );
          const settleResult = await settleResponse.json();
          if (settleResult.settled > 0) {
            console.log(`💳 Settled ${settleResult.settled} hold(s) for "${challenge.title}" (on close):`, {
              winners: settleResult.winners,
              losers: settleResult.losers,
              totalCaptured: settleResult.totalCaptured,
            });
          }
        } catch (settleErr: any) {
          console.error(`⚠️ Payment settlement failed for challenge ${challenge.id}:`, settleErr.message);
          errors.push({ challengeId: challenge.id, step: 'settle_payments', error: settleErr.message });
        }

        // Mark challenge as pending admin review
        const { error: updateError } = await supabase
          .from('challenges')
          .update({ approval_status: 'pending', status: 'completed' })
          .eq('id', challenge.id);

        if (updateError) {
          console.error(`Error updating challenge ${challenge.id}:`, updateError);
          errors.push({ challengeId: challenge.id, title: challenge.title, error: updateError.message });
        } else {
          successCount++;
          console.log(`✅ Marked "${challenge.title}" as pending review`);
        }
      } catch (err: any) {
        console.error(`Error processing challenge ${challenge.id}:`, err);
        errors.push({ challengeId: challenge.id, title: challenge.title, error: err.message });
      }
    }

    console.log(`✅ Closed ${successCount} challenge(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ended challenges`,
        settled: challengesToSettle?.length ?? 0,
        closed: successCount,
        total: endedChallenges.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in check-ended-challenges:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

