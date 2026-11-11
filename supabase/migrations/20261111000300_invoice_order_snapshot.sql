alter table public.invoices
  add column if not exists order_data_snapshot jsonb not null default '{}'::jsonb;

comment on column public.invoices.order_data_snapshot is
  'Complete immutable order data captured when the invoice is created.';

update public.invoices as invoices
set order_data_snapshot = to_jsonb(orders)
from public.orders as orders
where invoices.order_id = orders.id
  and invoices.order_data_snapshot = '{}'::jsonb;
