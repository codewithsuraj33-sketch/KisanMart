-- ============================================================
-- KisanMart — Database Schema + Row Level Security (RLS)
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- Re-runnable (idempotent): safe to run more than once.
-- ============================================================

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

-- 1. PROFILES — auth.users ko extend karta hai (is_admin yahin)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2. CATEGORIES — product categories (Seeds, Fertilizers, Tools...)
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- 3. PRODUCTS
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null check (price >= 0),   -- selling price
  mrp           numeric(10,2) check (mrp >= 0),              -- original price (for discount %)
  stock         integer not null default 0 check (stock >= 0),
  category_id   uuid references public.categories(id) on delete set null,
  image_url     text,
  weight_grams  integer not null default 500,               -- Shiprocket ke liye
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 4. ORDERS
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  status              text not null default 'pending',   -- pending|paid|shipped|delivered|cancelled
  total_amount        numeric(10,2) not null,
  discount_amount     numeric(10,2) not null default 0,
  coupon_code         text,
  -- shipping address (order ke waqt ka snapshot)
  shipping_name       text not null,
  shipping_phone      text not null,
  shipping_address    text not null,
  shipping_city       text not null,
  shipping_state      text not null,
  shipping_pincode    text not null,
  -- payment (Razorpay)
  payment_status      text not null default 'pending',   -- pending|paid|failed
  razorpay_order_id   text,
  razorpay_payment_id text,
  -- shipping (Shiprocket) — abhi placeholder
  shiprocket_order_id text,
  awb_code            text,
  created_at          timestamptz not null default now()
);

-- 5. ORDER_ITEMS — ek order mein kaun kaun se products
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,                 -- snapshot (product delete ho jaye to bhi naam rahe)
  price         numeric(10,2) not null,        -- snapshot (us waqt ki price)
  quantity      integer not null check (quantity > 0)
);

-- 6. COUPONS
create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  discount_type     text not null default 'percentage',  -- percentage | flat
  discount_value    numeric(10,2) not null,
  min_order_amount  numeric(10,2) not null default 0,
  max_discount      numeric(10,2),
  is_active         boolean not null default true,
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INDEXES (B-tree) — searching/filtering fast karne ke liye
-- ------------------------------------------------------------
create index if not exists idx_products_category  on public.products(category_id);
create index if not exists idx_products_active     on public.products(is_active);
create index if not exists idx_orders_user         on public.orders(user_id);
create index if not exists idx_order_items_order   on public.order_items(order_id);

-- ------------------------------------------------------------
-- ADMIN HELPER FUNCTION
-- SECURITY DEFINER => RLS ko bypass karke check karta hai,
-- isse profiles table pe "infinite recursion" error nahi aata.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ------------------------------------------------------------
-- AUTO-CREATE PROFILE on signup
-- Jab naya user signup kare, profiles row apne aap ban jaye.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — sabhi tables pe ON
-- ------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons     enable row level security;

-- ===== PROFILES =====
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Customer sirf apna naam/phone update kar sakta hai. Table-level UPDATE
-- revoke karna zaroori hai, warna koi direct API call se is_admin badal sakta hai.
revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

-- ===== CATEGORIES ===== (sab dekh sakte, sirf admin edit)
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ===== PRODUCTS ===== (active products sab dekh sakte, admin sab)
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ===== ORDERS ===== (user sirf apne, admin sab)
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ===== ORDER_ITEMS ===== (apne order ke items, admin sab)
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ===== COUPONS ===== (active coupon sab check kar sakte, admin manage)
drop policy if exists coupons_read_active on public.coupons;
create policy coupons_read_active on public.coupons
  for select using (is_active = true or public.is_admin());

drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- DONE ✅
-- Ab tu khud ko admin banane ke liye (signup ke baad):
--   update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';
-- ============================================================
