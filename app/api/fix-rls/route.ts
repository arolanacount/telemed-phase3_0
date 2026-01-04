import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Return the SQL that needs to be executed manually
  const sql = `-- Fix RLS policies to avoid infinite recursion
-- Run this SQL in your Supabase SQL Editor

-- Drop problematic policies
DROP POLICY IF EXISTS "Clinicians can view accessible patients" ON patients;
DROP POLICY IF EXISTS "Clinicians can update patients with write access" ON patients;
DROP POLICY IF EXISTS "Clinicians can view appointments for their patients" ON appointments;
DROP POLICY IF EXISTS "Clinicians can view accessible visits" ON visits;

-- Recreate policies with direct conditions instead of helper functions

-- Patients policies
CREATE POLICY "Clinicians can view their own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  );

CREATE POLICY "Clinicians can update their own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND patient_shares.permission_level IN ('write', 'full')
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  )
  WITH CHECK (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patient_shares
      WHERE patient_shares.patient_id = patients.id
      AND patient_shares.shared_with = auth.uid()
      AND patient_shares.permission_level IN ('write', 'full')
      AND (patient_shares.expires_at IS NULL OR patient_shares.expires_at > now())
    )
  );

-- Appointments policies
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
          SELECT 1 FROM patient_shares ps
          WHERE ps.patient_id = patients.id
          AND ps.shared_with = auth.uid()
          AND (ps.expires_at IS NULL OR ps.expires_at > now())
        )
      )
    )
  );

CREATE POLICY "Clinicians can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

-- Visits policies
CREATE POLICY "Clinicians can view accessible visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    clinician_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = visits.patient_id
      AND (
        patients.clinician_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patient_shares ps
          WHERE ps.patient_id = patients.id
          AND ps.shared_with = auth.uid()
          AND (ps.expires_at IS NULL OR ps.expires_at > now())
        )
      )
    )
  );

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
  );`

  return NextResponse.json({
    message: 'Please run this SQL in your Supabase SQL Editor to fix the RLS policies',
    sql: sql
  })
}
