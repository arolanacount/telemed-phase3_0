-- ============================================================================
-- Drop Shared Patients View
-- Removing the unnecessary view since existing RLS policies should work
-- ============================================================================

DROP VIEW IF EXISTS shared_patients;
