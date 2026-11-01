# Luna Healthy

Phase 0 technical foundation, Phase 1 visual design system, Phase 2 database foundation, and Phase 3 authentication foundation for the Luna Healthy operations system.

## Authentication and authorization

Authentication uses Supabase Auth email/password sessions. Public registration is not implemented. Disable public signups in the Supabase Dashboard and create the first Owner account manually in Authentication > Users. The application never creates users and never exposes the service-role key to browser code.

Protected routes under `/admin/*` use Supabase SSR cookies. Middleware refreshes sessions and redirects unauthenticated requests to `/admin/login`; authenticated users visiting `/admin/login` are sent to `/admin`. Server helpers in `src/lib/auth/server.ts` use `auth.getUser()` and database role rows, not browser-provided role values.

The centralized permission map is in `src/lib/auth/permissions.ts`. Add a permission to the `permissions` tuple, map it to each intended role in `rolePermissions`, and add the matching database permission through a migration. Use `requirePermission`, `requireRole`, or `requireAnyRole` in server routes/components. Never authorize from query parameters, form fields, local storage, or client state.

To assign the first Owner role, verify the real UUID in Supabase and execute the documented SQL in `supabase/README.md`. No fake users or credentials are included in this repository.

## Design system

The visual reference page is available at `/design-system`. It demonstrates the current tokens and reusable UI components without business data or workflows.

The supplied logo is preserved at `public/assets/luna-logo.png`; the original remains at `D:\LunaHealthy\assets\luna_logo.png`. The supplied Arabic and English menu references remain in `D:\LunaHealthy\assets\menu-ar.jpeg` and `D:\LunaHealthy\assets\menu-en.jpeg`.

Brand colors are centralized in `src/styles/tokens.css`. The current values are conservative samples from the supplied assets: olive `#808060`, brown `#504030`, and ivory `#FFFFF0`, with supporting semantic colors derived for interface states. Components should reference semantic variables rather than hardcoded brand values.

To add a UI component, create a focused TypeScript component in `src/components/ui/`, accept native HTML props where appropriate, support `className`, use semantic tokens, and keep client-side state limited to components that require interaction.

Arabic is the default document language with `dir="rtl"`. The language switcher updates the document `lang` and `dir` values to use RTL for Arabic and LTR for English and Italian. The typography stack is centralized in `src/app/globals.css` and uses the system stack (`Segoe UI`, `Tahoma`, `Arial`) because no external font dependency was added.

Accessibility foundations include semantic HTML, visible keyboard focus, native form controls, modal Escape handling, sufficient contrast for the selected palette, and reduced-motion support. The design system has no unavailable assets or font dependencies.

## Install

```bash
npm install
```

Copy `.env.example` to `.env.local` and provide the Supabase values when backend connectivity is needed. The application does not include authentication, business workflows, Telegram integration, products, orders, inventory, payments, recipes, or pricing in this phase.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. The basic health page is available at `/health`.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: Reserved for trusted server-only work in a later phase. Never expose it to the browser.
- `TELEGRAM_BOT_TOKEN`: Reserved for Telegram notifications in a later phase.
- `TELEGRAM_CHAT_ID`: Reserved for Telegram notifications in a later phase.
- `NEXT_PUBLIC_APP_URL`: Public application URL, such as `http://localhost:3000`.

## Structure

```text
src/
  app/             App Router routes, layout, global styles, manifest
  components/      Shared application shell and UI components
  features/        Feature modules reserved for future domain work
  lib/             Integrations and reusable utilities, including Supabase
  hooks/           Shared React hooks reserved for future work
  types/           Shared TypeScript types
  config/          Application configuration
  i18n/            Arabic, English, and Italian translation foundation
  styles/          Theme and design tokens
public/assets/     Reserved location for provided Luna assets
supabase/
  migrations/      Timestamped PostgreSQL schema migrations
  seed.sql         Structural seed records only
  README.md        Supabase setup, security, and migration instructions
```

Arabic (`ar`) is the default document language and uses RTL direction. English and Italian are available in the initial language switcher foundation.

## Commands

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm run type-check # TypeScript validation
npm run build      # Production build
npm run start      # Serve the production build
```

## Current phase boundary

Phase 2 establishes the Supabase schema and domain contracts for locations, tables, QR context, catalog foundations, roles, audit logging, and settings. Customer ordering, inventory, payment, authentication UI, Telegram integration, and operational dashboards remain future phases.
