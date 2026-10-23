// ============================================================
// Edge Function: razorpay-create-order
// ------------------------------------------------------------
// Creates a Razorpay order server-side so the key_secret never
// touches the browser.
//
// Input  (JSON): { amount: number (in RUPEES), orderId: string }
// Output (JSON): { razorpay_order_id, amount, key_id }
//
// Razorpay Orders API (verified against official docs):
//   POST https://api.razorpay.com/v1/orders
//   Auth: HTTP Basic  ->  base64("<KEY_ID>:<KEY_SECRET>")
//   Body: { amount (in paise), currency: "INR", receipt }
//   Docs: https://razorpay.com/docs/api/orders/create/
// ============================================================

import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!KEY_ID || !KEY_SECRET) {
      return json({ error: "Razorpay keys not configured" }, 500);
    }

    const { amount, orderId } = await req.json();

    // amount arrives in RUPEES; Razorpay wants the smallest unit (paise).
    const rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      return json({ error: "Invalid amount" }, 400);
    }
    if (!orderId || typeof orderId !== "string") {
      return json({ error: "Missing orderId" }, 400);
    }

    const paise = Math.round(rupees * 100);

    // HTTP Basic auth: base64("key_id:key_secret")
    const authToken = btoa(`${KEY_ID}:${KEY_SECRET}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authToken}`,
      },
      body: JSON.stringify({
        amount: paise,
        currency: "INR",
        receipt: orderId,
      }),
    });

    const data = await rzpRes.json();

    if (!rzpRes.ok) {
      // Surface Razorpay's error description, but never the secret.
      const reason = data?.error?.description ?? "Razorpay order creation failed";
      return json({ error: reason }, rzpRes.status);
    }

    return json({
      razorpay_order_id: data.id, // e.g. "order_RB58MiP5SPFYyM"
      amount: data.amount, // echoed back in paise
      key_id: KEY_ID, // public key_id is safe to send to the browser
    });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
