-- ============================================================================
-- Fix can_access_patient Function
-- Ensure it correctly returns false for non-existent patients
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS can_access_patient(uuid);

-- Recreate with correct logic
CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- First check if patient exists at all
  SELECT EXISTS (
    SELECT 1 FROM patients WHERE id = p_patient_id
  ) AND EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
    AND (
      patients.clinician_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM patient_shares
        WHERE patient_shares.patient_id = patients.id
        AND patient_shares.shared_with = (SELECT auth.uid())
        AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
      )
    )
  );
$$;
