# AGENTS.md — Stack Warning for AI Agents

> Read this **before** writing any code in this repo.

## This is Next.js 16, not Next.js 14

If your training data is from early 2025 or before, it describes **Next.js 14 or
15**. This repo uses **Next.js 16.2+** with **React 19.2** and **Tailwind v4**.
Do not apply older patterns blindly.

### Breaking changes you will otherwise get wrong

1. **`params` and `searchParams` are `Promise<...>`, not plain objects.** `await` them.
2. **`middleware.ts` is deprecated → use `src/proxy.ts`.** Node.js runtime, not Edge. Default or named `proxy` export.
3. **Caching is opt-in.** Use `"use cache"` directive. No implicit memoization.
4. **No `tailwind.config.ts`.** Theme lives in `src/app/globals.css` under `@theme`.
5. **`next/image` `domains` removed** — use `remotePatterns` in `next.config.ts`.
6. **Turbopack is default** for `next dev` and `next build`.
7. **`cookies()`, `headers()`, `draftMode()` are async.**

### Use `CLAUDE.md` as the authoritative stack reference

For full rules (style, Supabase, security, pre-commit) → read `CLAUDE.md`.
For module boundaries and feature public APIs → read `ARCHITECTURE.md`.
For architectural decisions → read `.claude/instincts.md`.
For session state → read `.claude/memory/project-state.md`.

### When in doubt

Run `cat node_modules/next/package.json | grep version` to confirm the installed
major. Read `node_modules/next/dist/esm/lib/...` or `https://nextjs.org/docs` for
the current API. **Do not invent APIs from memory.**

## Repo Safety Addendum

Before editing, also read `.claude/rules/repo-safety.md` for this repository's stack-specific safety rules.
