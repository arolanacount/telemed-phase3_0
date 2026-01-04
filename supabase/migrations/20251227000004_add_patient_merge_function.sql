-- ============================================================================
-- Patient Merge Function Migration
-- Adds function to merge duplicate patient records (admin only)
-- ============================================================================

-- Function to merge all records from source patient to target patient
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

  -- Move patient shares (avoid duplicates) - this table exists
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


-- Create audit_log table if it doesn't exist (for tracking merges)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid REFERENCES clinicians(id),
  performed_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinicians
      WHERE clinicians.id = (SELECT auth.uid())
      AND clinicians.role = 'admin'
    )
  );

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinicians
      WHERE clinicians.id = (SELECT auth.uid())
      AND clinicians.role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON audit_log(performed_at);
