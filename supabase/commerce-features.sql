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
alter table public.orders add column if not exists payment_method text not null default 'online';
alter table public.orders add column if not exists subtotal numeric(10,2);
alter table public.orders add column if not exists shipping_cost numeric(10,2) not null default 0;
alter table public.orders add column if not exists stock_reserved_at timestamptz;
alter table public.orders add column if not exists coupon_redeemed_at timestamptz;
alter table public.orders add column if not exists inventory_released_at timestamptz;
alter table public.orders add column if not exists loyalty_points_redeemed integer not null default 0;
alter table public.orders add column if not exists loyalty_discount numeric(10,2) not null default 0;
alter table public.coupons add column if not exists usage_limit integer;
alter table public.coupons add column if not exists used_count integer not null default 0;

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

-- ---------- CUSTOMER NOTIFICATIONS ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  kind        text not null default 'info',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- BULK / B2B QUOTE REQUESTS ----------
create table if not exists public.bulk_quote_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  name            text not null,
  phone           text not null,
  email           text,
  organisation    text,
  products_needed text not null,
  quantity_note   text not null,
  delivery_place  text not null,
  message         text,
  status          text not null default 'new' check (status in ('new','contacted','quoted','closed')),
  created_at      timestamptz not null default now()
);

-- ---------- REFUND TRACKER ----------
create table if not exists public.refunds (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null unique references public.orders(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  amount              numeric(10,2) not null check (amount >= 0),
  reason              text not null,
  status              text not null default 'initiated' check (status in ('initiated','processing','completed','failed')),
  provider             text,
  provider_refund_id  text,
  failure_reason      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- ACCOUNT PREFERENCES / FARM PROFILE ----------
create table if not exists public.user_preferences (
  user_id                       uuid primary key references auth.users(id) on delete cascade,
  locale                        text not null default 'en' check (locale in ('en','hi','pa','mr','gu','te','ta','kn')),
  order_email                   boolean not null default true,
  order_sms                     boolean not null default true,
  order_whatsapp                boolean not null default false,
  push_notifications            boolean not null default true,
  stock_alerts                  boolean not null default true,
  price_alerts                  boolean not null default true,
  marketing_messages            boolean not null default false,
  personalized_recommendations  boolean not null default true,
  text_size                     text not null default 'normal' check (text_size in ('normal','large')),
  high_contrast                 boolean not null default false,
  updated_at                    timestamptz not null default now()
);

create table if not exists public.farm_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  farm_name     text,
  acreage       numeric(10,2),
  crops         text[] not null default '{}',
  soil_type     text,
  irrigation   text,
  district      text,
  state         text,
  organisation text,
  gstin         text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  reason        text,
  status        text not null default 'requested' check (status in ('requested','cancelled','completed')),
  scheduled_for date not null default (current_date + 7),
  created_at    timestamptz not null default now()
);

-- ---------- SUBSCRIBE & SAVE ----------
create table if not exists public.product_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  variant_id        uuid references public.product_variants(id) on delete set null,
  address_id        uuid not null references public.addresses(id) on delete restrict,
  quantity          integer not null default 1 check (quantity between 1 and 20),
  frequency_days    integer not null default 30 check (frequency_days in (15,30,45,60,90)),
  discount_percent  numeric(5,2) not null default 5 check (discount_percent between 0 and 30),
  status            text not null default 'active' check (status in ('active','paused','cancelled')),
  next_order_date   date not null,
  last_order_id     uuid references public.orders(id) on delete set null,
  last_error        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.orders add column if not exists subscription_id uuid references public.product_subscriptions(id) on delete set null;
alter table public.orders add column if not exists subscription_scheduled_for date;

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
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_bulk_quotes_status on public.bulk_quote_requests(status, created_at desc);
create index if not exists idx_refunds_user on public.refunds(user_id, created_at desc);
create index if not exists idx_subscriptions_due on public.product_subscriptions(status, next_order_date);
create unique index if not exists idx_subscription_cycle_unique on public.orders(subscription_id, subscription_scheduled_for)
  where subscription_id is not null;
create unique index if not exists idx_subscription_product_unique
  on public.product_subscriptions(user_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status <> 'cancelled';

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
alter table public.notifications enable row level security;
alter table public.bulk_quote_requests enable row level security;
alter table public.refunds enable row level security;
alter table public.user_preferences enable row level security;
alter table public.farm_profiles enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.product_subscriptions enable row level security;

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
  user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  and (
    order_item_id is null
    or exists (select 1 from public.order_items oi where oi.id = order_item_id and oi.order_id = order_id)
  )
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

drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists bulk_quotes_own_read on public.bulk_quote_requests;
create policy bulk_quotes_own_read on public.bulk_quote_requests for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists bulk_quotes_insert on public.bulk_quote_requests;
create policy bulk_quotes_insert on public.bulk_quote_requests for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists bulk_quotes_admin_update on public.bulk_quote_requests;
create policy bulk_quotes_admin_update on public.bulk_quote_requests for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists refunds_own_read on public.refunds;
create policy refunds_own_read on public.refunds for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists refunds_admin_update on public.refunds;
create policy refunds_admin_update on public.refunds for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists preferences_own_all on public.user_preferences;
create policy preferences_own_all on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists farm_profiles_own_all on public.farm_profiles;
create policy farm_profiles_own_all on public.farm_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists deletion_requests_own_all on public.account_deletion_requests;
create policy deletion_requests_own_all on public.account_deletion_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists subscriptions_own_all on public.product_subscriptions;
create policy subscriptions_own_all on public.product_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Explicit API grants; RLS still decides which rows are visible/editable.
grant select on public.product_reviews, public.serviceable_pincodes, public.product_variants, public.sellers to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
grant select, insert, update, delete on public.wishlists, public.addresses, public.stock_alerts, public.push_subscriptions to authenticated;
grant select on public.order_status_history, public.return_requests, public.loyalty_transactions, public.referral_rewards to authenticated;
grant insert on public.return_requests to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert on public.bulk_quote_requests to anon, authenticated;
grant select on public.refunds to authenticated;
grant select, insert, update, delete on public.user_preferences, public.farm_profiles, public.account_deletion_requests, public.product_subscriptions to authenticated;

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

-- Atomically reserves every line item and redeems the coupon once. If any
-- item is short, PostgreSQL rolls the whole function back (no half-reserved
-- COD/online order). Safe to retry after a payment callback.
create or replace function public.reserve_order_inventory(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  item record;
begin
  select * into target_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if target_order.stock_reserved_at is not null then return; end if;

  for item in select * from public.order_items where order_id = p_order_id loop
    if item.variant_id is not null then
      update public.product_variants
      set stock = stock - item.quantity
      where id = item.variant_id and stock >= item.quantity;
      if not found then raise exception 'Insufficient variant stock'; end if;
    elsif item.product_id is not null then
      update public.products
      set stock = stock - item.quantity
      where id = item.product_id and stock >= item.quantity;
      if not found then raise exception 'Insufficient product stock'; end if;
    end if;
  end loop;

  if target_order.coupon_code is not null and target_order.coupon_redeemed_at is null then
    update public.coupons
    set used_count = used_count + 1
    where code = target_order.coupon_code
      and (usage_limit is null or used_count < usage_limit);
    if not found then raise exception 'Coupon usage limit reached'; end if;
  end if;

  if target_order.loyalty_points_redeemed > 0 then
    update public.profiles
    set loyalty_points = loyalty_points - target_order.loyalty_points_redeemed
    where id = target_order.user_id
      and loyalty_points >= target_order.loyalty_points_redeemed;
    if not found then raise exception 'Insufficient loyalty points'; end if;
    insert into public.loyalty_transactions(user_id, order_id, points, kind, note)
    values(target_order.user_id, target_order.id, -target_order.loyalty_points_redeemed, 'redeemed', 'Points used on order')
    on conflict(order_id, kind) do nothing;
  end if;

  update public.orders
  set stock_reserved_at = now(),
      coupon_redeemed_at = case when coupon_code is not null then now() else coupon_redeemed_at end
  where id = p_order_id;
end;
$$;

revoke execute on function public.reserve_order_inventory(uuid) from public, anon, authenticated;
grant execute on function public.reserve_order_inventory(uuid) to service_role;

-- Restores inventory, coupon usage and redeemed points if an already-reserved
-- order is cancelled. The timestamp makes repeated admin submissions safe.
create or replace function public.release_order_inventory(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  item record;
begin
  select * into target_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if target_order.stock_reserved_at is null or target_order.inventory_released_at is not null then return; end if;

  for item in select * from public.order_items where order_id = p_order_id loop
    if item.variant_id is not null then
      update public.product_variants set stock = stock + item.quantity where id = item.variant_id;
    elsif item.product_id is not null then
      update public.products set stock = stock + item.quantity where id = item.product_id;
    end if;
  end loop;

  if target_order.coupon_code is not null and target_order.coupon_redeemed_at is not null then
    update public.coupons set used_count = greatest(0, used_count - 1) where code = target_order.coupon_code;
  end if;
  if target_order.loyalty_points_redeemed > 0 then
    update public.profiles set loyalty_points = loyalty_points + target_order.loyalty_points_redeemed where id = target_order.user_id;
    insert into public.loyalty_transactions(user_id, order_id, points, kind, note)
    values(target_order.user_id, target_order.id, target_order.loyalty_points_redeemed, 'adjustment', 'Points restored after cancellation')
    on conflict(order_id, kind) do nothing;
  end if;

  update public.orders set inventory_released_at = now() where id = p_order_id;
end;
$$;

revoke execute on function public.release_order_inventory(uuid) from public, anon, authenticated;
grant execute on function public.release_order_inventory(uuid) to service_role;

-- Awards normal order points once, and the referrer bonus on the referred
-- customer's first delivered order. Called only by the admin server action.
create or replace function public.award_order_loyalty(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  points_to_add integer;
  referrer uuid;
begin
  select * into target_order from public.orders where id = p_order_id and status = 'delivered' for update;
  if not found or target_order.user_id is null then return; end if;
  points_to_add := greatest(1, floor(target_order.total_amount / 100)::integer);

  insert into public.loyalty_transactions(user_id, order_id, points, kind, note)
  values(target_order.user_id, target_order.id, points_to_add, 'earned', 'Delivered order reward')
  on conflict(order_id, kind) do nothing;
  if found then
    update public.profiles set loyalty_points = loyalty_points + points_to_add where id = target_order.user_id;
  end if;

  select referred_by into referrer from public.profiles where id = target_order.user_id;
  if referrer is not null then
    insert into public.referral_rewards(referrer_id, referred_id, points)
    values(referrer, target_order.user_id, 100)
    on conflict(referred_id) do nothing;
    if found then
      update public.profiles set loyalty_points = loyalty_points + 100 where id = referrer;
      insert into public.loyalty_transactions(user_id, order_id, points, kind, note)
      values(referrer, target_order.id, 100, 'referral', 'Referral customer first delivered order')
      on conflict(order_id, kind) do nothing;
    end if;
  end if;
end;
$$;

revoke execute on function public.award_order_loyalty(uuid) from public, anon, authenticated;
grant execute on function public.award_order_loyalty(uuid) to service_role;

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
