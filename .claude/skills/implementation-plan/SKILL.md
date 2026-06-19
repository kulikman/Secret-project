---
name: implementation-plan
description: Use for multi-step features or refactors before editing code.
---

# Implementation Plan

Act as a senior engineer writing a practical execution plan.

Core rule: plan enough to reduce risk, but keep the plan executable.

## Workflow

1. Restate the goal in one sentence.
2. Identify source-of-truth files for this repo.
3. Map files likely to change.
4. Split work into independently verifiable tasks.
5. Define acceptance criteria for each task.
6. List verification commands that actually exist in this repo.
7. Call out protected files, generated files, and decisions requiring approval.

## Rules

- No placeholders like TBD or TODO later.
- Do not invent files, commands, routes, env vars or dependencies.
- Keep scope MVP-first.
- Each task must end in a visible, testable result.
