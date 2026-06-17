# MVP Scope

## MVP Goal

Доказать, что Тайное Бюро может публиковать source-first knowledge archive из Brain в отказоустойчивую App DB projection, а публичные пользователи могут читать темы, источники и подавать заявки без зависимости от live Brain.

---

## In Scope

### Must Have (P0 — блокирует запуск)

- [ ] Project-specific env validation for Brain and Supabase.
- [ ] Server-only Brain adapter with typed unsupported-capability errors.
- [ ] App DB migrations for `node_projection` and community/application tables.
- [ ] Admin-only knowledge authoring entry points.
- [ ] Manual republish flow from Brain node to App DB projection.
- [ ] Public `/topics`, `/topics/:slug`, and `/sources/:id` pages from projection.
- [ ] Community application submission.
- [ ] Admin moderation for applications.
- [ ] Audit trail for admin mutations.
- [ ] Public portal remains available when Brain is unavailable.

### Should Have (P1 — важно, но не блокирует первый smoke)

- [ ] Source ingest trigger once local Brain C9 `source_studies_archive` is deployed/released and adapter-wired.
- [ ] Review queue for pending entities/facts.
- [ ] Dossier generation with source-first validation.
- [ ] PDF presentation generation with source references per slide.
- [ ] Basic map endpoint from cached graph projection.
- [ ] Email notifications for application status changes.

### Nice to Have (P2 — после MVP)

- [ ] Interactive 1-hop/2-hop graph exploration.
- [ ] PDF export for generated presentations.
- [ ] Public API for selected archive data.
- [ ] Advanced analytics dashboard.
- [ ] Webhook-based Brain projection invalidation.

---

## Out of Scope (MVP)

- Mobile app.
- White-labeling.
- Production map based on full live Brain graph.
- Automatic ingest with unapproved generic extraction profile.
- Founder/private Brain project access from this app.
- Any payment/billing implementation, checkout, paid plans, or subscription logic.

---

## MVP User Flow

```text
Admin configures Supabase + scoped Brain env
  ↓
Editor creates or confirms knowledge in Brain
  ↓
Editor runs manual republish
  ↓
App writes/updates node_projection
  ↓
Reader opens /topics or /sources
  ↓
Public page renders from App DB only
  ↓
Visitor submits a community application
  ↓
Admin reviews and changes application status
```

---

## MVP Release Criteria

Technical:

- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] App DB migrations are applied in Supabase.
- [ ] RLS policies exist for all new app-owned tables.
- [ ] Brain token exists only in environment variables.
- [ ] Public pages do not import `src/lib/brain`.
- [ ] Brain outage behavior is documented and tested.
- [ ] Deployment env is configured in Vercel.

Product:

- [ ] At least 5 public topics are published from projection.
- [ ] At least 5-10 sources are represented.
- [ ] Every generated/published content block has source references.
- [ ] Application submission and admin status change work end-to-end.
- [ ] Mobile layout works on iPhone SE width and above.
