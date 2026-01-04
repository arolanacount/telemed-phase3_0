-- Add comprehensive patient search function
-- This function enables searching across all patient fields including dates

CREATE OR REPLACE FUNCTION search_patients_comprehensive(
  search_query text,
  page_limit integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_patients jsonb;
  total_count integer;
BEGIN
  -- Get total count of matching patients
  SELECT COUNT(*) INTO total_count
  FROM patients
  WHERE
    first_name ILIKE '%' || search_query || '%' OR
    last_name ILIKE '%' || search_query || '%' OR
    email ILIKE '%' || search_query || '%' OR
    phone ILIKE '%' || search_query || '%' OR
    date_of_birth::text ILIKE '%' || search_query || '%';

  -- Get paginated results
  SELECT jsonb_build_object(
    'patients',
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'first_name', p.first_name,
          'last_name', p.last_name,
          'date_of_birth', p.date_of_birth,
          'phone', p.phone,
          'email', p.email,
          'created_at', p.created_at
        )
      ),
      '[]'::jsonb
    ),
    'total_count', total_count
  ) INTO result_patients
  FROM (
    SELECT *
    FROM patients
    WHERE
      first_name ILIKE '%' || search_query || '%' OR
      last_name ILIKE '%' || search_query || '%' OR
      email ILIKE '%' || search_query || '%' OR
      phone ILIKE '%' || search_query || '%' OR
      date_of_birth::text ILIKE '%' || search_query || '%'
    ORDER BY created_at DESC
    LIMIT page_limit
    OFFSET page_offset
  ) p;

  RETURN result_patients;
END;
$$;
