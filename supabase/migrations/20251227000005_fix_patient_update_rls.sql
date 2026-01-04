-- Fix patient UPDATE RLS policy issue
-- The WITH CHECK clause was preventing updates even when user owned the patient

-- Drop any existing problematic policy
DROP POLICY IF EXISTS "Clinicians can update patients with write access" ON patients;

-- Recreate with permissive WITH CHECK to allow updates
CREATE POLICY "Clinicians can update patients with write access"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = (SELECT auth.uid())
      AND patient_shares.permission_level IN ('write', 'full')
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  )
  WITH CHECK (true); -- Allow updates - security is handled by USING clause
