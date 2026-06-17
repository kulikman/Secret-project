# User Roles

## Overview

Тайное Бюро uses Supabase Auth as the identity layer. Admin roles are stored in
`admin_role_assignments` instead of `profiles` so the globally readable profile
table does not expose role assignments or allow profile self-update policies to
become privilege escalation paths.

RLS policies must enforce database boundaries; UI checks are convenience only.

---

## Role: Guest

### Description

Any unauthenticated visitor.

### Permissions

- Can view public landing/archive pages.
- Can view published topics, sources, events, and bureau city pages.
- Can submit public application forms when enabled.
- Cannot access dashboard, settings, or admin routes.

---

## Role: Member

### Description

Authenticated user in the current Supabase scaffold. Members have no row in
`admin_role_assignments` by default.

### Permissions

- Can manage own profile.
- Can view member-only community surfaces when enabled.
- Can submit and view own applications if the feature exposes a private status page.
- Cannot create or publish knowledge nodes.
- Cannot access admin panel.

---

## Role: Curator

### Description

Operational community role for city/event/application moderation. The role can
read moderation data after RBAC assignment; write actions still require audited
server actions.

### Permissions

- Can review applications.
- Can manage bureau cities and events.
- Can create photo reports.
- Cannot change Brain knowledge unless also granted editor/admin access.

---

## Role: Editor

### Description

Editorial role for knowledge authoring and source-first content review. The role
can read AI content/prompt templates after RBAC assignment; write actions still
require audited server actions.

### Permissions

- Can create/update knowledge through admin routes.
- Can run manual republish.
- Can review ingest output.
- Can generate dossiers/presentations.
- Cannot manage system-wide settings or admin roles.

---

## Role: Admin

### Description

Internal operator with access to editorial and community administration.

### Permissions

- Can perform curator and editor actions.
- Can view audit logs.
- Can manage users where allowed by policy.
- Cannot change super-admin-only settings.

### How to assign

Use trusted service-role SQL or a future super-admin-only role assignment action.
Do not expose role assignment to client code.

```sql
INSERT INTO public.admin_role_assignments (user_id, role, reason)
VALUES ('<user-id>', 'admin', 'manual bootstrap')
ON CONFLICT (user_id)
DO UPDATE SET role = excluded.role, reason = excluded.reason;
```

---

## Role: Super Admin

### Description

Project owner with full system access.

### Permissions

- All admin permissions.
- Can assign admin roles.
- Can perform critical maintenance operations.
- Can access all app-owned data through approved admin surfaces.

### How to assign

Use trusted service-role SQL or a future owner-only bootstrap action.

```sql
INSERT INTO public.admin_role_assignments (user_id, role, reason)
VALUES ('<user-id>', 'super_admin', 'owner bootstrap')
ON CONFLICT (user_id)
DO UPDATE SET role = excluded.role, reason = excluded.reason;
```

---

## Permission Matrix

| Feature                     | Guest | Member | Curator | Editor | Admin | Super Admin |
| --------------------------- | :---: | :----: | :-----: | :----: | :---: | :---------: |
| View public archive         |  ✅   |   ✅   |   ✅    |   ✅   |  ✅   |     ✅      |
| Submit application          |  ✅   |   ✅   |   ✅    |   ✅   |  ✅   |     ✅      |
| Own profile                 |  ❌   |   ✅   |   ✅    |   ✅   |  ✅   |     ✅      |
| Manage applications         |  ❌   |   ❌   |   ✅    |   ❌   |  ✅   |     ✅      |
| Manage cities/events        |  ❌   |   ❌   |   ✅    |   ❌   |  ✅   |     ✅      |
| Create/update Brain nodes   |  ❌   |   ❌   |   ❌    |   ✅   |  ✅   |     ✅      |
| Manual republish            |  ❌   |   ❌   |   ❌    |   ✅   |  ✅   |     ✅      |
| Generate dossiers/slides    |  ❌   |   ❌   |   ❌    |   ✅   |  ✅   |     ✅      |
| View audit logs             |  ❌   |   ❌   |   ❌    |   ❌   |  ✅   |     ✅      |
| Manage admin roles/settings |  ❌   |   ❌   |   ❌    |   ❌   |  ❌   |     ✅      |

---

## RLS Patterns

Public published projection rows can be read by anyone:

```sql
CREATE POLICY "node_projection_public_read" ON public.node_projection
  FOR SELECT USING (status = 'published');
```

Users can read their own application rows:

```sql
CREATE POLICY "applications_owner_read" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);
```

Admins can read moderation tables. Mutations should still go through audited
server actions:

```sql
CREATE POLICY "Curators can read applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_role_assignments
      WHERE user_id = auth.uid()
        AND role IN ('curator', 'admin', 'super_admin')
    )
  );
```
