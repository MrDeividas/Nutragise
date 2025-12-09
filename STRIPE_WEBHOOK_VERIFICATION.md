# Verifying Stripe Webhook Configuration

This guide will help you ensure your Stripe webhook is correctly configured to communicate with your Supabase Edge Functions. This is critical for tracking payments and challenge participation.

## Step 1: Log in to Stripe Dashboard

1.  Go to [dashboard.stripe.com](https://dashboard.stripe.com/).
2.  **Important:** Ensure the **Test mode** toggle in the top-right corner is switched **ON**.
    *   *(We are currently developing in test mode, so we must configure the test webhook).*

## Step 2: Navigate to Webhooks

1.  Click on the **Developers** tab in the top-right navigation bar.
2.  In the left sidebar (or secondary top menu), click on **Webhooks**.

## Step 3: Locate or Create Your Endpoint

You should see a list of "Hosted endpoints".

*   **If you already have an endpoint** for your Supabase URL (e.g., `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`):
    *   Click on that endpoint URL to open its details.
*   **If you do NOT have an endpoint**:
    *   Click the **"+ Add endpoint"** button.
    *   **Endpoint URL:** Enter your Supabase Edge Function URL:
        `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/stripe-webhook`
        *(Replace `<YOUR_SUPABASE_PROJECT_ID>` with your actual project ID found in Supabase Settings).*

## Step 4: Configure Events

1.  In the endpoint details page (or the "Add endpoint" screen), look for the **"Select events to listen to"** (or "Select events") button.
2.  Click it to open the event selection modal.
3.  Search for and check the boxes next to the following events:

    *   **Payment Intents:**
        *   `payment_intent.succeeded` **(CRITICAL)** - This handles successful payments for both wallet deposits and challenge joins.
        *   `payment_intent.payment_failed` (Recommended) - Helps track failed attempts.

    *   **Charges:**
        *   `charge.refunded` (Recommended) - Helps track when refunds are processed.

    *   *(Optional for future Connect features):*
        *   `transfer.created`
        *   `transfer.paid`

4.  Click **"Add events"** or **"Update endpoint"** to save your selection.

## Step 5: Verify Signing Secret

1.  On the webhook endpoint details page, look for the **"Signing secret"** section (usually top right or top left of the details panel).
2.  Click **"Reveal"**.
3.  Copy this secret (it starts with `whsec_...`).
4.  Go to your **Supabase Dashboard** -> **Settings** -> **Edge Functions** (or "Environment Variables").
5.  Ensure you have a secret named `STRIPE_WEBHOOK_SECRET` and that its value matches the secret you just copied from Stripe.
    *   *If they don't match, update the Supabase secret to match the one in Stripe.*

## Step 6: Test the Configuration

1.  Back in the Stripe Webhook details page, click the **"Test"** button (top right).
2.  Select event: `payment_intent.succeeded`.
3.  Click **"Send test webhook"**.
4.  You should see a response below.
    *   **Success:** `200 OK` - This means your Edge Function received and processed the event.
    *   **Failure:** `400 Bad Request` or `500 Server Error`.
        *   *Note: A 400 error might occur if the test data doesn't match what your function expects (e.g., missing metadata), but it confirms the connection is working.*

## Summary Checklist

- [ ] Test mode is **ON**.
- [ ] Webhook URL points to `.../functions/v1/stripe-webhook`.
- [ ] Event `payment_intent.succeeded` is enabled.
- [ ] `STRIPE_WEBHOOK_SECRET` in Supabase matches the Signing Secret in Stripe.

