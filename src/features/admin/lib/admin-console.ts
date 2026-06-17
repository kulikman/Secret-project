import { ROUTES, type AppRoute } from "@/lib/constants";

type AdminStatus = "available" | "blocked" | "planned" | "ready";

interface AdminNavItem {
  href: AppRoute;
  label: string;
  description: string;
}

interface AdminOverviewMetric {
  label: string;
  value: string;
  note: string;
  tone: "amber" | "emerald" | "rose" | "stone";
}

interface AdminWorkstream {
  href: AppRoute;
  title: string;
  summary: string;
  status: AdminStatus;
  bullets: readonly string[];
}

interface AdminSectionDetail {
  title: string;
  eyebrow: string;
  summary: string;
  status: AdminStatus;
  capabilities: readonly string[];
  settings: readonly string[];
  dependencies: readonly string[];
  nextActions: readonly string[];
}

interface AdminRole {
  role: string;
  scope: string;
  canDo: readonly string[];
}

interface CabinetItem {
  title: string;
  description: string;
}

export const adminNavItems = [
  {
    href: ROUTES.admin,
    label: "Пульт",
    description: "Общий обзор, зависимости и риски.",
  },
  {
    href: ROUTES.adminApplications,
    label: "Заявки",
    description: "Регистрация людей и модерация вступления.",
  },
  {
    href: ROUTES.adminPresentations,
    label: "PDF-презентации",
    description: "Сгенерированные материалы, промпты и версии.",
  },
  {
    href: ROUTES.adminApi,
    label: "API",
    description: "Подключения, статусы сервисов и лимиты.",
  },
  {
    href: ROUTES.adminCommunity,
    label: "Сообщество",
    description: "Кабинет участника, города, события и доступы.",
  },
  {
    href: ROUTES.adminKnowledge,
    label: "Знания",
    description: "Brain, источники, ingest, review и projection.",
  },
  {
    href: ROUTES.adminSettings,
    label: "Настройки",
    description: "Роли, аудит, промпты, политики и флаги.",
  },
] as const satisfies readonly AdminNavItem[];

export const adminOverviewMetrics = [
  {
    label: "Безопасность",
    value: "RBAC gate",
    note: "Админка требует admin_role_assignments; большинство write actions ещё не подключено.",
    tone: "amber",
  },
  {
    label: "Заявки",
    value: "moderation",
    note: "Public submit, rate limit, список и audited status transition подключены.",
    tone: "emerald",
  },
  {
    label: "Презентации",
    value: "PDF",
    note: "Не PPTX: нужен PDF export и админ-редактор промпта.",
    tone: "emerald",
  },
  {
    label: "Brain",
    value: "blocked",
    note: "Нужны live project/token и deployed C1-C10 contracts.",
    tone: "rose",
  },
] as const satisfies readonly AdminOverviewMetric[];

export const adminWorkstreams = [
  {
    href: ROUTES.adminApplications,
    title: "Регистрация людей",
    summary: "Очередь заявок, статусы, заметки куратора, история решений.",
    status: "ready",
    bullets: [
      "Фильтры по статусу, городу, событию, выбранной теме и дате.",
      "Статусы: new, in_review, approved, rejected, waitlisted.",
      "Status transition меняет reviewer/reviewed_at и пишет audit log.",
    ],
  },
  {
    href: ROUTES.adminPresentations,
    title: "Сгенерированные PDF-презентации",
    summary: "Реестр PDF, версии, source_refs и редактируемый промпт.",
    status: "planned",
    bullets: [
      "Промпт презентации редактируется в админке и версионируется.",
      "Каждый слайд обязан иметь source_refs перед публикацией.",
      "Экспорт только PDF для MVP, без PPTX-пайплайна.",
    ],
  },
  {
    href: ROUTES.adminApi,
    title: "API и интеграции",
    summary: "Статусы Brain, Supabase, Resend, Vercel, аналитики и webhooks.",
    status: "planned",
    bullets: [
      "Показывать только masked ключи и readiness, не значения секретов.",
      "Логи ошибок, retry-состояния webhooks и rate limit counters.",
      "Разделить user API keys и internal service credentials.",
    ],
  },
  {
    href: ROUTES.adminCommunity,
    title: "Кабинет участника",
    summary: "Профиль, заявка, мероприятия, сохраненные темы и материалы.",
    status: "planned",
    bullets: [
      "Показывать статус заявки и доступные действия участника.",
      "События, города бюро, уведомления и privacy preferences.",
      "Доступ к опубликованным PDF и материалам сообщества.",
    ],
  },
  {
    href: ROUTES.adminKnowledge,
    title: "Knowledge Ops",
    summary: "Brain authoring, ingest/review, merge и manual republish.",
    status: "blocked",
    bullets: [
      "Публичные страницы читают projection, не live Brain.",
      "Ingest работает только после deployed source_studies_archive profile.",
      "Manual republish должен писать audit log и source_refs.",
    ],
  },
  {
    href: ROUTES.adminSettings,
    title: "Админ-настройки",
    summary: "RBAC, prompt templates, feature flags, legal и backups.",
    status: "planned",
    bullets: [
      "Роли: super_admin, admin, editor, curator, support, viewer.",
      "Prompt templates: presentation_pdf, dossier, speech.",
      "Экспорт, резервные копии, журнал аудита и политики контента.",
    ],
  },
] as const satisfies readonly AdminWorkstream[];

export const adminSectionDetails = {
  applications: {
    title: "Регистрация людей и заявки",
    eyebrow: "community intake",
    summary: "Операционный центр для входящих заявок в сообщество, событий и городов Тайного Бюро.",
    status: "ready",
    capabilities: [
      "Просмотр карточки заявки: имя, email, Telegram, город, событие, мотивация, выбранная тема.",
      "Фильтр по статусу; backend helper уже поддерживает город, событие, тему и период.",
      "Статусный pipeline: new, in_review, approved, rejected, waitlisted.",
      "Причина решения сохраняется в audit metadata; заметки куратора требуют будущего schema решения.",
      "Уведомления участнику после решения через email/Telegram-интеграцию, когда она будет подключена.",
      "CSV export для ручной сверки и offline-операций.",
    ],
    settings: [
      "Шаблоны писем для approved/rejected/waitlisted.",
      "Rate limit и антиспам-правила для публичной формы.",
      "Обязательные согласия: privacy, communications, photo/video consent.",
    ],
    dependencies: [
      "RBAC и RLS-политики для curator/admin/super_admin уже добавлены.",
      "Audit log уже подключен для изменения статусов.",
      "Подключенный Supabase project с примененными migrations.",
    ],
    nextActions: [
      "Добавить уведомления после Resend/notification setup.",
      "Решить, нужны ли curator notes, assigned curator и follow-up date в схеме.",
      "Описать retention policy для заявок и персональных данных.",
    ],
  },
  presentations: {
    title: "PDF-презентации и промпты",
    eyebrow: "ai content",
    summary:
      "Реестр сгенерированных PDF-презентаций, версий, source_refs и админ-редактора промптов.",
    status: "planned",
    capabilities: [
      "Список презентаций: тема, статус, версия, дата генерации, автор, качество source_refs.",
      "Просмотр структуры: слайды, speaker notes, источники на каждом слайде.",
      "Редактируемый промпт `presentation_pdf` прямо в админке с версионированием.",
      "Regenerate flow: новая draft-версия связана с parent_version.",
      "Export/download PDF и история экспортов.",
      "Блокировка публикации, если хотя бы один слайд не имеет source_refs.",
    ],
    settings: [
      "Prompt template, system instructions, tone, slide count, visual style.",
      "PDF renderer configuration и storage bucket для артефактов.",
      "Лимиты генерации, retry policy и cost caps.",
    ],
    dependencies: [
      "Выбор model/provider и безопасное хранение API keys в env/Vercel.",
      "`ai_prompt_templates` уже есть; audited editor action ещё не реализован.",
      "PDF renderer/export pipeline; PPTX не входит в MVP.",
    ],
    nextActions: [
      "Собрать prompt editor server action с role check и audit log.",
      "Выбрать PDF renderer и storage strategy.",
      "Собрать first-pass generate-presentation server action с source-first validator.",
    ],
  },
  api: {
    title: "API и подключения",
    eyebrow: "integrations",
    summary: "Единый экран состояния внешних сервисов и внутренних API без раскрытия секретов.",
    status: "planned",
    capabilities: [
      "Readiness cards для Brain, Supabase, Resend, Vercel, PostHog и Sentry.",
      "Masked status API keys: configured/missing/rotating, но никогда не raw value.",
      "Webhook delivery health, retries, last success/error and dead-letter queue notes.",
      "User API keys отдельно от service credentials: owner, prefix, last_used_at, expires_at.",
      "Rate limits, usage counters и error budget для AI/API операций.",
    ],
    settings: [
      "Webhook URLs и expected event types.",
      "Rate limit thresholds по public, authenticated, admin и internal routes.",
      "Alert channels for errors, failed exports and Brain outage.",
    ],
    dependencies: [
      "Secrets остаются только в `.env.local`/Vercel env и не показываются в UI.",
      "Health/readiness endpoints для сервисов.",
      "Audit events for key rotation and integration changes.",
    ],
    nextActions: [
      "Добавить read-only readiness helpers без чтения secret values.",
      "Свести существующие `api_keys` в отдельную user-facing секцию.",
      "Описать rotation runbook для Brain/model/provider keys.",
    ],
  },
  community: {
    title: "Кабинет участника сообщества",
    eyebrow: "member cabinet",
    summary: "То, что видит зарегистрированный участник: профиль, заявка, мероприятия и материалы.",
    status: "planned",
    capabilities: [
      "Профиль участника: имя, контакты, Telegram, город, интересы, согласия.",
      "Статус заявки и история коммуникации: new, in_review, approved, rejected, waitlisted.",
      "Мероприятия: регистрация, посещения, QR/check-in в будущем.",
      "Сохраненные темы архива, подборки и доступные PDF-презентации.",
      "Уведомления, digest preferences, privacy controls и export/delete request.",
    ],
    settings: [
      "Community visibility: public/private profile fields.",
      "Notification channels and consent text.",
      "Access tiers for materials and closed events.",
    ],
    dependencies: [
      "Связь `profiles` с community membership state.",
      "RLS для участника: видеть только свои заявки и разрешенные материалы.",
      "Email/notification templates after Resend setup.",
    ],
    nextActions: [
      "Согласовать модель member_status и city/event registration.",
      "Добавить read-only cabinet sections в `/dashboard` после schema approval.",
      "Проверить, что rejected/waitlisted пользователи не получают закрытый контент.",
    ],
  },
  knowledge: {
    title: "Knowledge Ops и Brain",
    eyebrow: "archive operations",
    summary:
      "Редакторская зона для источников, тем, claims, ingest/review и ручной публикации projection.",
    status: "blocked",
    capabilities: [
      "Создание и редактирование topic/source/claim через server-only Brain adapter.",
      "Ingest источников с профилем `source_studies_archive` и review queue.",
      "Merge duplicates, intersections, neighbors and graph subset preview.",
      "Manual republish в `node_projection` с проверкой source_refs.",
      "Projection health: stale rows, unpublished changes, broken source links.",
    ],
    settings: [
      "Default Brain project slug/id for Тайное Бюро.",
      "Ingest profiles and allowed source types.",
      "Editorial policy: what can be published and what must stay internal.",
    ],
    dependencies: [
      "Live Brain project/token are not confirmed yet.",
      "Local Brain C1-C10 contracts must be deployed/versioned.",
      "Domain server actions must use admin role checks and audit logs before mutations.",
    ],
    nextActions: [
      "Confirm `secret-bureau-public-archive` Brain project and scoped token.",
      "Wire deployed Brain C1-C10 contracts into `src/lib/brain` adapter.",
      "Build review/republish actions after RBAC approval.",
    ],
  },
  settings: {
    title: "Настройки админки",
    eyebrow: "control plane",
    summary: "Системные настройки: роли, аудит, промпты, флаги, legal, backup/export и политики.",
    status: "planned",
    capabilities: [
      "Role matrix: super_admin, admin, editor, curator, support, viewer.",
      "Prompt templates for `presentation_pdf`, dossiers and speech assets.",
      "Audit log explorer with actor, action, entity, before/after and request id.",
      "Feature flags for PDF generation, public map, applications and community cabinet.",
      "Content/legal settings: consent texts, privacy links, disclaimers.",
      "Backup/export controls and incident mode toggles.",
    ],
    settings: [
      "Admin invite policy and emergency access policy.",
      "Source-first publishing rules.",
      "Data retention periods for applications, logs and generated artifacts.",
    ],
    dependencies: [
      "Domain-specific write actions with audit logs.",
      "Existing audit helper wired to every admin mutation.",
      "Operational owner for backups, incidents and key rotation.",
    ],
    nextActions: [
      "Use `requireAdminRole()` before adding write actions.",
      "Wire `ai_prompt_templates` editor only after prompt ownership is agreed.",
      "Document incident and rollback procedures before production.",
    ],
  },
} as const satisfies Record<string, AdminSectionDetail>;

export const adminRoleMatrix = [
  {
    role: "super_admin",
    scope: "Полный системный доступ.",
    canDo: ["Управлять ролями", "Менять интеграции", "Включать incident mode"],
  },
  {
    role: "admin",
    scope: "Операционное управление продуктом.",
    canDo: ["Модерировать заявки", "Публиковать события", "Запускать генерацию"],
  },
  {
    role: "editor",
    scope: "Знания, источники и AI-контент.",
    canDo: ["Редактировать темы", "Проверять source_refs", "Запускать republish"],
  },
  {
    role: "curator",
    scope: "Сообщество, города и события.",
    canDo: ["Разбирать заявки", "Вести заметки", "Подтверждать участие"],
  },
  {
    role: "support",
    scope: "Помощь участникам без доступа к системным настройкам.",
    canDo: ["Видеть обращения", "Обновлять коммуникационный статус"],
  },
  {
    role: "viewer",
    scope: "Read-only наблюдение.",
    canDo: ["Смотреть отчеты", "Проверять статусы без мутаций"],
  },
] as const satisfies readonly AdminRole[];

export const communityCabinetScope = [
  {
    title: "Профиль и согласия",
    description: "Контакты, город, интересы, privacy/photo/video consent и настройки связи.",
  },
  {
    title: "Статус заявки",
    description: "Текущий этап, история коммуникации и следующие шаги для участника.",
  },
  {
    title: "События и города",
    description: "Регистрация на события, выбранный город бюро и будущий check-in.",
  },
  {
    title: "Материалы",
    description: "Сохраненные темы, опубликованные PDF-презентации и закрытые подборки.",
  },
  {
    title: "Уведомления",
    description: "Digest, приглашения, системные сообщения и privacy controls.",
  },
] as const satisfies readonly CabinetItem[];

export const adminForgottenChecklist = [
  "RBAC/RLS: кто именно имеет право видеть персональные данные и менять статусы.",
  "Audit log: кто, когда и почему изменил заявку, промпт, публикацию или интеграцию.",
  "Prompt versioning: промпт презентации редактируется, но старые генерации должны знать версию.",
  "Consent/legal: privacy, рассылки, фото/видео, удаление данных и экспорт данных участника.",
  "Source-first gate: PDF и досье нельзя публиковать без источников на уровне блока/слайда.",
  "Incident mode: быстро выключить генерацию, ingest или публичные заявки при сбое.",
  "Cost controls: лимиты генерации, rate limits, бюджет модели, retry policy.",
  "Backups/export: заявки, участники, prompt templates, generated artifacts and audit logs.",
  "Observability: ошибки, latency, failed jobs, webhook retries, Brain outage visibility.",
  "Search/filtering: без нормального поиска админка быстро станет кладовкой с фонариком.",
] as const;
