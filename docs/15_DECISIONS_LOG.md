# Decisions Log

This file records important product and technical decisions.
Log a decision here whenever you make a meaningful architectural, stack, or product choice that would be non-obvious to a future developer (or AI agent) reading the code.

---

## Template: How to log a decision

```markdown
## DECISION-XXX: [Short title]

### Date

YYYY-MM-DD

### Decision

[What was decided in one sentence]

### Context

[Why this decision was needed — what problem or question triggered it]

### Options Considered

#### Option 1: [Name]

Pros: ...
Cons: ...

#### Option 2: [Name]

Pros: ...
Cons: ...

### Final Reason

[Why this option was chosen over others]

### Consequences

- Positive: ...
- Negative / trade-offs: ...
- Risks: ...
```

---

## DECISION-005: No Payments In Product

### Date

2026-06-17

### Decision

Remove payment runtime from Тайное Бюро. The product has no checkout, paid plans, subscription portal, payment webhooks, or paid entitlement gates.

### Context

The owner clarified that payments will not exist at all. Keeping Stripe scaffold code would create false backend priorities and future hallucination risk for Codex handoffs.

### Consequences

- Positive: simpler product surface, fewer secrets, fewer webhook/security paths, less CI/audit scope.
- Negative / trade-offs: any future monetization must be handled outside the app or through a new explicit architecture decision.
- Follow-up: legacy database subscription fields/tables are removed by `20260617124704_remove_payment_schema.sql`.

---

## DECISION-004: Store Admin Roles Outside Profiles

### Date

2026-06-17

### Decision

Store admin/editor/curator/support/viewer roles in `admin_role_assignments`
instead of adding a role column to `profiles`.

### Context

The scaffold currently allows authenticated users to read profiles broadly and
update their own profile rows. Adding `profiles.role` would either expose admin
assignments through normal profile reads or require a wider profile-policy
rewrite.

### Options Considered

#### Option 1: Add `profiles.role`

Pros: simple and matches the earliest target docs.
Cons: risks role visibility and privilege-escalation mistakes through existing
profile policies.

#### Option 2: Add `admin_role_assignments`

Pros: isolates RBAC data, supports self-read role checks, keeps profile behavior
stable.
Cons: future admin user-management screens need an extra join or trusted
service-role reads.

### Final Reason

The separate table is the smallest safe RBAC foundation without rewriting the
existing profile model.

### Consequences

- Positive: `/admin` can be role-gated without exposing role assignment broadly.
- Negative / trade-offs: role assignment bootstrap must use trusted SQL or a
  future super-admin-only action.
- Risks: future admin mutations must still add role checks and audit logs.

---

## DECISION-003: Admin Shell Before Admin Mutations

### Date

2026-06-16

### Decision

Start the admin console as a protected read-only shell and block real admin
mutations until RBAC, RLS, and audit logging are explicitly implemented.

### Context

The product needs admin surfaces for applications, generated PDF
presentations, API connections, knowledge operations, and the community member
cabinet. Existing project status already marks admin moderation as blocked by
RBAC/admin approval, and auth/secret logic must not be changed without a
separate task.

### Options Considered

#### Option 1: Build full admin CRUD immediately

Pros: faster visible progress.
Cons: risks exposing personal data or unsafe write actions without approved
roles and audit.

#### Option 2: Build a safe shell and decomposition first

Pros: creates navigation, scope, and implementation map without weakening
security boundaries.
Cons: real operations remain blocked until a follow-up RBAC epic.

### Final Reason

The safe shell preserves momentum while respecting the project's explicit
security constraints.

### Consequences

- Positive: Codex can continue from a clear admin map and routes.
- Negative / trade-offs: moderators still cannot process applications in UI.
- Risks: the next admin task must not skip RBAC/RLS/audit just because routes
  now exist.

---

## DECISION-002: Manual Republish For Initial Brain Projection Sync

### Date

2026-06-15

### Decision

Start MVP projection sync with manual republish from the admin app, and treat Brain webhooks as a later enhancement.

### Context

Epic 0 discovery found no current Brain webhook emission for `node.updated` or `node.merged`. Public pages must read App DB projection and must not depend on live Brain availability.

### Options Considered

#### Option 1: Manual republish

Pros: unblocks MVP without Brain webhook changes.
Cons: projection can become stale until an editor republishes.

#### Option 2: Brain webhook first

Pros: better automation and freshness.
Cons: requires Brain-side event emission before app features can start.

### Final Reason

Manual republish matches the production architecture's MVP fallback and lets the app proceed while Brain gaps are closed deliberately.

### Consequences

- Positive: lower integration risk for the first app milestone.
- Negative / trade-offs: editors must explicitly republish changed nodes.
- Risks: stale projection if editorial workflow forgets republish.

---

## DECISION-001: Tech Stack

### Date

[YYYY-MM-DD]

### Decision

Use Next.js 16 + Supabase + Tailwind v4 as the primary stack.

### Context

Starting from the SaaS template. Stack was pre-selected in the template.

### Final Reason

- Next.js 16 App Router: best-in-class DX for full-stack React with Server Components
- Supabase: Postgres + Auth + Realtime + Storage in one managed service, generous free tier
- Tailwind v4: no config file, CSS-native theme tokens, fast build

### Consequences

- Positive: fast setup, great documentation, strong ecosystem
- Negative: locked into Supabase for auth; migrating away would be expensive
- Risks: Supabase vendor dependency for production data
