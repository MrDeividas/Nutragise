#!/bin/bash

# Webhook Configuration Checker
# This script helps verify your Stripe webhook setup

echo "🔍 Stripe Webhook Configuration Checker"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Step 1: Check Supabase Project URL"
echo "--------------------------------------"
echo "Your webhook endpoint should be:"
echo "  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/stripe-webhook"
echo ""
echo "To find your project reference:"
echo "  1. Go to Supabase Dashboard"
echo "  2. Check the URL in your browser"
echo "  3. Or go to Settings → API → Project URL"
echo ""

echo "📋 Step 2: Verify Webhook in Stripe Dashboard"
echo "----------------------------------------------"
echo "1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "2. Look for a webhook pointing to your Supabase function"
echo "3. Click on it to see details"
echo ""

echo "📋 Step 3: Check Required Events"
echo "---------------------------------"
echo "The webhook should listen for these events:"
echo "  ✅ customer.subscription.created"
echo "  ✅ customer.subscription.updated"
echo "  ✅ customer.subscription.deleted"
echo "  ✅ invoice.paid"
echo "  ✅ invoice.payment_failed"
echo ""

echo "📋 Step 4: Verify Webhook Secret"
echo "---------------------------------"
echo "1. In Stripe Dashboard → Webhooks → Your webhook"
echo "2. Click 'Reveal' next to 'Signing secret'"
echo "3. Copy the secret (starts with whsec_)"
echo "4. Go to Supabase Dashboard → Settings → Edge Functions → Secrets"
echo "5. Check if STRIPE_WEBHOOK_SECRET matches"
echo ""

echo "📋 Step 5: Check Recent Webhook Deliveries"
echo "-------------------------------------------"
echo "1. In Stripe Dashboard → Webhooks → Your webhook"
echo "2. Scroll to 'Recent deliveries'"
echo "3. Look for events around the time deividasg upgraded"
echo "4. Check status:"
echo "   - ${GREEN}✅ Succeeded (200)${NC} = Webhook received and processed"
echo "   - ${RED}❌ Failed${NC} = Check error message"
echo "   - ${YELLOW}⏳ Pending${NC} = Webhook not yet delivered"
echo ""

echo "📋 Step 6: Check Supabase Environment Variables"
echo "-------------------------------------------------"
echo "Go to Supabase Dashboard → Settings → Edge Functions → Secrets"
echo "Verify these are set:"
echo "  ✅ STRIPE_SECRET_KEY"
echo "  ✅ STRIPE_WEBHOOK_SECRET"
echo "  ✅ STRIPE_PRO_PRICE_ID"
echo "  ✅ SUPABASE_URL"
echo "  ✅ SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo "📋 Step 7: Check Edge Function Deployment"
echo "-------------------------------------------"
echo "1. Go to Supabase Dashboard → Edge Functions"
echo "2. Look for 'stripe-webhook' function"
echo "3. Verify it's deployed and active"
echo ""

echo "📋 Step 8: Run Diagnostic Queries"
echo "----------------------------------"
echo "Run these SQL queries in Supabase SQL Editor:"
echo "  1. supabase/check_deividasg_pro_status.sql"
echo "  2. supabase/verify_webhook_setup.sql"
echo ""

echo "📋 Step 9: Test Webhook (Optional)"
echo "-----------------------------------"
echo "You can manually trigger a test event from Stripe Dashboard:"
echo "  1. Go to Stripe Dashboard → Webhooks → Your webhook"
echo "  2. Click 'Send test webhook'"
echo "  3. Select event: customer.subscription.created"
echo "  4. Check if it succeeds"
echo ""

echo "✅ For detailed instructions, see: WEBHOOK_VERIFICATION.md"
echo ""

