-- ============================================================================
-- Add Auth User Fields to Clinicians Table Migration
-- Adds email and other auth user fields to clinicians table for denormalization
-- ============================================================================

-- Add essential auth user fields to clinicians table
ALTER TABLE clinicians
ADD COLUMN IF NOT EXISTS email text;

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinicians_email ON clinicians(email);

-- Populate existing clinician records with auth user email
UPDATE clinicians
SET email = au.email
FROM auth.users au
WHERE clinicians.id = au.id;

-- Add unique constraint on email (optional, for data integrity)
-- ALTER TABLE clinicians ADD CONSTRAINT clinicians_email_unique UNIQUE (email);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinicians_email ON clinicians(email);

-- Update RLS policies to allow access to these fields
-- The existing policies should work, but adding explicit policy for email access
DROP POLICY IF EXISTS "Clinicians can read own data" ON clinicians;
CREATE POLICY "Clinicians can read own data"
  ON clinicians FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Allow clinicians to read other clinicians' basic info for sharing/searching
DROP POLICY IF EXISTS "Clinicians can read other clinicians basic info" ON clinicians;
CREATE POLICY "Clinicians can read other clinicians basic info"
  ON clinicians FOR SELECT
  TO authenticated
  USING (true);  -- Allow reading basic info, RLS on auth.users will restrict sensitive data

-- Note: Sensitive auth fields like app_metadata should be protected
-- Only allow access to public fields like email, full_name, etc.
