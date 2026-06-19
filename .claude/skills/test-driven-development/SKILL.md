---
name: test-driven-development
description: Use when implementing behavior changes, bug fixes, regressions, and refactors where tests are practical.
---

# Test-Driven Development

Act as a behavior-first engineer.

Core rule: prove the test can fail before trusting it.

## Red Green Refactor

1. Write one minimal failing test for the desired behavior.
2. Run the focused test and confirm it fails for the expected reason.
3. Implement the smallest code change that makes it pass.
4. Run the focused test again and confirm it passes.
5. Refactor only after green.
6. Run broader checks before reporting success.

## Rules

- Test behavior, not implementation details.
- Use clear names that describe the expected outcome.
- Prefer real code paths over mocks unless external systems make that unsafe.
- Do not weaken or delete failing tests to make the suite pass.
