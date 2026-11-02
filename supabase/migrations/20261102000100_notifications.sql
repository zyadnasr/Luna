create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('admin', 'customer')),
  recipient_user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  tracking_token uuid references public.orders(status_lookup_token) on delete cascade,
  kind text not null check (kind in ('order_created', 'order_status_changed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  check (audience = 'admin' or tracking_token is not null),
  check (audience = 'customer' or recipient_user_id is null)
);

create table public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  primary key (notification_id, user_id)
);

create index notifications_admin_created_idx on public.notifications(audience, created_at desc);
create index notifications_order_created_idx on public.notifications(order_id, created_at desc);
create index notifications_tracking_created_idx on public.notifications(tracking_token, created_at desc);
create index notification_reads_user_idx on public.notification_reads(user_id, read_at desc);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

create policy "admins read admin notifications" on public.notifications
  for select to authenticated
  using (
    audience = 'admin'
    and recipient_user_id is null
    and exists (select 1 from public.user_roles where user_id = (select auth.uid()))
  );

create policy "users read own notification receipts" on public.notification_reads
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users mark own notifications read" on public.notification_reads
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.notifications;
