-- ============================================================
-- VIKALPAYATI by Vishakha — Supabase schema migration
-- ============================================================
--
-- HOW TO RUN THIS:
--   1. Open your Supabase project → Dashboard.
--   2. Go to: SQL Editor (left sidebar) → "New query".
--   3. Paste this ENTIRE file → click "Run".
--   It is idempotent-ish (uses IF NOT EXISTS / DROP POLICY IF EXISTS),
--   so you can safely re-run it after edits.
--
-- ADMIN LOGIN (how the admin panel authenticates):
--   The admin is a real Supabase Auth user. Create one via:
--     Dashboard → Authentication → Users → "Add user"
--       → enter email + password → "Create user".
--   That email/password is what the Admin page logs in with.
--   Any *authenticated* user can manage products & read/update orders
--   (see RLS policies below). Keep this account private — it is the
--   store owner's account.
--
-- RLS SUMMARY (who can do what):
--   products  → anon/public can SELECT (storefront browsing).
--               only authenticated can INSERT / UPDATE / DELETE (admin).
--   orders    → anon can INSERT (a guest places an order at checkout).
--               only authenticated can SELECT / UPDATE (admin).
--               anon CANNOT SELECT  → a customer can never read
--               another customer's order. Order confirmation / tracking
--               for a guest must therefore go through an Edge Function
--               (service-role, server-side) or a tokenised lookup — see
--               NOTE at the bottom of this file. We keep it secure here
--               and do the guest-facing reads server-side.
-- ============================================================


-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id          text primary key,
  name        text,
  category    text,
  price       int,
  mrp         int,
  image       text,
  swatch      jsonb,
  fabric      text,
  color       text,
  badge       text,
  stock       int,
  rating      numeric,
  "desc"      text,
  created_at  timestamptz default now()
);


-- ---------- ORDERS ----------
create table if not exists public.orders (
  id                  text primary key,
  created_at          timestamptz default now(),
  items               jsonb,
  subtotal            int,
  shipping            int,
  cod_fee             int,
  discount            int,
  total               int,
  customer            jsonb,
  payment             jsonb,
  status              text default 'pending',
  razorpay_order_id   text,
  razorpay_payment_id text
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products enable row level security;
alter table public.orders   enable row level security;


-- ---------- PRODUCTS policies ----------
-- Public read: anyone (anon + authenticated) can browse the catalogue.
drop policy if exists products_select_public on public.products;
create policy products_select_public
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Admin writes: only logged-in (authenticated) users can mutate.
drop policy if exists products_insert_auth on public.products;
create policy products_insert_auth
  on public.products
  for insert
  to authenticated
  with check (true);

drop policy if exists products_update_auth on public.products;
create policy products_update_auth
  on public.products
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists products_delete_auth on public.products;
create policy products_delete_auth
  on public.products
  for delete
  to authenticated
  using (true);


-- ---------- ORDERS policies ----------
-- Guest checkout: anon can INSERT a new order (place an order).
drop policy if exists orders_insert_anon on public.orders;
create policy orders_insert_anon
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- Admin reads: only authenticated users can list / read orders.
-- NOTE: there is deliberately NO anon SELECT policy, so with RLS on,
-- an anonymous client can never read any order row.
drop policy if exists orders_select_auth on public.orders;
create policy orders_select_auth
  on public.orders
  for select
  to authenticated
  using (true);

-- Admin / payment updates: only authenticated users can update orders.
-- (The razorpay-verify Edge Function updates the paid order using the
--  SERVICE ROLE key, which bypasses RLS entirely — it does not rely on
--  this policy. This policy is for the admin panel marking shipped etc.)
drop policy if exists orders_update_auth on public.orders;
create policy orders_update_auth
  on public.orders
  for update
  to authenticated
  using (true)
  with check (true);


-- ============================================================
-- NOTE on guest order confirmation / tracking
-- ============================================================
-- Because anon has NO SELECT on orders, the public "order confirmation"
-- and "track order" pages cannot read the orders table directly with the
-- anon key (this is intentional — it stops customers reading each other's
-- orders by guessing IDs).
--
-- Two safe ways to show a guest their own order:
--   (a) EDGE FUNCTION: a small function that takes an order id + the
--       customer's phone/email, verifies they match, and returns ONLY
--       that order using the service-role key server-side.
--   (b) TOKENISED LOOKUP: store a random unguessable token on the order
--       row at creation and show it only to that customer; add an anon
--       SELECT policy that requires the token in the request.
-- Pick one when wiring the guest-facing pages. For now the schema stays
-- locked-down and secure by default.


-- ============================================================
-- OPTIONAL SEED DATA (the 12 catalogue products from js/data.js)
-- ============================================================
-- Uncomment the block below and Run it to seed the products table with
-- the current storefront catalogue. Safe to run once on a fresh table.
-- (ON CONFLICT DO NOTHING means re-running won't duplicate rows.)
--
-- insert into public.products
--   (id, name, category, price, mrp, image, swatch, fabric, color, badge, stock, rating, "desc")
-- values
--   ('sar-banarasi-red',   'Banarasi Silk Saree — Maroon & Gold', 'sarees',   4999,  7499,  'https://images.pexels.com/photos/17113983/pexels-photo-17113983.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#7a1f2b","#c79a3a"]'::jsonb, 'Pure Banarasi Silk', 'Maroon',       'Bestseller', 8,  4.8, 'Handwoven Banarasi silk with intricate gold zari motifs. A timeless drape for weddings and festive occasions.'),
--   ('sar-kanjivaram-grn', 'Kanjivaram Saree — Emerald',          'sarees',   6299,  8999,  'https://images.pexels.com/photos/35586011/pexels-photo-35586011.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#0f5132","#c79a3a"]'::jsonb, 'Kanjivaram Silk',    'Emerald',      'New',        5,  4.9, 'South-Indian Kanjivaram weave with a contrast gold border. Rich, regal and heirloom-worthy.'),
--   ('sar-chiffon-blush',  'Chiffon Saree — Blush Pink',          'sarees',   2499,  3499,  'https://images.pexels.com/photos/33067044/pexels-photo-33067044.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#d98a9e","#f3e4d7"]'::jsonb, 'Chiffon',            'Blush',        '',           12, 4.6, 'Featherlight chiffon with a delicate sequin pallu. Effortless elegance for cocktail evenings.'),
--   ('leh-bridal-red',     'Bridal Lehenga — Crimson Zardozi',    'lehengas', 18999, 26999, 'https://images.pexels.com/photos/25811178/pexels-photo-25811178.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#8b0000","#c79a3a"]'::jsonb, 'Raw Silk + Zardozi', 'Crimson',      'Bridal',     3,  5.0, 'A show-stopping crimson lehenga with hand-done zardozi and a heavily flared ghera. Made for the main day.'),
--   ('leh-pastel-mint',    'Lehenga — Pastel Mint Threadwork',    'lehengas', 9499,  13999, 'https://images.pexels.com/photos/40195823/pexels-photo-40195823.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#9fd8c3","#f3e4d7"]'::jsonb, 'Georgette',          'Mint',         '',           6,  4.7, 'Soft mint georgette with pastel resham threadwork. Perfect for mehndi and daytime functions.'),
--   ('suit-anarkali-wine', 'Anarkali Suit — Wine Floor Length',   'suits',    5499,  7999,  'https://images.pexels.com/photos/30268122/pexels-photo-30268122.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#5e2129","#c79a3a"]'::jsonb, 'Velvet',             'Wine',         'Bestseller', 7,  4.8, 'Floor-length wine velvet Anarkali with a gold-embellished yoke and matching dupatta.'),
--   ('suit-cotton-indigo', 'Cotton Kurti Set — Indigo Block',     'suits',    1899,  2699,  'https://images.pexels.com/photos/20690516/pexels-photo-20690516.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#2b3a67","#eadfce"]'::jsonb, 'Handblock Cotton',   'Indigo',       '',           20, 4.5, 'Breathable handblock-printed cotton kurti with pants. Everyday grace, hand-crafted in India.'),
--   ('suit-chanderi-gold', 'Chanderi Suit — Ivory & Gold',        'suits',    3299,  4599,  'https://images.pexels.com/photos/37054351/pexels-photo-37054351.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#efe6d0","#c79a3a"]'::jsonb, 'Chanderi Silk',      'Ivory',        'New',        9,  4.7, 'Luminous ivory Chanderi with fine gold buttis. Understated festive luxury.'),
--   ('dup-phulkari',       'Phulkari Dupatta — Rani Pink',        'dupattas', 1299,  1899,  'https://images.pexels.com/photos/13584935/pexels-photo-13584935.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#b3295f","#c79a3a"]'::jsonb, 'Georgette',          'Rani Pink',    '',           15, 4.6, 'Vibrant Phulkari embroidery on a flowy georgette base. The statement piece your wardrobe needs.'),
--   ('dup-organza-ivory',  'Organza Stole — Ivory Gota',          'dupattas', 999,   1499,  'https://images.pexels.com/photos/36266671/pexels-photo-36266671.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#f3e4d7","#c79a3a"]'::jsonb, 'Organza',            'Ivory',        '',           18, 4.4, 'Sheer organza stole edged with delicate gota lace. Drapes beautifully over any outfit.'),
--   ('bri-sharara-gold',   'Bridal Sharara — Antique Gold',       'bridal',   15999, 22999, 'https://images.pexels.com/photos/29128064/pexels-photo-29128064.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#b8860b","#7a1f2b"]'::jsonb, 'Silk + Gota Patti',  'Antique Gold', 'Bridal',     2,  5.0, 'Regal antique-gold sharara with intricate gota-patti. For the bride who loves tradition with flair.'),
--   ('bri-velvet-maroon',  'Bridal Gown — Maroon Velvet',         'bridal',   13499, 18999, 'https://images.pexels.com/photos/31832873/pexels-photo-31832873.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop', '["#4a0e1a","#c79a3a"]'::jsonb, 'Velvet + Stonework', 'Maroon',       'New',        4,  4.9, 'Deep maroon velvet gown with hand-set stonework and a sweeping train. Modern bridal drama.')
-- on conflict (id) do nothing;
