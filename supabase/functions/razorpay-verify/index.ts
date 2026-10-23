// ============================================================
// Edge Function: razorpay-verify
// ------------------------------------------------------------
// Verifies a Razorpay payment signature SERVER-SIDE and, if valid,
// marks the order as paid/confirmed in the database.
//
// Input (JSON): {
//   orderId,              // our internal order id (= Razorpay receipt)
//   razorpay_order_id,
//   razorpay_payment_id,
//   razorpay_signature
// }
// Output: { ok: true } | { ok: false, reason }
//
// Signature algorithm (verified against official docs):
//   expected = HMAC_SHA256(
//                message = razorpay_order_id + "|" + razorpay_payment_id,
//                key     = RAZORPAY_KEY_SECRET
//              )  -> hex
//   valid if expected === razorpay_signature
//   Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#verify-payment-signature
//
// The key_secret is used ONLY inside this function and is never returned.
// The DB write uses the SERVICE_ROLE key (bypasses RLS), which is also
// only available server-side.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";
import { corsHeaders } from "../_shared/cors.ts";

// --- HMAC-SHA256 helper using Web Crypto, returns lowercase hex ---
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Constant-time string compare to avoid timing side-channels ---
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, reason: "Method not allowed" }, 405);
  }

  try {
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KEY_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
      return json({ ok: false, reason: "Server not configured" }, 500);
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !orderId || !razorpay_order_id || !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return json({ ok: false, reason: "Missing fields" }, 400);
    }

    // Build and compare the signature.
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = await hmacSha256Hex(KEY_SECRET, message);

    if (!timingSafeEqual(expected, razorpay_signature)) {
      // Tampered / fraudulent payment — reject, do NOT confirm the order.
      return json({ ok: false, reason: "Signature verification failed" }, 400);
    }

    // Signature valid → mark the order paid using the service role
    // (this client bypasses RLS, so it can update the order row).
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from("orders")
      .update({
        payment: {
          method: "online",
          status: "paid",
          ref: razorpay_payment_id,
        },
        status: "confirmed",
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq("id", orderId);

    if (error) {
      return json({ ok: false, reason: `DB update failed: ${error.message}` }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, reason: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
