-- ============================================================================
-- Fix Patient Merge Function
-- Updates the merge function to only handle existing tables
-- ============================================================================

-- Update the merge function to only handle tables that exist in current schema
CREATE OR REPLACE FUNCTION merge_patient_records(
  source_patient_id uuid,
  target_patient_id uuid,
  admin_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that both patients exist
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = source_patient_id) THEN
    RAISE EXCEPTION 'Source patient does not exist';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = target_patient_id) THEN
    RAISE EXCEPTION 'Target patient does not exist';
  END IF;

  -- Move patient shares (avoid duplicates) - this table exists in current schema
  INSERT INTO patient_shares (patient_id, shared_by, shared_with, permission_level, expires_at, created_at)
  SELECT
    target_patient_id,
    shared_by,
    shared_with,
    permission_level,
    expires_at,
    created_at
  FROM patient_shares
  WHERE patient_id = source_patient_id
  AND NOT EXISTS (
    SELECT 1 FROM patient_shares
    WHERE patient_id = target_patient_id
    AND shared_by = patient_shares.shared_by
    AND shared_with = patient_shares.shared_with
  );

  -- Log the merge operation
  INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
  VALUES (
    'patients',
    target_patient_id,
    'MERGE',
    jsonb_build_object('source_patient_id', source_patient_id),
    jsonb_build_object('target_patient_id', target_patient_id),
    admin_user_id,
    now()
  );

  -- Note: Additional table updates would be added here as more features are implemented
  -- For now, we only handle patient_shares since that's the only related table that exists
END;
$$;
