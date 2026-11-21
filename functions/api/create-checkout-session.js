export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 10);
    const siteUrl = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set("mode", "payment");
    params.set("line_items[0][price]", env.STRIPE_PRICE_ID);
    params.set("line_items[0][quantity]", String(quantity));
    params.set("success_url", siteUrl + "/product.html?checkout=success&session_id={CHECKOUT_SESSION_ID}");
    params.set("cancel_url", siteUrl + "/product.html?checkout=cancelled");
    params.set("customer_creation", "always");
    params.set("billing_address_collection", "auto");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("allow_promotion_codes", "true");
    params.set("metadata[product]", "FLYSWATTER");
    params.set("metadata[order_type]", "preorder");

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(env.STRIPE_SECRET_KEY + ":"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return json({ error: data.error?.message || "Stripe could not create checkout." }, 502);
    }

    return json({ url: data.url });
  } catch (error) {
    return json({ error: "Unable to start checkout." }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
