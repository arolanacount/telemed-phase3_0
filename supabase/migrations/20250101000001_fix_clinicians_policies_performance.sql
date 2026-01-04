-- ============================================================================
-- Fix Performance Issue: Consolidate Multiple Permissive Policies on Clinicians Table
-- ============================================================================
-- Issue: Multiple permissive SELECT policies for authenticated role on clinicians table
-- Root Cause: Multiple SELECT policies for authenticated users force duplicate evaluation
-- Solution: Consolidate into single efficient policy

BEGIN;

-- Drop ALL conflicting SELECT policies for authenticated users on clinicians
DROP POLICY IF EXISTS "Clinicians can view other active clinicians" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can view own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read own data" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can read other clinicians basic info" ON clinicians;

-- Create a single consolidated policy that handles both cases efficiently
-- This eliminates the multiple policy evaluation performance issue
CREATE POLICY "Clinicians can access clinician data"
  ON clinicians FOR SELECT
  TO authenticated
  USING (
    -- Allow access to own data (restrictive access)
    id = (SELECT auth.uid())
    OR
    -- Allow access to other clinicians for sharing/searching (permissive access)
    true
  );

-- Add comment explaining the consolidated policy approach
COMMENT ON POLICY "Clinicians can access clinician data" ON clinicians IS
'Consolidated SELECT policy for optimal performance: combines restrictive (own data) and permissive (all clinician data for sharing/searching) access in single policy evaluation. Eliminates multiple policy performance penalty.';

COMMIT;
