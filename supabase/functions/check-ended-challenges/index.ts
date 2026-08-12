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

async function finaliseParticipantStatuses(supabase: any, challengeId: string) {
  const { data: challengeData, error: cErr } = await supabase
    .from('challenges')
    .select('start_date, end_date')
    .eq('id', challengeId)
    .single();

  if (cErr || !challengeData) {
    console.error(`finaliseParticipantStatuses: cannot load challenge ${challengeId}`, cErr);
    return;
  }

  const startDate = new Date(challengeData.start_date);
  const endDate = new Date(challengeData.end_date);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const { data: participants, error: pErr } = await supabase
    .from('challenge_participants')
    .select('id, user_id, status')
    .eq('challenge_id', challengeId)
    .in('status', ['active', 'completed']);

  if (pErr || !participants) {
    console.error(`finaliseParticipantStatuses: cannot load participants`, pErr);
    return;
  }

  for (const p of participants) {
    const { count, error: sErr } = await supabase
      .from('challenge_submissions')
      .select('submission_date', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('user_id', p.user_id)
      .not('submission_date', 'is', null);

    if (sErr) {
      console.error(`finaliseParticipantStatuses: error counting submissions for ${p.user_id}`, sErr);
      continue;
    }

    const submittedDays = count ?? 0;
    const pct = Math.min(100, Math.round((submittedDays / totalDays) * 100));
    const newStatus = pct >= 100 ? 'completed' : 'failed';

    if (p.status !== newStatus) {
      await supabase
        .from('challenge_participants')
        .update({ completion_percentage: pct, status: newStatus })
        .eq('id', p.id);
    } else {
      await supabase
        .from('challenge_participants')
        .update({ completion_percentage: pct })
        .eq('id', p.id);
    }
  }

  console.log(`✅ finaliseParticipantStatuses: ${participants.length} participants for ${challengeId} (totalDays=${totalDays})`);
}

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
    const { data: challengesToSettle, error: settleQueryError } = await supabase
      .from('challenges')
      .select('id, title, end_date')
      .lte('end_date', settleWindowISO)
      .or('approval_status.is.null,approval_status.eq.pending')
      .in('status', ['upcoming', 'active', 'completed']);

    if (settleQueryError) {
      console.error('Error fetching challenges for early settlement:', settleQueryError);
    } else if (challengesToSettle && challengesToSettle.length > 0) {
      console.log(`💳 Found ${challengesToSettle.length} challenge(s) needing hold settlement`);

      for (const challenge of challengesToSettle) {
        const minutesUntilEnd = Math.round((new Date(challenge.end_date).getTime() - now.getTime()) / 60000);
        const label = minutesUntilEnd > 0
          ? `ends in ${minutesUntilEnd} min (early settle)`
          : `ended ${Math.abs(minutesUntilEnd)} min ago`;

        const { count: earlyParticipantCount } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        if ((earlyParticipantCount ?? 0) === 0) {
          console.log(`⏭️  Skipping early settle for "${challenge.title}" (${label}) — no participants`);
        } else {
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
    }

    // ─── Phase 2: Close challenges that have officially ended ─────────────────
    // Also reprocess pending challenges with no flags (stuck false-positives).
    const { data: endedChallenges, error } = await supabase
      .from('challenges')
      .select('id, title, end_date, status, approval_status')
      .lt('end_date', nowISO)
      .or('approval_status.is.null,approval_status.eq.pending')
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
        const { count: participantCount } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        const hasParticipants = (participantCount ?? 0) > 0;

        if (!hasParticipants) {
          const { error: updateError } = await supabase
            .from('challenges')
            .update({
              approval_status: 'approved',
              status: 'completed',
              reviewed_at: nowISO,
              admin_notes: 'Auto-approved: no participants',
            })
            .eq('id', challenge.id);

          if (updateError) {
            console.error(`Error auto-approving empty challenge ${challenge.id}:`, updateError);
            errors.push({ challengeId: challenge.id, title: challenge.title, error: updateError.message });
          } else {
            successCount++;
            console.log(`⏭️  Auto-approved "${challenge.title}" (no participants)`);
          }
          continue;
        }

        const { count: flaggedCount } = await supabase
          .from('challenge_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .eq('is_flagged', true);

        const hasFlaggedSubmissions = (flaggedCount ?? 0) > 0;

        // Already correctly pending with real flags — leave for admin
        if (challenge.approval_status === 'pending' && hasFlaggedSubmissions) {
          console.log(`🚩 Skipping "${challenge.title}" — already pending with ${flaggedCount} flag(s)`);
          continue;
        }

        // Pass/fail every participant from actual submission days
        await finaliseParticipantStatuses(supabase, challenge.id);

        // Settle payments regardless of flag status (idempotent)
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

        // Auto-approve if no flags; otherwise queue for admin review
        const newApprovalStatus = hasFlaggedSubmissions ? 'pending' : 'approved';
        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            approval_status: newApprovalStatus,
            status: 'completed',
            reviewed_at: hasFlaggedSubmissions ? null : nowISO,
            admin_notes: hasFlaggedSubmissions
              ? null
              : 'Auto-approved: no flagged submissions',
          })
          .eq('id', challenge.id);

        if (updateError) {
          console.error(`Error updating challenge ${challenge.id}:`, updateError);
          errors.push({ challengeId: challenge.id, title: challenge.title, error: updateError.message });
        } else {
          successCount++;
          if (hasFlaggedSubmissions) {
            console.log(`🚩 Marked "${challenge.title}" as pending review (${flaggedCount} flagged submission(s))`);
          } else {
            console.log(`✅ Auto-approved "${challenge.title}" (${participantCount} participant(s), no flags)`);
          }
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
