-- ============================================================================
-- Add Patient Delete Policy for Admin Merge Operations
-- Allows admins to delete patients during merge operations
-- ============================================================================

-- Add DELETE policy for patients table - only admins can delete
CREATE POLICY "Admins can delete patients for merging"
  ON patients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinicians
      WHERE clinicians.id = (SELECT auth.uid())
      AND clinicians.role = 'admin'
    )
  );
