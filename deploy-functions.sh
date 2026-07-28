#!/bin/bash
# Deploy Supabase Edge Functions used by the app.
# - Stripe edge functions handle wallet deposits and challenge entry payments.
# - RevenueCat edge function handles Pro subscription state (Apple IAP / Google Play).

set -e

echo "Starting Supabase Edge Functions deployment..."

SUPABASE_URL=$(grep '^SUPABASE_URL=' .env | cut -d '=' -f2-)
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|.supabase.co||')
STRIPE_SECRET=$(grep '^STRIPE_SECRET_KEY=' .env | cut -d '=' -f2- || true)

echo "Project Reference: $PROJECT_REF"
echo "Supabase URL: $SUPABASE_URL"

echo "Checking Supabase login status..."
if ! npx supabase projects list &>/dev/null; then
    echo "Not logged in. Run: npx supabase login"
    exit 1
fi

echo "Linking project..."
npx supabase link --project-ref "$PROJECT_REF" || echo "Project may already be linked, continuing..."

echo "Setting environment secrets..."
if [ -n "$STRIPE_SECRET" ]; then
    npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET" || echo "Failed to set STRIPE_SECRET_KEY"
fi
npx supabase secrets set SUPABASE_URL="$SUPABASE_URL" || echo "Failed to set SUPABASE_URL"

echo ""
echo "Set the remaining secrets manually if not already configured:"
echo "  npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=..."
echo "  npx supabase secrets set REVENUECAT_WEBHOOK_AUTH=...   # shared secret used in the RevenueCat webhook Authorization header"
echo ""

echo "Deploying create-payment-intent function..."
npx supabase functions deploy create-payment-intent

echo "Deploying revenuecat-webhook function..."
npx supabase functions deploy revenuecat-webhook

echo "Deploying send-push-notification function..."
npx supabase functions deploy send-push-notification

echo ""
echo "Deployment complete."
echo ""
echo "Next steps:"
echo "  1. Ensure SUPABASE_SERVICE_ROLE_KEY and REVENUECAT_WEBHOOK_AUTH are set in Supabase secrets"
echo "  2. In the RevenueCat dashboard set the webhook URL and the matching Authorization header"
echo ""
echo "Function URLs:"
echo "  - Payment Intent: ${SUPABASE_URL}/functions/v1/create-payment-intent"
echo "  - RevenueCat Webhook: ${SUPABASE_URL}/functions/v1/revenuecat-webhook"
echo "  - Push Notifications: ${SUPABASE_URL}/functions/v1/send-push-notification"
