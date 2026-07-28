#!/bin/bash

# RevenueCat Webhook Configuration Checker
# Verifies the Supabase edge function and RevenueCat dashboard setup
# that keeps `profiles.is_pro` in sync with Apple / Google subscriptions.

echo "RevenueCat Webhook Configuration Checker"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Step 1: Confirm webhook endpoint"
echo "--------------------------------"
echo "Your webhook endpoint should be:"
echo "  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/revenuecat-webhook"
echo ""
echo "Find the project reference in Supabase Dashboard -> Settings -> API."
echo ""

echo "Step 2: Verify webhook in RevenueCat dashboard"
echo "----------------------------------------------"
echo "1. Go to: https://app.revenuecat.com -> Project Settings -> Integrations -> Webhooks"
echo "2. Confirm the endpoint URL is set to your Supabase function"
echo "3. Set an Authorization header value and store it in Supabase secrets as REVENUECAT_WEBHOOK_AUTH"
echo ""

echo "Step 3: Required RevenueCat events"
echo "----------------------------------"
echo "The function handles these events for the 'pro' entitlement:"
echo "  INITIAL_PURCHASE"
echo "  RENEWAL"
echo "  PRODUCT_CHANGE"
echo "  UNCANCELLATION"
echo "  TRANSFER"
echo "  CANCELLATION"
echo "  EXPIRATION"
echo "  SUBSCRIPTION_PAUSED"
echo "  BILLING_ISSUE"
echo ""

echo "Step 4: Required Supabase Edge Function secrets"
echo "-----------------------------------------------"
echo "Dashboard -> Settings -> Edge Functions -> Secrets:"
echo "  SUPABASE_URL"
echo "  SUPABASE_SERVICE_ROLE_KEY"
echo "  REVENUECAT_WEBHOOK_AUTH (matches the Authorization value in RevenueCat)"
echo ""

echo "Step 5: Check recent webhook deliveries"
echo "---------------------------------------"
echo "1. RevenueCat Dashboard -> Integrations -> Webhooks -> Recent deliveries"
echo "2. Look for events matching the test purchase you just made"
echo "3. Status:"
echo -e "   - ${GREEN}200 OK${NC} = handled"
echo -e "   - ${RED}4xx/5xx${NC} = inspect Supabase function logs"
echo ""

echo "Step 6: Verify edge function deployment"
echo "---------------------------------------"
echo "1. Supabase Dashboard -> Edge Functions"
echo "2. Confirm 'revenuecat-webhook' is deployed"
echo "3. Check Logs tab for the most recent invocation"
echo ""

echo "Step 7: Verify the user's profile row"
echo "-------------------------------------"
echo "In SQL Editor, run:"
echo "  select id, is_pro, subscription_status, subscription_source,"
echo "         subscription_current_period_end, revenuecat_app_user_id"
echo "  from profiles where id = '<user-id>';"
echo ""
