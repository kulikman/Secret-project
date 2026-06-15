# Current Status

> **AI Agent:** Read this file at the start of every session before writing any code.
> Update this file after every completed task.
> Do not invent progress — only write what is confirmed from the current codebase.

---

## Last Updated
[YYYY-MM-DD]

## Current Phase
- [ ] Setup (configuring template for this project)
- [ ] MVP Development
- [ ] Beta
- [ ] Production

---

## Currently Working On
[Describe the active task — be specific, e.g. "Implementing user profile edit form (TASK-005)"]

---

## Completed
- [x] Template scaffolded (Next.js 16, Supabase, Stripe, email, onboarding, notifications, API keys, orgs)
- [ ] Supabase project connected (SETUP-001)
- [ ] Stripe configured (SETUP-002)
- [ ] Resend configured (SETUP-003)
- [ ] Core feature implemented

---

## In Progress
- [ ] [Task name]

---

## Blocked
- [ ] [Blocker description and why it's blocked]

---

## Next Step
[Concrete next task to do — reference the backlog ID, e.g. "SETUP-001: Configure Supabase project"]

---

## Do Not Touch
These areas must not be changed without explicit discussion:

- `supabase/migrations/` — no manual edits, only new migration files
- `src/lib/supabase/admin.ts` — never import from client-side code
- `src/proxy.ts` — auth + security headers wiring
- Payment webhook logic (`src/app/api/webhooks/stripe/`)
- Auth callback logic (`src/app/auth/callback/`)

---

## Known Issues
- Issue 1: [description]
- Issue 2: [description]

---

## Recent Decisions
- [YYYY-MM-DD]: [Decision summary] — see `15_DECISIONS_LOG.md` for details

---

## Environment Status

| Environment | URL | Status |
|---|---|---|
| Local | http://localhost:3000 | ✅ |
| Staging | https://staging.[domain] | ⬜ Not configured |
| Production | https://[domain] | ⬜ Not deployed |
