create table public.permissions (
  key text primary key check (length(trim(key)) > 0),
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.role_permissions (
  role public.user_role not null references public.roles(role) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role, permission_key)
);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "owner manage permissions" on public.permissions for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "owner manage role permissions" on public.role_permissions for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
create policy "users read own roles" on public.user_roles for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

insert into public.roles (role)
values ('owner'), ('manager'), ('cashier'), ('kitchen'), ('inventory'), ('accountant')
on conflict (role) do nothing;

insert into public.permissions (key, description)
values
  ('admin.access', 'Access the protected admin area.'),
  ('admin.view_dashboard', 'View the admin overview.'),
  ('orders.view', 'View orders when implemented.'),
  ('orders.create', 'Create orders when implemented.'),
  ('orders.update', 'Update orders when implemented.'),
  ('orders.cancel', 'Cancel orders when implemented.'),
  ('tables.view', 'View tables when implemented.'),
  ('tables.manage', 'Manage tables when implemented.'),
  ('catalog.view', 'View the catalog when implemented.'),
  ('catalog.manage', 'Manage the catalog when implemented.'),
  ('inventory.view', 'View inventory when implemented.'),
  ('inventory.manage', 'Manage inventory when implemented.'),
  ('expenses.view', 'View expenses when implemented.'),
  ('expenses.manage', 'Manage expenses when implemented.'),
  ('reports.view', 'View reports when implemented.'),
  ('users.view', 'View users when implemented.'),
  ('users.manage', 'Manage users when implemented.'),
  ('settings.view', 'View settings when implemented.'),
  ('settings.manage', 'Manage settings when implemented.')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
select 'owner'::public.user_role, key from public.permissions
on conflict do nothing;

insert into public.role_permissions (role, permission_key)
values
  ('manager', 'admin.access'), ('manager', 'admin.view_dashboard'),
  ('manager', 'orders.view'), ('manager', 'orders.create'), ('manager', 'orders.update'), ('manager', 'orders.cancel'),
  ('manager', 'tables.view'), ('manager', 'tables.manage'), ('manager', 'catalog.view'), ('manager', 'catalog.manage'),
  ('manager', 'inventory.view'), ('manager', 'inventory.manage'), ('manager', 'expenses.view'), ('manager', 'expenses.manage'), ('manager', 'reports.view'),
  ('cashier', 'admin.access'), ('cashier', 'orders.view'), ('cashier', 'orders.create'), ('cashier', 'orders.update'), ('cashier', 'tables.view'), ('cashier', 'tables.manage'),
  ('kitchen', 'admin.access'), ('kitchen', 'orders.view'),
  ('inventory', 'admin.access'), ('inventory', 'inventory.view'), ('inventory', 'inventory.manage'), ('inventory', 'catalog.view'), ('inventory', 'reports.view'),
  ('accountant', 'admin.access'), ('accountant', 'expenses.view'), ('accountant', 'expenses.manage'), ('accountant', 'reports.view')
on conflict do nothing;
