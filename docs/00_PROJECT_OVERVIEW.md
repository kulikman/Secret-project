# Project Overview

## Project Name

Тайное Бюро

## One-line Description

Публичный исследовательский архив, карта knowledge-связей и закрытое сообщество под одним фронтендом.

## Project Type

- [x] Web Platform
- [x] Knowledge Archive
- [x] Community Platform
- [x] AI-assisted Editorial Tool
- [ ] Marketplace
- [ ] Internal-only Tool
- [ ] API Product

## Main Goal

Запустить надежный публичный портал Тайного Бюро, где проверенные темы, источники и связи публикуются из App DB projection, а админская работа с knowledge-графом идет через Brain.

## Target Users

- Публичные читатели и исследователи: изучают темы, источники и связи.
- Редакторы и кураторы: создают, проверяют и публикуют knowledge-материалы.
- Администраторы: управляют публикацией, ingest, сообществом и модерацией заявок.
- Участники сообщества: смотрят города/события и подают заявки на участие.

## Core Value

Тайное Бюро соединяет source-first архив, граф связей и community-модуль так, чтобы публичные страницы оставались быстрыми и доступными даже при деградации Brain.

## Current Stage

- [ ] Idea
- [ ] Prototype
- [x] MVP Foundation
- [ ] Beta
- [ ] Production
- [ ] Scaling

---

## Tech Stack

| Layer             | Choice                                 |
| ----------------- | -------------------------------------- |
| Framework         | Next.js 16 App Router                  |
| Language          | TypeScript strict                      |
| Styling           | Tailwind CSS v4                        |
| UI Primitives     | shadcn/ui + radix-ui                   |
| App DB/Auth       | Supabase Postgres + Supabase Auth      |
| Knowledge Backend | Elaurion Brain via server-only adapter |
| Email Scaffold    | Resend + React Email                   |
| Analytics         | PostHog                                |
| Deployment        | Vercel                                 |
| Package Manager   | pnpm 10                                |

---

## Important Links

| Resource       | URL                                        |
| -------------- | ------------------------------------------ |
| Repository     | https://github.com/kulikman/Secret-project |
| Local app      | http://localhost:3000                      |
| Production     | TBD                                        |
| Staging        | TBD                                        |
| Supabase       | TBD                                        |
| Brain project  | `secret-bureau-public-archive` recommended |
| Vercel project | TBD                                        |

---

## Team

| Role                 | Owner                        |
| -------------------- | ---------------------------- |
| Product Owner        | Anton                        |
| Technical Lead Agent | Codex                        |
| Brain Owner          | External Brain project owner |
| Editors / Curators   | TBD                          |
