# VIKALPAYATI — Supabase + Razorpay backend

This folder turns the static VIKALPAYATI storefront into a real store:

- **Supabase** (Postgres + Auth + Edge Functions) → central database for products & orders.
- **Razorpay** → real Indian payments (UPI / cards / COD).

Nothing here modifies the existing static site — it is an additive backend you
wire the front-end into when ready.

```
supabase/
├── schema.sql                                  ← run once in SQL Editor
├── functions/
│   ├── _shared/cors.ts                         ← shared CORS helper
│   ├── razorpay-create-order/index.ts          ← creates a Razorpay order
│   └── razorpay-verify/index.ts                ← verifies signature + marks paid
└── README.md                                   ← this file
```

---

## 1. Create the database

1. Create a project at <https://supabase.com> (note its **Project Ref** — the
   string in `https://<ref>.supabase.co`).
2. Dashboard → **SQL Editor** → **New query** → paste all of
   [`schema.sql`](./schema.sql) → **Run**.
   - This creates the `products` and `orders` tables and turns on Row Level
     Security with the policies described at the top of that file.
   - Optionally uncomment the seed block at the bottom to load the 12 catalogue
     products.

## 2. Create the admin user

Dashboard → **Authentication** → **Users** → **Add user** → enter an email +
password → **Create user**. That login is what the Admin page uses; any
authenticated user can manage products and read/update orders (per RLS).

---

## 3. Deploy the Edge Functions

### Option A — Supabase CLI (recommended)

```bash
# install the CLI (macOS/Linux via Homebrew; see docs for other OSes)
brew install supabase/tap/supabase
# or:  npm i -g supabase

# log in (opens a browser)
supabase login

# link this repo to your project (run from the project root, where
# the supabase/ folder lives)
supabase link --project-ref <your-project-ref>

# set the Razorpay secrets (get these from Razorpay Dashboard → Settings → API Keys)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxx RAZORPAY_KEY_SECRET=xxxxxxxxxxxx

# NOTE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected into every
# Edge Function automatically — you do NOT set those yourself.

# deploy both functions
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify
```

Your function URLs will be:

```
https://<ref>.functions.supabase.co/razorpay-create-order
https://<ref>.functions.supabase.co/razorpay-verify
```

### Option B — Supabase Dashboard (no CLI)

1. Dashboard → **Edge Functions** → **Create a function**.
2. Name it `razorpay-create-order`, paste the contents of
   `functions/razorpay-create-order/index.ts`, and deploy. Repeat for
   `razorpay-verify` (paste `functions/razorpay-verify/index.ts`).
   - When pasting in the dashboard editor, inline the tiny `_shared/cors.ts`
     helper into each file (the dashboard editor is single-file), or recreate
     `_shared/cors.ts` as a shared file if the UI supports it.
3. Dashboard → **Edge Functions** → **Secrets** (or Project Settings → Edge
   Functions) → add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

---

## 4. Payment flow (how the two functions fit together)

1. Checkout inserts the order row (status `pending`) with the anon key.
2. Front-end calls **`razorpay-create-order`** with `{ amount, orderId }`
   → gets back `{ razorpay_order_id, amount, key_id }`.
3. Front-end opens Razorpay Checkout with `key_id` + `razorpay_order_id`.
4. On success Razorpay returns `razorpay_order_id`, `razorpay_payment_id`,
   `razorpay_signature`.
5. Front-end calls **`razorpay-verify`** with those + `orderId`. The function
   recomputes the HMAC-SHA256 signature server-side; if it matches, it marks the
   order `confirmed` / `paid`. If not, it rejects — the order stays `pending`.

The `key_secret` and the service-role key are only ever used inside the
functions and are never sent to the browser.

---

## 5. Testing (Razorpay Test Mode)

Use **test** API keys (`rzp_test_...`) while building. Razorpay test
credentials:

- **Test card:** `4111 1111 1111 1111`, any **future** expiry (e.g. `12/30`),
  any 3-digit **CVV** (e.g. `123`), any OTP shown.
- **Test UPI (success):** `success@razorpay`
- **Test UPI (failure):** `failure@razorpay`

After a successful test payment, check the `orders` row in Supabase: `status`
should be `confirmed` and `payment` should be
`{ "method": "online", "status": "paid", "ref": "<razorpay_payment_id>" }`.

---

## Reference

- Razorpay Orders API: <https://razorpay.com/docs/api/orders/create/>
- Razorpay payment signature verification:
  <https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#verify-payment-signature>
- Supabase Edge Functions: <https://supabase.com/docs/guides/functions>
