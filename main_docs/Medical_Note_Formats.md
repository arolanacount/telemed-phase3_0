# Medical Note Formats Guide

This document outlines the standard medical note formats supported by the Telehealth Platform, along with their structure and use cases.

## Supported Formats

### 1. SOAP (Subjective, Objective, Assessment, Plan)
**Most Common Format** - Used for primary care, internal medicine, and most clinical encounters.

**Structure:**
- **S (Subjective)**: Patient's reported symptoms, history, and concerns
- **O (Objective)**: Clinical findings, vital signs, physical exam results
- **A (Assessment)**: Diagnosis and clinical impressions
- **P (Plan)**: Treatment plan, medications, follow-up

**Use Cases:** General medicine, primary care, most outpatient visits

---

### 2. DAP (Data, Assessment, Plan)
**Simplified Format** - Streamlined version of SOAP, focuses on essential elements.

**Structure:**
- **D (Data)**: Combines subjective and objective information
- **A (Assessment)**: Diagnosis and clinical reasoning
- **P (Plan)**: Treatment and management plan

**Use Cases:** Quick notes, follow-up visits, when detailed SOAP isn't needed

---

### 3. BIRP (Behavior, Intervention, Response, Plan)
**Behavioral Health Format** - Designed for mental health and behavioral health documentation.

**Structure:**
- **B (Behavior)**: Client's presenting behaviors and symptoms
- **I (Intervention)**: Therapeutic interventions and techniques used
- **R (Response)**: Client's response to interventions
- **P (Plan)**: Future treatment plans and goals

**Use Cases:** Psychiatry, psychology, counseling, behavioral health

---

### 4. GIRP (Goal, Intervention, Response, Plan)
**Goal-Oriented Format** - Focuses on measurable goals and outcomes.

**Structure:**
- **G (Goal)**: Specific, measurable treatment goals
- **I (Intervention)**: Actions taken to achieve goals
- **R (Response)**: Progress toward goals
- **P (Plan)**: Next steps and goal adjustments

**Use Cases:** Rehabilitation, physical therapy, long-term care planning

---

### 5. PIRP (Problem, Intervention, Response, Plan)
**Problem-Focused Format** - Emphasizes specific problems and solutions.

**Structure:**
- **P (Problem)**: Identified problems or issues
- **I (Intervention)**: Interventions applied to address problems
- **R (Response)**: Response to interventions
- **P (Plan)**: Plans for ongoing care

**Use Cases:** Case management, social work, complex care coordination

---

## Format Selection Guidelines

### When to Use Each Format:

**SOAP:**
- Comprehensive evaluations
- New patient visits
- Complex medical cases
- Academic/healthcare system documentation

**DAP:**
- Routine follow-ups
- Simple cases
- Time-constrained visits
- When SOAP would be overkill

**BIRP:**
- Mental health encounters
- Counseling sessions
- Behavioral health assessments
- Psychotherapy notes

**GIRP:**
- Rehabilitation services
- Physical/occupational therapy
- Goal-directed treatment plans
- Progress tracking

**PIRP:**
- Case management
- Social services
- Complex care coordination
- Problem-solving focused care

## Implementation in Telehealth Platform

### User Interface:
- Format selection dropdown in visit creation
- Default format can be set per clinician/specialty
- Format can be changed during visit (with data migration)
- Visual indicators show current format

### Data Structure:
Each format maps to specific sections in the `visit_notes` table:

```typescript
interface VisitNote {
  format: 'soap' | 'dap' | 'birp' | 'girp' | 'pirp'

  // SOAP fields
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string

  // DAP fields
  data?: string

  // BIRP fields
  behavior?: string
  intervention?: string
  response?: string

  // GIRP fields
  goal?: string

  // PIRP fields
  problem?: string

  // Common fields
  additional_notes?: string
  ai_generated?: boolean
  ai_confidence?: any
}
```

### Format Switching:
- When format is changed, existing data is preserved
- New format gets empty fields
- Previous format data remains accessible
- Migration is seamless and non-destructive

## Benefits of Multiple Formats

1. **Specialty-Specific Documentation**: Different medical specialties have different documentation needs
2. **Workflow Optimization**: Clinicians can use the format that matches their thinking process
3. **Regulatory Compliance**: Different settings may require different formats
4. **Training and Education**: Residents can learn multiple documentation styles
5. **Flexibility**: One platform supports various practice types

## Future Enhancements

- Custom format creation
- Specialty-specific defaults
- Format templates per clinician
- AI-assisted format selection based on visit type
- Integration with EHR systems that require specific formats
