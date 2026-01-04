-- ============================================================================
-- Add Missing Foreign Key Indexes
-- Fixes unindexed_foreign_keys performance issues
-- ============================================================================

-- This migration adds indexes for foreign key constraints that were missing indexes.
-- These indexes improve query performance, especially for joins and foreign key lookups.
-- Based on Supabase database linter recommendations.

-- ============================================================================
-- INDEXES FOR ALLERGIES TABLE
-- ============================================================================

-- Index for allergies.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_allergies_created_by ON allergies(created_by);

-- Index for allergies.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_allergies_updated_by ON allergies(updated_by);

-- ============================================================================
-- INDEXES FOR APPOINTMENTS TABLE
-- ============================================================================

-- Index for appointments.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);

-- Index for appointments.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_appointments_updated_by ON appointments(updated_by);

-- ============================================================================
-- INDEXES FOR LABS_ORDERED TABLE
-- ============================================================================

-- Index for labs_ordered.clinician_id foreign key
CREATE INDEX IF NOT EXISTS idx_labs_ordered_clinician_id ON labs_ordered(clinician_id);

-- Index for labs_ordered.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_labs_ordered_created_by ON labs_ordered(created_by);

-- Index for labs_ordered.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_labs_ordered_order_id ON labs_ordered(order_id);

-- ============================================================================
-- INDEXES FOR MEDICAL_HISTORY TABLE
-- ============================================================================

-- Index for medical_history.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_medical_history_created_by ON medical_history(created_by);

-- Index for medical_history.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_medical_history_updated_by ON medical_history(updated_by);

-- ============================================================================
-- INDEXES FOR MEDICATIONS TABLE
-- ============================================================================

-- Index for medications.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_medications_created_by ON medications(created_by);

-- Index for medications.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_medications_updated_by ON medications(updated_by);

-- ============================================================================
-- INDEXES FOR MEDICATIONS_PRESCRIBED TABLE
-- ============================================================================

-- Index for medications_prescribed.clinician_id foreign key
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_clinician_id ON medications_prescribed(clinician_id);

-- Index for medications_prescribed.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_created_by ON medications_prescribed(created_by);

-- Index for medications_prescribed.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_order_id ON medications_prescribed(order_id);

-- ============================================================================
-- INDEXES FOR MESSAGE_THREADS TABLE
-- ============================================================================

-- Index for message_threads.patient_id foreign key
CREATE INDEX IF NOT EXISTS idx_message_threads_patient_id ON message_threads(patient_id);

-- ============================================================================
-- INDEXES FOR MESSAGES TABLE
-- ============================================================================

-- Index for messages.visit_id foreign key
CREATE INDEX IF NOT EXISTS idx_messages_visit_id ON messages(visit_id);

-- ============================================================================
-- INDEXES FOR ORDERS TABLE
-- ============================================================================

-- Index for orders.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- ============================================================================
-- INDEXES FOR PATIENT_SHARES TABLE
-- ============================================================================

-- Index for patient_shares.shared_by foreign key
CREATE INDEX IF NOT EXISTS idx_patient_shares_shared_by ON patient_shares(shared_by);

-- ============================================================================
-- INDEXES FOR PATIENTS TABLE
-- ============================================================================

-- Index for patients.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);

-- Index for patients.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_patients_updated_by ON patients(updated_by);

-- ============================================================================
-- INDEXES FOR VISIT_NOTES TABLE
-- ============================================================================

-- Index for visit_notes.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_visit_notes_created_by ON visit_notes(created_by);

-- Index for visit_notes.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_visit_notes_updated_by ON visit_notes(updated_by);

-- ============================================================================
-- INDEXES FOR VISIT_RECORDINGS TABLE
-- ============================================================================

-- Index for visit_recordings.uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_visit_recordings_uploaded_by ON visit_recordings(uploaded_by);

-- ============================================================================
-- INDEXES FOR VISITS TABLE
-- ============================================================================

-- Index for visits.finalized_by foreign key
CREATE INDEX IF NOT EXISTS idx_visits_finalized_by ON visits(finalized_by);

-- Index for visits.last_edited_by foreign key
CREATE INDEX IF NOT EXISTS idx_visits_last_edited_by ON visits(last_edited_by);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of indexes added:
-- 1. ✅ allergies: created_by, updated_by
-- 2. ✅ appointments: created_by, updated_by
-- 3. ✅ labs_ordered: clinician_id, created_by, order_id
-- 4. ✅ medical_history: created_by, updated_by
-- 5. ✅ medications: created_by, updated_by
-- 6. ✅ medications_prescribed: clinician_id, created_by, order_id
-- 7. ✅ message_threads: patient_id
-- 8. ✅ messages: visit_id
-- 9. ✅ orders: created_by
-- 10. ✅ patient_shares: shared_by
-- 11. ✅ patients: created_by, updated_by
-- 12. ✅ visit_notes: created_by, updated_by
-- 13. ✅ visit_recordings: uploaded_by
-- 14. ✅ visits: finalized_by, last_edited_by
--
-- Total: 26 indexes added to cover all unindexed foreign keys
-- Note: Unused indexes were intentionally left as-is per requirements
