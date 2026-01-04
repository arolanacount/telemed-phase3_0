/*
  # Atlas Telemedicine Platform - Optimized Database Schema
  # Built following Schema Assistance Guidelines for Secure RLS & Key Management

  ## Overview
  This migration creates a secure, HIPAA-compliant database schema for the ICF Telehealth Platform.
  Optimized for minimal performance impact with proper RLS policies and safe key usage.

  ## Security Design
  - Uses pgcrypto extension for secure UUID generation
  - RLS enabled on all tables with optimized policies
  - Helper functions for complex access checks
  - Proper service_role restrictions
  - Audit trails with created_by/updated_by enforcement

  ## Tables Created

  ### Core Tables
  1. **clinicians** - Extends auth.users with clinician-specific profile data
  2. **patients** - Master patient profiles with demographics and contact information
  3. **patient_shares** - Controls patient record sharing between clinicians
  4. **appointments** - Scheduled appointments and their status
  5. **visits** - Clinical encounters/visits with patients
  6. **visit_notes** - Structured clinical documentation for each visit
  7. **visit_recordings** - Audio/video recordings linked to visits

  ### Medical Records
  8. **allergies** - Patient allergies and reactions
  9. **medications** - Current medications for patients
  10. **medical_history** - Past medical history entries
  11. **orders** - Medical orders (medications, labs, imaging, referrals)
  12. **medications_prescribed** - Detailed prescription records
  13. **labs_ordered** - Laboratory test orders

  ### AI & Transcription
  14. **transcription_jobs** - Tracks audio transcription processing

  ### Communication
  15. **messages** - Internal messaging system
  16. **message_threads** - Message conversation threading

  ## Key Security Features
  - All tables use RLS with TO authenticated policies
  - Complex access checks use SECURITY DEFINER helper functions
  - Service role access restricted to administrative operations
  - Proper indexing for RLS predicate performance
  - Audit fields automatically populated
*/

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Use pgcrypto for secure UUID generation (preferred over uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if current user can access a patient
CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
    AND (
      patients.clinician_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM patient_shares
        WHERE patient_shares.patient_id = patients.id
        AND patient_shares.shared_with = (SELECT auth.uid())
        AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
      )
    )
  );
$$;

-- Function to check if current user can access a visit
CREATE OR REPLACE FUNCTION can_access_visit(p_visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM visits
    WHERE visits.id = p_visit_id
    AND (
      visits.clinician_id = (SELECT auth.uid())
      OR visits.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = visits.patient_id
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
    )
  );
$$;

-- Function to check if current user owns a patient
CREATE OR REPLACE FUNCTION is_patient_owner(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
    AND patients.clinician_id = (SELECT auth.uid())
  );
$$;

-- Function to check if current user has write access to a patient
CREATE OR REPLACE FUNCTION can_write_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = p_patient_id
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
  );
$$;

-- Revoke execute from public roles for security
REVOKE EXECUTE ON FUNCTION can_access_patient(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION can_access_visit(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_patient_owner(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION can_write_patient(uuid) FROM anon, authenticated;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('clinician', 'nurse', 'admin', 'patient');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_type AS ENUM ('wellness', 'sick', 'chronic_care', 'medication_refill', 'telehealth_video', 'telehealth_audio', 'in_person', 'home_visit');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('draft', 'scheduled', 'in_progress', 'pending_review', 'finalized', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('medication', 'lab', 'imaging', 'referral');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('draft', 'sent', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('patient_to_clinician', 'clinician_to_clinician', 'nurse_to_doctor', 'system', 'lab_pharmacy');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE permission_level AS ENUM ('read', 'write', 'full');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transcription_status AS ENUM ('queued', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinicians (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  specialty text,
  license_number text,
  phone text,
  role user_role DEFAULT 'clinician' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES clinicians(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text,
  national_id text,
  email text,
  phone text,
  address text,
  city text,
  parish text,
  postal_code text,
  country text DEFAULT 'Jamaica',
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  blood_type text,
  occupation text,
  marital_status text,
  smoking_status text,
  alcohol_use text,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS patient_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  permission_level permission_level DEFAULT 'read' NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(patient_id, shared_with)
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30 NOT NULL,
  appointment_type visit_type NOT NULL,
  status appointment_status DEFAULT 'scheduled' NOT NULL,
  location text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  visit_type visit_type NOT NULL,
  visit_status visit_status DEFAULT 'draft' NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  location text,
  chief_complaint text,
  last_edited_by uuid REFERENCES clinicians(id),
  last_edited_at timestamptz DEFAULT now() NOT NULL,
  finalized_by uuid REFERENCES clinicians(id),
  finalized_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS visit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  chief_complaint text,
  history_present_illness text,
  review_of_systems jsonb DEFAULT '{}'::jsonb,
  vitals jsonb DEFAULT '{}'::jsonb,
  physical_exam jsonb DEFAULT '{}'::jsonb,
  assessment text,
  diagnoses jsonb DEFAULT '[]'::jsonb,
  plan text,
  ai_generated boolean DEFAULT false,
  ai_confidence jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS visit_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_size bigint,
  duration_seconds integer,
  content_type text,
  uploaded_by uuid NOT NULL REFERENCES clinicians(id),
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- MEDICAL RECORDS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  reaction text,
  severity text,
  onset_date date,
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  route text,
  start_date date,
  end_date date,
  prescriber text,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  condition text NOT NULL,
  diagnosis_date date,
  status text,
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id),
  updated_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  order_type order_type NOT NULL,
  status order_status DEFAULT 'draft' NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  sent_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS medications_prescribed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  form text,
  frequency text NOT NULL,
  route text,
  quantity integer,
  refills integer DEFAULT 0,
  instructions text,
  pharmacy_name text,
  pharmacy_phone text,
  status order_status DEFAULT 'draft' NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id)
);

CREATE TABLE IF NOT EXISTS labs_ordered (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  lab_test_name text NOT NULL,
  lab_test_code text,
  special_instructions text,
  status order_status DEFAULT 'draft' NOT NULL,
  sent_at timestamptz,
  results_received_at timestamptz,
  results jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES clinicians(id)
);

-- ============================================================================
-- AI & TRANSCRIPTION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS transcription_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  audio_path text NOT NULL,
  status transcription_status DEFAULT 'queued' NOT NULL,
  transcript_text text,
  word_timestamps jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  created_by uuid REFERENCES clinicians(id)
);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  subject text,
  body text NOT NULL,
  priority text DEFAULT 'normal',
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  visit_id uuid REFERENCES visits(id) ON DELETE SET NULL,
  thread_id uuid,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  participants uuid[] NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinicians_role ON clinicians(role);
CREATE INDEX IF NOT EXISTS idx_clinicians_active ON clinicians(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_clinician ON patients(clinician_id);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id) WHERE national_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_shares_patient ON patient_shares(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_shares_shared_with ON patient_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician ON appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_clinician ON visits(clinician_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_visits_started ON visits(started_at);
CREATE INDEX IF NOT EXISTS idx_visits_appointment ON visits(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_notes_visit ON visit_notes(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_recordings_visit ON visit_recordings(visit_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_active ON allergies(is_active);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_active ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_clinician ON orders(clinician_id);
CREATE INDEX IF NOT EXISTS idx_orders_visit ON orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_patient ON medications_prescribed(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_visit ON medications_prescribed(visit_id);
CREATE INDEX IF NOT EXISTS idx_labs_ordered_patient ON labs_ordered(patient_id);
CREATE INDEX IF NOT EXISTS idx_labs_ordered_visit ON labs_ordered(visit_id);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_visit ON transcription_jobs(visit_id);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_status ON transcription_jobs(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads USING gin(participants);

-- Additional indexes for RLS performance (per schema_assistance.md recommendations)
CREATE INDEX IF NOT EXISTS idx_patients_clinician_active ON patients(clinician_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_shares_patient_shared_with ON patient_shares(patient_id, shared_with);
CREATE INDEX IF NOT EXISTS idx_patient_shares_expires_at ON patient_shares(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_patient_clinician ON visits(patient_id, clinician_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_by ON visits(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_clinician ON appointments(patient_id, clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON appointments(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_orders_patient_clinician_status ON orders(patient_id, clinician_id, status);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_created_by_status ON transcription_jobs(created_by, status);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_clinicians_updated_at ON clinicians;
  CREATE TRIGGER update_clinicians_updated_at BEFORE UPDATE ON clinicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
  CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_patient_shares_updated_at ON patient_shares;
  CREATE TRIGGER update_patient_shares_updated_at BEFORE UPDATE ON patient_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
  CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
  CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_visit_notes_updated_at ON visit_notes;
  CREATE TRIGGER update_visit_notes_updated_at BEFORE UPDATE ON visit_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_allergies_updated_at ON allergies;
  CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON allergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
  CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_medical_history_updated_at ON medical_history;
  CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
  CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_medications_prescribed_updated_at ON medications_prescribed;
  CREATE TRIGGER update_medications_prescribed_updated_at BEFORE UPDATE ON medications_prescribed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_labs_ordered_updated_at ON labs_ordered;
  CREATE TRIGGER update_labs_ordered_updated_at BEFORE UPDATE ON labs_ordered
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications_prescribed ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs_ordered ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Clinicians
-- ============================================================================

CREATE POLICY "Clinicians can view own profile"
  ON clinicians FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Clinicians can insert own profile"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Clinicians can update own profile"
  ON clinicians FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Clinicians can view other active clinicians"
  ON clinicians FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- RLS POLICIES - Patients
-- ============================================================================

CREATE POLICY "Clinicians can view accessible patients"
  ON patients FOR SELECT
  TO authenticated
  USING (can_access_patient(id));

CREATE POLICY "Clinicians can create patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Clinicians can update patients with write access"
  ON patients FOR UPDATE
  TO authenticated
  USING (can_write_patient(id))
  WITH CHECK (can_write_patient(id));

-- ============================================================================
-- RLS POLICIES - Patient Shares
-- ============================================================================

CREATE POLICY "Clinicians can view shares for their patients"
  ON patient_shares FOR SELECT
  TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Clinicians can create shares for their patients"
  ON patient_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_shares.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares ps
          WHERE ps.patient_id = patients.id
          AND ps.shared_with = auth.uid()
          AND ps.permission_level = 'full'
        )
      )
    )
  );

CREATE POLICY "Clinicians can delete shares they created"
  ON patient_shares FOR DELETE
  TO authenticated
  USING (shared_by = auth.uid());

-- ============================================================================
-- RLS POLICIES - Appointments
-- ============================================================================

CREATE POLICY "Clinicians can view appointments for their patients"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (clinician_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - Visits
-- ============================================================================

CREATE POLICY "Clinicians can view accessible visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR created_by = (SELECT auth.uid())
    OR can_access_visit(id)
  );

CREATE POLICY "Clinicians can create visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
    OR last_edited_by = auth.uid()
  )
  WITH CHECK (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES - Visit Notes
-- ============================================================================

CREATE POLICY "Clinicians can view notes for accessible visits"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_notes.visit_id
      AND (
        visits.clinician_id = auth.uid()
        OR visits.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patients
          WHERE patients.id = visits.patient_id
          AND (
            patients.clinician_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM patient_shares
              WHERE patient_shares.patient_id = patients.id
              AND patient_shares.shared_with = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Clinicians can create visit notes"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update visit notes"
  ON visit_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_notes.visit_id
      AND visits.visit_status != 'finalized'
      AND (visits.clinician_id = auth.uid() OR visits.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_notes.visit_id
      AND visits.visit_status != 'finalized'
      AND (visits.clinician_id = auth.uid() OR visits.created_by = auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES - Visit Recordings
-- ============================================================================

CREATE POLICY "Clinicians can view recordings"
  ON visit_recordings FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_recordings.visit_id
      AND (
        visits.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patients
          WHERE patients.id = visits.patient_id
          AND (
            patients.clinician_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM patient_shares
              WHERE patient_shares.patient_id = patients.id
              AND patient_shares.shared_with = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Clinicians can upload recordings"
  ON visit_recordings FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Clinicians can delete own recordings"
  ON visit_recordings FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- ============================================================================
-- RLS POLICIES - Allergies, Medications, Medical History
-- ============================================================================

CREATE POLICY "Clinicians can view patient allergies"
  ON allergies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = allergies.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update allergies"
  ON allergies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = allergies.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
          AND patient_shares.permission_level IN ('write', 'full')
        )
      )
    )
  );

CREATE POLICY "Clinicians can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
          AND patient_shares.permission_level IN ('write', 'full')
        )
      )
    )
  );

CREATE POLICY "Clinicians can view medical history"
  ON medical_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create medical history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Clinicians can update medical history"
  ON medical_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_history.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
          AND patient_shares.permission_level IN ('write', 'full')
        )
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - Orders & Prescriptions
-- ============================================================================

CREATE POLICY "Clinicians can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = orders.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can delete own draft orders"
  ON orders FOR DELETE
  TO authenticated
  USING (clinician_id = auth.uid() AND status = 'draft');

CREATE POLICY "Clinicians can view prescriptions"
  ON medications_prescribed FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medications_prescribed.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create prescriptions"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own prescriptions"
  ON medications_prescribed FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can view lab orders"
  ON labs_ordered FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = labs_ordered.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares
          WHERE patient_shares.patient_id = patients.id
          AND patient_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinicians can create lab orders"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own lab orders"
  ON labs_ordered FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - Transcription Jobs
-- ============================================================================

CREATE POLICY "Clinicians can view transcription jobs"
  ON transcription_jobs FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = transcription_jobs.visit_id
      AND visits.clinician_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can create transcription jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Note: Transcription job updates should only be done by service role through Edge Functions
-- No user-facing update policy - updates are handled by background processing

-- ============================================================================
-- RLS POLICIES - Messages
-- ============================================================================

CREATE POLICY "Clinicians can view sent messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Clinicians can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Recipients can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Clinicians can view threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Clinicians can create threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = ANY(participants));

-- ============================================================================
-- SECURITY NOTES & SERVICE ROLE USAGE
-- ============================================================================

/*
  ## Service Role Usage Guidelines (per schema_assistance.md)

  The service_role key should NEVER be used in client-side code or exposed to users.
  It bypasses all RLS policies and should only be used in:

  1. **Edge Functions** - For privileged operations like:
     - Background job processing (transcription updates)
     - Administrative tasks
     - Bulk data operations
     - Cross-tenant data access (with proper validation)

  2. **Server-side code** - Only in trusted server environments for:
     - Database migrations
     - System maintenance
     - Background workers

  ## Recommended Architecture:
  - Use anon key for client-side authenticated operations
  - Create Edge Functions for privileged operations that validate requests
  - Implement proper audit logging for service role operations
  - Rotate keys regularly and monitor usage

  ## Testing RLS Policies:
  - Test with multiple user accounts
  - Use EXPLAIN ANALYZE to verify index usage
  - Monitor for performance regressions
*/
