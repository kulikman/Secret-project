# Template-Projects

Универсальный стартовый репозиторий: Next.js 16 + React 19 + Supabase + Tailwind v4 + TypeScript + pnpm.

Форкните → переименуйте → стройте продукт.

---

## Быстрый старт

После копии шаблона **сразу переименуйте проект** — иначе при каждом `pnpm dev` в консоли будет напоминание (для разработки самого шаблона: `TEMPLATE_DEV=1 pnpm dev`).

### Через git clone

```bash
git clone https://github.com/kulikman/Template-Projects.git my-app
cd my-app
pnpm post-clone "My Product" "my-product" "https://myproduct.com"
pnpm install
cp .env.example .env.local   # заполните ключи Supabase
pnpm dev
```

### Локальная копия каталога шаблона

Канонический путь шаблона на машине владельца: `/Users/DEV/TEMLATES/Template-Projects`. Скопируйте в новый каталог проекта и выполните те же шаги:

```bash
cp -R /Users/DEV/TEMLATES/Template-Projects ~/Projects/my-app
cd ~/Projects/my-app
pnpm post-clone "My Product" "my-product" "https://myproduct.com"
pnpm install
cp .env.example .env.local
pnpm dev
```

Приложение будет доступно на `http://localhost:3000`.

---

## Команды

| Command | Description |
|---------|-------------|
| `pnpm dev` | Запуск dev-сервера |
| `pnpm build` | Production-сборка |
| `pnpm lint` | ESLint проверка |
| `pnpm typecheck` | TypeScript type-check |
| `pnpm format:check` | Prettier проверка |
| `pnpm test` | Vitest unit-тесты |
| `pnpm test:watch` | Vitest в watch-режиме |
| `pnpm check` | Lint + typecheck + format (всё сразу) |
| `pnpm post-clone` | Переименование проекта после форка |
| `pnpm init:structure` | Scaffold папок в пустой директории |

---

## Проверка шаблона

Этот репозиторий — шаблон для новых проектов. Миграции Supabase лежат в
репозитории как baseline будущего проекта; не применяйте их к shared remote
Supabase-проекту только ради проверки шаблона.

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

После изменения схемы в реальном проекте, созданном из шаблона, обновите типы:

```bash
SUPABASE_PROJECT_ID=<your-project-id> pnpm supabase:types
```

Часть e2e-сценариев зависит от backend/Supabase окружения и может быть
пропущена в режиме чистого шаблона. Подробности: [`tests/e2e/README.md`](tests/e2e/README.md).

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
NEXT_PUBLIC_APP_NAME=MyProduct
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
