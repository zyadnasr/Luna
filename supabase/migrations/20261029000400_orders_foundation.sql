create type public.order_type as enum ('table', 'delivery', 'external');
create type public.order_status as enum ('new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'rejected');
create type public.payment_method as enum ('cash', 'instapay');
create type public.payment_status as enum ('pending', 'proof_submitted', 'verified', 'rejected', 'cash_pending', 'paid', 'refunded');

create sequence public.order_number_seq;

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text not null, name_it text not null,
  delivery_fee_egp numeric(12,2) not null check (delivery_fee_egp >= 0), is_active boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique default ('LH-' || to_char(timezone('utc', now()), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  source public.order_source not null, order_type public.order_type not null, status public.order_status not null default 'new', branch_id uuid references public.branches(id) on delete restrict,
  dining_table_id uuid references public.dining_tables(id) on delete restrict, qr_code_id uuid references public.qr_codes(id) on delete restrict, customer_name text, customer_phone text, customer_email text,
  delivery_zone_id uuid references public.delivery_zones(id) on delete restrict, delivery_address text, delivery_location_url text, customer_notes text, requested_delivery_time timestamptz,
  subtotal_egp numeric(12,2) not null check (subtotal_egp >= 0), delivery_fee_egp numeric(12,2) not null default 0 check (delivery_fee_egp >= 0), total_egp numeric(12,2) not null check (total_egp >= 0),
  payment_method public.payment_method not null, payment_status public.payment_status not null default 'pending', payment_proof_path text, status_lookup_token uuid not null default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null, confirmed_by uuid references auth.users(id) on delete set null, confirmed_at timestamptz, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  check ((order_type = 'table' and branch_id is not null and dining_table_id is not null and qr_code_id is not null and delivery_zone_id is null) or (order_type = 'delivery' and dining_table_id is null) or order_type = 'external'),
  check (payment_method <> 'instapay' or payment_status in ('pending', 'proof_submitted', 'verified', 'rejected'))
);
create unique index orders_status_lookup_token_idx on public.orders(status_lookup_token);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid not null references public.products(id) on delete restrict,
  product_price_id uuid references public.product_prices(id) on delete restrict, product_name_snapshot jsonb not null, price_label_snapshot text, unit_price_egp numeric(12,2) not null check (unit_price_egp > 0), quantity integer not null check (quantity > 0), line_total_egp numeric(12,2) not null check (line_total_egp > 0), created_at timestamptz not null default timezone('utc', now())
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, method public.payment_method not null, status public.payment_status not null, amount_egp numeric(12,2) not null check (amount_egp >= 0), proof_path text, verified_by uuid references auth.users(id) on delete set null, verified_at timestamptz, notes text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, from_status public.order_status, to_status public.order_status not null, changed_by uuid references auth.users(id) on delete set null, note text, created_at timestamptz not null default timezone('utc', now())
);
create trigger delivery_zones_set_updated_at before update on public.delivery_zones for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create index orders_status_created_idx on public.orders(status, created_at desc); create index orders_source_idx on public.orders(source); create index orders_phone_idx on public.orders(customer_phone); create index order_items_order_idx on public.order_items(order_id); create index order_history_order_idx on public.order_status_history(order_id, created_at);

alter table public.delivery_zones enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.payments enable row level security; alter table public.order_status_history enable row level security;
create policy "public read active delivery zones" on public.delivery_zones for select to anon, authenticated using (is_active);
create policy "owner manage delivery zones" on public.delivery_zones for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage orders" on public.orders for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage order items" on public.order_items for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage payments" on public.payments for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage order history" on public.order_status_history for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "public submit orders" on public.orders for insert to anon with check (status = 'new' and created_by is null);
create policy "public submit order items" on public.order_items for insert to anon with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.status = 'new'));

insert into public.app_settings (key, value, description, is_public) values ('instapay_display_number', 'null'::jsonb, 'Owner-configured Instapay display number.', true) on conflict (key) do nothing;
