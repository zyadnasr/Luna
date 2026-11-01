create extension if not exists pgcrypto;

create type public.location_type as enum ('warehouse', 'branch');
create type public.qr_code_type as enum ('table', 'general_delivery');
create type public.product_availability_status as enum ('available', 'out_of_stock', 'hidden');
create type public.order_source as enum ('website', 'qr_table', 'talabat', 'uber', 'whatsapp', 'manual');
create type public.user_role as enum ('owner', 'manager', 'cashier', 'kitchen', 'inventory', 'accountant');
create type public.supported_locale as enum ('ar', 'en', 'it');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  type public.location_type not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null unique references public.locations(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null unique references public.locations(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  table_number integer not null check (table_number > 0),
  display_name text not null check (length(trim(display_name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, table_number)
);

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(trim(code)) > 0),
  type public.qr_code_type not null,
  branch_id uuid references public.branches(id) on delete restrict,
  dining_table_id uuid unique references public.dining_tables(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((type = 'table' and dining_table_id is not null and branch_id is not null) or (type = 'general_delivery' and dining_table_id is null))
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(trim(slug)) > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  sku text unique,
  is_active boolean not null default true,
  availability_status public.product_availability_status not null default 'hidden',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  locale public.supported_locale not null,
  name text not null check (length(trim(name)) > 0),
  description text,
  ingredients_text text,
  allergens_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, locale)
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price_egp numeric(12, 2) not null check (price_egp >= 0),
  label text,
  is_active boolean not null default true,
  valid_from timestamptz not null default timezone('utc', now()),
  valid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (valid_until is null or valid_until > valid_from)
);

create table public.nutrition_facts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  serving_size text,
  calories numeric(10, 2) check (calories is null or calories >= 0),
  protein_g numeric(10, 2) check (protein_g is null or protein_g >= 0),
  carbohydrates_g numeric(10, 2) check (carbohydrates_g is null or carbohydrates_g >= 0),
  sugars_g numeric(10, 2) check (sugars_g is null or sugars_g >= 0),
  total_fat_g numeric(10, 2) check (total_fat_g is null or total_fat_g >= 0),
  saturated_fat_g numeric(10, 2) check (saturated_fat_g is null or saturated_fat_g >= 0),
  trans_fat_g numeric(10, 2) check (trans_fat_g is null or trans_fat_g >= 0),
  fiber_g numeric(10, 2) check (fiber_g is null or fiber_g >= 0),
  cholesterol_mg numeric(10, 2) check (cholesterol_mg is null or cholesterol_mg >= 0),
  source_image_path text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_sources (
  id uuid primary key default gen_random_uuid(),
  name public.order_source not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  preferred_locale public.supported_locale not null default 'ar',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  role public.user_role primary key
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null references public.roles(role) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) > 0),
  entity_type text not null check (length(trim(entity_type)) > 0),
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (length(trim(key)) > 0),
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
create trigger warehouses_set_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();
create trigger dining_tables_set_updated_at before update on public.dining_tables for each row execute function public.set_updated_at();
create trigger qr_codes_set_updated_at before update on public.qr_codes for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_translations_set_updated_at before update on public.product_translations for each row execute function public.set_updated_at();
create trigger product_prices_set_updated_at before update on public.product_prices for each row execute function public.set_updated_at();
create trigger nutrition_facts_set_updated_at before update on public.nutrition_facts for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

create index dining_tables_branch_id_idx on public.dining_tables(branch_id);
create index qr_codes_branch_id_idx on public.qr_codes(branch_id);
create index products_category_id_idx on public.products(category_id);
create index products_active_status_idx on public.products(is_active, availability_status);
create index product_translations_locale_idx on public.product_translations(locale);
create index product_prices_product_active_idx on public.product_prices(product_id, is_active);
create index audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at);

create or replace function public.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

alter table public.locations enable row level security;
alter table public.warehouses enable row level security;
alter table public.branches enable row level security;
alter table public.dining_tables enable row level security;
alter table public.qr_codes enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.product_prices enable row level security;
alter table public.nutrition_facts enable row level security;
alter table public.order_sources enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

create policy "public read active branches" on public.branches for select to anon, authenticated using (is_active);
create policy "public read active branch locations" on public.locations for select to anon, authenticated using (is_active and type = 'branch');
create policy "public read active dining tables" on public.dining_tables for select to anon, authenticated using (is_active);
create policy "public read active table qr codes" on public.qr_codes for select to anon, authenticated using (is_active);
create policy "public read active categories" on public.categories for select to anon, authenticated using (is_active);
create policy "public read active products" on public.products for select to anon, authenticated using (is_active and availability_status = 'available');
create policy "public read active translations" on public.product_translations for select to anon, authenticated using (exists (select 1 from public.products where products.id = product_translations.product_id and products.is_active and products.availability_status = 'available'));
create policy "public read active prices" on public.product_prices for select to anon, authenticated using (is_active and (valid_until is null or valid_until > timezone('utc', now())));
create policy "public read public settings" on public.app_settings for select to anon, authenticated using (is_public);

create policy "owner manage locations" on public.locations for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage warehouses" on public.warehouses for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage branches" on public.branches for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage dining tables" on public.dining_tables for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage qr codes" on public.qr_codes for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage categories" on public.categories for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage products" on public.products for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage translations" on public.product_translations for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage prices" on public.product_prices for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage nutrition" on public.nutrition_facts for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage order sources" on public.order_sources for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage roles" on public.roles for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage user roles" on public.user_roles for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner read audit logs" on public.audit_logs for select to authenticated using (public.has_role('owner'));
create policy "owner manage settings" on public.app_settings for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
