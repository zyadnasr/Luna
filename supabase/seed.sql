insert into public.locations (id, name, type, is_active)
values
  ('00000000-0000-0000-0000-000000000001', 'Home', 'warehouse', true),
  ('00000000-0000-0000-0000-000000000002', 'Black Ball', 'branch', true)
on conflict (id) do nothing;

insert into public.warehouses (id, location_id, name, is_active)
values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Home', true)
on conflict (id) do nothing;

insert into public.branches (id, location_id, name, is_active)
values ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002', 'Black Ball', true)
on conflict (id) do nothing;

insert into public.dining_tables (id, branch_id, table_number, display_name, is_active)
select ('00000000-0000-0000-0000-' || lpad((300 + series)::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000201', series, 'Table ' || series, true
from generate_series(1, 10) as series
on conflict (id) do nothing;

insert into public.qr_codes (id, code, type, branch_id, dining_table_id, is_active)
select ('00000000-0000-0000-0000-' || lpad((400 + table_number)::text, 12, '0'))::uuid,
  'black-ball-table-' || table_number, 'table', branch_id, id, true
from public.dining_tables
where branch_id = '00000000-0000-0000-0000-000000000201'
on conflict (id) do nothing;

insert into public.qr_codes (id, code, type, is_active)
values ('00000000-0000-0000-0000-000000000499', 'general-delivery', 'general_delivery', true)
on conflict (id) do nothing;

insert into public.order_sources (name)
values ('website'), ('qr_table'), ('talabat'), ('uber'), ('whatsapp'), ('manual')
on conflict (name) do nothing;

insert into public.roles (role)
values ('owner'), ('manager'), ('cashier'), ('kitchen'), ('inventory'), ('accountant')
on conflict (role) do nothing;

insert into public.app_settings (key, value, description, is_public)
values
  ('default_locale', '"ar"'::jsonb, 'Default application locale.', true),
  ('supported_locales', '["ar", "en", "it"]'::jsonb, 'Supported application locales.', true),
  ('business_open_time', 'null'::jsonb, 'Reserved for a future configured opening time.', false),
  ('business_close_time', 'null'::jsonb, 'Reserved for a future configured closing time.', false),
  ('default_delivery_fee', 'null'::jsonb, 'Reserved for a future configured delivery fee.', false),
  ('minimum_order_egp', '90'::jsonb, 'Minimum subtotal required for public orders.', true),
  ('available_payment_methods', '["cash", "visa", "mastercard"]'::jsonb, 'Payment methods advertised by the business.', true),
  ('instapay_display_number', 'null'::jsonb, 'Reserved; no real payment identifier is stored.', false),
  ('expiry_alert_days', 'null'::jsonb, 'Reserved for future inventory configuration.', false)
on conflict (key) do nothing;
