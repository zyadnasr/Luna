-- Persist first-party attribution on each online order.
alter table public.orders
  add column if not exists attribution_source text,
  add column if not exists attribution_type text,
  add column if not exists attribution_referrer text,
  add column if not exists attribution_landing_page text,
  add column if not exists attribution_session_id text,
  add column if not exists attribution_utm_source text,
  add column if not exists attribution_utm_medium text,
  add column if not exists attribution_utm_campaign text,
  add column if not exists attribution_utm_content text,
  add column if not exists attribution_utm_term text,
  add column if not exists attribution_gclid text,
  add column if not exists attribution_fbclid text;

create index if not exists orders_attribution_source_idx on public.orders(attribution_source);
create index if not exists orders_attribution_campaign_idx on public.orders(attribution_utm_campaign);
