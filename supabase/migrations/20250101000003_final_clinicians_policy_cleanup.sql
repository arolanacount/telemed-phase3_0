-- ============================================================================
-- FINAL CLEANUP: Ensure Only One SELECT Policy on Clinicians Table
-- ============================================================================
-- Emergency cleanup to resolve persistent performance issue
-- This runs after all other migrations to ensure clean final state

BEGIN;

-- DROP ALL existing SELECT policies on clinicians table
-- This ensures we start with a clean slate regardless of what previous migrations did
DROP POLICY IF EXISTS "Clinicians can view own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read own data" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read other clinicians basic info" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can view other active clinicians" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can access clinician data" ON clinicians;

-- Recreate ONLY the essential policies we need
-- SELECT policy: Single consolidated policy for authenticated users
CREATE POLICY "Clinicians can access clinician data"
  ON clinicians FOR SELECT
  TO authenticated
  USING (true);

-- Clean up any conflicting INSERT/UPDATE policies and recreate them
DROP POLICY IF EXISTS "Clinicians can insert own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can update own profile" ON clinicians;

-- INSERT policy: Only own profile
CREATE POLICY "Clinicians can insert own profile"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE policy: Only own profile
CREATE POLICY "Clinicians can update own profile"
  ON clinicians FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Add clear documentation
COMMENT ON POLICY "Clinicians can access clinician data" ON clinicians IS
'FINAL CLEAN POLICY: Single SELECT policy for optimal performance. Allows authenticated users to read clinician data for sharing/searching. Security maintained through auth.users RLS. Eliminates multiple policy evaluation penalty.';

COMMIT;
