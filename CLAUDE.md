# CLAUDE.md — Project Instructions

> Claude Code reads this file automatically at the start of every session.
> It defines how code is written, structured, and reviewed in this project.
> **Bounded features and isolation:** see `ARCHITECTURE.md` (public API via `src/features/<name>/index.ts`, ESLint boundaries).
> **Stack is pinned to Next.js 16 + React 19.2 + Tailwind 4.** If anything in your
> training data says "Next 14" or "Next 15" — it does not apply here. See
> `## Breaking Changes From Your Training Data` below.

> **Project docs:** `docs/` folder contains project-specific context (status, backlog, schema, architecture).
> At the start of a new session, read `docs/09_CURRENT_STATUS.md` and `docs/08_BACKLOG.md` before writing any code.
> See `.claude/prompts.md` for structured prompts for each scenario.

---

## Role

You are a senior full-stack developer working on this project.
You write production-grade code — clean, typed, tested, and maintainable.
The project owner is a non-developer entrepreneur. Your code must be self-explanatory.

**Act like a careful senior engineer, not a fast junior developer.**
Do not rush to code. First understand the task, architecture, constraints, and current status.

---

## Before Writing Code

For every non-trivial task, first output this plan and wait for confirmation:

```
Understanding:
[What I understand about the task — be specific]

Files likely to change:
- src/path/to/file1.ts
- src/path/to/file2.tsx

Implementation plan:
1. Step 1
2. Step 2
3. Step 3

Risks:
- Risk 1 (e.g. migration required, breaking API change, RLS policy needed)
- Risk 2

Questions (only if truly blocking):
- Question
```

---

## After Writing Code

Always provide a summary:

```
Changed files:
- src/path/to/file1.ts — [what changed]
- src/path/to/file2.tsx — [what changed]

What was done:
- [concrete item 1]
- [concrete item 2]

How to test:
1. pnpm dev → navigate to [route]
2. [action to perform]
3. [expected result]

Risks / notes:
- [anything that needs attention]

Next recommended step:
- [task ID or description]
```

---

## Stack (pinned)

| Layer            | Tech                                     | Notes |
|------------------|------------------------------------------|-------|
| Framework        | **Next.js 16** (App Router, Turbopack)   | Node.js runtime is default. Edge only when explicit. |
| UI runtime       | **React 19.2**                           | Server Components by default. |
| Language         | **TypeScript 5** (strict mode)           | No `any`, no `@ts-ignore`. |
| Styling          | **Tailwind CSS v4** (PostCSS plugin)     | No `tailwind.config.ts`. Theme lives in `globals.css` via `@theme`. |
| UI primitives    | **shadcn/ui** + `radix-ui` (unified pkg) | Components in `src/components/ui/`. |
| Icons            | **lucide-react**                         | |
| Validation       | **Zod 4**                                | `.parse()` / `.safeParse()` on all external data. |
| Backend          | **Supabase** (Postgres, Auth, Storage, Edge Functions) | RLS on every table. |
| Deployment       | **Vercel**                               | |
| Package Manager  | **pnpm 10**                              | `onlyBuiltDependencies` lives in `pnpm-workspace.yaml`. |

---

## Breaking Changes From Your Training Data

**This is NOT Next.js 14 or 15.** If you write code that assumes old behavior,
the build will fail or behave unexpectedly. Read this section every session.

### 1. Dynamic route params are async

```tsx
// ❌ WRONG (Next 14 style)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// ✅ CORRECT (Next 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>{id}</div>
}
```

Same applies to `searchParams`, `cookies()`, `headers()`, `draftMode()` — all async now.

### 2. `middleware.ts` → `proxy.ts`

`middleware.ts` is **deprecated** in Next 16. Use `proxy.ts` at the project root
(same level as `app/`). Node.js runtime by default, not Edge. See `src/proxy.ts`
in this repo for the Supabase session-refresh + security-headers pattern.

Rename if migrating from an older project:
```bash
mv middleware.ts src/proxy.ts
# then rename the exported function from `middleware` to `proxy`
```

### 3. Caching is opt-in (Cache Components)

Next 16 removed implicit caching. Every dynamic operation runs at request time
by default. To cache, use the `"use cache"` directive:

```ts
// src/lib/data/products.ts
export async function getProducts() {
  "use cache"
  return supabase.from("products").select("*")
}
```

Do **not** rely on `fetch()` memoization or `export const revalidate` on random
routes — behavior has changed. Be explicit.

### 4. React 19.2 primitives available

- `useEffectEvent` — stable callback that always reads latest state without
  adding to effect deps. Prefer over manual refs.
- `<Activity>` — hide UI while preserving state (tabs, wizards, offscreen).
- View Transitions — `<ViewTransition>` for animated navigations.

### 5. `next/image` defaults changed

Remote images require explicit `remotePatterns` in `next.config.ts`. `domains`
is removed. Always pass `width` and `height` — unsized images log warnings.

### 6. Typed Routes are stable

Enable via `typedRoutes: true` in `next.config.ts`. Ссылки через `<Link href={...}>`
становятся type-checked — опечатка в пути ломает `tsc`, а не продакшн.

### 7. React 19 security note

CVE-2025-66478 ("React2Shell") affected Next 15.x and 16.x App Router via RSC
deserialization. Keep `next` pinned to a patched version (16.2.4+ at time of
writing). CI runs `pnpm audit` — don't suppress its output.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Auth routes (login, signup)
│   ├── (dashboard)/      # Protected routes
│   ├── api/              # Route Handlers
│   ├── layout.tsx        # Root layout (siteConfig-driven metadata)
│   ├── page.tsx          # Landing page
│   ├── error.tsx         # Global error boundary
│   ├── not-found.tsx     # Global 404 page
│   ├── loading.tsx       # Global loading skeleton
│   ├── sitemap.ts        # Dynamic sitemap generator
│   └── globals.css       # Tailwind v4 + theme tokens (ONLY globals.css file)
├── components/
│   ├── ui/               # shadcn primitives (button, input, card...)
│   ├── forms/            # Form components
│   ├── layout/           # Header, Footer, Sidebar, Breadcrumbs
│   └── [feature]/        # Feature-specific components
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Browser Supabase client
│   │   ├── server.ts     # Server Supabase client (cookies-aware)
│   │   ├── admin.ts      # Service role client (server only, never in client bundle)
│   │   └── middleware.ts  # Session-refresh helper called from src/proxy.ts
│   ├── env.ts            # Zod-validated environment variables
│   ├── utils.ts          # cn() and general utilities
│   ├── constants.ts      # App-wide constants + ROUTES map
│   └── validations.ts    # Zod schemas for forms / API bodies
├── features/             # Bounded contexts (import from outside only via `@/features/<name>`)
├── shared/               # Optional shared kernel (`@/shared/*`); create when needed
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
│   ├── database.ts       # Supabase generated types (regenerate on schema change)
│   └── index.ts          # Shared app types
├── config/
│   └── site.ts           # Site metadata + nav config
└── proxy.ts              # Request interception (session refresh + security headers)
```

> Note: `src/styles/` does **not** exist. All global CSS lives in `src/app/globals.css`.

---

## URL Hierarchy & Breadcrumbs

Every page with a path deeper than the first level (e.g. `/companies/[id]`) **must** have breadcrumb navigation.
URLs must reflect a logical hierarchy that users can navigate by truncating
segments. This is both a UX and an SEO requirement.

### Rules

1. **URLs are hierarchical.** `/docs/getting-started` means `/docs` is a valid,
   navigable page. Never create a deep route without a parent index page.
2. **Detail / edit / create pages** must render `<Breadcrumbs />` from
   `@/components/layout/breadcrumbs` as the **first content element** (above the page title).
   - First breadcrumb is always **Dashboard** → `/dashboard`
   - Last breadcrumb is the current page (no link, bold)
   - Do **not** render breadcrumbs on `/dashboard`, `/settings*`, or first-level list pages (e.g. `/companies`)
3. **Dynamic segments** (e.g. `/docs/[slug]`) must pass a `resolveLabel` prop
   to map the slug to a human-readable title:
   ```tsx
   <Breadcrumbs resolveLabel={(seg) => doc?.title ?? seg} />
   ```
4. **Route groups** like `(dashboard)` or `(auth)` are invisible in the URL
   and are automatically stripped from breadcrumbs.
5. **`SEGMENT_LABELS`** in `src/components/layout/breadcrumbs.tsx` must be
   updated when adding a new static route. If the segment is not in the map
   and no `resolveLabel` is provided, the raw segment is title-cased
   (`getting-started` → `Getting Started`).

### Pattern: Nested layout with breadcrumbs

```tsx
// src/app/docs/layout.tsx
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs className="mb-6" />
      {children}
    </div>
  )
}
```

### Anti-patterns

- ❌ Creating `/settings/billing/invoices/[id]` without `/settings/billing/invoices` index
- ❌ Pages deeper than `/` without `<Breadcrumbs />`
- ❌ Using non-descriptive slugs as route segments (`/p/123` instead of `/projects/123`)
- ❌ Flat URL structures that don't reflect content hierarchy (`/invoice-detail` instead of `/invoices/[id]`)

---

## Code Rules

### TypeScript

- Strict mode always. No `any`. No `@ts-ignore`. Use `unknown` + narrowing.
- `interface` for object shapes, `type` for unions/intersections.
- Every exported function has an explicit return type.
- Zod for all runtime boundaries: API bodies, form inputs, env vars, 3rd-party responses.

### React Components

- Functional components only.
- Named exports: `export function ComponentName()`.
- Props interface above the component:
  ```tsx
  interface UserCardProps {
    user: User
    onSelect: (id: string) => void
  }

  export function UserCard({ user, onSelect }: UserCardProps): React.ReactElement {
    // ...
  }
  ```
- Components under 150 lines. Extract logic to hooks or utilities.
- `"use client"` only for browser APIs, interactivity, or client-only libs.
- Server Components fetch data directly with `async/await` — no `useEffect` for fetching.

### Naming Conventions

- Files: `kebab-case.ts`, `kebab-case.tsx`
- Components: `PascalCase` (file in kebab-case)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Database tables: `snake_case`
- API routes: `kebab-case`
- Booleans: prefix `is`, `has`, `should`, `can`

### Error Handling

Never silently catch. Always log or re-throw with context.
```ts
try {
  const { data, error } = await supabase.from("users").select("id, email")
  if (error) throw error
  return data
} catch (error) {
  console.error("Failed to fetch users:", error)
  throw new Error("Unable to load users. Please try again.")
}
```

### Imports

Absolute imports via `@/` prefix. Group in this order:
1. React / Next.js
2. External libraries
3. Internal modules (`@/lib`, `@/hooks`, `@/types`)
4. Components (`@/components`)
5. Relative imports (same feature folder only)

---

## Supabase Rules

- RLS **enabled** on every table. Write policies in the migration that creates the table.
- `service_role` key is server-only. Never import `@/lib/supabase/admin.ts` from a
  file with `"use client"`.
- On the server, use `supabase.auth.getUser()` (not `getSession()`) — it revalidates
  against Supabase Auth.
- Regenerate types on schema change:
  ```bash
  pnpm supabase gen types typescript --project-id <project-id> > src/types/database.ts
  ```
- Sensitive logic (webhooks, 3rd-party API calls with secrets, file processing) →
  Edge Functions.
- Session refresh lives in `src/proxy.ts` (see that file). Do not duplicate it.

---

## Environment Variables

- All env vars are validated with Zod at startup via `src/lib/env.ts`.
- **Add new env vars** in three places: `.env.example`, `src/lib/env.ts` (schema),
  and the relevant CI workflow env block.
- Use `getServerEnv()` in server code and `getClientEnv()` in client code instead
  of raw `process.env` — this gives type safety and fails fast on misconfiguration.
- Never commit `.env.local`. The `.gitignore` already blocks it.

---

## Error Handling & Boundaries

Three files provide the global error safety net:

- `src/app/error.tsx` — catches unhandled runtime errors. Wired to `console.error`
  by default; replace with `Sentry.captureException(error)` when you add error
  tracking.
- `src/app/not-found.tsx` — renders for any unmatched route (404).
- `src/app/loading.tsx` — global loading skeleton during navigation.

### Rules

- Every route group layout **may** have its own `error.tsx` and `loading.tsx`
  for more granular feedback.
- Never swallow errors silently. If you catch, either re-throw or report.
- Error boundaries must provide a way to retry (`reset()` callback).
- The `error.digest` field is a server-side hash — safe to show to users for
  support requests, but never expose the full stack trace.

---

## SEO & Metadata

- Root `layout.tsx` uses `title.template` from `siteConfig` — child pages only
  need to set `title` (e.g. `"Dashboard"` renders as `"Dashboard — ProductName"`).
- Use `generateMetadata()` for dynamic pages (blog posts, docs):
  ```tsx
  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const doc = await getDoc(slug)
    return { title: doc.title, description: doc.excerpt }
  }
  ```
- `src/app/robots.ts` — dynamic `robots.txt`; reads canonical URL from `NEXT_PUBLIC_APP_URL`.
- `public/llms.txt` — fill with product info for AI indexing.
- `src/app/sitemap.ts` — add dynamic routes as your product grows.
- Always set `width` and `height` on OG images (default: 1200×630).

---

## Styling Rules (Tailwind v4)

- Tailwind only. No inline styles. No CSS Modules (exceptional cases only).
- There is **no `tailwind.config.ts`**. Theme tokens live in `src/app/globals.css`
  under `@theme inline { ... }`. Add new tokens there.
- Use `cn()` from `@/lib/utils` for conditional classes:
  ```tsx
  <div className={cn("base", isActive && "active")} />
  ```
- Mobile-first. Use `sm:`, `md:`, `lg:`, `xl:` breakpoints.
- Dark mode via `dark:` variant (toggled by `.dark` on `<html>`).
- No magic pixels. Use the spacing scale (`p-2`, `gap-4`) and radius tokens
  (`rounded-md`, `rounded-xl`).

---

## Prohibitions

1. No `any`. Use `unknown` and narrow.
2. No `console.log` in production paths. Use `console.warn` / `console.error` or a logger.
3. No hardcoded secrets. All keys live in `.env.local` and are accessed via
   `getServerEnv()` / `getClientEnv()` from `@/lib/env.ts` — not raw `process.env`.
4. No direct DOM manipulation. Use React state/refs.
5. No default exports (except Next.js pages/layouts/error boundaries that require them,
   and `proxy.ts` default export).
6. No barrel files (`index.ts` re-exports) in shared code — they break tree-shaking. **Exception:** each `src/features/<name>/index.ts` **must** re-export that feature’s public API; consumers import only `@/features/<name>` (see `ARCHITECTURE.md`).
7. No data fetching in `useEffect`. Use Server Components, Server Actions, or SWR/React Query
   for client-side real-time needs.
8. No committing `.env*` files with real values.
9. No ignoring TypeScript errors. Fix them.
10. No installing packages without justification in the commit message.
11. No `middleware.ts` — use `src/proxy.ts` (Next 16 convention).

---

## Git Rules

Commit messages in imperative mood, concise, Conventional Commits prefixes:

- `feat: add user authentication flow`
- `fix: resolve timezone offset in booking display`
- `refactor: extract payment logic into hook`
- `chore: bump next to 16.2.4`

One logical change per commit. Never commit broken code.

---

# Commit & Push Protocol

When the user says "commit", "запушь", "залей", or similar, perform the
following sequence WITHOUT asking for clarification. Stop only if a step
fails with a real error.

## Step 1 — Pre-commit verification

Detect which checks apply to this repo, then run all that exist:

| Tool | Command | Skip if |
|---|---|---|
| Python tests | `cd engine && uv run pytest tests/ -q 2>&1 \| tail -5` | No `engine/` or `pyproject.toml` |
| Python lint | `cd engine && uv run ruff check src/ tests/ 2>&1 \| tail -3` | Same |
| Python types | `cd engine && uv run pyright src/ 2>&1 \| tail -3` | Same |
| TS types | `pnpm tsc --noEmit 2>&1 \| tail -5` | No `package.json` |
| ESLint | `pnpm lint 2>&1 \| tail -3` | Same |
| Vitest | `pnpm test 2>&1 \| tail -5` | Same |

Run them in this order. If any fail, STOP and fix the failure before
continuing. Do not commit broken code.

## Step 2 — Stage files

Explicitly add only the files you changed:

```bash
git add path/to/file1 path/to/file2 ...
```

Never use `git add .` or `git add -A` — they pull in secrets and junk.
If many files changed in one logical unit, list them all by name.

## Step 3 — Compose the commit message

Use Conventional Commits with **lowercase subject** (many commitlint
configs require this). Body MUST have 4 sections:

```
<type>(<scope>): <lowercase subject under 70 chars>

context — why this change exists / what bug / what data triggered it:
- 1-3 bullet points explaining motivation

<area> — what changed:
- file-level summary of each meaningful edit
- include constants / thresholds / new functions / new endpoints

tests:
- N new tests covering ...
- M tests total passing

results (if applicable):
- numbers before vs after
- benchmark output, regression test pass, real-data backtest, etc.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `chore`, `ci`, `docs`, `test`, `perf`.
Scopes are repo-specific — read recent `git log --oneline -20` to see
what scopes have been used before, mimic those.

## Step 4 — Commit via heredoc

ALWAYS use heredoc, not `-m`. The `&` and apostrophes in commit bodies
break with `-m "..."` quoting.

```bash
git commit -F - <<'COMMIT'
<type>(<scope>): subject

context — ...
- bullet

<area> — what changed:
- bullet

tests:
- bullet

results:
- bullet

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
COMMIT
```

The `'COMMIT'` quotes are critical — they prevent shell variable
expansion of `$`, backticks, etc. inside the body.

## Step 5 — Handle commitlint warnings

If commit succeeds but warns about `scope-enum`, ignore — the commit
still landed. If it FAILS with `subject-case` (uppercase subject),
re-compose with all-lowercase subject and re-commit.

If a pre-commit / lint-staged hook auto-formats files and the message
shows "modified by linter", the commit still landed correctly — the
warning is informational.

## Step 6 — Push

```bash
git push origin main 2>&1 | tail -3
```

(Or whatever the current branch is — check `git branch --show-current`
first if unsure.)

Report the commit SHA back to the user as a GitHub link if possible.

## What NOT to do

- Don't ask for permission between steps — run them all
- Don't use `--no-verify` to skip hooks
- Don't use `git push --force` to main
- Don't commit `.env*` files
- Don't use `git add .` / `git add -A`
- Don't write the subject line in uppercase
- Don't skip the verification step "to save time"

---

## Testing

- Write tests for: utility functions, API routes, complex business logic, Zod schemas.
- Framework: Vitest (unit) + Playwright (E2E when needed).
- Test files colocated: `utils.ts` → `utils.test.ts`.
- Every new utility function gets a test.

---

## Pre-Commit Checklist

Before completing any task, verify:

- [ ] TypeScript compiles (`pnpm tsc --noEmit`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier clean (`pnpm format:check`)
- [ ] Tests pass (`pnpm test`)
- [ ] Breadcrumbs present on nested routes
- [ ] No hardcoded values (URLs, keys, magic numbers)
- [ ] Error states handled in UI (loading, error, empty)
- [ ] Mobile responsiveness checked
- [ ] No `console.log` left in source
- [ ] New dependencies justified in commit message
- [ ] Commit message follows convention

---

## El Aurion Agents

Проект использует систему специализированных агентов. Подробности: `.claude/agents/README.md`.

Быстрый старт:
```
/project:agent orchestrator "сложная задача с несколькими шагами"
/project:agent coder "написать или изменить код"
/project:agent reviewer "проверить код перед merge"
/project:agent architect "спроектировать схему или API"
/project:agent tester "написать тесты"
/project:agent security "аудит безопасности"
```

Правила разбиты по файлам в `.claude/rules/` — агенты читают только нужные им файлы.

---

## Context & Memory

When working on a task:
1. Read relevant files first before making changes.
2. Follow existing patterns — consistency over preference.
3. Suggest refactors as separate steps, not mixed into feature commits.

When starting a new session:
1. Read `docs/09_CURRENT_STATUS.md` — current project status, what's done, what's next.
2. Read `docs/08_BACKLOG.md` — pick the next task.
3. Read `.claude/memory/context.md` for session context.
4. Read `.claude/memory/mistakes.md` — not to repeat past errors.
5. Read `.claude/rules/` relevant to your task.
6. Ask clarifying questions if requirements are ambiguous.
7. Show implementation plan before writing code (see `## Before Writing Code` above).

After completing a task:
- Update `docs/09_CURRENT_STATUS.md` with what was done and the next step.
- If a meaningful architectural/product decision was made, log it in `docs/15_DECISIONS_LOG.md`.

---

## Documentation

- Every exported function has a JSDoc comment.
- Complex logic gets inline comments explaining **why**, not **what**.
- README.md is kept up to date.
- API routes documented with request/response examples.

---

## Performance

- `next/image` for all images. Always pass `width` and `height`.
- `next/link` for internal navigation.
- Server Components by default. `"use client"` only when necessary.
- Lazy-load heavy client components: `dynamic(() => import("./chart"), { ssr: false })`.
- Cache Components (`"use cache"`) for expensive server reads that don't change
  per-user — opt-in, be explicit about what you cache.

---

## Security

- Sanitize all user inputs via Zod at the API boundary.
- Validate on both client (UX) and server (security).
- Check auth on every protected route, Server Action, and Route Handler
  with `supabase.auth.getUser()`.
- Never log sensitive data (passwords, tokens, PII).
- CSP and security headers are set in `src/proxy.ts` — don't fight it.
- Keep `next` on a patched version (16.2.4+) due to CVE-2025-66478.
- For new features involving money, auth, or multi-tenancy: write the RLS policy
  **in the same migration** that creates the table.

---

## Built-in Features (added to this template)

These features are scaffolded and ready to wire up. Read their `index.ts` for the public API.

### PostHog Analytics (`src/components/analytics/`, `src/lib/analytics.ts`)
- Client: wrap `usePostHog()` → `ph.capture("event_name", props)`
- Server: `trackServerEvent("event", userId, props)` from `@/lib/analytics`
- Identify after login: `ph.identify(user.id, { email, plan })`
- Reset on sign-out: `ph.reset()`
- Enable: set `NEXT_PUBLIC_POSTHOG_KEY` env var

### Onboarding Wizard (`src/features/onboarding/`)
- Route: `/onboarding` — auto-redirects new users after signup
- Steps defined in `src/features/onboarding/lib/steps.ts` — add/remove/reorder freely
- Profile column: `profiles.onboarding_completed` (migration 0005)
- Enable redirect in auth callback: check `onboarding_completed` and redirect to `/onboarding`

### Plan Limits + PlanGate (`src/lib/plan-limits.ts`, `src/components/plan-gate.tsx`)
- Map Stripe product IDs → limits in `src/lib/plan-limits.ts` `PRODUCT_PLAN_MAP`
- Gate any feature: `<PlanGate allowed={limits.aiEnabled} feature="AI Assistant">...</PlanGate>`
- Usage page at `/settings/usage` — shows per-resource bars
- Replace placeholder usage queries with real ones when tables exist

### In-app Notifications (`src/features/notifications/`)
- Bell component with Supabase Realtime badge: `<NotificationsBell initialNotifications={...} userId={...} />`
- Send from server: `sendNotification(userId, { title, body, kind, href })`
- Table: `public.notifications` (migration 0006)
- Enable flag: `NEXT_PUBLIC_FF_NOTIFICATIONS=true`

### API Keys (`src/features/api-keys/`)
- Management UI at `/settings/api-keys`
- Verify in Route Handlers: `const userId = await verifyApiKey(request.headers.get("x-api-key"))`
- Only SHA-256 hash stored — plain key shown once on creation
- Table: `public.api_keys` (migration 0007)
- Enable flag: `NEXT_PUBLIC_FF_API_KEYS=true`

### Releases & Changelog
- `release.config.ts` — semantic-release config
- `.github/workflows/release.yml` — auto-release on push to `main`
- `CHANGELOG.md` — auto-generated from Conventional Commits
- Install devDeps to activate: `pnpm add -D semantic-release @semantic-release/changelog @semantic-release/git`

### Development Seed
- `pnpm seed` — creates 3 test users + sample data
- Credentials: `alice@example.com / password123`, etc.
- Safe to run multiple times (upserts)
