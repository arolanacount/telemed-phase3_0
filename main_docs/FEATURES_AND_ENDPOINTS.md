## Contents
1. Quick summary
2. Feature list (with UX notes)
3. API endpoints (path, method, auth, request/response samples)
4. Data models / DB tables
5. Frontend components & visual contracts
6. Auth & session rules
7. File upload & transcription flow
8. Environment variables
9. Tests & verification (smoke tests, scripts)
10. Migration & integration guidance for an AI
11. Security & compliance notes

---

## 1) Quick summary
- Monorepo consolidated into a single Next.js app at the repo root.
- Supabase is used for authentication, storage, and database.
- Recording UI (browser MediaRecorder) uploads audio to private Supabase bucket via signed upload URLs.
- `/api/transcribe` accepts a transcription request and returns a queued job id (202) after authorization and size checks.
- Tailwind CSS (v4) + PostCSS + LightningCSS used for styling (design system uses Tailwind utility classes).

---

## 2) Feature list (short)
- Authentication (email & password sign-in/up with verification)
  - Login page (`/signin`), `lib/api.ts` wrapper functions (`login`, `signup`), `useAuthGuard`.
- Dashboard & navigation (Header, Sidebar, Layout)
- Patients CRUD (list, detail, create)
- Visits lifecycle (create visit, add notes, record audio)
- Recording + upload flow (client obtains signed URL, uploads file to private bucket)
- Transcription (server route `/api/transcribe` uses signed URL, returns queued job)
- Twilio token endpoint for video PoC (`/api/twilio/token`) — requires auth
- Sharing & permissions endpoints (patient sharing, access checks)
- Search & quick actions (search bar component)

Each feature includes: page(s), components used, API routes invoked, UX acceptance criteria, and tests.

---

## 3) API endpoints (detailed)
All endpoints live under `app/api/*` and require `Authorization: Bearer <access_token>` header where noted.

- POST /api/auth/signup
  - Auth: none
  - Purpose: create a user account
  - Request: { email, password }
  - Response: 201 or appropriate error

- POST /api/auth/login (client-side wrapper using Supabase `signInWithPassword`)
  - Auth: none
  - Purpose: sign in a user and create a session

- POST /api/upload
  - Auth: REQUIRED (use `requireUser` server helper)
  - Purpose: create a signed upload URL for a user-scoped path
  - Request: { fileName?, bucket?, metadata? }
  - Response: { signedUrl, path, token }
  - Notes: server uses Supabase storage `createSignedUploadUrl(objectPath, { upsert: false })`.

- POST /api/transcribe
  - Auth: REQUIRED (`requireUser`) — returns 401 on missing auth
  - Purpose: Accepts audio reference (signed url or storage path), validates size/quota, returns { jobId, status: 'queued' } with HTTP 202
  - Request: { audioPath | audioUrl, visitId, metadata }
  - Response: 202 { jobId, status }
  - Errors: 401 unauthenticated, 413 payload too large, 400 bad request
  - Server behavior: For now writes a queued job entry, returns jobId. TODO: move to async worker

- GET /api/patients
  - Auth: REQUIRED
  - Purpose: list patients for the clinician
  - Response: 200 JSON list

- POST /api/patients
  - Auth: REQUIRED
  - Purpose: create a new patient

- GET /api/visits
  - Auth: REQUIRED
  - Purpose: list visits

- POST /api/visits
  - Auth: REQUIRED
  - Purpose: create a new visit

- POST /api/visits/:id/note
  - Auth: REQUIRED
  - Purpose: add a note to a visit

- GET /api/twilio/token?room={room}
  - Auth: REQUIRED
  - Purpose: mint a Twilio short-lived room token for in-app video PoC

- POST /api/patients/:id/share
  - Auth: REQUIRED
  - Purpose: share patient access (admin operation in PoC)

Notes: Many routes use `requireUser(req)` helper (see `lib/auth.ts`) that extracts `Authorization` header, strips `Bearer `, and calls `supabase.auth.getUser(token)`.

---

## 4) Data models / DB tables (optimized schema)

### Core Tables
- **clinicians** (extends auth.users)
  - id, full_name, specialty, license_number, phone, role, is_active, metadata
  - Audit: created_at, updated_at

- **patients** (master profiles with sharing)
  - id, clinician_id, demographics (name, DOB, contact, medical info), metadata
  - Audit: created_at, updated_at, created_by, updated_by

- **patient_shares** (permission-based sharing)
  - patient_id, shared_by, shared_with, permission_level (read/write/full), expires_at
  - Audit: created_at, updated_at

- **appointments** (scheduled visits)
  - id, patient_id, clinician_id, scheduled_at, duration, type, status, location, notes
  - Audit: created_at, updated_at, created_by, updated_by

- **visits** (clinical encounters)
  - id, patient_id, clinician_id, appointment_id, type, status, started_at, ended_at
  - Collaboration: last_edited_by, finalized_by, chief_complaint
  - Audit: created_at, updated_at, created_by

### Clinical Documentation
- **visit_notes** (structured SOAP notes)
  - visit_id, chief_complaint, HPI, ROS, vitals, physical_exam, assessment, plan
  - AI support: ai_generated, ai_confidence
  - Audit: created_at, updated_at, created_by, updated_by

- **visit_recordings** (audio/video files)
  - visit_id, file_path, file_size, duration, content_type, uploaded_by
  - Metadata: uploaded_at, metadata jsonb

### Medical Records
- **allergies** - patient_id, allergen, reaction, severity, onset_date, notes, is_active
- **medications** - patient_id, medication_name, dosage, frequency, start_date, end_date, prescriber
- **medical_history** - patient_id, condition, diagnosis_date, status, notes, is_active

### Orders & Prescriptions
- **orders** - visit_id, patient_id, clinician_id, order_type, status, details jsonb
- **medications_prescribed** - order_id, patient_id, medication details, pharmacy info, status
- **labs_ordered** - order_id, patient_id, lab_test details, results jsonb, status

### AI & Processing
- **transcription_jobs** (async audio processing)
  - visit_id, audio_path, status (queued/processing/completed/failed)
  - Results: transcript_text, word_timestamps, error_message
  - Audit: created_at, completed_at, created_by

### Communication
- **messages** - sender_id, recipient_id, message_type, subject, body, priority, patient_id, visit_id, thread_id
- **message_threads** - subject, participants array, patient_id, last_message_at

### Security Features
- **RLS enabled** on all tables with optimized policies
- **Helper functions** for complex access checks (SECURITY DEFINER)
- **Audit trails** on all data modifications
- **Patient sharing** with granular permissions
- **Service role** restricted to Edge Functions only

---

## 5) Frontend components & visual contracts
Goal: Preserve design and semantic structure. Key components (file names are in `components/`):

- `Header.tsx` — top nav; props: { onSignOut? }
- `Sidebar.tsx` — page navigation
- `PatientsList.tsx` — lists patients; props: { patients, onSelect }
- `PatientDetail.tsx` — shows patient details and visit list
- `NewVisitForm.tsx` — creates a new visit
- `VisitDetail.tsx` — shows visit transcript, recordings, notes
- `PatientModal.tsx` — modal for quick patient creation
- `SearchBar.tsx` — search + typeahead
- `UseAuthGuard` hook — used by pages that require authentication

Design guidance for each component for AI migration:
- Preserve Tailwind classes/variants used in markup. Classnames like `text-slate-900`, `bg-blue-600`, `rounded-lg`, etc., are part of the appearance contract.
- Maintain accessible markup (labels, `aria-*` attributes already present).
- Keep component props minimal and explicit to allow easy wiring to new endpoints in the target codebase.
- For visual parity, keep CSS utility mapping (e.g., if target codebase uses CSS-in-JS, map Tailwind tokens to theme variables).

---

## 6) Auth & session rules
- Auth is done via Supabase JWT access tokens. Client uses `supabase.auth.signInWithPassword` and stores session client-side.
- Server expects `Authorization: Bearer <access_token>` header and uses `supabase.auth.getUser(token)` server-side.
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side (admin actions like creating test users). Never expose it to clients.
- Test fixture: `scripts/create_test_user.js` creates a test user using the service role and writes `TEST_AUTH` to `.env.local` for smoke tests.

---

## 7) File upload & transcription flow (steps)
Client flow (record -> upload -> transcribe):
1. Client calls POST `/api/upload` (with auth) to get a signed upload URL for `clinician/{clinicianId}/{filename}`.
2. Client uploads the audio directly to the signed URL (fetch/PUT) with the correct content-type.
3. Client calls POST `/api/transcribe` with { audioPath } (server will create a signed URL for Replicate or use stored path) and receives 202 { jobId, status: 'queued' }.
4. The worker (future) will pick up transcription job, call Replicate/LLM, write transcript to `transcripts` table and update job status.

Server constraints:
- Enforce size limits (configurable with env var MAX_FILE_BYTES) and return 413 if exceeded.
- Validate auth before creating signed URLs.
- Return helpful JSON errors for invalid inputs.

---

## 8) Environment variables (required & optional)
- NEXT_PUBLIC_SUPABASE_URL (required)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (required for client operations)
- SUPABASE_SERVICE_ROLE_KEY (required server-side to create test users or perform admin ops)
- STORAGE_BUCKET (e.g., `telehealth_audio`)
- REPLICATE_API_KEY (for transcription calls)
- TEST_AUTH (used by smoke tests; generated by `scripts/create_test_user.js`)
- LIGHTNINGCSS_PLATFORM (opt, for local LightningCSS binary preference)

---

## 9) Tests & verification
- Smoke tests:
  - `scripts/create_test_user.js` — create test user and write `TEST_AUTH`
  - `scripts/upload_test_audio.js` — upload sample audio to storage
  - `tests/smoke/transcribe-smoke.js` — posts to `/api/transcribe` and expects 202 queued
  - `scripts/run_smoke_test.js` — wrapper: creates test user, ensures server running, uploads audio, runs transcribe smoke test
- Unit tests: not exhaustive; add endpoint unit tests as migration proceeds

Acceptance criteria for migration:
- `POST /api/upload` returns signed url for authenticated user
- `POST /api/transcribe` returns 202 queued when provided valid `Authorization` and small test audio path
- Frontend pages render and look visually similar (matching spacing, typography, and colors) and links navigate as expected

---

## 10) Migration & integration guidance for an AI
Goal: Allow another project to implement the same features while preserving the UI look.

High-level steps for an AI/operator to follow:
1. **Inventory target app**: detect its routing, auth mechanism, and styling system.
2. **Create server-side adapters**: Implement equivalent endpoints (see list above) with identical request/response contracts (so front-end code can be reused with minimal change). Use `requireUser` semantics for auth.
3. **Preserve UI**: If target app uses a different styling approach, map Tailwind tokens to theme variables first. Prioritize keeping classnames & semantic HTML in components to retain layout and spacing.
4. **Add tests**: Reuse smoke tests verbatim but change environment variables to target deployment.
5. **Run smoke tests**: `npm run smoke:test` (or the equivalent) to validate functions.
6. **Iterate**: Implement missing DB tables (migrations) and background worker if needed.

Best practices for an AI to avoid breaking visual design:
- Do not make bulk structural changes to component HTML; instead, adapt data plumbing behind props.
- Keep CSS classnames intact; if not possible, create a small compatibility stylesheet mapping old utility classes to the new system.
- Implement endpoints with stable contracts first; once everything is green, refactor internals.

Sample migration checklist for `/api/transcribe`:
1. Implement `POST /api/transcribe` that accepts `{ audioPath, visitId }` and checks `Authorization` header.
2. Validate file path exists and size limit; if OK, insert job record in `transcription_jobs` and return `{ jobId, status: 'queued' }` (HTTP 202).
3. Add unit test for auth missing → 401, large file → 413, valid → 202.
4. Update frontend `VisitDetail` to call the new endpoint and show queued state UI.

---

## 11) Security & compliance notes
- Keep `.env.local` out of source control (we add it to `.gitignore`).
- Do server-side admin operations with `SUPABASE_SERVICE_ROLE_KEY` only on server-side code.
- Use short-lived credentials where possible and rotate `TEST_AUTH` in CI.
- For real deployments handle PII carefully and follow Atlas platform operating doc for audit & sign-off.

---

## Machine artifacts (OpenAPI & Postman)
To help automated migration or AI-driven porting, two machine-readable artifacts are included:

- `docs/openapi.yaml` — OpenAPI 3.0 spec describing all primary endpoints, auth rules, request/response schemas, and examples.
- `docs/postman_collection.json` — Postman collection with example requests for manual or automated testing.

These files can be imported into API tooling (Postman, Insomnia, Swagger UI, or AI ingestion) to generate server stubs, client SDKs, or to drive integration tests automatically.

---

## Appendix: Useful dev commands
- Install and run dev server: `npm install && npm run dev`
- Create test user: `npm run create:test-user`
- Run smoke workflow: `npm run smoke:test`
- Run only smoke transcribe test: `node tests/smoke/transcribe-smoke.js`

---

If you'd like, I can also produce a JSON or machine-readable format of this document (OpenAPI / Postman collection + component contract JSON) to feed directly into an AI code-migration workflow. Say the word and I'll generate OpenAPI paths + example payloads. ✨
