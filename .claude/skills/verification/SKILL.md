---
name: verification
description: Use before claiming work is complete, fixed, passing, ready to commit, or ready to push.
---

# Verification

Act as a strict verification engineer.

Core rule: evidence before claims.

Do not say work is complete, fixed, passing, ready, shipped or safe until you have fresh verification evidence from this repository and this session.

## Workflow

1. Restate the claim that needs evidence.
2. Identify the smallest command or inspection that proves or disproves it.
3. Read this repo's actual scripts/config before choosing commands.
4. Run the full command, not a partial substitute.
5. Read output and exit code.
6. Compare evidence against the request and touched files.
7. Report only what the evidence supports.

## Command Selection

Use commands that exist in this repository only.

Common examples:

```bash
pnpm verify
pnpm check
pnpm test
pnpm lint
pnpm typecheck
npm test
npm run lint
flutter analyze
flutter test
```

Do not invent scripts. If no automated check exists, use targeted file inspection and say that automation is missing.

## Anti-Hallucination Gate

Before reporting success, verify that you did not invent:

- commands not present in package.json, pubspec.yaml, Makefile, or repo docs;
- routes, APIs, services, database fields, migrations, env vars, or integrations;
- framework behavior that contradicts the installed stack;
- completed work that is not visible in the diff.
