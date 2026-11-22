# Stripe integration setup

## Values to Replace

**Files containing runtime configuration:**
- [wrangler.toml](wrangler.toml)
- [worker.js](worker.js)

| Field | Current Value | What to Set |
|---|---|---|
| STRIPE_PUBLISHABLE_KEY | Not committed | Add your sandbox `pk_test_...` as a regular Cloudflare Worker variable. Keep it out of GitHub if preferred. |
| STRIPE_SECRET_KEY | Not committed | Add your sandbox `sk_test_...` as an encrypted Cloudflare secret. |
| STRIPE_WEBHOOK_SECRET | Not committed | Add your sandbox `whsec_...` as an encrypted Cloudflare secret. |

## Configured Parameters

The embedded Checkout Session is created in [functions/api/create-checkout-session.js](functions/api/create-checkout-session.js).

| Parameter | Value |
|---|---|
| ui_mode | form |
| mode | payment |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| payment_method_collection | always |
| submit_type | auto |
| shipping_address_collection.allowed_countries | US |
| integration_identifier | custom_embedded_web_0001 |
| line_items[0].price | Read from STRIPE_PRICE_ID |
| return_url | Current site origin + /success.html |

## Setup and next steps

1. Add `STRIPE_PUBLISHABLE_KEY` to the Worker’s Production variables.
2. Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` encrypted in Cloudflare.
3. Redeploy the Worker.
4. Test the embedded form on `product.html` using Stripe sandbox mode.
5. Use a Stripe test card such as `4242 4242 4242 4242`.
6. Confirm `checkout.session.completed` reaches the webhook.
7. Before launch, create a live Price, live keys, and a live webhook destination.

## How it works

The product page loads Stripe.js from Stripe’s hosted Dahlia SDK. Clicking “Preorder Now” requests a Checkout Session client secret from the Worker, then mounts Stripe’s embedded form on the page. The secret key remains server-side.

Stripe’s webhook remains the source of truth for successful payment and fulfillment.
