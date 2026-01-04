Update app to use RPCs and match schema policy structure
Purpose

Update your codebase so all public (anon) read access uses the new SECURITY DEFINER RPCs created in the database.
Remove direct table SELECTs that previously relied on anon SELECT privileges.
Ensure authenticated client flows (with user's JWT) rely on the normal Supabase table APIs where appropriate, or call server-side RPCs for sensitive data.
Add tests and a deploy checklist.
Assumptions

RPC names applied to the database:
get_accessible_patients_for(clinician_uuid uuid) -> SETOF patients
get_clinician_by_id(clinician_uuid uuid) -> clinicians
get_visits_for_clinician(clinician_uuid uuid) -> SETOF visits
get_appointments_for_clinician(clinician_uuid uuid) -> SETOF appointments
get_messages_for_clinician(clinician_uuid uuid) -> SETOF messages
Frontend uses supabase-js (patterns below assume v2-style client but include notes for v1).
The app previously did anonymous direct SELECTs against tables like patients, visits, messages, etc.
You want to keep anon reads but mediated through those RPCs; writes remain protected and require authenticated users or server-side service_role.
What to change (developer-facing instructions)

Find direct anon table reads
Search repo for calls that read any of these tables directly as anon: patients, patient_shares, visits, appointments, messages, message_threads, visit_notes, visit_recordings, allergies, medications, medical_history, orders, medications_prescribed, labs_ordered, transcription_jobs.
Search terms to use: ".from('patients')", "supabase.from('patients')", fetch to "/rest/v1/patients", any direct SQL SELECT for these tables in server code that runs with anon credentials.
Replace anon reads with RPC calls
For each direct read performed by unauthenticated or anon client flows, replace with the corresponding RPC call.
Suggested supabase-js client usage (examples)

Pattern: call RPC with clinician id extracted from JWT (preferred) or leave null if RPC uses auth context.

Example: get accessible patients for clinician (frontend):

Get clinician id string from JWT claims or user metadata in your app (e.g., user.user_metadata.clinician_id or decode token).

Call RPC:

supabase-js v2 (recommended)

Example: const clinicianId = /* code to get clinician id from logged-in user or query param / const { data, error } = await supabase.rpc('get_accessible_patients_for', { clinician_uuid: clinicianId }); if (error) { / handle error */ } // data is an array of patients
supabase-js v1:

const { data, error } = await supabase.rpc('get_accessible_patients_for', { clinician_uuid: clinicianId });
Example: get visits for clinician: const { data: visits, error } = await supabase.rpc('get_visits_for_clinician', { clinician_uuid: clinicianId });

Example: get appointments for clinician: const { data: appointments, error } = await supabase.rpc('get_appointments_for_clinician', { clinician_uuid: clinicianId });

Example: get messages for clinician: const { data: messages, error } = await supabase.rpc('get_messages_for_clinician', { clinician_uuid: clinicianId });

Notes:

RPC parameter names must match the function signature; use camelCase keys in JS object if you prefer, but the function parameters are positional by name mapping in supabase-js.
Handle empty results gracefully (data may be null or [] depending on supabase client and RPC return type). Prefer to check error first, then data ?? [].
Replace REST calls (if used) with RPC endpoints
If you previously used the REST endpoint /rest/v1/patients?select=..., replace with a call to /rpc/get_accessible_patients_for where you pass clinician_uuid in JSON body (REST RPC pattern):
POST /rest/v1/rpc/get_accessible_patients_for
Body: {"clinician_uuid": "uuid-string"}
Use the same headers (apikey/authorization) — but ensure you use anon key for public reads calling RPC as intended.
Update server-side logic (API routes) that relied on anon SELECT
Any server code that uses the anon key to fetch those protected tables should be updated to call RPCs instead. If the server has its own authentication (session cookie), prefer performing queries with the user's JWT forwarded, or use service_role key for privileged actions.
If server endpoints should return sensitive patient data only for authenticated users, validate the user's session on the server and call the RPC with the proper clinician id.
Do NOT change any code that previously used the service_role key to bypass RLS (these should remain server-only and protected)
Keep any service-side direct table reads that require full access on server functions or Edge Functions using the service_role key. Do not commit service_role usage to the client.
Update frontend authentication handling and token claims usage
Where previous code expected auth.user().id as the sole identifier, ensure it extracts clinician id from JWT claims if suitable:
Example: clinicianId = supabase.auth.getUser()?.data?.user?.user_metadata?.clinician_id OR decode JWT and read claim clinician_id.
If clinician id is not present in the JWT, update user provisioning logic to include clinician_id as a custom claim or store clinician relation in a public safe-to-read table and create a lightweight RPC mapping get_clinician_by_user(sub uuid) (not created in the applied bundle). Alternatively, call get_clinician_by_id if you do have the clinician id.
Client-side error handling and UX
Map RPC errors to friendly UI messages:
On RPC error (403/401 patterns), show "You are not authorized to view this data" or prompt sign-in.
On network / 5xx errors, show generic message and optionally retry logic.
Replace .single() usage carefully
Previously you may have used .single() on a table read to assert exactly one row; RPC returns may be SETOF (array) or single row depending on return type:
get_clinician_by_id returns a single row — you can use const clinician = data ?? null.
get_accessible_patients_for returns an array — do not use .single(); treat as array.
Tests and smoke checks
Add unit/integration tests that use the anon key to call the RPC endpoints and assert expected shapes:
Test: anon RPC get_accessible_patients_for with a known test clinician id returns expected patients list.
Test: calling old endpoint /rest/v1/patients returns 403 (if still accessible revocation enforced).
Test: signed-in clinician can still use authenticated flows to create and update data (ensures policies aren't blocking valid writes).
Add a developer checklist in README:
"When adding a new protected table require an RPC to expose readonly data to anon. Add SECURITY DEFINER RPC + GRANT EXECUTE TO anon + Revoke anon SELECT on table + RLS policies on table."
Code examples to commit (copy-paste)
Example React hook (supabase-js v2): import { useState, useEffect } from 'react'; import { createClient } from '@supabase/supabase-js'; const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function useAccessiblePatients(clinicianId) { const [patients, setPatients] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { let mounted = true; async function load() { setLoading(true); const { data, error } = await supabase.rpc('get_accessible_patients_for', { clinician_uuid: clinicianId }); if (error) { console.error('RPC error', error); if (mounted) setPatients([]); } else { if (mounted) setPatients(data ?? []); } if (mounted) setLoading(false); } if (clinicianId) load(); return () => { mounted = false; }; }, [clinicianId]); return { patients, loading }; }

Example fetch to REST RPC (node/fetch or server): const res = await fetch(${SUPABASE_URL}/rest/v1/rpc/get_accessible_patients_for, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': Bearer ${SUPABASE_ANON_KEY} }, body: JSON.stringify({ clinician_uuid: 'uuid-string' }) }); const data = await res.json();

Add migration note (repo)
Add a short migration note in your repo (e.g., docs/rls-migration.md):
List RPC names and their purpose.
Note that anon SELECT was revoked for protected tables — update any integration that was relying on that to use RPCs.
Add instructions for adding future RPCs and policies:
Create SECURITY DEFINER RPC
Revoke EXECUTE then GRANT to anon only on RPC
Revoke SELECT on the underlying table for anon
Add RLS policies to allow authenticated users or service_role as needed
Add indexes on columns used by policies
PR / commit message template
Title: "Migrate anon reads to RPCs + enforce RLS on protected tables"
Body:
Summary of DB changes (list RPCs and policies) — link to the bundle.sql file.
Code changes: list files updated to call RPCs instead of direct table reads.
Testing steps and verification checklist (calls to RPC using anon key, authenticated write flows).
Rollback steps (re-add anon SELECT on table or remove RPC grants).
Verification commands for maintainers (manual)
Verify RPC runs as anon:

Using HTTP: curl -X POST '<SUPABASE_URL>/rest/v1/rpc/get_accessible_patients_for'
-H "apikey: <ANON_KEY>"
-H "Authorization: Bearer <ANON_KEY>"
-H "Content-Type: application/json"
--data '{"clinician_uuid":""}'
Expect: JSON array of patients (200). If 401/403, check RPC grants and RLS contexts.
Verify table direct SELECT blocked for anon:

curl -X GET '<SUPABASE_URL>/rest/v1/patients?select=*'
-H "apikey: <ANON_KEY>"
-H "Authorization: Bearer <ANON_KEY>"
Expect: 401 or empty results depending on policy. The intention: anon cannot select directly.*
Rollback plan
If something breaks in production, rollback steps:
Re-grant anon SELECT temporarily: GRANT SELECT ON public.patients TO anon;
Or remove the RPC grant if you need to stop anon RPC access: REVOKE EXECUTE ON FUNCTION public.get_accessible_patients_for(uuid) FROM anon;
Revert code changes in the repo to previous version (via git).
Security considerations
Do not expose service_role keys in client code.
Keep SECURITY DEFINER functions minimal and avoid exposing any unnecessary columns.
Revoke EXECUTE for anon/authenticated on helper functions (get_requesting_user_uuid) — we already did this in DB changes.
Limit RPCs to only return fields safe for public read; if any RPC returns PII that should be access-restricted, change RPC to require authentication or return masked fields.
Extra: Adding new protected table pattern
When adding a new protected table T:
Create SECURITY DEFINER function get_T_for_clinician(clinician_uuid uuid) RETURNS SETOF public.T SELECT ... WHERE conditions;
REVOKE EXECUTE ON FUNCTION public.get_T_for_clinician(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_T_for_clinician(uuid) TO anon;
ALTER TABLE public.T ENABLE ROW LEVEL SECURITY;
Create RLS policies for authenticated users as appropriate.
REVOKE SELECT ON public.T FROM anon;
Add indexes on columns used in the policy conditions.
Files to update checklist

Frontend:
All components/pages that previously did supabase.from('patients') or similar.
Any client-side services/helpers that wrap table reads.
Backend:
API routes that used anon key to read protected tables.
Integration and automation scripts that use anon key for reads.
Tests:
Update and add new tests to use RPCs.
Example commit diff hints

Replace: const { data, error } = await supabase.from('patients').select('*').eq('clinician_id', clinicianId)
With: const { data, error } = await supabase.rpc('get_accessible_patients_for', { clinician_uuid: clinicianId })*
Acceptance criteria / QA checklist

 All public (anon) reads that previously used direct SELECTs are replaced with RPCs.
 No client-side code contains service_role key.
 Smoke test: anonymous client calling RPC endpoints returns expected public-safe data.
 Authenticated flows continue to allow writes for valid users.
 PR contains a migration note and tests.
 Monitoring/alerts configured for any increases in 401/403 errors.