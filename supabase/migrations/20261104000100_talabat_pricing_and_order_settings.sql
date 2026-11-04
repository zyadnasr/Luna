alter table public.product_prices
  add column if not exists compare_at_price_egp numeric(12, 2)
  check (compare_at_price_egp is null or compare_at_price_egp >= price_egp);

insert into public.app_settings (key, value, description, is_public)
values
  ('minimum_order_egp', '90'::jsonb, 'Minimum subtotal required for public orders.', true),
  ('available_payment_methods', '["cash", "visa", "mastercard"]'::jsonb, 'Payment methods advertised by the business.', true)
on conflict (key) do update
set value = excluded.value, description = excluded.description, is_public = excluded.is_public;

update public.product_prices
set price_egp = case id
  when '30000000-0000-0000-0000-000000000011'::uuid then 528
  when '30000000-0000-0000-0000-000000000012'::uuid then 480
  when '30000000-0000-0000-0000-000000000013'::uuid then 480
  when '30000000-0000-0000-0000-000000000014'::uuid then 480
  when '30000000-0000-0000-0000-000000000015'::uuid then 480
  when '30000000-0000-0000-0000-000000000016'::uuid then 556
  when '30000000-0000-0000-0000-000000000017'::uuid then 142.85
  when '30000000-0000-0000-0000-000000000019'::uuid then 81.60
  when '30000000-0000-0000-0000-000000000020'::uuid then 134.40
  else price_egp
end,
compare_at_price_egp = case id
  when '30000000-0000-0000-0000-000000000011'::uuid then 660
  when '30000000-0000-0000-0000-000000000012'::uuid then 600
  when '30000000-0000-0000-0000-000000000013'::uuid then 600
  when '30000000-0000-0000-0000-000000000014'::uuid then 600
  when '30000000-0000-0000-0000-000000000015'::uuid then 600
  when '30000000-0000-0000-0000-000000000016'::uuid then 695
  when '30000000-0000-0000-0000-000000000017'::uuid then 178.57
  when '30000000-0000-0000-0000-000000000019'::uuid then 102
  when '30000000-0000-0000-0000-000000000020'::uuid then 168
  else compare_at_price_egp
end
where id in (
  '30000000-0000-0000-0000-000000000011'::uuid,
  '30000000-0000-0000-0000-000000000012'::uuid,
  '30000000-0000-0000-0000-000000000013'::uuid,
  '30000000-0000-0000-0000-000000000014'::uuid,
  '30000000-0000-0000-0000-000000000015'::uuid,
  '30000000-0000-0000-0000-000000000016'::uuid,
  '30000000-0000-0000-0000-000000000017'::uuid,
  '30000000-0000-0000-0000-000000000019'::uuid,
  '30000000-0000-0000-0000-000000000020'::uuid
);

update public.product_prices
set is_active = false
where id between '30000000-0000-0000-0000-000000000001'::uuid
  and '30000000-0000-0000-0000-000000000010'::uuid;
