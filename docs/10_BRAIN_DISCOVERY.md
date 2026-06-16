# Brain Discovery

## Epic

Epic 0: Discovery + Architecture Freeze

## Date

2026-06-15

## Status

Local Brain code review completed. Brain node/edge CRUD gaps C1-C4 were
implemented locally in `/Users/DEV/Elaurion-Brain` on 2026-06-15. Structured
semantic search C5, bounded neighbors C6, and graph intersections C7 were
implemented locally on 2026-06-16. Transactional bulk merge C8 was also
implemented locally on 2026-06-16. Source studies archive ingest profile C9 was
implemented locally on 2026-06-16. Root/depth graph subset C10 was implemented
locally on 2026-06-16. Live Brain instance setup and deployment of those Brain
changes are still pending.

## Goal

Validate the real `Elaurion-Brain` SDK/API against the capabilities required by
`secret-bureau-architecture-v4.md` before implementing knowledge features in this
app.

## Sources Reviewed

- `/Users/anton/Downloads/secret-bureau-architecture-v4.md`
- `/Users/anton/Downloads/codex-delivery-plan.md`
- `/Users/DEV/Elaurion-Brain/AGENTS.md`
- `/Users/DEV/Elaurion-Brain/packages/brain-sdk/src/index.ts`
- `/Users/DEV/Elaurion-Brain/packages/brain-sdk/src/contract.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/routes/brain.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/services/graph.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/services/retrieval.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/services/ingest.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/middleware/auth.ts`
- `/Users/DEV/Elaurion-Brain/apps/api/src/db/schema.ts`

## Summary

The current Brain implementation is a project-scoped memory graph, not yet the
public archive API described in the Secret Bureau architecture.

Confirmed:

- Brain is Hono + PostgreSQL + pgvector.
- Brain has project-scoped auth via project keys and agent keys.
- Brain has dynamic nodes, facts, dynamic edges, ingest events, embeddings, graph
  retrieval, and merge flow.
- Brain has generic and profiled ingest, semantic context retrieval, a full
  project graph endpoint, and a root/depth graph subset endpoint.

Not confirmed or missing:

- No `namespace` primitive matching `secret_bureau_public_archive`.
- No webhook emission for `node.updated` / `node.merged`.

## Capability Matrix

| ID  | Required capability                              | Current Brain status | Evidence                                                                                                                                                                                                                                                | Decision / next action                                                                                            |
| --- | ------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| C1  | `createNode(type, payload, namespace)`           | Implemented locally  | API has `POST /api/v1/brain/:pid/nodes`; SDK now has `createNode()`. Actual model remains `projectId + label + category + type + summary`, not arbitrary payload + namespace.                                                                           | Map Secret Bureau node types to Brain `category/type/summary/facts`; deploy Brain changes before app consumption. |
| C2  | `updateNode(nodeId, patch)`                      | Implemented locally  | Added `PATCH /api/v1/brain/:pid/nodes/:nid` and SDK `updateNode()`, scoped by `projectId`.                                                                                                                                                              | Deploy Brain changes before admin editing.                                                                        |
| C3  | `createEdge(fromId, toId, relationType, weight)` | Implemented locally  | Added `POST /api/v1/brain/:pid/edges` and SDK `createEdge()`. Service validates both endpoint nodes are in the scoped project before upsert.                                                                                                            | Deploy Brain changes before manual/admin graph curation.                                                          |
| C4  | `getNode(nodeId)`                                | Implemented locally  | Added `GET /api/v1/brain/:pid/nodes/:nid` and SDK `getNode()` with facts.                                                                                                                                                                               | Deploy Brain changes before direct admin reads.                                                                   |
| C5  | `semanticSearch(query, namespace, filters)`      | Implemented locally  | Added `GET /api/v1/brain/:pid/search`, SDK `semanticSearch()`, MCP `brain_search`, category filters, ranked node scores, and source facts.                                                                                                              | Deploy Brain changes before app-side Knowledge Engine search consumption.                                         |
| C6  | `getNeighbors(nodeId, depth, edgeTypes)`         | Implemented locally  | Added `GET /api/v1/brain/:pid/nodes/:nid/neighbors`, SDK `getNeighbors()`, MCP `brain_get_neighbors`, depth 1-3, relation filters, and project-scoped traversal.                                                                                        | Deploy Brain changes before Graph Map consumption.                                                                |
| C7  | `getIntersections(nodeId, via)`                  | Implemented locally  | Added `GET /api/v1/brain/:pid/nodes/:nid/intersections`, SDK `getIntersections()`, MCP `brain_get_intersections`, via category filters, relation filters, bounded limit, and project-scoped 2-hop intersection search.                                  | Deploy Brain changes before Graph Map consumption.                                                                |
| C8  | `mergeNodes(primaryId, duplicateIds)`            | Implemented locally  | Added transactional bulk merge through `POST /api/v1/brain/:pid/nodes/:nid/merge` with `{ duplicateIds }`, SDK object overload `mergeNodes({ primaryNodeId, duplicateNodeIds })`, and MCP `duplicate_node_ids`; legacy single merge remains compatible. | Deploy Brain changes before admin duplicate review uses bulk merge.                                               |
| C9  | `enqueueIngest(sourceRef, profile)`              | Implemented locally  | Added API/SDK/MCP `profile` support for ingest, stores profile in ingest metadata, and routes worker extraction through `source_studies_archive` prompt using archive categories `topic/source/claim/person/organization/event/tag`.                    | Deploy Brain changes before app-side profiled archive ingest consumption.                                         |
| C10 | `getGraphSubset(rootId, depth)`                  | Implemented locally  | Added `GET /api/v1/brain/:pid/nodes/:nid/subgraph`, SDK `getGraphSubset()`, MCP `brain_get_graph_subset`, root node included at depth 0, depth 1-3, relation filters, and project-scoped traversal.                                                     | Deploy Brain changes before production Graph Map consumption.                                                     |

## Auth / Isolation Findings

Brain does not use `namespace`. It uses:

- `projects.id`
- `projects.slug`
- `projects.scope`
- project API keys
- `agent_keys` with role, `can_write`, and optional `allowed_categories`

For Secret Bureau, the architecture should map `secret_bureau_public_archive` to
a dedicated Brain project or slug. Recommended slug:

```text
secret-bureau-public-archive
```

The app should use a Brain project key or a writable agent key scoped to that
project only. Anton must create/provide the live token through environment
variables; it must not be pasted into code or chat.

## Invalidation Findings

No webhook emission was found for `node.updated` or `node.merged`.

MVP decision remains:

- Start with manual `republish`.
- Add app endpoint shape for future webhook later.
- Do not block public portal on webhook.

## Brain-Side Tasks

These are blockers before Knowledge Engine is production-ready:

- `BRAIN-001`: Expose `createNode` in `@elaurion/brain-sdk`. Done locally.
- `BRAIN-002`: Add `PATCH /api/v1/brain/:pid/nodes/:nid` and SDK `updateNode`. Done locally.
- `BRAIN-003`: Add edge creation route and SDK method. Done locally.
- `BRAIN-004`: Add `GET /api/v1/brain/:pid/nodes/:nid`. Done locally.
- `BRAIN-005`: Add structured semantic search result API. Done locally.
- `BRAIN-006`: Add neighbors endpoint with `depth` and `edgeTypes`. Done locally.
- `BRAIN-007`: Add intersections endpoint or formalize app-side derivation from graph cache. Done locally.
- `BRAIN-008`: Add transactional bulk merge for duplicate nodes. Done locally.
- `BRAIN-009`: Add ingest `profile` support and `source_studies_archive`. Done locally.
- `BRAIN-010`: Add root/depth graph subset endpoint. Done locally.
- `BRAIN-011`: Add webhook emission or change events for projection sync.

## App-Side Tasks

These can start after the current discovery output:

- Create app Brain adapter interface that matches the Secret Bureau capability
  names, while internally adapting to real Brain SDK methods.
- Add env schema for `BRAIN_API_URL`, `BRAIN_API_KEY`, and `BRAIN_PROJECT_ID` or
  `BRAIN_PROJECT_SLUG`.
- Implement manual republish as the initial projection sync mechanism.
- Treat `node_projection` as read model only.
- Keep public routes off live Brain calls.

## Architecture Freeze Notes

- Keep CQRS: public archive reads from App DB projection, not live Brain.
- Use Brain project scope as the isolation boundary unless Brain later adds a
  first-class namespace model.
- Do not implement Graph/Map against full `getGraph()` as the production
  contract. Use Brain `getGraphSubset()` once the local C10 changes are
  deployed or released.
- Do not implement archive ingest against production Brain until the local
  `source_studies_archive` profile changes are deployed or released.

## Remaining Blockers

- Live Brain project/slug for Secret Bureau has not been created or confirmed.
- Scoped Brain token has not been provisioned in this app environment.
- Local Brain changes for C1-C10 have not been deployed or versioned for app
  consumption.
- App-side adapter and admin/public features still need to consume the deployed
  C1-C10 contracts.

## Exit Criteria Status

- Capability matrix completed: yes, from local code.
- App-side next steps identified: yes.
- Brain-side tasks identified: yes.
- Brain-side C1-C10 capability gaps closed locally: yes.
- Live namespace/project token confirmed: no.
- Epic 0 fully complete: no, blocked on live Brain project/token, deployment of
  local Brain changes, and app-side consumption of the deployed contracts.
