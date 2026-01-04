-- ============================================================================
-- Manual Cleanup of Specific Orphaned Shares
-- Delete the specific orphaned shares we identified
-- ============================================================================

-- Delete the specific orphaned shares
DELETE FROM patient_shares
WHERE patient_id IN (
  'b5b83a25-5695-451f-b4d9-c13b5bf1a500',
  '5ff6cd58-5dfe-4fc2-a501-2fb2e93529b8'
);

-- Log the cleanup
INSERT INTO audit_log (table_name, record_id, action, old_values, performed_by, performed_at)
VALUES (
  'patient_shares',
  '00000000-0000-0000-0000-000000000000',
  'MANUAL_CLEANUP_ORPHANED_SHARES',
  jsonb_build_object('patient_ids', ARRAY['b5b83a25-5695-451f-b4d9-c13b5bf1a500', '5ff6cd58-5dfe-4fc2-a501-2fb2e93529b8']),
  (SELECT id FROM clinicians LIMIT 1),
  now()
);
