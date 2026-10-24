// ============================================================
// Edge Function: get-order
// ------------------------------------------------------------
// WHY THIS EXISTS:
//   The `orders` table has NO anon SELECT policy (see schema.sql) —
//   anonymous clients can never read order rows, so a customer can
//   never fetch another customer's order by guessing an ID. But a
//   genuine buyer still needs cross-device order tracking. This
//   function performs that read SERVER-SIDE using the SERVICE_ROLE
//   key (which bypasses RLS) and only returns a row when the caller
//   proves ownership by supplying the matching customer phone.
//
// Input  (JSON): { id: string, phone: string }
// Output (JSON): a SAFE subset of the order, or { found: false }.
//   { id, status, created_at, total, itemsCount,
//     payment: { method, status } }
//   — deliberately NO address / email / full item PII.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ found: false, reason: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json({ found: false, reason: "Server not configured" }, 500);
    }

    const { id, phone } = await req.json();
    if (!id || !phone) {
      return json({ found: false, reason: "Missing id or phone" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("orders")
      .select("id, status, created_at, total, items, customer, payment")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return json({ found: false });
    }

    // Ownership check: the buyer's phone must match (digits only, so
    // formatting differences don't block a legitimate lookup).
    const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");
    const stored = digits((data.customer ?? {}).phone);
    if (!stored || digits(phone) !== stored) {
      return json({ found: false });
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const itemsCount = items.reduce(
      (n: number, it: { qty?: number }) => n + (it.qty || 0),
      0,
    );
    const pay = data.payment ?? { method: "cod", status: "pending" };

    // SAFE subset only — never the address / email / line items.
    return json({
      found: true,
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      total: data.total,
      itemsCount,
      payment: { method: pay.method, status: pay.status },
    });
  } catch (err) {
    return json({ found: false, reason: (err as Error).message ?? "error" }, 500);
  }
});
