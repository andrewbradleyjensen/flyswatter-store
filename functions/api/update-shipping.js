export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_SHIPPING_RATE_CONTIGUOUS || !env.STRIPE_SHIPPING_RATE_AK_HI) {
      return json({ error: "Shipping is not configured yet." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.session_id || "");
    const country = String(body.country || "").toUpperCase();
    const state = String(body.state || "").toUpperCase();

    if (!/^cs_/.test(sessionId) || country !== "US") {
      return json({ error: "We currently ship only within the United States." }, 400);
    }

    const shippingZone = state === "AK" || state === "HI" ? "ak-hi" : "contiguous";
    const shippingRate = shippingZone === "ak-hi"
      ? env.STRIPE_SHIPPING_RATE_AK_HI
      : env.STRIPE_SHIPPING_RATE_CONTIGUOUS;

    const params = new URLSearchParams();
    params.set("shipping_options[0][shipping_rate]", shippingRate);
    params.set("metadata[shipping_zone]", shippingZone);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
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
      return json({ error: data.error?.message || "Unable to update shipping." }, 502);
    }

    return json({ ok: true, shipping_zone: shippingZone });
  } catch (error) {
    return json({ error: "Unable to update shipping." }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
