create or replace function public.complete_stock_count(count_id_input uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare count_record record; item_record record; expected numeric; actual numeric; delta numeric;
begin
  if not (public.has_role('owner') or public.has_role('inventory')) then raise exception 'not authorized'; end if;
  select * into count_record from stock_counts where id=count_id_input for update;
  if count_record.id is null or count_record.status <> 'open' then raise exception 'count is not open'; end if;
  for item_record in select * from stock_count_items where count_id=count_id_input loop
    if item_record.actual_quantity is null or item_record.actual_quantity < 0 then raise exception 'invalid actual quantity'; end if;
    expected := item_record.expected_quantity; actual := item_record.actual_quantity; delta := actual - expected;
    if delta <> 0 then
      insert into stock_movements(inventory_item_id, warehouse_id, quantity_delta, movement_type, reference_type, reference_id, reason, actor_user_id)
      values(item_record.inventory_item_id, count_record.warehouse_id, delta, 'adjustment', 'stock_count', count_id_input, count_record.reason, auth.uid());
    end if;
  end loop;
  update stock_counts set status='completed', completed_by=auth.uid(), completed_at=timezone('utc',now()) where id=count_id_input;
  return jsonb_build_object('ok',true);
end; $$;
