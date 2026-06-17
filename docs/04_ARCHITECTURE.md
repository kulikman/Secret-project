# Architecture

## System Overview

```text
Browser / Client
  ↓ HTTPS
Vercel Edge (proxy.ts: session refresh + security headers)
  ↓
Next.js App Router (Server Components, Server Actions, Route Handlers)
  ↓                         ↓
Supabase App DB/Auth        External Services
  - profiles                - Elaurion Brain (knowledge backend)
  - node_projection
  - dossiers/slides/jobs    - Resend scaffold
  - community tables        - PostHog analytics
```

Core rule: public archive pages read App DB projection, never live Brain.

---

## Ownership Boundaries

| Area                            | Owner                     | Rule                                               |
| ------------------------------- | ------------------------- | -------------------------------------------------- |
| Public archive rendering        | Next.js + App DB          | Read from `node_projection` only                   |
| Knowledge graph source of truth | Brain                     | Access through `src/lib/brain` server-only adapter |
| Community/events/applications   | App DB                    | App-owned tables with RLS                          |
| Auth/session                    | Supabase + `src/proxy.ts` | Do not rewrite without approval                    |
| Transactional email scaffold    | Resend                    | Preserved for future notifications                 |

---

## Folder Structure

```text
src/
├── app/
│   ├── (auth)/                       # Login/signup/password reset
│   ├── admin/                        # Planned admin/editor/curator surfaces
│   ├── api/
│   │   ├── health/                   # Stateless health endpoint
│   │   ├── cron/cleanup/             # Existing scheduled cleanup
│   │   ├── topics/                   # Planned public topic API
│   │   ├── sources/                  # Planned public source API
│   │   ├── map/                      # Planned graph cache API
│   │   └── applications/             # Planned application submission API
│   ├── dashboard/                    # Existing protected dashboard scaffold
│   ├── settings/                     # Profile/org/API key scaffold
│   ├── page.tsx                      # Public landing page
│   └── sitemap.ts / robots.ts        # Public metadata routes
│
├── components/
│   ├── ui/                           # Shared UI primitives
│   ├── forms/                        # Shared form components
│   └── layout/                       # Header, breadcrumbs, shell
│
├── features/
│   ├── api-keys/                     # Existing scaffold
│   ├── maintenance/                  # Existing cleanup job logic
│   ├── notifications/                # Existing notification scaffold
│   ├── onboarding/                   # Existing onboarding scaffold
│   ├── orgs/                         # Existing org scaffold
│   ├── knowledge/                    # Planned Brain/admin knowledge feature
│   ├── community/                    # Planned cities/events/applications
│   └── ai-content/                   # Planned dossiers/presentations/jobs
│
├── lib/
│   ├── brain/                        # Server-only Brain adapter
│   ├── supabase/                     # client/server/admin clients
│   ├── email/                        # Email scaffold
│   ├── env.ts                        # Zod env validation
│   ├── audit.ts                      # App audit logging helper
│   ├── logger.ts                     # Server logging
│   └── validations.ts                # Shared Zod schemas
│
├── types/database.ts                 # Generated Supabase types
├── config/site.ts                    # Site metadata/navigation
└── proxy.ts                          # Next 16 proxy for session/security headers
```

---

## Key Architecture Rules

1. Business logic lives in `lib/` or `features/`, not UI components.
2. Route Handlers and Server Actions stay thin: validate input, check auth/RBAC, call feature/lib code, return response.
3. Supabase access is isolated: browser code uses `lib/supabase/client.ts`; server code uses `server.ts`; service-role code uses `admin.ts` only on the server.
4. Brain access is isolated in `src/lib/brain/*` and must import `server-only`.
5. Public archive pages must not import `src/lib/brain`.
6. Manual republish is the MVP projection sync mechanism.
7. Brain unavailable means admin ingest/republish is degraded, not that published public pages fail.
8. Admin/editor mutations must write audit logs.
9. Checkout, subscriptions, billing UI, and paid entitlements are not part of the product.

---

## Critical Flows

### Public Archive Read Flow

```text
Reader opens /topics/:slug
  ↓
Next.js Server Component or route queries App DB
  ↓
Read public row from node_projection
  ↓
Render topic + source_refs + related projection/cache data
  ↓
No live Brain call happens during public render
```

### Knowledge Authoring + Republish Flow

```text
Editor opens admin knowledge UI
  ↓
Server Action verifies session + approved editor/admin RBAC
  ↓
Action calls src/lib/brain adapter
  ↓
Brain creates/updates knowledge where supported
  ↓
Editor triggers manual republish
  ↓
App fetches approved Brain data and upserts node_projection
  ↓
Audit log records actor/action/entity
```

### Ingest + Review Flow

```text
Admin submits source for ingest
  ↓
App calls Brain ingest only after profile support is available
  ↓
Brain creates pending nodes/facts/relations
  ↓
Editor reviews and merges/accepts
  ↓
Manual republish updates App DB projection
```

### Community Application Flow

```text
Visitor opens /join or event page
  ↓
Submits application form
  ↓
App validates with Zod and inserts into applications
  ↓
Curator/admin changes status
  ↓
Audit log captures status transition
```

### Auth Flow

```text
User visits protected route
  ↓
proxy.ts refreshes/checks Supabase session
  ↓
Unauthenticated user redirects to /login
  ↓
auth/callback/route.ts completes auth
  ↓
User enters dashboard/onboarding/admin depending on state and role
```

## Known Architectural Constraints

- Next.js 16 `params` and `searchParams` are async.
- `middleware.ts` is deprecated; this repo uses `src/proxy.ts`.
- No `tailwind.config.ts`; theme tokens live in `src/app/globals.css`.
- `service_role` client must never be imported from client-side code.
- Typed routes are enabled; route typos should fail at compile time.
- `@elaurion/brain-sdk` is not installed in this app; current adapter uses the reviewed Brain HTTP contracts.
- Brain project/slug and scoped token are not yet provisioned in this app environment.
