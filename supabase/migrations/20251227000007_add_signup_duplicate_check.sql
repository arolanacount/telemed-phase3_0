-- ============================================================================
-- Patient Duplicate Check Function Migration
-- Adds function to check for patient duplicates during patient creation
-- ============================================================================

-- Function to check for patient duplicates during signup (bypasses RLS)
CREATE OR REPLACE FUNCTION check_patient_duplicates_signup(
  p_first_name text,
  p_last_name text,
  p_date_of_birth date,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_national_id text DEFAULT NULL,
  p_passport_number text DEFAULT NULL,
  p_drivers_license text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_patients jsonb;
BEGIN
  -- Check for patients with matching criteria
  -- Include ID fields for stronger duplicate detection
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'date_of_birth', p.date_of_birth,
      'phone', p.phone,
      'email', p.email,
      'national_id', p.national_id,
      'passport_number', p.passport_number,
      'drivers_license', p.drivers_license,
      'clinician_id', p.clinician_id
    )
  ) INTO result_patients
  FROM patients p
  WHERE (
    -- Primary match: name and DOB
    (p.first_name ILIKE p_first_name
     AND p.last_name ILIKE p_last_name
     AND p.date_of_birth = p_date_of_birth)
    OR
    -- Strong ID matches
    (p_national_id IS NOT NULL AND p.national_id = p_national_id)
    OR
    (p_passport_number IS NOT NULL AND p.passport_number = p_passport_number)
    OR
    (p_drivers_license IS NOT NULL AND p.drivers_license = p_drivers_license)
    OR
    -- Email/Phone matches if provided
    (p_email IS NOT NULL AND p.email ILIKE p_email)
    OR
    (p_phone IS NOT NULL AND p.phone ILIKE p_phone)
  )
  LIMIT 5;

  RETURN COALESCE(result_patients, '[]'::jsonb);
END;
$$;

-- Revoke execute from authenticated users for security (only service role can execute)
REVOKE EXECUTE ON FUNCTION check_patient_duplicates_signup(text, text, date, text, text, text, text, text) FROM authenticated;

-- Update index for duplicate checking performance with new fields
DROP INDEX IF EXISTS idx_patients_duplicate_check;
CREATE INDEX IF NOT EXISTS idx_patients_duplicate_check ON patients(first_name, last_name, date_of_birth, email, phone, national_id, passport_number, drivers_license);
