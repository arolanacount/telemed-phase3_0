-- ============================================================================
-- Create Function to Get Shared Patient Data
-- Bypasses RLS issues by using SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION get_shared_patient_data(p_patient_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'date_of_birth', p.date_of_birth,
    'email', p.email,
    'phone', p.phone,
    'created_at', p.created_at
  )
  FROM patients p
  WHERE p.id = p_patient_id;
$$;
