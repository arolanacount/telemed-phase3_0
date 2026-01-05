# Code Index — Feature → File Map

This file is an index of core features and the primary files that implement them. Keep this file updated when adding or moving code so engineers and AI assistants can quickly locate functionality.

---

## How to use
- Search for a feature name and open the referenced file path. Paths are relative to the repository root.
- Run the verification script to ensure referenced files still exist:

```bash
node scripts/verify_code_index.js
```

- If you add or remove files, update this file and re-run the verification script.

---

## Feature → File Map (concise)

- `app/signup/page.tsx` — Signup form and clinician creation flow
- `app/signin/page.tsx` — Sign-in form and session logic
- `lib/auth.ts` — Server-side auth helpers (ensureClinicianExists, getUser)
- `app/api/ensure-clinician/` — API endpoint(s) for clinician creation

- `app/patients/page.tsx` — Patients list (server-side fetching)
- `app/patients/PatientList.tsx` — Client-side patient list UI
- `app/patients/[id]/page.tsx` — Patient profile page
- `app/patients/[id]/PatientTabs.tsx` — Tab/accordion UI for patient details
- `app/patients/[id]/PatientShare.tsx` — Patient sharing UI
- `app/api/patients/[id]/shares/route.ts` — Shares API
- `app/api/patients/[id]/share/route.ts` — Share creation API

- `app/visits/new/page.tsx` — New visit creation form
- `app/api/visits/route.ts` — Visits API (create/modify)
- `app/visits/[id]/page.tsx` — Visit detail page, notes saving, finalize

- `app/appointments/new/page.tsx` — Appointment creation
- `app/api/appointments/route.ts` — Appointment API
- `app/calendar/CalendarClient.tsx` — Calendar UI component

- `app/dashboard/page.tsx` — Dashboard server-side aggregation
- `app/dashboard/DashboardClient.tsx` — Dashboard client rendering
- `app/search/page.tsx` — Global search implementation

- `lib/useSessionTimeout.ts` — Session timeout hook
- `components/Layout.tsx` — Layout that applies session timeout

- `main_docs/reference_docs/transcription-and-summarization.md` — Transcription design & API contract (planned)
- `main_docs/IMPLEMENTATION_PLAN.md` — Overall plan and phases
- `main_docs/AI_Code_Changes_Reference.md` — AI change controls and coding patterns
- `main_docs/Functional_Code_Locations.md` — Detailed mapping and explanations
- `main_docs/reference_docs/TECH_STACK.md` — Tech stack and vendor guidance
- `main_docs/reference_docs/HIPAA_COMPLIANCE.md` — HIPAA controls and checklist

---

## Searchable table (quick reference)
| Feature | Path |
|---|---|
| Signup | `app/signup/page.tsx` |
| Signin | `app/signin/page.tsx` |
| Ensure Clinician API | `app/api/ensure-clinician` |
| Patients list | `app/patients/page.tsx` |
| Patient profile | `app/patients/[id]/page.tsx` |
| Patient sharing | `app/patients/[id]/PatientShare.tsx` |
| Visit creation | `app/visits/new/page.tsx` |
| Visit detail | `app/visits/[id]/page.tsx` |
| Appointments | `app/appointments/new/page.tsx` |
| Calendar | `app/calendar/CalendarClient.tsx` |
| Dashboard | `app/dashboard/page.tsx` |
| Global search | `app/search/page.tsx` |
| Session timeout | `lib/useSessionTimeout.ts`, `components/Layout.tsx` |
| Transcription (planned) | `main_docs/reference_docs/transcription-and-summarization.md` |

---

## Verification
Run the verification script at `scripts/verify_code_index.js` to validate all referenced paths exist and report missing entries. Keep this file up-to-date and add a line in `main_docs/IMPLEMENTATION_PLAN.md` when you add new features.


---

_Last updated: 2026-01-04 — add your name and date when you modify this file._
