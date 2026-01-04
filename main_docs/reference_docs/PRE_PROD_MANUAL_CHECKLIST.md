# Pre-Production Manual Checklist — Required Manual Actions 🛠️

This checklist enumerates manual actions that must be completed and verified before production deployment.

## Legal & Vendor
- [ ] Confirm BAAs with all vendors that will process PHI (Supabase, Twilio, transcription/AI vendors).
- [ ] Obtain written statements on data processing and retention from transcription/AI vendors.
- [ ] Complete legal review for any AI features that have diagnostic/treatment implications.

## Platform & Storage
- [ ] Create and configure private Supabase storage buckets (e.g., `telehealth_audio`).
- [ ] Implement signed URLs with limited TTL for all PHI files and recordings.
- [ ] Audit access permissions on storage; remove any public ACLs.
- [ ] Ensure backups are encrypted and access-controlled.

## Database & Security
- [ ] Verify RLS policies are complete (fill in any omitted policy logic) and approve logic with security lead.
- [ ] Deploy DB check constraints and any recommended triggers (e.g., to set `created_by`/`updated_by` when using service APIs).
- [ ] Configure service roles and secrets; restrict direct DB updates for background jobs to service accounts.

## Logging & Monitoring
- [ ] Configure and verify immutable audit logging (and export to a secure store if required).
- [ ] Configure alerts for anomalous data access patterns and AI error rates.

## Consent & UI
- [ ] Implement patient consent capture flows (record consent text, timestamp, clinician id).
- [ ] Add UI flags indicating AI-generated content and patient consent status.

## Testing & Validation (documentation-only now)
- [ ] Prepare RLS test plan with JWTs and expected outcomes (do not run yet).
- [ ] Prepare test cases for transcription job lifecycle and service role access (documentation-only now).

## Governance & Incident Response
- [ ] Finalize incident response playbook and notification templates.
- [ ] Define roles and responsibilities for security incidents and data breaches.

## Sign-offs
- [ ] Security sign-off (security lead)
- [ ] Legal sign-off (legal counsel)
- [ ] Clinical sign-off for AI-driven workflows (clinical lead)

*Notes*: Do not send identifiable PHI to third parties until BAAs are confirmed. Document completion of each item in `main_docs/reference_docs/IMPLEMENTATION_INCORPORATION.md` and maintain copies of BAAs and sign-offs in the project secure repository.

*Prepared on:* 2025-12-20