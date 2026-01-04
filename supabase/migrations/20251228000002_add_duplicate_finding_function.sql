-- ============================================================================
-- Duplicate Finding Function Migration
-- Adds function to find and group duplicate patients for admin review
-- ============================================================================

-- Function to find duplicate patients grouped by similar name and DOB
CREATE OR REPLACE FUNCTION find_patient_duplicates()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_duplicates jsonb;
BEGIN
  -- Find groups of patients with identical or very similar information
  WITH duplicate_groups AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, MIN(p.created_at)) as group_id,
      COUNT(*) as duplicate_count,
      array_agg(p.id ORDER BY p.created_at) as patient_ids,
      array_agg(jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'date_of_birth', p.date_of_birth,
        'email', p.email,
        'phone', p.phone,
        'clinician_id', p.clinician_id,
        'created_at', p.created_at
      ) ORDER BY p.created_at) as patients
    FROM patients p
    GROUP BY
      LOWER(TRIM(p.first_name)),
      LOWER(TRIM(p.last_name)),
      p.date_of_birth
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, MIN(p.created_at)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'group_id', group_id,
      'duplicate_count', duplicate_count,
      'patient_ids', patient_ids,
      'patients', patients
    )
  ) INTO result_duplicates
  FROM duplicate_groups;

  RETURN COALESCE(result_duplicates, '[]'::jsonb);
END;
$$;
