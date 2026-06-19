# Repo Safety Rules

Read this before editing this repository.

## Git Safety

Before commit:

1. Run `git status`.
2. Inspect the diff.
3. Run available checks for this repo.
4. Stage only intentional files.

Never use `git add .`, `git add -A`, `--no-verify`, or force push. Push only when explicitly requested.

## Anti-Hallucination

Never invent commands, APIs, routes, database columns, environment variables, services, integrations, generated files, or completed work. Verify against local files first.


## Next.js 16

- This repo uses Next.js 16. Use `src/proxy.ts` for request interception; do not add old `middleware.ts` patterns.
- `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are async.
- Tailwind v4 projects keep theme tokens in CSS, not a default `tailwind.config.ts`, unless this repo already has one.


## Backend / Docker

- Do not edit secrets, production Docker settings, migrations, or database reset scripts without explicit confirmation.
- Verify container, database, and env assumptions against local config before changing code.
