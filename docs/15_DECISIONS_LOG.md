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

---

## DECISION-002: [Your next decision]

### Date
[YYYY-MM-DD]

### Decision
[...]
