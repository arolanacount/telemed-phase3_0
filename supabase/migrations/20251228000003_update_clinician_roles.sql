-- ============================================================================
-- Update Clinician Roles Migration
-- Ensures proper role assignment and admin privileges
-- ============================================================================

-- Update demodoctor@telemed.com to admin role
UPDATE clinicians
SET role = 'admin', updated_at = now()
WHERE email = 'demodoctor@telemed.com';

-- For future role management, we could add a migration to set roles based on specialty
-- For now, we'll keep it simple: demodoctor@telemed.com is admin, others are clinicians
-- In a production system, you might want to add role selection during signup

-- Add a comment to document the role system
COMMENT ON COLUMN clinicians.role IS 'User role: admin (doctors), clinician (nurses), patient';
