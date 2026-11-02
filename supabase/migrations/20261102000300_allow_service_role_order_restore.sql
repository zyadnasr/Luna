create or replace function public.restore_cancelled_order(order_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  movement_record record;
begin
  if auth.role() <> 'service_role' and not public.has_role('owner') then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1
    from stock_movements
    where reference_type = 'order'
      and reference_id = order_id_input
      and movement_type = 'cancellation_restore'
  ) then
    return jsonb_build_object('ok', true, 'already_restored', true);
  end if;

  for movement_record in
    select *
    from stock_movements
    where reference_type = 'order'
      and reference_id = order_id_input
      and movement_type = 'consumption'
  loop
    update stock_batches
    set quantity_available = quantity_available + abs(movement_record.quantity_delta),
        updated_at = timezone('utc', now())
    where id = movement_record.batch_id;

    insert into stock_movements(
      inventory_item_id,
      warehouse_id,
      batch_id,
      quantity_delta,
      movement_type,
      reference_type,
      reference_id,
      actor_user_id
    )
    values (
      movement_record.inventory_item_id,
      movement_record.warehouse_id,
      movement_record.batch_id,
      abs(movement_record.quantity_delta),
      'cancellation_restore',
      'order',
      order_id_input,
      case when auth.role() = 'service_role' then null else auth.uid() end
    );
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;
