import { onRequestPost as createCheckoutSession } from "./functions/api/create-checkout-session.js";
import { onRequestPost as stripeWebhook } from "./functions/api/stripe-webhook.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stripe-config" && request.method === "GET") {
      if (!env.STRIPE_PUBLISHABLE_KEY) return new Response(JSON.stringify({ error: "Stripe publishable key is not configured." }), { status: 500, headers: { "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ publishable_key: env.STRIPE_PUBLISHABLE_KEY }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/create-checkout-session" && request.method === "POST") {
      return createCheckoutSession({ request, env, ctx });
    }

    if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
      return stripeWebhook({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
