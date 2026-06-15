# Architecture

## System Overview

```text
Browser / Client
  ↓ HTTPS
Vercel Edge (proxy.ts — session refresh + security headers)
  ↓
Next.js App Router (Server Components, Server Actions, Route Handlers)
  ↓                           ↓
Supabase (Postgres + Auth)   External Services
  - RLS on every table         - Stripe (payments + webhooks)
  - Realtime subscriptions     - Resend (transactional email)
  - Storage (file uploads)     - PostHog (analytics)
```

---

## Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes: /login, /signup, /reset-password
│   │   └── auth/callback/      # OAuth + magic link callback
│   ├── (dashboard)/            # Protected routes (require auth)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── settings/           # Profile, billing, usage, API keys, org
│   │   └── [your-feature]/     # Core product routes
│   ├── (marketing)/            # Public pages: landing, pricing, docs
│   ├── admin/                  # Admin panel (role: admin/super_admin only)
│   ├── api/
│   │   ├── webhooks/stripe/    # Stripe webhook handler
│   │   └── cron/cleanup/       # Scheduled cleanup job
│   ├── onboarding/             # Onboarding wizard (new users)
│   ├── layout.tsx              # Root layout (metadata, providers)
│   ├── globals.css             # Tailwind v4 theme tokens
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   └── loading.tsx             # Global loading skeleton
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (button, input, card…)
│   ├── forms/                  # Reusable form components
│   ├── layout/                 # Header, Footer, Sidebar, Breadcrumbs
│   └── [feature]/              # Feature-specific components
│
├── features/                   # Bounded feature modules
│   ├── onboarding/             # Onboarding wizard feature
│   ├── notifications/          # In-app notifications + bell
│   └── api-keys/               # API key management
│
├── lib/
│   ├── supabase/               # client.ts, server.ts, admin.ts, middleware.ts
│   ├── stripe/                 # Stripe client + upsertSubscription
│   ├── email/                  # send.ts + templates/
│   ├── analytics.ts            # PostHog server events
│   ├── plan-limits.ts          # Plan → feature limits map
│   ├── env.ts                  # Zod-validated env vars
│   ├── utils.ts                # cn() + shared utilities
│   ├── constants.ts            # ROUTES map + app-wide constants
│   └── validations.ts          # Shared Zod schemas
│
├── hooks/                      # Custom React hooks
├── types/
│   ├── database.ts             # Supabase generated types (auto-generated)
│   └── index.ts                # Shared app types
├── config/site.ts              # Site metadata + nav config
└── proxy.ts                    # Session refresh + security headers (Next 16)
```

---

## Key Architecture Rules

1. **Business logic lives in `lib/` or `features/`, not in UI components.**
2. **Route Handlers and Server Actions are thin** — they validate input (Zod), call lib functions, return responses.
3. **Supabase access is isolated** — `lib/supabase/server.ts` for server, `lib/supabase/client.ts` for browser, `lib/supabase/admin.ts` for service-role (server-only, never import from `"use client"` files).
4. **All mutations go through Server Actions** (`"use server"`) — never raw `fetch` to your own API from client.
5. **Caching is opt-in** — use `"use cache"` directive. No implicit memoization (Next 16 behavior).
6. **Auth is checked at every protected route** via `proxy.ts` + `supabase.auth.getUser()` in Server Actions.
7. **External integrations are wrapped** — Stripe logic in `lib/stripe/`, email logic in `lib/email/`, etc.
8. **Admin actions are logged** — write to `audit_logs` table for all destructive admin operations.

---

## Critical Flows

### Auth Flow

```text
User visits protected route
  ↓
proxy.ts checks session cookie
  ↓ (no session)
Redirect to /login
  ↓
User authenticates (email/OAuth)
  ↓
Supabase sets session cookie
  ↓
auth/callback/route.ts runs:
  - Check profiles.onboarding_completed
  - If false → redirect /onboarding
  - If true  → redirect /dashboard
```

### Stripe Subscription Flow

```text
User clicks "Upgrade"
  ↓
Server Action creates Stripe Checkout Session
  ↓
User completes payment on Stripe hosted page
  ↓
Stripe sends checkout.session.completed webhook
  ↓
api/webhooks/stripe/route.ts:
  - Verifies webhook signature
  - Calls upsertSubscription()
  - Updates profiles.stripe_customer_id
  - Sends subscriptionConfirmed email
```

### Server Action Mutation Flow

```text
Client form submit
  ↓
Server Action (src/features/[domain]/api/actions.ts)
  1. supabase.auth.getUser() — verify auth
  2. schema.parse(rawData) — validate with Zod
  3. supabase.from(...) — mutate database
  4. revalidateTag(...) — invalidate cache
  5. Return success or throw
  ↓
Client: catch error → toast.error / toast.success
```

---

## Known Architectural Constraints

- Next.js 16 `params` and `searchParams` are async — always `await` them
- `middleware.ts` is deprecated — use `src/proxy.ts`
- No `tailwind.config.ts` — theme tokens in `globals.css` under `@theme inline`
- `service_role` client must never be imported from client-side code
- Typed routes enabled (`typedRoutes: true`) — route typos fail at compile time
