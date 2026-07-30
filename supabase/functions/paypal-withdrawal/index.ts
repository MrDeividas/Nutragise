// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Processes a user withdrawal from their in-app wallet to their PayPal account.
// Free: £3 fee | Pro: £1 fee — deducted from the withdrawal; net sent to PayPal.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_WITHDRAWAL_FEE = 3
const PRO_WITHDRAWAL_FEE = 1

const PAYPAL_BASE = 'https://api.paypal.com'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')

  if (!paypalClientId || !paypalClientSecret) {
    return new Response(
      JSON.stringify({ error: 'PayPal credentials not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { amount } = await req.json()

    if (!amount || isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const withdrawAmount = Math.round(amount * 100) / 100

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('paypal_email, is_pro')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.paypal_email) {
      return new Response(
        JSON.stringify({ error: 'No PayPal email saved. Add one in Settings before withdrawing.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const isPro = profile.is_pro === true
    const fee = isPro ? PRO_WITHDRAWAL_FEE : FREE_WITHDRAWAL_FEE
    const payoutAmount = Math.round((withdrawAmount - fee) * 100) / 100

    if (payoutAmount <= 0) {
      return new Response(
        JSON.stringify({
          error: `Withdrawal must be more than the £${fee.toFixed(2)} fee. Your balance is too low.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const paypalEmail = profile.paypal_email

    const { data: wallet, error: walletError } = await adminSupabase
      .from('user_wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const currentBalance = Number(wallet.balance)
    if (currentBalance < withdrawAmount) {
      return new Response(
        JSON.stringify({ error: `Insufficient balance. Available: £${currentBalance.toFixed(2)}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const newBalance = Math.round((currentBalance - withdrawAmount) * 100) / 100
    const { error: deductError } = await adminSupabase
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)

    if (deductError) {
      throw new Error(`Failed to deduct balance: ${deductError.message}`)
    }

    const { data: request, error: requestError } = await adminSupabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: withdrawAmount,
        paypal_email: paypalEmail,
        status: 'pending',
      })
      .select()
      .single()

    if (requestError) {
      await adminSupabase.from('user_wallets').update({ balance: currentBalance }).eq('id', wallet.id)
      throw new Error(`Failed to create withdrawal record: ${requestError.message}`)
    }

    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text()
      await rollback(adminSupabase, wallet.id, currentBalance, request.id, `PayPal auth failed: ${tokenErr}`)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with PayPal. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    const payoutRes = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `withdrawal_${request.id}`,
          email_subject: 'You have a payout from Nutragise!',
          email_message: `Your withdrawal of £${payoutAmount.toFixed(2)} has been processed (£${fee.toFixed(2)} fee).`,
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: payoutAmount.toFixed(2),
              currency: 'GBP',
            },
            receiver: paypalEmail,
            note: `Nutragise wallet withdrawal (fee £${fee.toFixed(2)})`,
            sender_item_id: request.id,
          },
        ],
      }),
    })

    const payoutData = await payoutRes.json()

    if (!payoutRes.ok) {
      const errorMsg = payoutData?.message || payoutData?.error_description || JSON.stringify(payoutData)
      await rollback(adminSupabase, wallet.id, currentBalance, request.id, errorMsg)
      return new Response(
        JSON.stringify({ error: `PayPal payout failed: ${errorMsg}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const paypalPayoutId = payoutData?.batch_header?.payout_batch_id || null

    await adminSupabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        paypal_payout_id: paypalPayoutId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', request.id)

    await adminSupabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: -withdrawAmount,
      status: 'completed',
      metadata: {
        withdrawal_date: new Date().toISOString(),
        paypal_email: paypalEmail,
        paypal_payout_id: paypalPayoutId,
        withdrawal_request_id: request.id,
        gross_amount: withdrawAmount,
        fee,
        payout_amount: payoutAmount,
        is_pro: isPro,
      },
    })

    console.log(
      `✅ Withdrawal: gross £${withdrawAmount}, fee £${fee}, payout £${payoutAmount} to ${paypalEmail}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        newBalance,
        paypalEmail,
        paypalPayoutId,
        fee,
        payoutAmount,
        message: `£${payoutAmount.toFixed(2)} sent to ${paypalEmail} (£${fee.toFixed(2)} fee). PayPal may take a few minutes to arrive.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in paypal-withdrawal:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Withdrawal failed. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function rollback(
  supabase: any,
  walletId: string,
  originalBalance: number,
  requestId: string,
  errorMessage: string
) {
  console.error(`❌ Rolling back withdrawal ${requestId}: ${errorMessage}`)
  await Promise.all([
    supabase.from('user_wallets').update({ balance: originalBalance }).eq('id', walletId),
    supabase.from('withdrawal_requests').update({ status: 'failed', error_message: errorMessage }).eq('id', requestId),
  ])
}
