// @ts-nocheck - Deno runtime (Supabase Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`🔍 Checking for ended challenges at ${nowISO}...`);

    // Find challenges that have ended but don't have approval_status set
    const { data: endedChallenges, error } = await supabase
      .from('challenges')
      .select('id, title, end_date, status')
      .lt('end_date', nowISO) // Has already ended (before now)
      .is('approval_status', null) // Not yet processed
      .in('status', ['upcoming', 'active', 'completed']); // Include all possible statuses

    if (error) {
      console.error('Error fetching ended challenges:', error);
      throw error;
    }

    if (!endedChallenges || endedChallenges.length === 0) {
      console.log('✅ No challenges need to be marked for review');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No challenges to process',
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${endedChallenges.length} challenge(s) that need review`);

    let successCount = 0;
    const errors: any[] = [];

    // Update each challenge to pending review
    for (const challenge of endedChallenges) {
      try {
        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            approval_status: 'pending',
            status: 'completed',
          })
          .eq('id', challenge.id);

        if (updateError) {
          console.error(`Error updating challenge ${challenge.id}:`, updateError);
          errors.push({
            challengeId: challenge.id,
            title: challenge.title,
            error: updateError.message
          });
        } else {
          successCount++;
          console.log(`✅ Marked ${challenge.title} as pending review`);
        }
      } catch (err: any) {
        console.error(`Error processing challenge ${challenge.id}:`, err);
        errors.push({
          challengeId: challenge.id,
          title: challenge.title,
          error: err.message
        });
      }
    }

    console.log(`✅ Updated ${successCount} challenge(s) to pending review`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${endedChallenges.length} ended challenges`,
        updated: successCount,
        total: endedChallenges.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in check-ended-challenges:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

