#!/bin/bash
# Deploy Supabase Edge Functions
# This script automates the deployment process

set -e

echo "🚀 Starting Supabase Edge Functions Deployment..."

# Extract project ref from SUPABASE_URL
SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
STRIPE_SECRET=$(grep STRIPE_SECRET_KEY .env | cut -d '=' -f2)

echo "📋 Project Reference: $PROJECT_REF"
echo "📋 Supabase URL: $SUPABASE_URL"

# Check if logged in
echo "🔐 Checking Supabase login status..."
if ! npx supabase projects list &>/dev/null; then
    echo "⚠️  Not logged in. Please run: npx supabase login"
    echo "   This will open your browser to authenticate."
    exit 1
fi

# Link project
echo "🔗 Linking project..."
npx supabase link --project-ref "$PROJECT_REF" || {
    echo "⚠️  Project may already be linked, continuing..."
}

# Set secrets
echo "🔑 Setting environment secrets..."
npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET" || echo "⚠️  Failed to set STRIPE_SECRET_KEY"
npx supabase secrets set SUPABASE_URL="$SUPABASE_URL" || echo "⚠️  Failed to set SUPABASE_URL"

echo "⚠️  You need to manually set:"
echo "   1. SUPABASE_SERVICE_ROLE_KEY (from Dashboard → Settings → API)"
echo "   2. STRIPE_WEBHOOK_SECRET (after setting up webhook in Stripe)"
echo ""
echo "   Run: npx supabase secrets set KEY=value"

# Deploy functions
echo "📦 Deploying create-payment-intent function..."
npx supabase functions deploy create-payment-intent

echo "📦 Deploying stripe-webhook function..."
npx supabase functions deploy stripe-webhook

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Get your Service Role Key from Supabase Dashboard → Settings → API"
echo "   2. Set it: npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"
echo "   3. Set up Stripe webhook in Stripe Dashboard"
echo "   4. Get webhook secret and set: npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "🌐 Function URLs:"
echo "   - Payment Intent: ${SUPABASE_URL}/functions/v1/create-payment-intent"
echo "   - Webhook: ${SUPABASE_URL}/functions/v1/stripe-webhook"

