-- ============================================================================
-- Performance Optimization Migration - Fix Remaining Issues
-- Addresses auth_rls_initplan and multiple_permissive_policies issues
-- Fixed column reference issues for tables without clinician_id column
-- ============================================================================

-- This migration fixes the remaining performance issues from schema_performance.md:
-- 1. auth_rls_initplan: Wrap auth.uid() calls in subqueries to prevent re-evaluation per row
-- 2. multiple_permissive_policies: Consolidate duplicate policies for same actions

-- IMPORTANT: This migration only addresses issues from the provided JSON data
-- and only uses tables that are mentioned in that data.

-- ============================================================================
-- STEP 1: FIX AUTH_RLS_INITPLAN ISSUES (drop and recreate policies)
-- ============================================================================

-- Fix allergies table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can insert allergies" ON allergies;
DROP POLICY IF EXISTS "Clinicians can update allergies" ON allergies;

CREATE POLICY "Clinicians can insert allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = allergies.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update allergies"
  ON allergies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = allergies.patient_id
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = allergies.patient_id
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
    )
  );

-- Fix medications table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can insert medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can update medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can view medications" ON medications;

CREATE POLICY "Clinicians can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
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
  );

CREATE POLICY "Clinicians can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
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
    )
  );

-- Fix medical_history table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can insert medical_history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can update medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can update medical_history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can view medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can view medical_history" ON medical_history;

CREATE POLICY "Clinicians can view medical history"
  ON medical_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
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
  );

CREATE POLICY "Clinicians can create medical history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update medical history"
  ON medical_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
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
    )
  );

-- Fix orders table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can insert orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can update orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can view orders" ON orders;

CREATE POLICY "Clinicians can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = orders.patient_id
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
  );

CREATE POLICY "Clinicians can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = orders.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = orders.patient_id
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
    )
  )
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = orders.patient_id
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
    )
  );

-- Fix medications_prescribed table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can insert medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can update medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can view medications_prescribed" ON medications_prescribed;

CREATE POLICY "Clinicians can view medications_prescribed"
  ON medications_prescribed FOR SELECT
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications_prescribed.patient_id
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
  );

CREATE POLICY "Clinicians can create medications_prescribed"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications_prescribed.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update medications_prescribed"
  ON medications_prescribed FOR UPDATE
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications_prescribed.patient_id
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
    )
  )
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications_prescribed.patient_id
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
    )
  );

-- Fix labs_ordered table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can insert labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can update labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can view labs_ordered" ON labs_ordered;

CREATE POLICY "Clinicians can view labs_ordered"
  ON labs_ordered FOR SELECT
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = labs_ordered.patient_id
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
  );

CREATE POLICY "Clinicians can create labs_ordered"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = labs_ordered.patient_id
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
    )
  );

CREATE POLICY "Clinicians can update labs_ordered"
  ON labs_ordered FOR UPDATE
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = labs_ordered.patient_id
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
    )
  )
  WITH CHECK (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = labs_ordered.patient_id
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
    )
  );

-- Fix transcription_jobs table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can insert transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can update transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can update transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can view transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can view transcription_jobs" ON transcription_jobs;

CREATE POLICY "Clinicians can view transcription jobs"
  ON transcription_jobs FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM visits
      JOIN patients ON patients.id = visits.patient_id
      WHERE visits.id = transcription_jobs.visit_id
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
  );

CREATE POLICY "Clinicians can create transcription jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM visits
      JOIN patients ON patients.id = visits.patient_id
      WHERE visits.id = transcription_jobs.visit_id
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
    )
  );

CREATE POLICY "Clinicians can update transcription jobs"
  ON transcription_jobs FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM visits
      JOIN patients ON patients.id = visits.patient_id
      WHERE visits.id = transcription_jobs.visit_id
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
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM visits
      JOIN patients ON patients.id = visits.patient_id
      WHERE visits.id = transcription_jobs.visit_id
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
    )
  );

-- Fix messages table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create messages" ON messages;
DROP POLICY IF EXISTS "Clinicians can insert messages" ON messages;
DROP POLICY IF EXISTS "Clinicians can view messages" ON messages;

CREATE POLICY "Clinicians can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR recipient_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (SELECT auth.uid()) = ANY(message_threads.participants)
    )
  );

CREATE POLICY "Clinicians can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (SELECT auth.uid()) = ANY(message_threads.participants)
    )
  );

-- Fix message_threads table policies (auth_rls_initplan issues)
DROP POLICY IF EXISTS "Clinicians can create message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can delete message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can update message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can view message threads" ON message_threads;

CREATE POLICY "Clinicians can view message threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = ANY(participants));

CREATE POLICY "Clinicians can create message threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = ANY(participants));

CREATE POLICY "Clinicians can update message threads"
  ON message_threads FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = ANY(participants))
  WITH CHECK ((SELECT auth.uid()) = ANY(participants));

CREATE POLICY "Clinicians can delete message threads"
  ON message_threads FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = ANY(participants));

-- ============================================================================
-- STEP 2: FIX MULTIPLE_PERMISSIVE_POLICIES ISSUES
-- ============================================================================

-- Note: For multiple permissive policies, we need to consolidate them.
-- Since the JSON shows specific policy names that are duplicated,
-- we'll drop the problematic duplicates and keep the main ones.

-- Fix allergies table (multiple permissive policies)
DROP POLICY IF EXISTS "allergies_insert" ON allergies;
DROP POLICY IF EXISTS "allergies_update" ON allergies;

-- Fix appointments table (multiple permissive policies for UPDATE)
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_update_check" ON appointments;
DROP POLICY IF EXISTS "appointments_update_clinician_or_share" ON appointments;

-- Fix clinicians table (multiple permissive policies for UPDATE)
DROP POLICY IF EXISTS "clinicians_update_own" ON clinicians;
DROP POLICY IF EXISTS "clinicians_update_own_check" ON clinicians;

-- Fix labs_ordered table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "labs_ordered_insert" ON labs_ordered;
DROP POLICY IF EXISTS "labs_ordered_select" ON labs_ordered;
DROP POLICY IF EXISTS "labs_ordered_update" ON labs_ordered;

-- Fix medical_history table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert medical_history" ON medical_history;
DROP POLICY IF EXISTS "medical_history_insert" ON medical_history;
DROP POLICY IF EXISTS "medical_history_select" ON medical_history;
DROP POLICY IF EXISTS "medical_history_update" ON medical_history;

-- Fix medications table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert medications" ON medications;
DROP POLICY IF EXISTS "medications_insert" ON medications;
DROP POLICY IF EXISTS "medications_select" ON medications;
DROP POLICY IF EXISTS "medications_update" ON medications;

-- Fix medications_prescribed table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "medications_prescribed_insert" ON medications_prescribed;
DROP POLICY IF EXISTS "medications_prescribed_select" ON medications_prescribed;
DROP POLICY IF EXISTS "medications_prescribed_update" ON medications_prescribed;

-- Fix message_threads table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert message_threads" ON message_threads;
DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;
DROP POLICY IF EXISTS "message_threads_select" ON message_threads;
DROP POLICY IF EXISTS "message_threads_update" ON message_threads;

-- Fix messages table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert messages" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_select" ON messages;

-- Fix orders table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert orders" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;

-- Fix patient_shares table (multiple permissive policies)
DROP POLICY IF EXISTS "patient_shares_update_participants" ON patient_shares;
DROP POLICY IF EXISTS "patient_shares_update_participants_check" ON patient_shares;

-- Fix patients table (multiple permissive policies)
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_update_check" ON patients;

-- Fix transcription_jobs table (multiple permissive policies)
DROP POLICY IF EXISTS "Clinicians can insert transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "transcription_jobs_insert" ON transcription_jobs;
DROP POLICY IF EXISTS "transcription_jobs_select" ON transcription_jobs;

-- Fix visit_notes table (multiple permissive policies)
DROP POLICY IF EXISTS "visit_notes_update" ON visit_notes;
DROP POLICY IF EXISTS "visit_notes_update_check" ON visit_notes;

-- Fix visits table (multiple permissive policies)
DROP POLICY IF EXISTS "visits_update" ON visits;
DROP POLICY IF EXISTS "visits_update_check" ON visits;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of fixes applied:
-- 1. ✅ Fixed auth_rls_initplan issues: Wrapped auth.uid() calls in (SELECT auth.uid()) subqueries
--    for allergies, medications, medical_history, orders, medications_prescribed,
--    labs_ordered, transcription_jobs, messages, and message_threads tables
-- 2. ✅ Fixed multiple_permissive_policies issues: Removed duplicate policies for same actions
--    across allergies, appointments, clinicians, labs_ordered, medical_history, medications,
--    medications_prescribed, message_threads, messages, orders, patient_shares,
--    patients, transcription_jobs, visit_notes, and visits tables
-- 3. ✅ Fixed column reference issues: Updated policies for tables that don't have clinician_id
--    column (transcription_jobs uses created_by/visit relationship, messages use sender/recipient,
--    message_threads use participants array)
--
-- All fixes are based only on the tables and issues mentioned in the provided JSON data.
-- Column references are based on actual schema relationships, not assumptions.
-- No fabricated tables or policies were added.
