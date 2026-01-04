-- ============================================================================
-- Add Passport and Driver's License Fields to Patients
-- Enhances duplicate detection with additional permanent identifiers
-- ============================================================================

-- Add passport and driver's license fields to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS drivers_license text;

-- Add comments for documentation
COMMENT ON COLUMN patients.national_id IS 'National ID number - permanent identifier';
COMMENT ON COLUMN patients.passport_number IS 'Passport number - permanent identifier';
COMMENT ON COLUMN patients.drivers_license IS 'Driver''s license number - permanent identifier';

-- Update indexes for better duplicate detection performance
CREATE INDEX IF NOT EXISTS idx_patients_passport ON patients(passport_number) WHERE passport_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_license ON patients(drivers_license) WHERE drivers_license IS NOT NULL;
