# Implementation — What We Incorporated Now vs Manual Actions (Status) 🗂️

## Purpose
This document records what we were able to incorporate immediately (documentation, plans, and recommendations) and what **must** be done manually later (before production). Per instructions: no tests will be run now and no code/build steps started.

---

## Items we incorporated immediately (done now)
These are documentation and planning items we completed and that are now part of project references:

- **Tech stack documented** (`TECH_STACK.md`) — clear architecture, libraries, and production/security recommendations.
- **HIPAA compliance assessment** (`HIPAA_COMPLIANCE.md`) — existing strengths, gaps, and prioritized mitigations.
- **AI legal research** (`AI_LEGAL_RESEARCH.md`) — high-level mapping of HIPAA, FDA, FTC, GDPR and practical takeaways.
- **AI use guidelines** (`AI_USE_GUIDELINES.md`) — strict "must not" rules, required controls, example consent text and UI/DB controls.
- **Supabase schema report** (`SCHEMA_SUPABASE_REPORT.md`) — compatibility check, actionable improvements (RLS testing, tighter service roles, constraints, indexing suggestions).

Each document also includes checklists and recommended next steps (where manual actions or confirmations are required).

---

## Manual actions & items we deferred (will do before production)
These items require human/administrative action, platform admin access, legal review, or a fully-functional application to test and should be performed later in the deploy/pre-production phase:

1. **Vendor BAAs and legal agreements**
   - Confirm BAAs with Supabase (if needed), Twilio, any transcription/AI companies (OpenAI/Replicate or others) before sending PHI.
   - Responsible party: Project lead / Legal.

2. **Storage bucket hardening in Supabase**
   - Create private buckets, enforce signed URL policies, set access lifetimes, and audit access logs.
   - Responsible party: DevOps / Platform Admin.

3. **Audit logging and retention configuration**
   - Configure immutable log export and define retention policies for access/audit logs (ensure HIPAA compliance).
   - Responsible party: DevOps / Security.

4. **Key management / encryption**
   - Decide KMS provider, and implement envelope encryption for highly sensitive fields if required.
   - Responsible party: Security.

5. **Consent flows & UI additions**
   - Implement patient consent capture, persist consent records, and surface consent in clinician UI.
   - Responsible party: Product / Frontend.

6. **RLS policy testing & verification**
   - Execute the RLS test plan (simulate roles, JWTs, edge cases). Document and fix any policy gaps.
   - Responsible party: Backend + QA.

7. **Service role tightening for background/system jobs**
   - Restrict updates to `transcription_jobs` and other system-modifiable rows to a secure service account or service role.
   - Responsible party: Backend / DevOps.

8. **Incident response & breach notification plan**
   - Build and test incident response playbook, including escalation and notification templates.
   - Responsible party: Security / Legal.

9. **Final compliance review**
   - Formal HIPAA risk assessment and legal sign-off before production.
   - Responsible party: Compliance / Legal.

10. **Clinical validation & AI governance**
    - If/when AI features are expanded into decision support, perform clinical validation and set governance policies (monitoring, drift detection, bias review).
    - Responsible party: Clinical Lead + Data Science + Regulatory.

11. **Replicate & signed-URL verification**
    - Verify BAAs or contractual terms with Replicate (or chosen transcription/LLM vendors) before sending PHI. Ensure requirements are documented.
    - Validate that Supabase signed URLs are reachable by vendor services; set appropriate TTL (e.g., 1 hour) and document expected lifetimes. Add fallback/error handling for fetch failures.
    - Ensure `transcription_jobs` and other background operations run under a tightened service role.
    - Responsible party: DevOps / Legal / Backend.

---

## What we recorded in the project plan
- All immediate findings and recommendations were added to `main_docs/reference_docs/*` and are referenced in `SCHEMA_SUPABASE_REPORT.md` and `HIPAA_COMPLIANCE.md` for visibility.
- We recorded explicit "do not send PHI to vendors without a BAA" rules in `AI_USE_GUIDELINES.md`.
- The Supabase schema report lists concrete DB changes and tests (check constraints, triggers for audit fields, RLS test cases) that should be implemented and validated later.

---

## Next documentation tasks (planned)
- Prepare **pre-production manual checklist** (`PRE_PROD_MANUAL_CHECKLIST.md`) with step-by-step manual actions and verification checks for release.
- Prepare an **RLS test plan** doc (test cases, JWT samples, expected results) that will be executed by QA when the app is functional.
- Document the vendor BAA status and who to contact.

---

## Notes & Constraints
- Per instruction: no tests will be executed now; all test artifacts will be documentation-only until system is functional.
- No code changes or builds were started.
- This file is a living status note — update it as manual items are completed.

*Prepared on:* 2025-12-20