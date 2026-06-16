# User Roles

## Overview

Тайное Бюро uses Supabase Auth as the current identity layer. The target admin model uses an app role field such as `profiles.role`, but the current migrations do not add that column yet. RBAC migration is intentionally deferred because auth changes require separate confirmation.

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

Authenticated user in the current Supabase scaffold. A future RBAC migration can map this to `profiles.role = 'user'`.

### Permissions

- Can manage own profile.
- Can view member-only community surfaces when enabled.
- Can submit and view own applications if the feature exposes a private status page.
- Cannot create or publish knowledge nodes.
- Cannot access admin panel.

---

## Role: Curator

### Description

Operational community role for city/event/application moderation. This is target behavior and should be implemented only after the RBAC migration is approved.

### Permissions

- Can review applications.
- Can manage bureau cities and events.
- Can create photo reports.
- Cannot change Brain knowledge unless also granted editor/admin access.

---

## Role: Editor

### Description

Editorial role for knowledge authoring and source-first content review. This is target behavior and should be implemented only after the RBAC migration is approved.

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

Blocked until the RBAC migration adds an app role column.

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';
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

Blocked until the RBAC migration adds an app role column.

```sql
UPDATE profiles SET role = 'super_admin' WHERE id = '<user-id>';
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

Admins can manage moderation tables:

```sql
-- Target policy after an approved RBAC migration adds profiles.role.
CREATE POLICY "applications_admin_all" ON public.applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```
