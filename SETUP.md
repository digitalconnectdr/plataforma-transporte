# Plataforma Transporte — Setup Guide

Premium multi-tenant SaaS platform for luxury ground transportation companies.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Payments | Stripe + Stripe Connect |
| Maps | Google Maps Platform |
| Email | Resend |
| SMS | Twilio |
| Hosting | Vercel |
| Monorepo | Turborepo |

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/digitalconnectdr/luxeride.git
cd luxeride
npm install
```

### 2. Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in all values in `.env.local`. Required at minimum:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Supabase Local Dev

```bash
# Start local Supabase stack
supabase start

# Run migrations (creates all tables + RLS policies)
supabase db push

# Seed with test data
supabase db reset
```

Copy the local keys to your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` → `API URL` from `supabase start` output
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `anon key` from output
- `SUPABASE_SERVICE_ROLE_KEY` → `service_role key` from output

### 4. Run Development Server

```bash
npm run dev
# App available at http://localhost:3000
# Supabase Studio at http://localhost:54323
```

## Project Structure

```
luxeride/
├── apps/
│   └── web/                          # Next.js 14 app
│       ├── app/
│       │   ├── (public)/             # Public website — revival branding
│       │   ├── (booking)/            # 4-step booking flow
│       │   ├── (admin)/              # Admin panel — company management
│       │   ├── (dispatcher)/         # Real-time dispatch dashboard
│       │   └── api/                  # Route Handlers
│       ├── components/
│       │   ├── ui/                   # Base UI components
│       │   ├── booking/              # Booking flow components
│       │   ├── admin/                # Admin panel components
│       │   └── dispatcher/           # Dispatcher components
│       ├── lib/
│       │   ├── supabase/             # Supabase client (client + server + admin)
│       │   ├── stripe/               # Stripe client (browser + server)
│       │   ├── maps/                 # Google Maps utilities
│       │   └── utils/                # Shared utilities
│       ├── middleware.ts             # Auth + route protection
│       └── styles/globals.css        # Design system CSS
├── packages/
│   ├── database/                     # TypeScript types for DB schema
│   │   └── src/types/
│   │       ├── companies.ts
│   │       ├── users.ts
│   │       ├── bookings.ts
│   │       ├── fleet.ts
│   │       ├── pricing.ts
│   │       └── payments.ts
│   ├── ui/                           # Shared UI components (Button, Input, Card...)
│   └── config/                       # Shared config (ESLint, TypeScript...)
└── supabase/
    ├── migrations/                   # Database migrations (run in order)
    ├── seed/                         # Test data
    └── functions/                    # Edge Functions (if needed)
```

## Design System

Two themes — both use Playfair Display (headings) + Inter (body):

| Theme | Use Case | Background |
|---|---|---|
| Silent Luxury (dark) | Booking, Dispatcher, Mobile | `#141313` |
| Luminous Editorial (light) | Admin panel content area | `#faf9f6` |
| LuxeRide (hybrid) | Admin sidebar dark + content light | Both |

**Accent color across both:** Champagne Gold `#e9c176`

## RBAC — 9 Roles

| Role | Scope | Access |
|---|---|---|
| `super_admin` | Global | All companies, billing, system config |
| `company_owner` | Company | Full company access including billing |
| `company_admin` | Company | Full access minus Stripe/billing |
| `dispatcher` | Company | Assign drivers, monitor trips |
| `accounting` | Company | Invoices, reports, refunds |
| `driver` | Company | Own trips only (mobile app) |
| `customer` | Company | Own bookings only |
| `corporate_manager` | Corporate Account | Approve trips, set budgets |
| `corporate_user` | Corporate Account | Book under corporate account |

## Multi-Tenancy

Every table has `company_id`. Row Level Security (RLS) policies on Supabase enforce that:
- Users can only read/write rows matching their `company_id`
- `super_admin` bypasses RLS via Service Role key (server-side only)
- Prices are **always calculated server-side** — frontend never sends amounts

## Deployment

### Vercel (Production)

```bash
vercel --prod
```

Set environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

### Supabase (Production)

1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Link: `supabase link --project-ref your-project-ref`
3. Push migrations: `supabase db push`

## Module Roadmap

**Phase 1 — COMPLETE ✅**
- [x] F1.0 Foundation — Monorepo, Next.js, Supabase, Vercel
- [x] F1.1 Database Schema + RLS Policies (24 tables, 12 migrations)
- [x] F1.2 Auth + RBAC (9 roles)
- [x] F1.3 Company Management + Super Admin
- [x] F1.4 Fleet + Drivers + Documents
- [x] F1.5 Services + Zones + Airports
- [x] F1.6 Pricing Engine (5 models)
- [x] F1.7 Google Maps Integration
- [x] F1.8 Booking Engine + State Machine
- [x] F1.9 Stripe + Stripe Connect (checkout, payment links, webhooks, refunds)
- [x] F1.10 Policy Engine (cancellation/no-show fees, booking windows)
- [x] F1.11 Corporate Accounts (credit, members, limits, cost centers)
- [x] F1.12 Admin Dashboard (revenue KPIs, 7-day trend, upcoming trips)
- [x] F1.13 Dispatcher (Real-time board via Supabase Realtime)
- [x] F1.14 Notifications (Resend email + Twilio SMS, template-driven)
- [x] F1.15 Reports + Audit Logs (date-range KPIs, CSV export, audit viewer)
- [x] F1.16 Public Web (landing + booking flow + driver/customer portals)
- [x] F1.17 Security Review (rate limiting, input hardening, HSTS, RLS audit)

> Stripe/Resend/Twilio ship **placeholder-safe**: without real API keys the
> features degrade gracefully (payments UI shows "not configured",
> notifications are logged to the `notifications` table as `pending`).
> Add real keys in Vercel env vars to activate them — no code changes needed.

**Phase 2 — Mobile Apps** (after Phase 1 is live in production)
- React Native + Expo + EAS Build
- Client App (iOS + Android)
- Driver App (iOS + Android)
