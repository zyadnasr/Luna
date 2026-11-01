alter table public.products add column if not exists sort_order integer not null default 0;

create table public.category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  locale public.supported_locale not null,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (category_id, locale)
);

create trigger category_translations_set_updated_at before update on public.category_translations for each row execute function public.set_updated_at();
create index products_sort_order_idx on public.products(category_id, sort_order);
create index category_translations_locale_idx on public.category_translations(locale);

alter table public.category_translations enable row level security;
create policy "public read active category translations" on public.category_translations for select to anon, authenticated using (exists (select 1 from public.categories where categories.id = category_translations.category_id and categories.is_active));
create policy "owner manage category translations" on public.category_translations for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner insert audit logs" on public.audit_logs for insert to authenticated with check (public.has_role('owner') and actor_user_id = (select auth.uid()));

drop policy if exists "public read active products" on public.products;
create policy "public read visible products" on public.products for select to anon, authenticated using (is_active and availability_status <> 'hidden');

drop policy if exists "public read active prices" on public.product_prices;
create policy "public read visible product prices" on public.product_prices for select to anon, authenticated using (is_active and (valid_until is null or valid_until > timezone('utc', now())) and exists (select 1 from public.products where products.id = product_prices.product_id and products.is_active and products.availability_status <> 'hidden'));
