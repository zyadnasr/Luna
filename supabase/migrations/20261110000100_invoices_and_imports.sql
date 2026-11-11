create sequence if not exists public.invoice_number_seq;

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'INV-' || to_char(timezone('utc', now()), 'YYMMDD') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
end;
$$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  invoice_number text not null unique,
  status text not null default 'issued' check (status in ('issued', 'void')),
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_type text not null default 'new' check (customer_type in ('new', 'returning')),
  subtotal_egp numeric(12,2) not null default 0,
  delivery_fee_egp numeric(12,2) not null default 0,
  discount_percentage numeric(5,2) not null default 0,
  discount_amount_egp numeric(12,2) not null default 0,
  tax_amount_egp numeric(12,2) not null default 0,
  total_egp numeric(12,2) not null default 0,
  currency text not null default 'EGP',
  issued_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot jsonb not null default '{}'::jsonb,
  price_label_snapshot text,
  unit_price_egp numeric(12,2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  line_total_egp numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  imported_by uuid references auth.users(id) on delete set null,
  imported_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'completed' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.order_import_batches(id) on delete cascade,
  row_number integer not null,
  order_number text,
  error text not null,
  raw_row jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.order_import_batches enable row level security;
alter table public.order_import_errors enable row level security;

create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
