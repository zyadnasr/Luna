-- Store the resolved delivery place separately from ad attribution data.
alter table public.orders
  add column if not exists delivery_latitude numeric(10,7),
  add column if not exists delivery_longitude numeric(10,7),
  add column if not exists delivery_place_name text,
  add column if not exists delivery_place_id text;

create index if not exists orders_delivery_place_idx on public.orders(delivery_place_id);
