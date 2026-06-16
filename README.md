# Тайное Бюро

Веб-платформа для публичного исследовательского архива, карты связей и закрытого сообщества Тайного Бюро.

---

## Быстрый старт

```bash
git clone https://github.com/kulikman/Secret-project.git secret-bureau
cd secret-bureau
pnpm install
cp .env.example .env.local   # заполните ключи Supabase
pnpm dev
```

Приложение будет доступно на `http://localhost:3000`.

---

## Команды

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `pnpm dev`            | Запуск dev-сервера                    |
| `pnpm build`          | Production-сборка                     |
| `pnpm lint`           | ESLint проверка                       |
| `pnpm typecheck`      | TypeScript type-check                 |
| `pnpm format:check`   | Prettier проверка                     |
| `pnpm test`           | Vitest unit-тесты                     |
| `pnpm test:watch`     | Vitest в watch-режиме                 |
| `pnpm check`          | Lint + typecheck + format (всё сразу) |
| `pnpm init:structure` | Scaffold папок в пустой директории    |

---

## Проверка проекта

Миграции Supabase лежат в репозитории как baseline проекта; не применяйте их к
shared remote Supabase-проекту только ради локальной проверки.

Минимальная проверка перед использованием/публикацией шаблона:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check
pnpm knip
pnpm build
pnpm test:e2e
```

Локальная проверка Supabase migrations:

```bash
supabase start
supabase db reset
```

После изменения схемы обновите типы:

```bash
SUPABASE_PROJECT_ID=<your-project-id> pnpm supabase:types
```

Часть e2e-сценариев зависит от backend/Supabase окружения. Подробности:
[`tests/e2e/README.md`](tests/e2e/README.md).

---

## Структура проекта

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Server Action + useActionState скелет
│   ├── dashboard/                # Защищённый shell с breadcrumbs
│   ├── error.tsx                 # Глобальный error boundary → logger
│   ├── not-found.tsx             # 404
│   ├── loading.tsx               # Loading skeleton
│   ├── sitemap.ts                # Динамический sitemap (через getPublicMetadataEnv)
│   ├── layout.tsx                # Header + Providers + <main>
│   └── globals.css               # Tailwind v4 theme tokens
├── components/
│   ├── ui/                       # shadcn/ui примитивы
│   ├── forms/submit-button.tsx   # useFormStatus pending state
│   ├── layout/                   # Header, Breadcrumbs
│   ├── providers.tsx             # ThemeProvider + Toaster (sonner)
│   └── theme-toggle.tsx          # next-themes light/dark/system
├── lib/
│   ├── supabase/                 # client, server, admin (server-only), middleware
│   ├── auth.ts                   # getUser() + requireUser()
│   ├── env.ts                    # Zod env validation (server + client)
│   ├── logger.ts                 # Структурированный logger (Sentry-ready)
│   ├── rate-limit.ts             # In-memory limiter, Upstash-совместимый
│   ├── security-headers.ts       # CSP + HSTS для proxy.ts
│   ├── validations.ts            # Общие Zod-схемы
│   ├── utils.ts                  # cn()
│   └── constants.ts              # ROUTES, APP_NAME
├── hooks/use-mounted.ts          # Anti-hydration хук для ThemeToggle
├── types/database.ts             # Supabase types (regenerated)
├── config/site.ts                # siteConfig (single source of truth)
├── instrumentation.ts            # Fail-fast env validation на старте
└── proxy.ts                      # Session refresh + security headers

supabase/migrations/0001_*.sql    # Канонический пример таблицы с RLS
tests/e2e/                        # Playwright (опционально, README внутри)
```

Подробная структура и правила: [`CLAUDE.md`](CLAUDE.md).

---

## Переменные окружения

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # только сервер

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Тайное Бюро
```

Все переменные валидируются Zod-схемой в `src/lib/env.ts` — приложение упадёт на старте, если что-то не так.

---

## AI-агенты

Репозиторий оптимизирован для работы с Claude Code и Cursor:

- **`CLAUDE.md`** — основные правила стека и кода
- **`AGENTS.md`** — предупреждение для агентов о Next.js 16
- **`.cursorrules`** — приоритеты для Cursor
- **`.claude/`** — memory, instincts, skills (architect, review, memory)
- **`audit/`** — правила аудита (`rules.json`), промпт, история

Команды Cursor: `.cursor/commands/` (Run audit, Fix all critical, Show rules).

---

## Качество и CI

GitHub Actions при каждом push/PR:

- ESLint + TypeScript + Prettier
- Vitest unit-тесты
- Gitleaks (сканирование секретов)
- `pnpm audit` (блокирует HIGH/CRITICAL CVE)
- Production build

---

## Деплой

Push в `main` → Vercel авто-деплой. Убедитесь что переменные окружения настроены в Vercel Dashboard.

---

## SEO

- `src/app/robots.ts` — динамический `robots.txt` (Sitemap URL из `NEXT_PUBLIC_APP_URL`)
- `public/llms.txt` — заполните информацией о продукте
- `src/app/sitemap.ts` — добавьте динамические маршруты
- Metadata через `siteConfig` + `getPublicMetadataEnv()` в `src/app/layout.tsx`
