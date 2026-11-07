create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (char_length(event_name) between 1 and 80),
  session_id text,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_utm_campaign_idx on public.analytics_events (utm_campaign);

alter table public.analytics_events enable row level security;

comment on table public.analytics_events is 'First-party, privacy-conscious event ledger for attribution and product analytics.';
