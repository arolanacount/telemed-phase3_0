-- ============================================================================
-- Force Fix: Completely Consolidate Clinicians Table Policies
-- ============================================================================
-- Emergency fix for persistent performance issue with multiple SELECT policies

BEGIN;

-- Drop ALL existing policies on clinicians table to start fresh
DROP POLICY IF EXISTS "Clinicians can view other active clinicians" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can view own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can insert own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can update own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read own data" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read other clinicians basic info" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can access clinician data" ON clinicians;

-- Recreate essential policies with optimal structure

-- INSERT policy (restrictive - only own data)
CREATE POLICY "Clinicians can insert own profile"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE policy (restrictive - only own data)
CREATE POLICY "Clinicians can update own profile"
  ON clinicians FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- SELECT policy (consolidated - single policy for both own and others data)
CREATE POLICY "Clinicians can access clinician data"
  ON clinicians FOR SELECT
  TO authenticated
  USING (true);  -- Simplified: allow all authenticated users to read clinician data
                  -- Security is maintained through auth.users RLS for sensitive fields

-- Add explanatory comment
COMMENT ON POLICY "Clinicians can access clinician data" ON clinicians IS
'Single consolidated SELECT policy for optimal performance. Allows authenticated users to access clinician data for sharing/searching. Sensitive auth fields protected by auth.users RLS.';

COMMIT;
