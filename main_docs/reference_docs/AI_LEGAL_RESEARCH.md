# AI in Healthcare — Legal & Regulatory Research (Summary) ⚖️

## Purpose
High-level research notes on laws, regulations, and risks when using AI/ML in clinical contexts. This is informational — consult counsel for binding legal advice.

---

## United States — Key Considerations
- **HIPAA**: Health data are PHI. Covering entities and business associates must protect PHI; BAAs are required when vendors handle PHI. Use minimum necessary and obtain appropriate patient authorization for non-routine uses (e.g., sending PHI to non-BAA vendors).
- **FDA**: Some AI/ML tools used for diagnosis, triage, or treatment may be regulated as medical devices (SaMD). If AI influences clinical decisions or provides diagnostic output, evaluate whether FDA clearance/510(k)/De Novo applies. The FDA has specific guidance for AI/ML-based SaMD lifecycle.
- **FTC & State Consumer Protection**: The FTC enforces against deceptive or unfair practices; claims about AI accuracy or safety must be substantiated. State medical boards may have additional rules on telemedicine and AI use.
- **Malpractice & Standard of Care**: Clinicians are responsible for care decisions; reliance on AI doesn’t remove professional responsibility. Document clinician oversight.

---

## Europe — GDPR & Medical Data
- **GDPR**: Health data are ‘special category’ data and require a lawful basis and specific safeguards (usually explicit consent or vital interest/legal obligation). Data subject rights (access, deletion) and transparent processing are critical.
- **Cross-border transfers**: Transfer of EU patient data to non-adequate countries requires safeguards (SCCs, adequacy, etc.).

---

## Other Jurisdictions
- Local laws vary (e.g., Canada’s PIPEDA, UK DPA/UKGDPR, various state laws in the US). Check local telemedicine and data protection regulations.

---

## Specific AI Risks & Regulatory Focus Areas
- **Transparency & Explainability**: Regulators expect clarity about AI role in care and the model’s limitations.
- **Bias & Fairness**: Models trained on non-representative data can produce biased outcomes.
- **Validation & Performance**: Clinical validation on relevant populations is essential.
- **Data Minimization**: Only share necessary data, de-identify when possible.

---

## Practical Takeaways for Implementation
- Obtain BAAs before sending PHI to third-party AI/transcription services.
- Avoid labeling features as "diagnostic" or "treatment" unless you intend to pursue medical device regulatory path and validation.
- Provide clear clinician controls and require clinician sign-off for AI-suggested actions.
- Maintain documentation for model validation, monitoring, and incident response.

---

## References & Next Steps
- Consult HHS OCR HIPAA guidance, FDA AI/ML SaMD guidance, FTC consumer protection resources, and local data protection authorities.
- Engage legal counsel with health-tech experience before: (1) sending PHI to AI vendors, (2) marketing AI features as clinical-decision-making tools, or (3) deploying AI that impacts diagnosis/treatment.

*This summary is informational and not legal advice.*