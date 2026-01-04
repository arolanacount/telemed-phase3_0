# Atlas Telemedicine Platform (TeleHealth)

## One-line summary

Atlas is a HIPAA-conscious telemedicine web application that provides clinician and patient management, visit scheduling, secure audio capture, transcription, and clinician-facing dashboards — built on Next.js and Supabase.

---

## Project scope (what this repo implements)

This repository contains the full-stack application and supporting tools to operate a telemedicine platform with the following capabilities:

- Multi-tenant data model (organizations, projects, memberships)
- Clinician and patient management UX and APIs
- Visit/appointment lifecycle with secure audio recording and storage
- Transcription pipeline (server-side flow integrating Replicate Whisper + parsing/summarization)
- Row-Level Security (RLS) enforced in Postgres for tenant-scoped access control
- Helper `SECURITY DEFINER` functions and RLS policies to avoid leaking data
- Private Supabase Storage buckets for PHI and signed URL generation
- Diagnostic and maintenance scripts (moved to `scripts/`)

This repo focuses on privacy-by-design and secure defaults appropriate for PHI workflows.

---

## Architecture & components

- Frontend: Next.js (App Router), Tailwind CSS for UI, pages and components under `app/` and `components/`.
- Backend: Supabase (Postgres, Auth, Storage). Server-side code calls Supabase via `@supabase/supabase-js` and communicates with external services for transcription.
- Storage: Supabase Storage with private bucket (e.g., `telehealth_audio`) — audio files are uploaded privately and served via signed URLs.
- Transcription: `/api/transcribe` (documented in `main_docs/reference_docs/transcription-and-summarization.md`) — server-side endpoint that creates a signed URL and calls an external ML service (Replicate).
- Migrations & schema: `supabase/migrations/current_schema.sql` and related schema assistance docs.

---

## Security & compliance notes (HIPAA-minded) 🔒

- Never expose the `SUPABASE_SERVICE_ROLE_KEY` in client code or public repos. Store in CI/Edge Function environment variables.
- Enable Row-Level Security (RLS) on all tenant/user-scoped tables and use `USING`/`WITH CHECK` policies to explicitly verify access.
- Use `SECURITY DEFINER` functions for membership checks, revoke execute permissions for `anon`/`authenticated` roles, and grant explicitly.
- Make storage buckets private and generate signed URLs server-side. Log signed URL issuance for auditing.
- Test and monitor slow queries (RLS predicates can change plans). Use `EXPLAIN (ANALYZE, BUFFERS)` to validate index usage.

Refer to: `main_docs/reference_docs/HIPAA_COMPLIANCE.md`, `supabase/schema_assistance.md`.

---

## Development setup (quick)

1. Copy environment template and provide secrets:

```bash
cp .env.example .env.local
# Edit .env.local and fill in keys
```

2. Install and run locally:

```bash
npm install
npm run dev
# OR (experimental) run Next with Turbopack developer server:
# - Faster incremental rebuilds in many projects
npm run dev:turbo
```

3. Open the app at: http://localhost:3000

---

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Automated Testing & Building

- **Triggers**: Runs on pushes and pull requests to `main` and `develop` branches
- **Node.js versions**: Tests against Node.js 18.x, 20.x, and 22.x
- **Checks performed**:
  - ESLint code linting
  - TypeScript type checking
  - Application build verification

### GitHub Actions Workflow

The CI pipeline is defined in `.github/workflows/ci.yml` and includes:

```yaml
- Code checkout and dependency installation
- Linting with ESLint
- Type checking with TypeScript
- Build verification
- Optional deployment (currently commented out)
```

### Setting up Repository Secrets

For the CI/CD pipeline to work properly, add these secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment (Optional)

To enable automatic deployment, uncomment the deployment section in `.github/workflows/ci.yml` and add these additional secrets:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

---



### Using Turbopack (experimental) ⚡

- Run with: `npm run dev:turbo` (this runs `next dev --turbo`).
- Notes:
  - Turbopack is an experimental, Rust-based bundler/development server designed for faster dev builds and HMR.
  - Some features or Next.js plugins may not be fully supported; if you hit issues, switch back to the standard dev server with `npm run dev`.
  - Test key flows (file uploads, CSS/Tailwind, and server-side behavior) after enabling Turbopack to ensure nothing is broken.

---

---

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

**Required environment variables:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

**Optional environment variables:**

- `REPLICATE_API_KEY` - For AI transcription services
- `OPENAI_API_KEY` - Alternative to Replicate for transcription
- `REDIS_URL` - For caching (not implemented yet)
- `STORAGE_BUCKET` - Supabase storage bucket name (e.g., `telehealth_audio`)
- `TWILIO_*` - Twilio configuration for SMS/WhatsApp features

**⚠️ Security Note**: Never commit `.env.local` or any file containing real API keys to version control.

---

## Useful scripts (diagnostics & maintenance)

Scripts are stored in `scripts/` and are intended for local diagnostics and maintenance (not runtime):

- `node scripts/test-supabase-connection.js` — verify connectivity and basic RPC
- `node scripts/test-db-state.js` — inspect key tables (clinicians, patients)
- `node scripts/get-db-url.js` — helper to find DB host/connectivity
- `node scripts/check-auth-status.js` — test anonymous/auth access for debug

If you want, I can add npm short-hands for these (e.g., `npm run test:supabase`).

---

## Schema & migrations

- Schema files and current SQL are under `supabase/migrations/`.
- Make non-destructive migration templates and validate with your staging project before applying to production.
- Use `EXPLAIN ANALYZE` on representative queries and add indexes for RLS predicates as required.

---

## Contributing & development guidelines

- Add non-runtime helper scripts to `scripts/` (keep project root clean).
- Follow RLS best-practices: explicit `TO authenticated` policies, wrap `auth.uid()` as `(SELECT auth.uid())`, and prefer `EXISTS(...)` lookups or `SECURITY DEFINER` functions.
- Keep secrets out of git; use `.env.local` or CI secret stores.
- Document architectural changes in `main_docs/` and keep the OpenAPI spec (`main_docs/openapi.yaml`) up to date for external integrations.

---

## Where to look for more detail

- Security/RLS guidance: `supabase/schema_assistance.md`
- Transcription & summarization workflow: `main_docs/reference_docs/transcription-and-summarization.md`
- HIPAA notes & compliance checklist: `main_docs/reference_docs/HIPAA_COMPLIANCE.md`
- Implementation plan and feature list: `main_docs/IMPLEMENTATION_PLAN.md`
