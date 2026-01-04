# AI Use Guidelines — Rules & Implementation Controls ⚖️🤖

## Key Principles (short)
- **Human-in-the-loop**: AI outputs are suggestions; a licensed clinician must review and sign any clinical decisions.
- **Minimum necessary**: Only send the minimal PHI necessary to external services.
- **Explicit consent**: Obtain and log patient consent before recording or sending PHI to third-party services for AI/transcription.
- **Vendor safeguards**: Use only vendors that will sign a BAA for PHI processing.

---

## Prohibited Actions (Lines you must NOT breach)
- Do NOT send raw PHI (names, national IDs, contact info, identifiers) to any vendor that cannot sign a BAA.
- Do NOT auto-execute any treatment or prescription based solely on AI output (no autonomous prescribing).
- Do NOT train models on identified PHI unless the patient has explicitly consented and regulatory/legal checks are complete.
- Do NOT represent AI outputs as definitive diagnoses to patients; always label them as AI-generated suggestions.

---

## Required Implementation Controls (technical)
1. **Consent capture & audit**
   - Add consent record to patient profile when recordings/transcriptions/AI processing occur.
   - Log timestamp, clinician id, patient id, and scope of consent.
2. **De-identification pipeline**
   - Prefer de-identification before sending text/audio out-of-platform for training or analysis.
3. **BAA enforcement**
   - Gate calls to external transcription/LLM APIs behind an allowlist of BAAs.
4. **Provenance & UI**
   - Show clear UI indicators when content is AI-generated and show confidence score and model metadata (model name, version, timestamp).
5. **Safe Defaults**
   - Default AI features to opt-in off for clinicians and explicitly obtain patient consent for PHI processing.
6. **Logging & Monitoring**
   - Log each AI request/response with correlation IDs (no raw PHI in logs unless logs are stored in HIPAA-compliant store).
   - Monitor model performance and error rates; set alert thresholds.
7. **Validation & Retraining Governance**
   - Maintain test datasets, validation results, and retraining records. Establish a change-control process.
8. **Access Controls**
   - Only authorized clinical roles can request or view AI outputs for a given patient (enforce with RLS and app-level checks).

---

## Suggested Patient Consent Language (example)
"I consent to the recording and secure transmission of my audio/video for clinical documentation and automated transcription. I understand that processed text may be reviewed by automated systems to generate draft clinical notes and that a licensed clinician will verify all final documentation. I may withdraw this consent at any time."

---

## Incident & Escalation
- If an AI-generated suggestion leads to an adverse event, record the event, preserve raw inputs and outputs, and escalate per the incident response playbook.

---

## Operational Checklist ✅
- [ ] Consent UI & DB fields implemented
- [ ] BAA check before sending PHI externally
- [ ] De-identification tooling for training data
- [ ] Audit logs for AI requests and outputs (immutable)
- [ ] UI flags for AI-generated content and confidence

---

*Note*: This is a policy/design-level document and not legal advice. Engage legal counsel for site-specific wording and regulatory obligations.