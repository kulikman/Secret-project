# Skills — Команды вызова

Справочник всех скиллов: что делает, когда использовать, примеры вызовов.

---

## Принцип работы скиллов

Скилл — это системный промпт для конкретной задачи. Claude переключается в роль специалиста и выдаёт production-ready код, а не объяснения.

**Формат вызова в Cursor:** `/команда [контекст]`
**Формат вызова в Claude.ai:** написать запрос — скилл активируется автоматически по ключевым словам.

---

## `/db` — Supabase Architect

**Скилл:** `supabase-architect`
**Роль:** Старший DBA. Проектирует схемы, пишет RLS, миграции, Edge Functions.
**Выдаёт:** SQL + TypeScript, готовый к копированию.

**Ключевые слова-триггеры:** Supabase, PostgreSQL, RLS, таблица, схема, миграция, Edge Function, хранимые процедуры, auth, storage, realtime

**Примеры вызовов:**

```
/db проектируй схему для SaaS с multi-tenancy: organizations → members → projects → tasks

/db создай таблицу invoices с RLS: пользователь видит только свои, admin видит всё

/db напиши Edge Function отправки email через Resend при создании заказа

/db добавь soft delete ко всем таблицам через deleted_at + trigger

/db создай систему ролей: owner / admin / member с RLS на уровне organization_id

/db настрой realtime subscription для таблицы notifications

/db создай таблицу audit_logs: трекинг всех действий пользователей с user_id, action, metadata
```

---

## `/ui` — Premium Animated UI

**Скилл:** `premium-animated-ui`
**Роль:** World-class UI/UX + frontend engineer. Создаёт кинематографичные интерфейсы.
**Выдаёт:** Next.js / React компоненты с Tailwind, анимациями, темной темой.

**Ключевые слова-триггеры:** лендинг, компонент, страница, дашборд, hero, анимации, UI, design, красиво, премиум

**Примеры вызовов:**

```
/ui hero section для SaaS продукта: заголовок, подзаголовок, CTA кнопка, dashboard preview

/ui dashboard карточки KPI: выручка, активные пользователи, конверсия, churn rate

/ui pricing таблица: 3 тарифа, toggle monthly/annual, highlighted plan, CTA

/ui sidebar навигация с аккордеоном: иконки, active state, collapsed mode

/ui onboarding wizard: 4 шага с прогресс-баром и анимацией между шагами

/ui data table с сортировкой, фильтрами, пагинацией — generic list view

/ui modal создания новой организации с валидацией Zod + react-hook-form
```

---

## `/seo` — SEO Machine

**Скилл:** `seo-machine`
**Роль:** Full-stack SEO инженер. Генерирует все SEO артефакты за один проход.
**Выдаёт:** `seo-config.ts`, `sitemap.xml`, `robots.txt`, `llms.txt`, FAQ + схема, OG теги, structured data.

**Ключевые слова-триггеры:** SEO, meta теги, sitemap, robots.txt, llms.txt, schema markup, OG теги, поисковая оптимизация

**Примеры вызовов:**

```
/seo [ваш домен] — [описание продукта], целевая аудитория: [кто], ключи: [keywords]

/seo сгенерируй только llms.txt и llms-full.txt для [домен]

/seo добавь FAQSchema на страницу /pricing

/seo проверь и обнови sitemap — добавились новые роуты /blog и /docs

/seo добавь OG-изображения для всех публичных страниц

/seo настрой canonical URL и hreflang для мультиязычного сайта
```

---

## `/security` — Security Hardening

**Скилл:** `security-hardening`
**Роль:** Старший security engineer. Закрывает дыры в auth, API, инфраструктуре.
**Выдаёт:** Middleware код, CSP headers, rate limiting, конфиги защиты.

**Ключевые слова-триггеры:** безопасность, DDoS, brute force, уязвимость, CORS, CSP, rate limiting, JWT, MFA, webhook, secrets

**Примеры вызовов:**

```
/security настрой rate limiting на auth endpoints в Next.js proxy.ts (Supabase auth)

/security добавь CSP headers и security headers в proxy.ts

/security защита webhook от Stripe: верификация подписи

/security аудит: какие данные могут утечь через client components в нашем стеке?

/security настрой Vercel Edge Middleware для блокировки по IP / геолокации

/security MFA через TOTP: схема реализации с Supabase Auth

/security secrets rotation plan: как менять ключи без downtime
```

---

## `/ci` — GitHub Workflow

**Скилл:** `github-workflow`
**Роль:** DevOps инженер. Строит CI/CD пайплайны, автоматизацию, branch protection.
**Выдаёт:** GitHub Actions YAML, скрипты, конфигурации.

**Ключевые слова-триггеры:** CI/CD, GitHub Actions, деплой, pipeline, PR checks, branch protection, автоматизация

**Примеры вызовов:**

```
/ci создай базовый workflow: lint + typecheck + build при каждом push и PR

/ci настрой автодеплой на Vercel при merge в main, preview при PR

/ci добавь Supabase миграции в pipeline: auto-migrate staging при PR, production при merge

/ci настрой branch protection: require PR review, require CI pass, no direct push to main

/ci создай workflow release: bump version, changelog, GitHub Release при тэге v*

/ci добавь проверку secrets leaks (gitleaks) в pre-commit hook
```

---

## `/review` — Code Reviewer

**Скилл:** `code-reviewer`
**Роль:** Старший инженер. Ищет реальные проблемы — баги, уязвимости, N+1, missing RLS.
**Выдаёт:** Структурированный отчёт: Critical / Warning / Suggestion.

**Ключевые слова-триггеры:** review, проверь код, найди баги, аудит, PR review, что не так

**Примеры вызовов:**

```
/review src/app/api/invoices/route.ts

/review этот компонент — проверь на N+1, missing await, типы

/review вся папка src/features/billing/ — security audit

/review миграция 0008_add_projects.sql — RLS и индексы

/review webhook handler — CORS, auth, error handling, idempotency

# Прямо в тексте:
"Проверь этот код на безопасность: [вставить код]"
"Найди все проблемы в этом компоненте: [вставить]"
```

**Что проверяет автоматически:**
- N+1 запросы
- service_role в клиенте
- trust client user_id (использование user_id из тела запроса вместо auth.uid())
- missing await
- missing RLS
- getSession() на сервере вместо getUser()
- secrets в client components

---

## `/content` — Content Engine

**Скилл:** `content-engine`
**Роль:** SEO-копирайтер. Пишет статьи, гайды, лонгриды с keyword targeting.
**Выдаёт:** Готовые к публикации статьи с meta тегами, structured data, внутренними ссылками.

**Ключевые слова-триггеры:** статья, блог пост, гайд, контент, SEO текст, напиши про

**Примеры вызовов:**

```
/content статья "[тема]" — для блога [ваш домен], ключ: [keyword]

/content гайд "Как начать работу с [ваш продукт]" — onboarding документация

/content 5 статей для контент-плана по теме: [ваша ниша]

/content landing page copy: hero, features, pricing, FAQ, CTA
```

---

## `/copy` — Copywriter

**Скилл:** `telecom-copywriter`
**Роль:** B2B SaaS копирайтер. Пишет маркетинговые тексты, pitch decks, email-последовательности.
**Выдаёт:** Маркетинговые тексты, pitch decks, email sequences, продуктовые описания.

**Ключевые слова-триггеры:** маркетинг, копирайт, pitch, email кампания, продуктовый текст, landing page

**Примеры вызовов:**

```
/copy pitch deck для [продукт]: [описание], целевая аудитория — [кто]

/copy email sequence (5 писем) для onboarding новых пользователей

/copy one-pager для [продукт]: [описание] для [целевой аудитории]

/copy LinkedIn пост анонс запуска [продукт]

/copy case study: как клиент X достиг [результат] с помощью [продукт]

/copy white paper "[тема]" — [N] страниц для lead generation
```

---

## `/ga4` — GA4 + GTM Setup

**Скилл:** `ga4-gtm-setup`
**Роль:** Analytics инженер. Настраивает измерение конверсий, аудитории, attribution.
**Выдаёт:** GTM container JSON, GA4 event схемы, dataLayer код, conversion setup.

**Ключевые слова-триггеры:** аналитика, GA4, GTM, Google Analytics, конверсии, remarketing, tracking

**Примеры вызовов:**

```
/ga4 настрой GA4 + GTM для [домен]: конверсии — регистрация, апгрейд плана, активация

/ga4 server-side conversion tracking через Vercel Edge (CAPI)

/ga4 remarketing аудитории: посетители /pricing, не купившие за 7 дней

/ga4 ecommerce tracking для подписки: trial_start, subscription_created, churn

/ga4 настрой attribution модель для paid social → регистрация → конверсия

/ga4 GTM container: lead form submission, demo request, contact
```

---

## Быстрая шпаргалка

```
Задача                              Команда
─────────────────────────────────────────────────────
Новая таблица / схема / RLS         /db [описание]
UI компонент / страница             /ui [описание]
SEO файлы / мета / llms.txt         /seo [сайт + ключи]
Безопасность / auth / headers       /security [угроза]
CI/CD / GitHub Actions              /ci [что автоматизировать]
Проверка кода                       /review [файл или код]
SEO статья / блог                   /content [тема + ключ]
Маркетинг / pitch / email           /copy [контекст]
Аналитика / конверсии               /ga4 [цель]
Сохранить контекст сессии           /memory update
Восстановить контекст               /memory show
```

---

## Когда скилл НЕ нужен

- Общий вопрос по коду → просто спроси
- Дебаг конкретного бага → объясни симптом
- Рефакторинг одного файла → `/review` + правки
- Архитектурное решение → `/db` или описание задачи

Скилл нужен когда нужен **артефакт** (код, файл, конфиг), а не объяснение.

---

## Superpowers Workflow Skills

Local evidence-first workflow skills:

- `/verify` -> `.claude/skills/verification/SKILL.md`
- `/debug` -> `.claude/skills/systematic-debugging/SKILL.md`
- `/plan` -> `.claude/skills/implementation-plan/SKILL.md`
- `/tdd` -> `.claude/skills/test-driven-development/SKILL.md`

Use these before completion claims, debugging fixes, multi-step implementation, and behavior changes.
