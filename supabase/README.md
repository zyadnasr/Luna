# Supabase Foundation

Phase 2 contains the database foundation only. No customer ordering workflow, inventory workflow, payment workflow, authentication UI, Telegram integration, or operational dashboard is included.

## Create a project

1. Create a project at [supabase.com](https://supabase.com/).
2. Copy the project URL and anon key into `.env.local` using `.env.example`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix it with `NEXT_PUBLIC_`, expose it to browser code, or commit it.

## Apply migrations

The Supabase CLI is not installed in this environment. After installing it through the official Supabase instructions, from the project root run:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

For a local Supabase instance:

```bash
supabase start
supabase db reset
```

`supabase db reset` applies migrations and the configured seed file. Do not claim migration success until the command completes against a real Supabase project or local Supabase instance.

## Seed data

The root seed file is `supabase/seed.sql`. It contains only confirmed structural records: Home, Black Ball, ten tables, table QR records, one general delivery QR, order sources, roles, supported locale settings, and placeholder setting values. It contains no products, prices, recipes, nutrition, stock, users, expenses, or orders.

## Generate database types later

After the schema is applied, generate types with:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

Review generated types before committing them. `src/types/domain.ts` remains the application-facing contract layer.

## Security

RLS is enabled on every application table. Anonymous and authenticated users receive only narrow public reads for active catalog and branch/table/QR context. Authenticated users do not automatically receive internal access. Owner policies call the reusable `public.has_role` function. Profiles are limited to a user's own row. Audit logs are owner-readable only. Service-role access is not exposed to client code and bypasses RLS by design, so it must remain server-only.

Authentication and more granular manager/cashier/kitchen/inventory/accountant policies should be added in the authentication and authorization phase.

## Phase 3 authentication

Enable email/password authentication in the Supabase Dashboard under Authentication settings. Disable public signups and email providers that are not intentionally used. Create the first Owner account manually in the Dashboard, then assign its role from the SQL editor only after verifying the account UUID:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'owner')
on conflict do nothing;
```

Replace `AUTH_USER_UUID` with the real authenticated user's UUID. Do not run this example with a placeholder and do not commit real credentials. Password recovery redirects must include the application's `/auth/callback` URL in Supabase Auth URL configuration.
