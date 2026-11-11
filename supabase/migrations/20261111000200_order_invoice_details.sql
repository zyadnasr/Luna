-- Optional operational fields captured by external order sources and shown on invoices.
alter table public.orders
  add column if not exists sales_channel text,
  add column if not exists acquisition_source text,
  add column if not exists attribution_type text,
  add column if not exists campaign_ad_set text,
  add column if not exists influencer_partner_name text,
  add column if not exists business_type text,
  add column if not exists invoice_requested boolean,
  add column if not exists invoice_notes text,
  add column if not exists external_invoice_url text,
  add column if not exists external_invoice_error text;
