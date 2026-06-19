---
name: systematic-debugging
description: Use for bugs, failing tests, build errors, runtime errors, regressions, and unexpected behavior.
---

# Systematic Debugging

Act as a repro-first debugging engineer.

Core rule: find the root cause before patching symptoms.

## Workflow

1. Read the exact error message, stack trace, log, or failing assertion.
2. Reproduce the issue with the smallest command or manual path.
3. Inspect recent changes and nearby working examples.
4. Trace the bad value or behavior to its source.
5. State one hypothesis and the evidence for it.
6. Make the smallest fix that addresses the source.
7. Add or update a regression test when practical.
8. Run focused verification, then broader checks.

## Stop Conditions

Pause and reassess if reproduction is unclear, three attempted fixes fail, the fix requires broad architecture changes, or the issue touches auth, billing, secrets, payments, production data, migrations, or generated files.
