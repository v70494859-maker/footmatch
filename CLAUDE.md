# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, ESLint 9)
```

No test framework is configured. Database scripts live in `/scripts/` (run with `tsx`).

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + Supabase + Stripe

**Three user roles** drive the entire app structure: `player`, `operator`, `admin`. Middleware (`middleware.ts`) validates auth via Supabase SSR cookies and enforces role-based route access on every request.

### Routing & Layouts

Route groups map to roles, each with its own layout:
- `app/(player)/` — matches, my-matches, subscription, social, teams, profile, players, faq
- `app/(operator)/` — dashboard, matches CRUD, payouts, profile
- `app/(operator-onboarding)/` — 4-step approval flow
- `app/admin/` — applications review, user management, config
- `app/api/` — Stripe webhooks/checkout, admin endpoints, email, subscription checks

Role-based home routes are defined in `lib/constants.ts` via `ROLE_HOME_ROUTES`.

### Data Layer

- **Server components** fetch data via `createServerClient()` from `lib/supabase/server.ts`
- **Client components** use `createBrowserClient()` from `lib/supabase/client.ts` for mutations and realtime
- Pages commonly use `export const dynamic = "force-dynamic"` and parallel `Promise.all()` fetches
- **Types/enums** are centralized in `types/index.ts` — includes role enums, status labels, and badge style maps

### Supabase

- Schema: `supabase/schema.sql` (full schema), migrations in `supabase/migrations/`
- Edge functions (Deno): `supabase/functions/` — **excluded from tsconfig**
- RLS: `has_active_subscription()` SQL function gates match registration
- Storage buckets: avatars, match images, chat images, chat voice notes (public), documents (private)
- Deploy migrations via `scripts/deploy-migration.ts`

### Stripe Integration

- **Player subscriptions:** Checkout → webhook (`/api/stripe/webhook`) → updates `subscriptions` table
- **Operator payouts:** Stripe Connect Express, revenue distributed by registration proportion
- Server-side Stripe singleton in `lib/stripe/config.ts`

### i18n

Three locales: `fr`, `en`, `es`. `LanguageProvider` in `lib/i18n/LanguageContext.tsx` wraps the app. Translations live in `lib/i18n/sections/`. Use `useTranslation()` hook which returns `{ locale, setLocale, t }`.

## Styling

Tailwind CSS v4 with `@theme inline` block in `app/globals.css`. Custom color tokens:
- `pitch-*` (green accent/primary, 50–900)
- `surface-*` (dark grays, 50–950)
- `danger-500`, `amber-500`
- Background: `#030712`, foreground: `#f9fafb`

Common patterns: `bg-surface-900 border border-surface-800 rounded-2xl` for cards.

## Key Conventions

- Path alias: `@/*` maps to project root
- Components are organized by domain in `components/` (match/, social/, operator/, admin/, etc.) with shared primitives in `components/ui/`
- Hooks in `hooks/` wrap Supabase queries (useMatches, useMatch, useSubscription, etc.)
- Geolocation uses Haversine formula + OpenStreetMap Nominatim geocoding (`lib/geo.ts`)
- Display formatting helpers in `lib/format.ts`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PREMIUM_PRICE_ID, STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```
