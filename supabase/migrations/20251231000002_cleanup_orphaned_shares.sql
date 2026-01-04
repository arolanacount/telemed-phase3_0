-- ============================================================================
-- Cleanup Orphaned Patient Shares
-- Remove share records for patients that no longer exist
-- ============================================================================

-- Delete orphaned shares where the patient no longer exists
DELETE FROM patient_shares
WHERE patient_id NOT IN (
  SELECT id FROM patients
);
