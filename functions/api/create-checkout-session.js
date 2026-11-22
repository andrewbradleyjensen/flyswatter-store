export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID || !env.STRIPE_SHIPPING_RATE_CONTIGUOUS || !env.STRIPE_SHIPPING_RATE_AK_HI) {
      return json({ error: "Stripe is not fully configured. Add the Stripe secret, price, and both shipping rate IDs in Cloudflare." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 10);
    const shippingZone = body.shipping_zone === "ak-hi" ? "ak-hi" : body.shipping_zone === "contiguous" ? "contiguous" : "";
    if (!shippingZone) return json({ error: "Choose a shipping destination before checkout." }, 400);
    const shippingRate = shippingZone === "ak-hi"
      ? env.STRIPE_SHIPPING_RATE_AK_HI
      : env.STRIPE_SHIPPING_RATE_CONTIGUOUS;
    const siteUrl = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set("ui_mode", "form");
    params.set("mode", "payment");
    params.set("line_items[0][price]", env.STRIPE_PRICE_ID);
    params.set("line_items[0][quantity]", String(quantity));
    params.set("billing_address_collection", "auto");
    params.set("phone_number_collection[enabled]", "false");
    params.set("automatic_tax[enabled]", "false");
    params.set("submit_type", "auto");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("shipping_options[0][shipping_rate]", shippingRate);
    params.set("integration_identifier", "custom_embedded_web_0001");
    params.set("return_url", siteUrl + "/success.html?session_id={CHECKOUT_SESSION_ID}");
    params.set("customer_creation", "always");
    params.set("allow_promotion_codes", "true");
    params.set("metadata[product]", "FLYSWATTER");
    params.set("metadata[order_type]", "preorder");
    params.set("metadata[shipping_zone]", shippingZone);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(env.STRIPE_SECRET_KEY + ":"),
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-03-25.dahlia"
      },
      body: params
    });

    const data = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return json({ error: data.error?.message || "Stripe could not create checkout." }, 502);
    }

    return json({ client_secret: data.client_secret });
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
