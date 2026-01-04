# Plan Incorporation Notes — Mapping incorporated items to project phases 🧭

## Purpose
Record which plan items we have documented/implemented in planning and which actions are deferred until the application is functional or pre-prod.

---

## Phase mapping (high level)
- **Phase 1 — Foundation**: Implemented planning documents and schema assessment; RLS and Auth requirements documented. (Docs: `TECH_STACK.md`, `SCHEMA_SUPABASE_REPORT.md`, `HIPAA_COMPLIANCE.md`)

- **Phase 2 — Patient Management**: UI/DB notes captured; duplicate detection and API endpoints documented in `TECH_STACK.md` and `IMPLEMENTATION_PLAN.md`.

- **Phase 3 — Dashboard & Appointments**: Requirements present; no production configuration required yet.

- **Phase 5/6 — Storage & Audio Upload**: Storage design and security recommendations are documented; bucket hardening deferred until platform admin access.

- **Phase 7 — Transcription**: Legal and operational constraints documented; BAA and service-role changes will occur during pre-prod. Implementation currently uses Replicate Whisper for transcription and DeepSeek for parsing/summarization via signed Supabase URLs — see `main_docs/reference_docs/transcription-and-summarization.md` for model IDs, prompts, and examples.

- **Phase 8 — AI Note Generation**: AI guidelines and legal research created; clinical validation and model governance deferred until after functional MVP.

---

## Actionable plan items recorded
- Each deferred manual task is listed in `PRE_PROD_MANUAL_CHECKLIST.md` with responsible roles and verification steps.
- Add example request/response payloads and a short troubleshooting checklist (signed URL reachability, JSON parse fallbacks) to `PRE_PROD_MANUAL_CHECKLIST.md` for Phase 7/8 verification.
- RLS testing and test-case descriptions will be placed in `RLS_TEST_PLAN.md` (documentation-only now).

---

## Notes
- This file is for planners and PMs to track what was incorporated into planning documents vs what requires administrative/manual follow-up.
- Update this file after each pre-production sign-off or when manual tasks are completed.

*Prepared on:* 2025-12-20