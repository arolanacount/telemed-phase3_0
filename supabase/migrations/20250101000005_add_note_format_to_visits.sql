-- Add note_format column to visits table
-- This allows users to select different medical note formats (SOAP, DAP, BIRP, etc.)

ALTER TABLE visits
ADD COLUMN note_format text DEFAULT 'soap' CHECK (note_format IN ('soap', 'dap', 'birp', 'girp', 'pirp'));

-- Add comment for documentation
COMMENT ON COLUMN visits.note_format IS 'Medical note format: soap, dap, birp, girp, or pirp';
