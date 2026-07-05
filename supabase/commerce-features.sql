-- ============================================================
-- KisanMart — Advanced commerce features
-- Run ONCE in Supabase SQL Editor after schema.sql.
-- Safe to re-run: tables/columns/policies are idempotent.
-- ============================================================

-- ---------- PROFILE / SELLER FOUNDATION ----------
alter table public.profiles add column if not exists loyalty_points integer not null default 0;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists is_seller boolean not null default false;

update public.profiles
set referral_code = upper(substr(md5(id::text), 1, 8))
where referral_code is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_referral_code_key'
  ) then
    alter table public.profiles add constraint profiles_referral_code_key unique (referral_code);
  end if;
end $$;

create table if not exists public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  business_name       text not null,
  phone               text,
  gst_number          text,
  status              text not null default 'pending' check (status in ('pending','approved','suspended')),
  commission_percent  numeric(5,2) not null default 10,
  created_at          timestamptz not null default now()
);

alter table public.products add column if not exists seller_id uuid references public.sellers(id) on delete set null;
alter table public.products add column if not exists rating_avg numeric(3,2) not null default 0;
alter table public.products add column if not exists rating_count integer not null default 0;
alter table public.products add column if not exists is_flash_sale boolean not null default false;
alter table public.products add column if not exists sale_ends_at timestamptz;

-- Give an initial demo flash sale to the oldest eight active products.
update public.products
set is_flash_sale = true,
    sale_ends_at = now() + interval '3 days'
where id in (
  select id from public.products
  where is_active = true and sale_ends_at is null
  order by created_at asc
  limit 8
);

-- ---------- REVIEWS / VERIFIED BUYER ----------
create table if not exists public.product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  reviewer_name text not null default 'KisanMart Customer',
  title         text,
  comment       text not null,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(product_id, user_id)
);

alter table public.product_reviews add column if not exists reviewer_name text not null default 'KisanMart Customer';

create or replace function public.set_review_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(nullif(trim(full_name), ''), 'KisanMart Customer')
  into new.reviewer_name
  from public.profiles
  where id = new.user_id;
  new.reviewer_name := coalesce(new.reviewer_name, 'KisanMart Customer');
  new.is_verified := exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = new.product_id
      and o.user_id = new.user_id
      and o.payment_status = 'paid'
  );
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_review_verified_trigger on public.product_reviews;
create trigger set_review_verified_trigger
  before insert or update on public.product_reviews
  for each row execute function public.set_review_verified();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product uuid;
begin
  if tg_op = 'DELETE' then
    target_product := old.product_id;
  else
    target_product := new.product_id;
  end if;
  update public.products p
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.review_count, 0)
  from (
    select avg(rating)::numeric(3,2) as avg_rating, count(*)::integer as review_count
    from public.product_reviews
    where product_id = target_product
  ) r
  where p.id = target_product;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists refresh_product_rating_trigger on public.product_reviews;
create trigger refresh_product_rating_trigger
  after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_rating();

-- ---------- WISHLIST ----------
create table if not exists public.wishlists (
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key(user_id, product_id)
);

-- ---------- MULTIPLE DELIVERY ADDRESSES ----------
create table if not exists public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text not null default 'Home',
  full_name     text not null,
  phone         text not null,
  address_line  text not null,
  city          text not null,
  state         text not null,
  pincode       text not null,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create or replace function public.keep_one_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_one_default_address_trigger on public.addresses;
create trigger keep_one_default_address_trigger
  before insert or update of is_default on public.addresses
  for each row execute function public.keep_one_default_address();

-- ---------- PINCODE DELIVERY ----------
create table if not exists public.serviceable_pincodes (
  pincode          text primary key,
  delivery_days    integer not null default 5 check (delivery_days between 1 and 30),
  cod_available    boolean not null default true,
  is_active        boolean not null default true
);

insert into public.serviceable_pincodes (pincode, delivery_days, cod_available) values
  ('110001', 3, true), ('400001', 3, true), ('560001', 4, true),
  ('700001', 4, true), ('600001', 4, true), ('500001', 4, true),
  ('302001', 5, true), ('226001', 5, true), ('800001', 6, true)
on conflict (pincode) do nothing;

-- ---------- PRODUCT VARIANTS ----------
create table if not exists public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  label         text not null,
  price         numeric(10,2) not null check (price >= 0),
  mrp           numeric(10,2) check (mrp >= 0),
  stock         integer not null default 0 check (stock >= 0),
  weight_grams  integer not null default 500 check (weight_grams > 0),
  is_default    boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique(product_id, label)
);

-- Demo weight/volume choices for seed and pesticide products.
insert into public.product_variants
  (product_id, label, price, mrp, stock, weight_grams, is_default)
select p.id, v.label,
       round((p.price * v.multiplier)::numeric, 2),
       case when p.mrp is null then null else round((p.mrp * v.multiplier)::numeric, 2) end,
       greatest(5, floor(p.stock / v.stock_divisor)::integer),
       v.weight_grams,
       v.is_default
from public.products p
join public.categories c on c.id = p.category_id
cross join lateral (
  values
    (case when c.slug = 'pesticides' then '250ml' else '250g' end, 0.45::numeric, 4, 250, false),
    (case when c.slug = 'pesticides' then '500ml' else '500g' end, 0.70::numeric, 2, 500, true),
    (case when c.slug = 'pesticides' then '1L' else '1kg' end, 1.00::numeric, 1, 1000, false)
) as v(label, multiplier, stock_divisor, weight_grams, is_default)
where c.slug in ('seeds', 'pesticides')
on conflict (product_id, label) do nothing;

alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.order_items add column if not exists variant_label text;

-- ---------- TRACKING / RETURNS ----------
alter table public.orders add column if not exists expected_delivery_date date;

create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      text not null,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.return_requests (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  reason        text not null,
  details       text,
  status        text not null default 'requested' check (status in ('requested','approved','rejected','picked_up','refunded')),
  refund_amount numeric(10,2),
  created_at    timestamptz not null default now()
);

-- ---------- STOCK / PUSH ALERTS ----------
create table if not exists public.stock_alerts (
  user_id      uuid not null references auth.users(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz,
  primary key(user_id, product_id)
);

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  subscription  jsonb not null,
  created_at    timestamptz not null default now()
);

-- ---------- LOYALTY / REFERRALS ----------
create table if not exists public.loyalty_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  points      integer not null,
  kind        text not null check (kind in ('earned','redeemed','referral','adjustment')),
  note        text,
  created_at  timestamptz not null default now(),
  unique(order_id, kind)
);

create table if not exists public.referral_rewards (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references auth.users(id) on delete cascade,
  referred_id   uuid not null unique references auth.users(id) on delete cascade,
  points        integer not null default 100,
  created_at    timestamptz not null default now()
);

-- Signup trigger now also creates a referral code and accepts referral metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
begin
  select id into referrer
  from public.profiles
  where referral_code = upper(new.raw_user_meta_data->>'referral_code')
  limit 1;

  insert into public.profiles (id, full_name, phone, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    upper(substr(md5(new.id::text), 1, 8)),
    referrer
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- INDEXES ----------
create index if not exists idx_reviews_product on public.product_reviews(product_id);
create index if not exists idx_wishlists_user on public.wishlists(user_id);
create index if not exists idx_addresses_user on public.addresses(user_id);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_status_history_order on public.order_status_history(order_id);
create index if not exists idx_returns_user on public.return_requests(user_id);
create index if not exists idx_products_seller on public.products(seller_id);

-- ---------- RLS ----------
alter table public.sellers enable row level security;
alter table public.product_reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.addresses enable row level security;
alter table public.serviceable_pincodes enable row level security;
alter table public.product_variants enable row level security;
alter table public.order_status_history enable row level security;
alter table public.return_requests enable row level security;
alter table public.stock_alerts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists reviews_public_read on public.product_reviews;
create policy reviews_public_read on public.product_reviews for select using (true);
drop policy if exists reviews_own_insert on public.product_reviews;
create policy reviews_own_insert on public.product_reviews for insert with check (auth.uid() = user_id);
drop policy if exists reviews_own_update on public.product_reviews;
create policy reviews_own_update on public.product_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists reviews_own_delete on public.product_reviews;
create policy reviews_own_delete on public.product_reviews for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists wishlist_own_all on public.wishlists;
create policy wishlist_own_all on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists addresses_own_all on public.addresses;
create policy addresses_own_all on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists pincodes_public_read on public.serviceable_pincodes;
create policy pincodes_public_read on public.serviceable_pincodes for select using (true);
drop policy if exists pincodes_admin_write on public.serviceable_pincodes;
create policy pincodes_admin_write on public.serviceable_pincodes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants for select using (is_active = true or public.is_admin());
drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists status_history_read on public.order_status_history;
create policy status_history_read on public.order_status_history for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
drop policy if exists status_history_admin_insert on public.order_status_history;
create policy status_history_admin_insert on public.order_status_history for insert with check (public.is_admin());

drop policy if exists returns_read on public.return_requests;
create policy returns_read on public.return_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists returns_insert on public.return_requests;
create policy returns_insert on public.return_requests for insert with check (
  user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists returns_admin_update on public.return_requests;
create policy returns_admin_update on public.return_requests for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists stock_alerts_own_all on public.stock_alerts;
create policy stock_alerts_own_all on public.stock_alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_own_all on public.push_subscriptions;
create policy push_own_all on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists loyalty_own_read on public.loyalty_transactions;
create policy loyalty_own_read on public.loyalty_transactions for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists referrals_own_read on public.referral_rewards;
create policy referrals_own_read on public.referral_rewards for select using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin());

drop policy if exists sellers_public_read on public.sellers;
create policy sellers_public_read on public.sellers for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists sellers_admin_write on public.sellers;
create policy sellers_admin_write on public.sellers for all using (public.is_admin()) with check (public.is_admin());

-- Explicit API grants; RLS still decides which rows are visible/editable.
grant select on public.product_reviews, public.serviceable_pincodes, public.product_variants, public.sellers to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
grant select, insert, update, delete on public.wishlists, public.addresses, public.stock_alerts, public.push_subscriptions to authenticated;
grant select on public.order_status_history, public.return_requests, public.loyalty_transactions, public.referral_rewards to authenticated;
grant insert on public.return_requests to authenticated;

-- Stock changes are server-only, positive, and fail instead of overselling.
create or replace function public.decrement_stock(p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty <= 0 then raise exception 'Quantity must be positive'; end if;
  update public.products set stock = stock - p_qty
  where id = p_product_id and stock >= p_qty;
  if not found then raise exception 'Insufficient stock'; end if;
end;
$$;

create or replace function public.decrement_variant_stock(p_variant_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty <= 0 then raise exception 'Quantity must be positive'; end if;
  update public.product_variants set stock = stock - p_qty
  where id = p_variant_id and stock >= p_qty;
  if not found then raise exception 'Insufficient variant stock'; end if;
end;
$$;

revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.decrement_variant_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
grant execute on function public.decrement_variant_stock(uuid, integer) to service_role;

-- Seed two safe demo coupons.
insert into public.coupons
  (code, discount_type, discount_value, min_order_amount, max_discount, is_active)
values
  ('WELCOME10', 'percentage', 10, 499, 200, true),
  ('KISAN50', 'flat', 50, 799, null, true)
on conflict (code) do nothing;

-- Refresh profile column protection after the new internal columns.
revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

-- Trigger helpers must not be directly callable through the API.
revoke execute on function public.set_review_verified() from public;
revoke execute on function public.refresh_product_rating() from public;
revoke execute on function public.keep_one_default_address() from public;

-- ============================================================
-- Advanced commerce schema ready.
-- ============================================================
