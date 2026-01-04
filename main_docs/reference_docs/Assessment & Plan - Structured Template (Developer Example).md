# **Assessment & Plan — Structured Template (Developer Example)**

Each **Assessment & Plan** section is **diagnosis-centric**.  
 A single visit may contain **multiple diagnoses**, each with its own A/P block.

---

1. ## \[Diagnosis Name\] – \[Assessment: e.g., Stable, Worse, Improved, New\] \[ICD-10 Code\]

* ## Plan: \[Specific plan details\]

* ## Medications: \[Changes/Adjustments\]

* ## Monitoring: \[Details\]

* ## Orders: \[Labs/Imaging\]

* ## Follow-ups / Referrals: \[Details\]

* ## Education: \[Details provided to patient\]

* ## Coordination: \[Communication with other clinicians\]

  ## 

2. ## \[Diagnosis Name\] – \[Assessment: e.g., Stable, Worse, Improved, New\] \[ICD-10 Code\]

* ## Plan: \[Specific plan details\]

* ## Medications: \[Changes/Adjustments\]

* ## Monitoring: \[Details\]

* ## Orders: \[Labs/Imaging\]

* ## Follow-ups / Referrals: \[Details\]

* ## Education: \[Details provided to patient\]

* ## Coordination: \[Communication with other clinicians\]

## 

## **Assessment & Plan — Diagnosis Block**

**\[Diagnosis Name\]**  
 **Status:** *Stable | Improved | Worsened | New*  
 **ICD-10:** *\[Code\]*

---

### **Plan**

Free-text clinical plan describing management strategy.

*Example:*  
 “Continue conservative management. No red flags. Escalate if symptoms worsen.”

---

### **Medications**

Structured \+ optional.

* ☐ **Add new medication**

* ☐ **Refill existing medication**

* ☐ **Modify existing medication**

* ☐ **Discontinue medication**

* ☐ **No medication changes**

When selected:

* Medication picker opens

* Provider can:

  * Select from current med list

  * Or prescribe a new medication

* AI assists with:

  * Dose suggestions

  * Weight-based dosing (pediatrics)

  * Diagnosis ↔ medication linking

  * Safety checks

---

### **Monitoring**

Optional structured or free text.

*Examples:*  
 “Monitor blood pressure daily.”  
 “Return if fever \>101°F or worsening pain.”

---

### **Orders**

Structured actions.

* ☐ **Labs**

* ☐ **Imaging**

* ☐ **No orders**

When selected:

* Lab / imaging order builder opens

* Orders are automatically linked to this diagnosis

---

### **Follow-Ups / Referrals**

Optional structured \+ free text.

* ☐ **Schedule follow-up visit**

* ☐ **Refer to specialist**

* ☐ **No follow-up needed**

*Example:*  
 “Follow up in 2 weeks if symptoms persist.”  
 “Referral to ENT.”

---

### **Patient Education**

Optional.

* ☐ **Standard education material**

* ☐ **Custom free-text education**

* ☐ **No education provided**

When selected:

* Provider can choose:

  * Prebuilt education handouts

  * Or enter free text

* Education content is linked to the diagnosis

---

### **Care Coordination**

Optional free text.

*Examples:*  
 “Discussed case with on-call cardiologist.”  
 “Updated primary care physician.”

---

### **Additional Notes (Free Text)**

Always available.

*Purpose:*  
 Catch-all space for anything that doesn’t fit structured fields.

---

## **Repeatable Pattern**

The above **Diagnosis Block** repeats for each diagnosis in the visit.

Example:

* Hypertension – Stable – I10

* Acute Otitis Media – New – H66.90

Each diagnosis has its **own Plan, Meds, Orders, Education, etc.**

---

# **Implementation Guidance for Engineers**

### **1\. Diagnosis-First Architecture**

* The A/P section should be built as a **repeatable diagnosis component**

* Each diagnosis:

  * Has its own state

  * Owns its meds, orders, education, and follow-up

---

### **2\. Action-Driven Sections (Not Just Text)**

Key sections (**Medications, Orders, Education, Follow-ups**) should be:

* **Actionable** (buttons, selectors)

* **Optional**

* **Explicitly “No action taken” when unused**

This avoids ambiguity in notes.

---

### **3\. “Bring Forward” Logic**

For Medications and Orders:

* Provider can:

  * Pull in an existing medication to refill

  * Or create a new one

* No duplication required

* The A/P references the actual med/order objects

---

### **4\. AI Integration Points**

AI can assist at these moments:

* Suggest ICD-10 when diagnosis is entered

* Suggest meds when diagnosis is selected

* Suggest labs or imaging

* Pre-populate patient education

* Draft plan text (editable)

AI suggestions are **reviewable, editable, and optional**.

---

### **5\. Free Text Is Always Available**

Even with structure:

* Every diagnosis block must allow unrestricted free text

* No forced completion of structured fields

---

### **6\. Final Output (Note Rendering)**

When finalized, the note renders as:

`Assessment:`  
`1. Acute Otitis Media – New (H66.90)`

`Plan:`  
`Start antibiotics.`

`Medications:`  
`Amoxicillin 400 mg/5 mL, 7.5 mL PO BID x 10 days`

`Orders:`  
`None`

`Follow-up:`  
`PRN if no improvement in 48 hours`

`Education:`  
`Discussed expected course and return precautions.`

`Coordination:`  
`None`

---

## **Why This Matters**

This structure:

* Matches real physician thinking

* Supports fast documentation

* Allows structured data for analytics

* Preserves narrative flexibility

* Integrates naturally with AI, meds, labs, and education

