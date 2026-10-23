/* ============================================================
   VIKALPAYATI — Backend config (activation switch)
   ------------------------------------------------------------
   Leave everything BLANK  → site runs in DEMO mode
       (localStorage data + simulated payment — exactly as now).
   Fill these in (see SETUP.md) → site goes REAL:
       orders saved to your Supabase database, admin reads from
       anywhere, and Razorpay takes real payments.

   SAFE to put here (these are PUBLIC by design):
       SUPABASE_URL, SUPABASE_ANON_KEY, RAZORPAY_KEY_ID, FUNCTIONS_URL
   NEVER put here (keep only inside Supabase):
       Razorpay KEY SECRET, Supabase service_role key.
   ============================================================ */
window.VIK_CONFIG = {
  SUPABASE_URL:      "",   // e.g. https://abcd1234.supabase.co
  SUPABASE_ANON_KEY: "",   // Supabase → Project Settings → API → anon public key
  RAZORPAY_KEY_ID:   "",   // e.g. rzp_test_xxxxxxxx  (Key Id only — NOT the secret)
  FUNCTIONS_URL:     ""    // e.g. https://abcd1234.supabase.co/functions/v1
};

/* Convenience flag used by the app: are we wired to a real backend yet? */
window.VIK_LIVE = !!(window.VIK_CONFIG.SUPABASE_URL && window.VIK_CONFIG.SUPABASE_ANON_KEY);
