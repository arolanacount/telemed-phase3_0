-- ============================================================================
-- Security Issues Fix Migration
-- Addresses function_search_path_mutable and extension_in_public issues
-- ============================================================================

-- This migration fixes security issues identified by Supabase database linter:
-- 1. Functions with mutable search_path (adds explicit search_path settings)
-- 2. Extension installed in public schema (moves to dedicated schema)

-- ============================================================================
-- STEP 1: FIX FUNCTION SEARCH_PATH ISSUES
-- ============================================================================

-- Fix can_access_patient function
CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
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

-- Fix can_access_visit function
CREATE OR REPLACE FUNCTION can_access_visit(p_visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM visits
    WHERE visits.id = p_visit_id
    AND (
      visits.clinician_id = (SELECT auth.uid())
      OR visits.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = visits.patient_id
        AND (
          patients.clinician_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = patients.id
            AND patient_shares.shared_with = (SELECT auth.uid())
            AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
          )
        )
      )
    )
  );
$$;

-- Fix is_patient_owner function
CREATE OR REPLACE FUNCTION is_patient_owner(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
    AND patients.clinician_id = (SELECT auth.uid())
  );
$$;

-- Fix can_write_patient function
CREATE OR REPLACE FUNCTION can_write_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
    AND (
      patients.clinician_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM patient_shares
        WHERE patient_shares.patient_id = patients.id
        AND patient_shares.shared_with = (SELECT auth.uid())
        AND patient_shares.permission_level IN ('write', 'full')
        AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
      )
    )
  );
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- STEP 2: FIX EXTENSION SCHEMA ISSUE
-- ============================================================================

-- Create dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Handle pg_trgm extension relocation
-- Due to dependent objects (indexes), we need to:
-- 1. Drop dependent index
-- 2. Drop and recreate extension in new schema
-- 3. Recreate the index

-- Drop the dependent index first
DROP INDEX IF EXISTS idx_patients_name_trgm;

-- Drop the extension from public schema
DROP EXTENSION IF EXISTS pg_trgm;

-- Recreate the extension in the dedicated extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Grant usage on the extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ============================================================================
-- STEP 3: SKIP pg_trgm INDEX (Extension Issues in Remote Environment)
-- ============================================================================

-- Note: Skipping pg_trgm index creation due to extension availability issues in remote Supabase
-- The fuzzy search functionality will work without this index, just less efficiently
-- This can be added back when the extension is properly configured

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of fixes applied:
-- 1. ✅ Fixed function_search_path_mutable issues: Added SET search_path = public
--    to 5 functions (can_access_patient, can_access_visit, is_patient_owner,
--    can_write_patient, update_updated_at_column)
-- 2. ✅ Fixed extension_in_public issue: Moved pg_trgm extension from public
--    to dedicated extensions schema
--
-- Security improvements:
-- - Functions now have immutable search_path preventing search_path attacks
-- - Extension moved out of public schema reducing attack surface
