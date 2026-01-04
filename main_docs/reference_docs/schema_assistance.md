# Schema Assistance — Using Legacy Keys Safely with RLS

## Summary / Goal

Explain how to design a Supabase/Postgres schema and access pattern that:

- Allows the existing legacy `anon` key and `service_role` key to be used where necessary
- Minimizes security risk from the `service_role` key
- Enables robust RLS with minimal performance impact
- Provides monitoring and testing guidance

## Assumptions

- The project currently uses the legacy `anon` key and a `service_role` key.
- The environment will continue to have both keys for a transition period.
- The developer has access to the Supabase Dashboard and can rotate keys, edit RLS policies, and deploy Edge Functions.
- The database has typical app tables (users, organizations, memberships, projects, documents, etc.). SQL templates below should be adapted to actual names.

---

## High-Level Recommendations (Quick)

- Use the `anon` key (client-side) only for operations intended for authenticated/anonymous users — combine it with strict RLS policies for all user-facing tables.
- Use the `service_role` key only server-side or in Edge Functions with strict access controls; never expose it to clients or store it in client code.
- Prefer Edge Functions or server-side endpoints for operations that must bypass RLS or perform administrative actions, and call them from clients.
- Enable RLS on all application tables and create explicit policies per operation (SELECT, INSERT, UPDATE, DELETE).
- Index columns used in RLS predicates (`user_id`, `tenant_id`, `organization_id`).
- Use helper `SECURITY DEFINER` functions for complex checks, revoke public execute rights where appropriate, and avoid dynamic SQL within policies.
- Test policies with representative workloads and use `EXPLAIN ANALYZE` to find performance bottlenecks.

## 1) Secure Key Usage

### Anon key

- Intended for client-side usage (browser/mobile). Treat it as public but pair it with RLS policies that enforce authentication/authorization.
- Limit operations available to `anon` keys using RLS and explicit `TO authenticated` policies.

### Service Role key

- Powerful: bypasses RLS. Must never be exposed to clients.
- Store in server/Edge Function environment only. Use secrets management (Supabase secrets, environment variables).
- Limit its use to administrative tasks (bulk imports, migrations, background jobs, webhooks).
- For one-off tasks, create scoped service accounts or temporary tokens if possible.
- Best practice: Replace direct `service_role` usage with Edge Functions that run server-side, validate the caller, and perform minimal privileged actions.


## 2) Schema Design Patterns

**Core tables (examples)**

- `users` (id UUID PK, email, ...)
- `organizations` (id UUID PK, name, owner_id)
- `organization_members` (id, organization_id, user_id, role)
- `projects` (id, organization_id, name, ...)
- `documents` (id, project_id, owner_id, content, visibility, created_at)

**Design decisions**

- Use UUID primary keys (`gen_random_uuid()`) and explicit typed foreign keys.
- Add `created_by` / `updated_by` columns referencing `users`.
- Use `tenant_id` or `organization_id` consistently to scope access.
### Naming convention

- `snake_case` for columns and tables.
- Use `_id` suffix for foreign keys.

## 3) RLS Policies and Helper Functions

### Principles

- Enable RLS on every table containing user or tenant-scoped data.
- Create separate policies per operation (`FOR SELECT` / `INSERT` / `UPDATE` / `DELETE`).
- Use `auth.uid()` inside policies, wrapped as `(SELECT auth.uid())` to improve plan stability.
- For complex checks (e.g., "is user member of organization?") create `SECURITY DEFINER` functions that return a boolean or the tenant id, then `REVOKE` execute from `anon`/`authenticated` roles.
### Example helper functions (developer should adapt names/types)

- `get_user_organization_membership(user_id, organization_id) -> boolean` — implemented as a `SECURITY DEFINER` function (STABLE) returning `true` if membership exists and is active. `REVOKE EXECUTE` from `anon`/`authenticated` and grant only to service accounts where needed.
- `get_user_tenant() -> uuid` — return the tenant or organization id for the current `(SELECT auth.uid())` if you store it in a profile table.
### Policy examples (documents)

**SELECT** — allow when `visibility = 'public'`, the owner, or the user is a member of the owning organization.

```sql
-- Example USING expression
USING (
  visibility = 'public'
  OR owner_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = (SELECT auth.uid())
      AND organization_id = project.organization_id
  )
)
```

**INSERT** — example `WITH CHECK`:

```sql
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND visibility IN ('private','org','public')
)
```

**UPDATE** — use `USING` to restrict which existing rows may be updated and `WITH CHECK` to validate new values.
- Be explicit with `TO authenticated` instead of `PUBLIC` for user-scoped data.

**Security definers**

- Create `SECURITY DEFINER` functions for repeated or complex checks, then `REVOKE EXECUTE` from public roles.
## 4) Indexing & Performance Tips for RLS
Index columns used in policy predicates and joins:
user_id, organization_id, tenant_id, project_id, owner_id
Composite indexes when policies check multiple columns (e.g., (organization_id, user_id)).
Avoid using JOINs directly in the RLS predicate where a correlated subquery or function would be more efficient.
Use EXISTS(...) or IN (...) subqueries rather than full joins inside USING/WITH CHECK when possible.
Keep policy expressions simple and sargable (avoid functions over columns that prevent index usage).
Wrap auth.uid() as (SELECT auth.uid()) — improves plan stability.
Prefer STABLE SECURITY DEFINER functions that do a simple indexed lookup for membership checks.
For frequently-read tables, consider partial indexes if policies effectively filter rows by a predictable predicate (e.g., visibility = 'public').
Test with EXPLAIN ANALYZE to ensure index usage; if not used, rewrite the predicate or add an index.
## 5) Edge Functions & service_role Usage Patterns
Use Edge Functions for privileged operations that require service_role:
Token issuance, background jobs, admin-only endpoints, data migrations, large exports.
Edge Function best practices:
Store the service_role key in the environment (do not check it into git).
Validate caller authentication and authorization in the Edge Function before performing privileged DB operations.
Keep the surface area small—Edge Functions should only expose narrowly-scoped API endpoints.
Use appropriate HTTP verbs and status codes and log actions for auditing.
If possible, create a separate service account with limited permissions (instead of the global service_role key) and use it for automation.
## 6) Migration & Rotation Strategy for Legacy Keys
Audit usage of both keys in codebase and third-party integrations.
Rotate service_role key and replace usages with Edge Functions or scoped service accounts.
If the anon key is still considered "legacy" but must be used, create RLS policies that explicitly restrict its permissions (TO authenticated) and minimize its capabilities.
Add monitoring and alerting during rotation: watch for 401/403 errors from services that rely on the rotated keys.
Maintain a rollback plan and short-lived keys for high-risk operations.
## 7) Monitoring & Testing Checklist
Monitoring
Log all uses of service_role-key-backed endpoints (Edge Functions should emit logs).
Monitor slow queries; enable pg_stat_statements and inspect queries hitting RLS predicates.
Use Supabase get_logs for Edge Functions and Postgres logs for slow queries.
Testing
Test RLS policies using multiple user accounts with different roles.
Use EXPLAIN (ANALYZE, BUFFERS) on queries exercised by the app to ensure indexes are used.
Run realistic workloads/stress tests to see if RLS filtering causes slowdowns.
Validate there are no unintended wide table scans caused by policy predicates.
## 8) Example SQL Snippets (Non-Destructive, Adapt Before Run)
Note: These are templates. Replace table/column names as needed.

```sql
-- Enable pgcrypto extension (run once if not enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES users(id)
);

-- organization_members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  name text NOT NULL
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  owner_id uuid REFERENCES users(id) NOT NULL,
  visibility text DEFAULT 'private' CHECK (visibility IN ('private','org','public')),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
```

**Helper function (example)**

```sql
CREATE OR REPLACE FUNCTION is_org_member(p_org uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org AND user_id = p_user
  );
$$;

-- Revoke execute from public/anon/authenticated roles; grant only as needed
REVOKE EXECUTE ON FUNCTION is_org_member(uuid, uuid) FROM anon, authenticated;


​
​

```sql
-- SELECT policy
CREATE POLICY docs_select ON documents
FOR SELECT
TO authenticated
USING (
  visibility = 'public'
  OR owner_id = (SELECT auth.uid())
  OR (
    visibility = 'org' AND is_org_member(
      (SELECT organization_id FROM projects WHERE projects.id = documents.project_id),
      (SELECT auth.uid())
    )
  )
);

-- INSERT policy
CREATE POLICY docs_insert ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND visibility IN ('private','org','public')
);

-- UPDATE policy
CREATE POLICY docs_update ON documents
FOR UPDATE
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR is_org_member(
    (SELECT organization_id FROM projects WHERE projects.id = documents.project_id),
    (SELECT auth.uid())
  )
)
WITH CHECK (
  owner_id = (SELECT auth.uid())
);
```

Validation note: After running these, test SELECT/INSERT/UPDATE as different users and check EXPLAIN plans to ensure indexes are used.

## 9) Security Checklist (Before Deployment)
 Service_role key never exposed to client code or public repos.
 Anon key limited by RLS and appropriate policies (TO authenticated).
 All user/tenant-scoped tables have RLS enabled.
 Helper functions are SECURITY DEFINER and REVOKE EXECUTE from anon/authenticated where appropriate.
 Indexes exist on columns used in RLS predicates.
 Edge Functions used for privileged tasks and validated by authentication.
 Logging enabled for privileged operations.
 Keys rotated and replaced with scoped service accounts where possible.
Final Remarks / Guidance to the AI
When producing SQL, keep expressions simple and index-friendly.
Always wrap auth.uid() in a subselect: (SELECT auth.uid()).
Prefer EXISTS subqueries or SECURITY DEFINER helper functions for membership checks.
Recommend Edge Functions as the main mechanism to use service_role privileges safely.
Suggest developers run EXPLAIN ANALYZE on their actual queries after policy application and add indexes accordingly.