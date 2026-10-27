---
description: How to setup Stripe Webhooks for local development and production
---

# Setup Stripe Webhooks

This guide explains how to connect your Stripe account to the `snap-critique` application to receive payment notifications (credits, unlocking).

## Prerequisites
- A [Stripe Account](https://dashboard.stripe.com/register).
- [Stripe CLI](https://stripe.com/docs/stripe-cli) installed on your machine.

## 1. Local Development (Testing)

1.  **Login to Stripe CLI**:
    Open a terminal and run:
    ```powershell
    stripe login
    ```
    Follow the browser prompt to authorize.

2.  **Start the Webhook Forwarder**:
    Running this command sends Stripe events to your local app:
    ```powershell
    stripe listen --forward-to localhost:3000/api/webhook
    ```

3.  **Get the Signing Secret**:
    The CLI will output a secret starting with `whsec_...`.
    Example output:
    > Ready! Your webhook signing secret is whsec_123456789...

4.  **Add to Environment Variables**:
    Open `.env.local` and add/update:
    ```env
    STRIPE_WEBHOOK_SECRET=whsec_123456789...
    ```

5.  **Trigger a Test Event**:
    In a new terminal, you can simulate a payment:
    ```powershell
    stripe trigger checkout.session.completed
    ```
    *Note: The mock event won't have the correct metadata (`userId`, `creditAmount`) so the API will log an error or skip it, but you should see "200 OK" in the listener terminal, confirming the connection.*

## 2. Production Setup

1.  **Go to Stripe Dashboard**:
    Navigate to [Developers > Webhooks](https://dashboard.stripe.com/webhooks).

2.  **Add Endpoint**:
    - Click **"Add endpoint"**.
    - **Endpoint URL**: `https://your-domain.com/api/webhook` (Replace with your actual Vercel/production domain).
    - **Version**: Latest API version.
    - **Events to send**: Select:
      - `checkout.session.completed` — credits purchases, unlocks, queues referral rewards
      - `charge.refunded` — takes back the buyer's credits and voids/claws back the referral reward
      - `charge.dispute.created` — same as a refund, for chargebacks

3.  **Get Production Secret**:
    - After creating the endpoint, click "Reveal" under **Signing secret**.
    - This will be a different `whsec_...` than your local one.

4.  **Set Environment Variable on Vercel**:
    - Go to your Vercel Project Settings > Environment Variables.
    - Add `STRIPE_WEBHOOK_SECRET` with the production secret value.
    - Redeploy if necessary.
