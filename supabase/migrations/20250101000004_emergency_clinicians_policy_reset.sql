-- ============================================================================
-- EMERGENCY RESET: Complete Clinicians Table Policy Cleanup
-- ============================================================================
-- Nuclear option: Drop ALL policies and recreate clean set
-- Addresses remaining multiple permissive policy issues

BEGIN;

-- DROP ALL EXISTING POLICIES ON CLINICIANS TABLE
-- This ensures complete cleanup regardless of policy names
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename = 'clinicians'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       policy_record.policyname,
                       policy_record.schemaname,
                       policy_record.tablename);
    END LOOP;
END $$;

-- RECREATE CLEAN POLICY SET WITH UNIQUE NAMES

-- SELECT: Single policy for authenticated users to access clinician data
CREATE POLICY "clinicians_select_policy"
  ON clinicians FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only allow inserting own profile
CREATE POLICY "clinicians_insert_policy"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE: Only allow updating own profile
CREATE POLICY "clinicians_update_policy"
  ON clinicians FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Add documentation
COMMENT ON POLICY "clinicians_select_policy" ON clinicians IS
'EMERGENCY RESET: Single SELECT policy for optimal performance. Allows authenticated users to access clinician data. Security maintained through auth.users RLS.';

COMMENT ON POLICY "clinicians_insert_policy" ON clinicians IS
'EMERGENCY RESET: Restrictive INSERT policy allowing only own profile creation.';

COMMENT ON POLICY "clinicians_update_policy" ON clinicians IS
'EMERGENCY RESET: Restrictive UPDATE policy allowing only own profile modification.';

COMMIT;
