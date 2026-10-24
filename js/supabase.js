/* ============================================================
   VIKALPAYATI — Supabase / Razorpay backend adapter
   ------------------------------------------------------------
   window.VikBackend — a thin, dependency-free (plain fetch, no
   SDK) layer used ONLY when window.VIK_LIVE is true. In demo mode
   every method returns null/false without ever touching the
   network, so the site behaves exactly as before.

   Talks to:
     • Supabase REST   (/rest/v1/orders)      — insert / list / patch
     • Supabase Auth   (/auth/v1/token)       — admin sign-in
     • Edge Functions  (${FUNCTIONS_URL}/...)  — razorpay + guest order

   All methods are async, wrapped in try/catch, and resolve to
   null/false on any failure — they NEVER throw into the UI.
   ============================================================ */
(function () {
  const CFG = () => window.VIK_CONFIG || {};
  const LIVE = () => !!window.VIK_LIVE;

  /* ---------- mappers (app camelCase <-> db snake_case) ---------- */
  // Only the columns that differ in naming need translating; the rest
  // (items, subtotal, shipping, discount, total, customer, payment,
  // status) share the same key in both shapes.
  function appOrderToDbRow(o) {
    return {
      id: o.id,
      created_at: o.createdAt,
      items: o.items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      cod_fee: o.codFee || 0,
      discount: o.discount || 0,
      total: o.total,
      customer: o.customer,
      payment: o.payment,
      status: o.status,
      razorpay_order_id: o.razorpayOrderId || null,
      razorpay_payment_id: o.razorpayPaymentId || null
    };
  }
  function dbRowToAppOrder(r) {
    if (!r) return null;
    return {
      id: r.id,
      createdAt: r.created_at,
      items: r.items || [],
      subtotal: r.subtotal,
      shipping: r.shipping,
      codFee: r.cod_fee || 0,
      discount: r.discount || 0,
      total: r.total,
      customer: r.customer || {},
      payment: r.payment || { method: "cod", status: "pending" },
      status: r.status,
      razorpayOrderId: r.razorpay_order_id || null,
      razorpayPaymentId: r.razorpay_payment_id || null
    };
  }

  /* ---------- small helpers ---------- */
  const anonHeaders = () => {
    const c = CFG();
    return {
      apikey: c.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + c.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };
  };

  /* ---------- orders: insert (anon) ---------- */
  async function insertOrder(order) {
    if (!LIVE()) return null;
    try {
      const c = CFG();
      const res = await fetch(c.SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: Object.assign({}, anonHeaders(), { Prefer: "return=representation" }),
        body: JSON.stringify(appOrderToDbRow(order))
      });
      if (!res.ok) return null;
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      return dbRowToAppOrder(row);
    } catch (e) {
      return null;
    }
  }

  /* ---------- razorpay: create order (edge fn) ---------- */
  async function createRazorpayOrder(amountRupees, orderId) {
    if (!LIVE()) return null;
    try {
      const c = CFG();
      const res = await fetch(c.FUNCTIONS_URL + "/razorpay-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountRupees, orderId: orderId })
      });
      if (!res.ok) return null;
      return await res.json(); // { razorpay_order_id, amount, key_id }
    } catch (e) {
      return null;
    }
  }

  /* ---------- razorpay: verify signature (edge fn) ---------- */
  async function verifyRazorpay(payload) {
    if (!LIVE()) return { ok: false };
    try {
      const c = CFG();
      const res = await fetch(c.FUNCTIONS_URL + "/razorpay-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return { ok: false };
      return await res.json(); // { ok: true } | { ok: false, reason }
    } catch (e) {
      return { ok: false };
    }
  }

  /* ---------- admin auth (Supabase Auth REST) ---------- */
  const TOKEN_KEY = "vik_sb_token";

  async function adminSignIn(email, pass) {
    if (!LIVE()) return false;
    try {
      const c = CFG();
      const res = await fetch(c.SUPABASE_URL + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { apikey: c.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pass })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.access_token) {
        sessionStorage.setItem(TOKEN_KEY, data.access_token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  const adminToken = () => sessionStorage.getItem(TOKEN_KEY);
  const adminSignOut = () => sessionStorage.removeItem(TOKEN_KEY);
  const isAdminLive = () => !!adminToken();

  /* ---------- orders: list (authenticated / admin) ---------- */
  async function listOrders() {
    if (!LIVE()) return null;
    try {
      const c = CFG();
      const res = await fetch(
        c.SUPABASE_URL + "/rest/v1/orders?select=*&order=created_at.desc",
        {
          headers: {
            apikey: c.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + adminToken()
          }
        }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return (Array.isArray(rows) ? rows : []).map(dbRowToAppOrder);
    } catch (e) {
      return null;
    }
  }

  /* ---------- orders: update status (authenticated / admin) ---------- */
  async function setOrderStatus(id, status) {
    if (!LIVE()) return null;
    try {
      const c = CFG();
      const res = await fetch(
        c.SUPABASE_URL + "/rest/v1/orders?id=eq." + encodeURIComponent(id),
        {
          method: "PATCH",
          headers: {
            apikey: c.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + adminToken(),
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify({ status: status })
        }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      return dbRowToAppOrder(row);
    } catch (e) {
      return null;
    }
  }

  /* ---------- guest order lookup (edge fn, service role) ---------- */
  // Guests have NO anon SELECT on orders, so cross-device tracking goes
  // through the get-order edge function which verifies id + phone.
  async function getOrderGuest(id, phone) {
    if (!LIVE()) return null;
    try {
      const c = CFG();
      const res = await fetch(c.FUNCTIONS_URL + "/get-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, phone: phone })
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.found === false) return null;
      // get-order returns a SAFE subset already in app shape; normalise
      // created_at -> createdAt in case the fn returns raw.
      if (data.created_at && !data.createdAt) data.createdAt = data.created_at;
      return data;
    } catch (e) {
      return null;
    }
  }

  window.VikBackend = {
    // mappers exposed for testing / reuse
    appOrderToDbRow, dbRowToAppOrder,
    // orders
    insertOrder, listOrders, setOrderStatus, getOrderGuest,
    // payments
    createRazorpayOrder, verifyRazorpay,
    // admin auth
    adminSignIn, adminToken, adminSignOut, isAdminLive
  };
})();
