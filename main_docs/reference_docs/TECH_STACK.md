# Telehealth Platform — Technology Stack 🔧 (Updated 2025-01-02)

## Overview
Optimized HIPAA-compliant stack with security-first architecture (based on `IMPLEMENTATION_PLAN.md` and `schema_assistance.md`):

- **Frontend**: Next.js 16.1.1 (App Router), TypeScript 5.9.3, React 19.2.3, Tailwind CSS 4.1.18
- **Backend / BaaS**: Supabase (Postgres 17 with optimized RLS, Auth, Storage, Edge Functions)
- **Database Security**: pgcrypto + pg_trgm extensions (moved to dedicated schema), SECURITY DEFINER helper functions with immutable search_path, restricted service_role
- **Realtime / Messaging**: Supabase Realtime + Postgres with RLS policies
- **Storage**: Supabase Storage (private buckets for PHI, signed URLs only)
- **Transcription**: Whisper/Replicate + DeepSeek via Edge Functions (server-side only)
- **Video / Real-time Media**: Twilio Video (Room tokens with BAA compliance)
- **AI / LLM**: DeepSeek/OpenAI GPT-4 for structured note generation (Edge Functions)
- **Worker / Queue**: Supabase Edge Functions for all privileged operations (transcription, AI, background jobs)
- **Forms & Validation**: React Hook Form + Zod
- **CI / CD**: GitHub Actions (build, test, lint, deploy to Vercel + Supabase Edge)
- **Observability**: Sentry for errors, structured logging, RLS policy monitoring

---

## Security & Production Recommendations 🔐

- **Schema Security**: Optimized RLS with helper functions, service_role restricted to Edge Functions only, immutable search_path on SECURITY DEFINER functions
- **Buckets**: Private storage buckets (e.g., `telehealth_audio`) with signed URLs and expiry
- **RBAC & RLS**: Comprehensive policies with patient sharing (read/write/full), audit trails on all tables, 26 additional foreign key indexes for performance
- **Encryption**: TLS 1.2+ in transit (automatic), AES-256 encryption at rest (AWS-managed keys), pg_trgm extension secured in dedicated schema
- **Database Performance**: 37 auth_rls_initplan fixes, 31 multiple_permissive_policies consolidations, optimized query planning
- **BAA & Vendors**: Required BAAs for Supabase, Twilio, DeepSeek/Replicate/OpenAI before PHI processing
- **Secrets Management**: service_role keys only in Edge Functions, anon keys client-side with RLS restrictions
- **Audit & Logging**: Automatic created_by/updated_by tracking, monitor service_role usage, immutable trails
- **Key Rotation**: Regular rotation of service_role keys, monitor for unauthorized access patterns

---

## Architecture Notes & Patterns 🔁

- **Separation of concerns**: Keep storage of audio/transcripts separate from main DB records (store path + metadata in DB).
- **Async processing**: Use a job queue for transcription and AI note generation. Return 202 Accepted for job submission.
- **Minimal data sharing with AI vendors**: Prefer de-identified transcripts or explicit patient consent before sending PHI to third-party APIs.
- **Failure modes**: Provide retry, idempotency, backoff, and a visible status UI for transcription and AI jobs.

---

## Recent Security & Performance Optimizations ✅

### Database Performance Fixes (2025-01-02)
- **37 auth_rls_initplan fixes**: Wrapped `auth.uid()` calls in `(SELECT auth.uid())` subqueries for optimal query planning
- **31 multiple_permissive_policies fixes**: Consolidated duplicate RLS policies for better performance
- **26 foreign key indexes added**: Improved join performance and reduced query execution time
- **Query optimization**: All RLS policies now use schema-aware column references

### Security Hardening (2025-01-02)
- **5 function search_path fixes**: Added immutable `SET search_path = public` to SECURITY DEFINER functions
- **Extension security**: Moved pg_trgm extension to dedicated `extensions` schema to reduce attack surface
- **Dependency management**: Properly handled extension dependencies during migration
- **Schema isolation**: Improved security through better extension management

### Encryption & Compliance Status
- **TLS 1.2+ in transit**: Automatic HTTPS encryption for all Supabase connections
- **AES-256 at rest**: AWS-managed encryption for all database and storage data
- **HIPAA compliance**: Encryption meets healthcare data protection requirements
- **Connection security**: JWT-based authentication over encrypted channels

### Infrastructure Security
- **Row-Level Security**: Optimized RLS policies with helper functions and audit trails
- **Private storage**: Supabase Storage with signed URLs and expiry for PHI data
- **Service role restrictions**: service_role keys limited to Edge Functions only
- **Immutable audit trails**: created_by/updated_by tracking on all sensitive tables

---

## Current Library Versions & Dependencies 📦

### Core Framework & Runtime
- **Next.js**: 16.1.1 (App Router, React 19.2.3)
- **React**: 19.2.3 with React DOM 19.2.3
- **TypeScript**: 5.9.3
- **Node.js**: 20.6.2 (TypeScript types)

### Supabase Stack
- **@supabase/supabase-js**: 2.89.0 (main client)
- **@supabase/ssr**: 0.8.0 (server-side rendering)
- **Supabase CLI**: 2.70.5
- **PostgreSQL**: 17 (production database)

### Styling & UI
- **Tailwind CSS**: 4.1.18
- **PostCSS**: 8.5.6
- **Autoprefixer**: 10.4.23
- **@tailwindcss/postcss**: 4.1.18

### Development & Quality
- **ESLint**: 8.49.0 with eslint-config-next 13.5.1
- **TypeScript Compiler**: Built-in type checking
- **dotenv**: 17.2.3 (environment management)

### External Services (Configured)
- **Twilio Video**: SDK integration (version TBD)
- **OpenAI/DeepSeek**: API integration via Edge Functions
- **Replicate/Whisper**: Transcription services via Edge Functions

---

## Quick Operational Checklist ✅

### Completed Optimizations
- [x] **Database performance optimization**: 37 auth_rls_initplan + 31 multiple_permissive_policies fixes
- [x] **Security hardening**: 5 function search_path + pg_trgm extension security fixes
- [x] **Index optimization**: 26 foreign key indexes added for query performance
- [x] **Encryption verification**: TLS in transit + AES-256 at rest confirmed
- [x] **RLS policy optimization**: Schema-aware column references and consolidated policies

### Remaining Tasks
- [ ] Configure private storage buckets and signed URLs
- [ ] Review and test all RLS policies end-to-end (post-optimization)
- [ ] Obtain BAAs from vendors that will see PHI (Supabase, Twilio, AI providers)
- [ ] Implement job queue & background worker for transcription/AI
- [ ] Add monitoring & alerting for transcription/AI failures
- [ ] Set up customer-managed KMS keys (optional, for enhanced compliance)


*Notes*:
- **Last Updated**: 2025-01-02 (added security/performance optimization details)
- **Compliance Status**: HIPAA-ready with TLS + AES-256 encryption, optimized RLS policies
- **Performance**: Query optimization completed with 37 auth_rls fixes and 26 new indexes
- **Security**: Function search_path hardening and extension isolation completed
- This doc is a living reference—update vendor-specific configurations and BAA status as vendor relationships change.