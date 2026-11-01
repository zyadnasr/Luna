create type public.inventory_item_type as enum ('ingredient','packaging','finished_product');
create type public.inventory_unit as enum ('piece','gram','kilogram','milliliter','liter','box','pack','bag');
create type public.stock_movement_type as enum ('purchase','production','consumption','transfer_out','transfer_in','adjustment','waste','return','cancellation_restore');
create type public.transfer_status as enum ('draft','submitted','completed','cancelled');
create type public.waste_reason as enum ('expired','damaged','production_loss','incorrect_storage','other');

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text not null, name_it text not null,
  item_type public.inventory_item_type not null, sku text unique, unit public.inventory_unit not null, is_active boolean not null default true,
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.stock_batches (
  id uuid primary key default gen_random_uuid(), inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  batch_number text, quantity_received numeric(14,3) not null check (quantity_received >= 0), quantity_available numeric(14,3) not null check (quantity_available >= 0), unit_cost numeric(14,3) check (unit_cost is null or unit_cost >= 0), received_at timestamptz not null default timezone('utc', now()), expiry_date date, supplier text, notes text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), check (quantity_available <= quantity_received)
);
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(), inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, warehouse_id uuid not null references public.warehouses(id) on delete restrict, batch_id uuid references public.stock_batches(id) on delete restrict,
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0), movement_type public.stock_movement_type not null, reference_type text, reference_id uuid, reason text, actor_user_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default timezone('utc', now())
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, product_price_id uuid references public.product_prices(id) on delete cascade, is_active boolean not null default true, note text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique(product_id, product_price_id)
);
create table public.recipe_items (
  id uuid primary key default gen_random_uuid(), recipe_id uuid not null references public.recipes(id) on delete cascade, inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, quantity numeric(14,3) not null check (quantity > 0), unit public.inventory_unit not null, note text, unique(recipe_id, inventory_item_id)
);
create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(), source_warehouse_id uuid not null references public.warehouses(id) on delete restrict, destination_warehouse_id uuid not null references public.warehouses(id) on delete restrict, status public.transfer_status not null default 'draft', note text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), check(source_warehouse_id <> destination_warehouse_id)
);
create table public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(), transfer_id uuid not null references public.stock_transfers(id) on delete cascade, inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, batch_id uuid references public.stock_batches(id) on delete restrict, quantity numeric(14,3) not null check(quantity > 0)
);
create table public.stock_counts (
  id uuid primary key default gen_random_uuid(), warehouse_id uuid not null references public.warehouses(id) on delete restrict, status text not null default 'open' check(status in ('open','completed','cancelled')), reason text, opened_by uuid references auth.users(id) on delete set null, completed_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), completed_at timestamptz
);
create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(), count_id uuid not null references public.stock_counts(id) on delete cascade, inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, expected_quantity numeric(14,3) not null, actual_quantity numeric(14,3), unique(count_id, inventory_item_id)
);
create table public.stock_waste (
  id uuid primary key default gen_random_uuid(), warehouse_id uuid not null references public.warehouses(id) on delete restrict, inventory_item_id uuid not null references public.inventory_items(id) on delete restrict, batch_id uuid references public.stock_batches(id) on delete restrict, quantity numeric(14,3) not null check(quantity > 0), reason public.waste_reason not null, notes text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.consume_order_inventory(order_id_input uuid, warehouse_id_input uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare item_record record; recipe_record record; batch_record record; remaining numeric; needed numeric; consumed jsonb := '[]'::jsonb;
begin
  if not public.has_role('owner') and not public.has_role('inventory') then raise exception 'not authorized'; end if;
  if exists(select 1 from stock_movements where reference_type='order' and reference_id=order_id_input and movement_type='consumption') then return jsonb_build_object('ok', true, 'already_consumed', true); end if;
  for item_record in select oi.product_id, oi.product_price_id, oi.quantity from order_items oi where oi.order_id=order_id_input loop
    select * into recipe_record from recipes where product_id=item_record.product_id and product_price_id is not distinct from item_record.product_price_id and is_active limit 1;
    if recipe_record.id is null then select * into recipe_record from recipes where product_id=item_record.product_id and product_price_id is null and is_active limit 1; end if;
    if recipe_record.id is null then raise exception 'missing recipe for product %', item_record.product_id; end if;
    for recipe_record in select ri.inventory_item_id, ri.quantity from recipe_items ri where ri.recipe_id=recipe_record.id loop
      needed := recipe_record.quantity * item_record.quantity;
      for batch_record in select * from stock_batches where inventory_item_id=recipe_record.inventory_item_id and warehouse_id=warehouse_id_input and quantity_available > 0 and (expiry_date is null or expiry_date >= current_date) order by expiry_date nulls last, received_at for update loop
        exit when needed <= 0; remaining := least(needed, batch_record.quantity_available); update stock_batches set quantity_available=quantity_available-remaining, updated_at=timezone('utc',now()) where id=batch_record.id; insert into stock_movements(inventory_item_id,warehouse_id,batch_id,quantity_delta,movement_type,reference_type,reference_id) values(batch_record.inventory_item_id,warehouse_id_input,batch_record.id,-remaining,'consumption','order',order_id_input); needed := needed-remaining; end loop;
      if needed > 0 then raise exception 'insufficient stock for item %', recipe_record.inventory_item_id; end if;
    end loop;
  end loop;
  return jsonb_build_object('ok',true);
end; $$;

alter table public.inventory_items enable row level security; alter table public.stock_batches enable row level security; alter table public.stock_movements enable row level security; alter table public.recipes enable row level security; alter table public.recipe_items enable row level security; alter table public.stock_transfers enable row level security; alter table public.stock_transfer_items enable row level security; alter table public.stock_counts enable row level security; alter table public.stock_count_items enable row level security; alter table public.stock_waste enable row level security;
create policy "inventory read" on public.inventory_items for select to authenticated using (public.has_role('owner') or public.has_role('inventory') or public.has_role('manager'));
create policy "inventory manage" on public.inventory_items for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory tables read" on public.stock_batches for select to authenticated using (public.has_role('owner') or public.has_role('inventory') or public.has_role('manager'));
create policy "inventory tables manage" on public.stock_batches for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory ledger read" on public.stock_movements for select to authenticated using (public.has_role('owner') or public.has_role('inventory') or public.has_role('manager'));
create policy "inventory recipes read" on public.recipes for select to authenticated using (public.has_role('owner') or public.has_role('inventory') or public.has_role('manager'));
create policy "inventory recipes manage" on public.recipes for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory recipe items manage" on public.recipe_items for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory operations read" on public.stock_transfers for select to authenticated using (public.has_role('owner') or public.has_role('inventory') or public.has_role('manager'));
create policy "inventory operations manage" on public.stock_transfers for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory transfer items manage" on public.stock_transfer_items for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory counts manage" on public.stock_counts for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory count items manage" on public.stock_count_items for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
create policy "inventory waste manage" on public.stock_waste for all to authenticated using (public.has_role('owner') or public.has_role('inventory')) with check (public.has_role('owner') or public.has_role('inventory'));
