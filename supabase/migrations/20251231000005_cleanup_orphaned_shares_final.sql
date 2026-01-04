-- ============================================================================
-- Final Cleanup of Orphaned Shares
-- Remove patient_shares records that reference non-existent patients
-- ============================================================================

-- Delete orphaned shares where the patient no longer exists
DELETE FROM patient_shares
WHERE patient_id NOT IN (
  SELECT id FROM patients
);

-- Log the cleanup operation
INSERT INTO audit_log (table_name, record_id, action, old_values, performed_by, performed_at)
VALUES (
  'patient_shares',
  '00000000-0000-0000-0000-000000000000',
  'CLEANUP_ORPHANED_SHARES_FINAL',
  jsonb_build_object('description', 'Final cleanup of orphaned patient_shares records'),
  (SELECT id FROM clinicians WHERE email = 'demodoctor@telemed.com' LIMIT 1),
  now()
);
