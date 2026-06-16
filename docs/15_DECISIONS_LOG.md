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

Use Next.js 16 + Supabase + Stripe + Tailwind v4 as the primary stack.

### Context

Starting from the SaaS template. Stack was pre-selected in the template.

### Final Reason

- Next.js 16 App Router: best-in-class DX for full-stack React with Server Components
- Supabase: Postgres + Auth + Realtime + Storage in one managed service, generous free tier
- Stripe: industry standard for SaaS billing, best webhook reliability
- Tailwind v4: no config file, CSS-native theme tokens, fast build

### Consequences

- Positive: fast setup, great documentation, strong ecosystem
- Negative: locked into Supabase for auth; migrating away would be expensive
- Risks: Supabase vendor dependency for production data
