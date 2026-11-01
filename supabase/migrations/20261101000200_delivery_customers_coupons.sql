alter type public.payment_method add value if not exists 'card';

create table public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  delivery_address text,
  delivery_location_url text,
  order_count integer not null default 0 check (order_count >= 0),
  free_shipping boolean not null default false,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  applies_to_all boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.coupon_products (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_phone text not null,
  discount_egp numeric(12,2) not null check (discount_egp >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders add column if not exists customer_profile_id uuid references public.customer_profiles(id) on delete set null;
alter table public.orders add column if not exists coupon_id uuid references public.coupons(id) on delete set null;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_egp numeric(12,2) not null default 0 check (discount_egp >= 0);

create index customer_profiles_phone_idx on public.customer_profiles(phone);
create index coupons_code_idx on public.coupons(code);
create index coupon_redemptions_customer_idx on public.coupon_redemptions(customer_phone, created_at desc);
create trigger customer_profiles_set_updated_at before update on public.customer_profiles for each row execute function public.set_updated_at();
create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();

create or replace function public.increment_coupon_uses(coupon_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons set uses_count = uses_count + 1 where id = coupon_id_input;
$$;

alter table public.customer_profiles enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_products enable row level security;
alter table public.coupon_redemptions enable row level security;
create policy "owner manage customer profiles" on public.customer_profiles for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage coupons" on public.coupons for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage coupon products" on public.coupon_products for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage coupon redemptions" on public.coupon_redemptions for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));

insert into public.delivery_zones (id, name_ar, name_en, name_it, delivery_fee_egp, is_active, sort_order)
values ('00000000-0000-0000-0000-000000000550', 'التجمع', 'El Tagamo3', 'El Tagamo3', 45, true, 1)
on conflict (id) do update set delivery_fee_egp = excluded.delivery_fee_egp, is_active = true;
