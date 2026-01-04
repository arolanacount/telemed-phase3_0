-- ============================================================================
-- Create Shared Patients View
-- Allows users to view patients shared with them without RLS restrictions
-- ============================================================================

-- Create a view for shared patients that bypasses RLS
CREATE OR REPLACE VIEW shared_patients AS
SELECT
  ps.patient_id,
  ps.shared_with,
  ps.permission_level,
  ps.created_at as shared_at,
  ps.shared_by,
  c.full_name as sharer_name,
  p.id,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.email,
  p.phone,
  p.created_at
FROM patient_shares ps
JOIN patients p ON ps.patient_id = p.id
LEFT JOIN clinicians c ON ps.shared_by = c.id
WHERE ps.expires_at IS NULL;

-- Grant access to the view
GRANT SELECT ON shared_patients TO authenticated;
