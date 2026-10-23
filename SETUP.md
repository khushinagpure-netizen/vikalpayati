# VIKALPAYATI — Making it a Real Store (Setup Guide)

Hi! This guide takes your website from a *demo* into a *real shop* that takes real orders and real money. You don't need to be a coder. Just follow the numbered steps and copy-paste exactly what's shown. Take it slow — you can stop and come back anytime. 💛

---

## What "real" means

Right now your site is a lovely demo: when a visitor "orders", it only saves inside *their own browser* (nobody else — not even you — can see it), and the payment is pretend. After this setup, orders land in **one central database** that you own, you get notified, you can run the admin panel from **any phone or laptop**, and **real money (UPI / card / netbanking / COD) reaches your bank account**. Same website, same link — just switched on for real.

---

## What you need ready (checklist)

Keep these handy before you start. Nothing here costs money to *test*.

- [ ] A **PAN** (business or personal) — only needed later for real money, not for testing.
- [ ] A **bank account** to receive payments — only needed for the LIVE (real-money) step.
- [ ] A **phone number** and **email** (for signing up).
- [ ] **GST number** — *optional*, small sellers usually don't need it to start.
- [ ] Your **real product photos, names, prices, and stock** ready to type in.

> *Term check:* **PAN** = your tax ID card. **KYC** = "Know Your Customer" — the ID check a payment company does before letting real money flow to you.

---

## The 3 accounts to create (with links)

### 1. Supabase (your database) — FREE

*Supabase is a free online storehouse for your products and orders — like a shared Google Sheet, but proper and secure.*

1. Go to **https://supabase.com** → click **Sign up** (Google/GitHub/email all fine).
2. Click **New Project**.
   - **Name:** `vikalpayati` (anything you like).
   - **Database Password:** make a **strong one** and save it somewhere safe — you'll rarely need it but don't lose it.
   - **Region:** pick **Mumbai** (or Singapore) — closest = faster for Indian shoppers.
3. Wait ~2 minutes while it builds. ☕
4. When ready, go to **Project Settings** (gear icon) → **API**. Copy and save these two:
   - **Project URL** — looks like `https://abcd1234.supabase.co`
   - **anon public key** — a long text string.
   > ⚠️ On the same page there's a **service_role** key. That one is a master key — **NEVER** paste it into your website or share it. Leave it alone.
5. In the left menu open **SQL Editor** → **New query**. Open the file **`supabase/schema.sql`** from your project, copy *everything* inside it, paste into the box, and click **Run**. This creates your **products** and **orders** tables (the shelves your data sits on).
6. In the left menu open **Authentication** → **Users** → **Add user** → **Create new user**. Enter an **email + password** — this is your **admin login** for the dashboard. Remember it!

### 2. Razorpay (payments)

*Razorpay is an Indian payment gateway — it collects UPI, cards, netbanking, and COD and deposits the money to your bank.*

1. Go to **https://razorpay.com** → **Sign up**.
2. At the top you'll see a **Test Mode / Live Mode** toggle. Start in **Test Mode** — no KYC, no real money, perfect for trying everything safely.
3. Go to **Settings** → **API Keys** → **Generate Test Key**. Copy and save:
   - **Key Id** — starts with `rzp_test_…`
   - **Key Secret** — a long string. *(Keep this private — it goes into Supabase only, never the website.)*
4. **For real money later:** finish **KYC** (business details, PAN, bank account) inside Razorpay. Once approved, switch the toggle to **Live Mode** and generate your **Live** Key Id (`rzp_live_…`) and Secret.
   > 💰 Razorpay charges roughly **2% per transaction** — ₹2 on every ₹100 collected. No monthly/fixed fee.

### 3. (Optional) Your own domain

*A domain is your custom web address, e.g. `vikalpayati.in`, instead of the free `...github.io` link.*

- Buy **vikalpayati.in** from **GoDaddy** or **Hostinger** (~₹700–1,000/year) and point it at your site.
- Totally optional — your free `github.io` link keeps working perfectly in the meantime. Do this whenever you feel like it.

---

## Deploy the payment functions

*These are small secure programs that sit on Supabase and talk to Razorpay safely (so your secret key never touches the website). The exact click-by-click / command steps are in* **`supabase/README.md`** *— follow that file.*

- It gives you **two ways**: the quick **Dashboard (point-and-click)** method, or the **Supabase CLI** (typing a few commands). Either is fine — pick whichever feels comfortable.
- Important: when prompted, set these **two secrets** inside Supabase (this is where the private keys live safely):

| Secret name | What to paste |
|---|---|
| `RAZORPAY_KEY_ID` | your `rzp_test_…` Key Id |
| `RAZORPAY_KEY_SECRET` | your Razorpay **Key Secret** (the private one) |

---

## Paste your keys (the activation step)

This is the magic switch. 🪄

1. Open the file **`js/config.js`** in your project.
2. Fill in the four blanks between the quotes:

   ```js
   SUPABASE_URL:      "https://abcd1234.supabase.co",
   SUPABASE_ANON_KEY: "your-anon-public-key",
   RAZORPAY_KEY_ID:   "rzp_test_xxxxxxxx",
   FUNCTIONS_URL:     "https://abcd1234.supabase.co/functions/v1"
   ```

   *(FUNCTIONS_URL is just your Project URL with `/functions/v1` added at the end.)*
3. **Save** → **push/upload** the change to GitHub. The site automatically flips from **demo** to **real** the moment these are filled in.

**Safe vs secret — simple rule:**

| ✅ Safe in the website (public by design) | ❌ Never in the website (Supabase only) |
|---|---|
| SUPABASE_URL | Razorpay **Key Secret** |
| SUPABASE_ANON_KEY | Supabase **service_role** key |
| RAZORPAY_KEY_ID | |
| FUNCTIONS_URL | |

> Think of it like a shop: the *address and front-door key* (left column) can be public. The *safe combination* (right column) stays hidden in the back office. 🔐

---

## Test it (before going live)

Still in **Test Mode** — no real money moves.

1. Open your site → add a product to cart → go to checkout → pay.
2. Use a **test payment**:
   - **Test card:** `4111 1111 1111 1111`, any **future** expiry date, any **CVV**, any name.
   - **Test UPI:** `success@razorpay`
3. Finish the order. Then check **both** places:
   - Supabase → **Table Editor** → **orders** table — your order row should appear. ✅
   - Your **admin dashboard** (log in with the admin email/password from step 1.6) — the order should show there too. ✅

If it shows up in both, everything is wired correctly. 🎉

---

## Go live

When you're happy with testing:

1. Finish **Razorpay KYC** and switch Razorpay to **Live Mode**.
2. In **`js/config.js`**, replace `RAZORPAY_KEY_ID` with your **live** key (`rzp_live_…`). Save & push.
3. In **Supabase secrets**, replace `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` with the **live** ones.

That's it — real customers, real money, straight to your bank. 🏦

---

## Rough cost summary

| Thing | Cost |
|---|---|
| **Supabase** (database) | ₹0 on free tier — plenty to start; upgrade only if you grow big |
| **Razorpay** (payments) | ₹0 fixed + **~2% per transaction** |
| **Domain** (optional) | ~₹800/year (skip it for now if you like) |
| **Hosting** (GitHub Pages / Vercel) | ₹0 — free |
| **Total to start** | **₹0** — pay nothing until real orders flow |

---

## What Claude will do next

Once you send me these **4 values** from the steps above:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `RAZORPAY_KEY_ID`
4. `FUNCTIONS_URL`

I'll wire up the frontend for you — orders saving into Supabase, the **real Razorpay checkout** on the payment page, and the **admin dashboard reading live from the database** — and then we'll place a test order together, end to end, to confirm it all works before you go live.

> Reminder: only send the **4 public values** above. Never send me (or paste online) the Razorpay **Key Secret** or the Supabase **service_role** key — those stay inside Supabase only. 🔐

Take your time, ma'am — do it one step at a time, and ping me whenever you're stuck. 💛
