-- Migration: add visit_notes subcategory fields
-- Adds text fields to persist note subcategories (behavioral/clinical formats and mental health specific fields)

ALTER TABLE visit_notes
  ADD COLUMN IF NOT EXISTS data text,
  ADD COLUMN IF NOT EXISTS behavior text,
  ADD COLUMN IF NOT EXISTS intervention text,
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS problem text,
  ADD COLUMN IF NOT EXISTS mental_status text,
  ADD COLUMN IF NOT EXISTS risk_assessment text,
  ADD COLUMN IF NOT EXISTS rating_scales text,
  ADD COLUMN IF NOT EXISTS treatment_goals text,
  ADD COLUMN IF NOT EXISTS medications_review text,
  ADD COLUMN IF NOT EXISTS follow_up text,
  ADD COLUMN IF NOT EXISTS referrals text;

-- Optional indexes for fields that may be searched often (leave commented until needed)
-- CREATE INDEX IF NOT EXISTS idx_visit_notes_behavior ON visit_notes (behavior);
-- CREATE INDEX IF NOT EXISTS idx_visit_notes_goal ON visit_notes (goal);

COMMENT ON COLUMN visit_notes.behavior IS 'BIRP: Behavior - presenting symptoms';
COMMENT ON COLUMN visit_notes.intervention IS 'Interventions used (BIRP/GIRP/PIRP)';
COMMENT ON COLUMN visit_notes.response IS 'Response to interventions (BIRP/GIRP/PIRP)';
COMMENT ON COLUMN visit_notes.mental_status IS 'Structured or free-text Mental Status Exam/MSE';
COMMENT ON COLUMN visit_notes.risk_assessment IS 'Risk assessment / safety plan notes';
COMMENT ON COLUMN visit_notes.rating_scales IS 'Survey or rating scale results (PHQ-9, GAD-7) as text or JSON string';
COMMENT ON COLUMN visit_notes.treatment_goals IS 'Treatment goals (G in GIRP)';
COMMENT ON COLUMN visit_notes.medications_review IS 'Medication reconciliation and allergies review';
COMMENT ON COLUMN visit_notes.follow_up IS 'Follow-up instructions / schedule';
COMMENT ON COLUMN visit_notes.referrals IS 'Referrals placed or recommended';
COMMENT ON COLUMN visit_notes.data IS 'DAP: combined Data section (subjective/objective)';
COMMENT ON COLUMN visit_notes.problem IS 'PIRP: Problem field';
COMMENT ON COLUMN visit_notes.goal IS 'GIRP: Goal field';

-- Update updated_at trigger if present by touching row
UPDATE visit_notes SET updated_at = now() WHERE true;
