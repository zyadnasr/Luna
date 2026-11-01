create or replace function public.receive_inventory_batch(item_id uuid, warehouse_id uuid, received numeric, cost numeric, received_at_input timestamptz, expiry_input date, batch_input text, supplier_input text, notes_input text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare batch_id uuid;
begin
  if not (public.has_role('owner') or public.has_role('inventory')) then raise exception 'not authorized'; end if;
  if received <= 0 then raise exception 'quantity must be positive'; end if;
  if expiry_input is not null and expiry_input < received_at_input::date then raise exception 'expiry before received'; end if;
  if not exists(select 1 from inventory_items where id=item_id and is_active) then raise exception 'invalid item'; end if;
  if not exists(select 1 from warehouses where id=warehouse_id and is_active) then raise exception 'invalid warehouse'; end if;
  insert into stock_batches(inventory_item_id,warehouse_id,batch_number,quantity_received,quantity_available,unit_cost,received_at,expiry_date,supplier,notes) values(item_id,warehouse_id,batch_input,received,received,cost,received_at_input,expiry_input,supplier_input,notes_input) returning id into batch_id;
  insert into stock_movements(inventory_item_id,warehouse_id,batch_id,quantity_delta,movement_type,reason,actor_user_id) values(item_id,warehouse_id,batch_id,received,'purchase','batch received',auth.uid());
  return jsonb_build_object('id',batch_id);
end; $$;

create or replace function public.complete_stock_transfer(transfer_id_input uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare transfer_record record; item_record record; batch_record record; destination_batch uuid;
begin
  if not (public.has_role('owner') or public.has_role('inventory')) then raise exception 'not authorized'; end if;
  select * into transfer_record from stock_transfers where id=transfer_id_input for update;
  if transfer_record.id is null or transfer_record.status = 'completed' then return jsonb_build_object('ok',true,'already_completed',true); end if;
  if transfer_record.status = 'cancelled' then raise exception 'transfer cancelled'; end if;
  for item_record in select * from stock_transfer_items where transfer_id=transfer_id_input loop
    select * into batch_record from stock_batches where id=item_record.batch_id and warehouse_id=transfer_record.source_warehouse_id for update;
    if batch_record.id is null or batch_record.quantity_available < item_record.quantity or (batch_record.expiry_date is not null and batch_record.expiry_date < current_date) then raise exception 'insufficient or expired batch'; end if;
    update stock_batches set quantity_available=quantity_available-item_record.quantity, updated_at=timezone('utc',now()) where id=batch_record.id;
    insert into stock_batches(inventory_item_id,warehouse_id,batch_number,quantity_received,quantity_available,unit_cost,received_at,expiry_date,supplier,notes) values(batch_record.inventory_item_id,transfer_record.destination_warehouse_id,batch_record.batch_number,item_record.quantity,item_record.quantity,batch_record.unit_cost,now(),batch_record.expiry_date,batch_record.supplier,batch_record.notes) returning id into destination_batch;
    insert into stock_movements(inventory_item_id,warehouse_id,batch_id,quantity_delta,movement_type,reference_type,reference_id,actor_user_id) values(batch_record.inventory_item_id,transfer_record.source_warehouse_id,batch_record.id,-item_record.quantity,'transfer_out','stock_transfer',transfer_id_input,auth.uid()),(batch_record.inventory_item_id,transfer_record.destination_warehouse_id,destination_batch,item_record.quantity,'transfer_in','stock_transfer',transfer_id_input,auth.uid());
  end loop;
  update stock_transfers set status='completed',updated_at=timezone('utc',now()) where id=transfer_id_input;
  return jsonb_build_object('ok',true);
end; $$;

create or replace function public.create_waste(warehouse_id_input uuid,item_id_input uuid,batch_id_input uuid,quantity_input numeric,reason_input public.waste_reason,notes_input text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare batch_record record; waste_id uuid;
begin
  if not (public.has_role('owner') or public.has_role('inventory')) then raise exception 'not authorized'; end if;
  select * into batch_record from stock_batches where id=batch_id_input and warehouse_id=warehouse_id_input and inventory_item_id=item_id_input for update;
  if batch_record.id is null or quantity_input <= 0 or batch_record.quantity_available < quantity_input then raise exception 'invalid waste quantity'; end if;
  update stock_batches set quantity_available=quantity_available-quantity_input,updated_at=timezone('utc',now()) where id=batch_id_input;
  insert into stock_waste(warehouse_id,inventory_item_id,batch_id,quantity,reason,notes,created_by) values(warehouse_id_input,item_id_input,batch_id_input,quantity_input,reason_input,notes_input,auth.uid()) returning id into waste_id;
  insert into stock_movements(inventory_item_id,warehouse_id,batch_id,quantity_delta,movement_type,reason,reference_type,reference_id,actor_user_id) values(item_id_input,warehouse_id_input,batch_id_input,-quantity_input,'waste',notes_input,'stock_waste',waste_id,auth.uid());
  return jsonb_build_object('id',waste_id);
end; $$;

create or replace function public.restore_cancelled_order(order_id_input uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare movement_record record;
begin
  if not public.has_role('owner') then raise exception 'not authorized'; end if;
  if exists(select 1 from stock_movements where reference_type='order' and reference_id=order_id_input and movement_type='cancellation_restore') then return jsonb_build_object('ok',true,'already_restored',true); end if;
  for movement_record in select * from stock_movements where reference_type='order' and reference_id=order_id_input and movement_type='consumption' loop
    update stock_batches set quantity_available=quantity_available+abs(movement_record.quantity_delta),updated_at=timezone('utc',now()) where id=movement_record.batch_id;
    insert into stock_movements(inventory_item_id,warehouse_id,batch_id,quantity_delta,movement_type,reference_type,reference_id,actor_user_id) values(movement_record.inventory_item_id,movement_record.warehouse_id,movement_record.batch_id,abs(movement_record.quantity_delta),'cancellation_restore','order',order_id_input,auth.uid());
  end loop;
  return jsonb_build_object('ok',true);
end; $$;
