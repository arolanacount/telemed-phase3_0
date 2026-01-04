-- Fix RLS policies to avoid infinite recursion
-- The issue is that helper functions query tables that have policies using those same functions

-- Drop problematic policies
DROP POLICY IF EXISTS "Clinicians can view accessible patients" ON patients;
DROP POLICY IF EXISTS "Clinicians can update patients with write access" ON patients;
DROP POLICY IF EXISTS "Clinicians can view appointments for their patients" ON appointments;
DROP POLICY IF EXISTS "Clinicians can view accessible visits" ON visits;

-- Recreate policies with direct conditions instead of helper functions

-- Patients policies
CREATE POLICY "Clinicians can view their own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  );

CREATE POLICY "Clinicians can update their own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND patient_shares.permission_level IN ('write', 'full')
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  )
  WITH CHECK (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND patient_shares.permission_level IN ('write', 'full')
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  );

-- Appointments policies
CREATE POLICY "Clinicians can view appointments for their patients"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares ps
          WHERE ps.patient_id = patients.id
          AND ps.shared_with = auth.uid()
          AND (ps.expires_at IS NULL OR ps.expires_at > now())
        )
      )
    )
  );

CREATE POLICY "Clinicians can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

-- Visits policies
CREATE POLICY "Clinicians can view accessible visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = visits.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares ps
          WHERE ps.patient_id = patients.id
          AND ps.shared_with = auth.uid()
          AND (ps.expires_at IS NULL OR ps.expires_at > now())
        )
      )
    )
  );

CREATE POLICY "Clinicians can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
    OR last_edited_by = auth.uid()
  )
  WITH CHECK (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
  );

-- Keep the helper functions for other uses, but revoke execution to prevent their use in policies
-- These can still be used in application code where needed
REVOKE EXECUTE ON FUNCTION can_access_patient(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION can_access_visit(uuid) FROM anon, authenticated;
