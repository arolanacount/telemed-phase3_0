-- Current RLS Policies from Remote Database
-- Generated from Supabase CSV export
-- Date: 2025-12-26T21:05:43.347Z

-- Policies for allergies table
CREATE POLICY "Clinicians can insert allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients)
;


-- Policies for appointments table
CREATE POLICY "Clinicians can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;

CREATE POLICY "Clinicians can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING ((clinician_id = auth.uid()))
  WITH CHECK ((clinician_id = auth.uid()))
;


-- Policies for clinicians table
CREATE POLICY "Clinicians can read own profile"
  ON clinicians FOR SELECT
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)))
;

CREATE POLICY "Clinicians can update own profile"
  ON clinicians FOR UPDATE
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)))
;

CREATE POLICY "Clinicians insert"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)))
;


-- Policies for labs_ordered table
CREATE POLICY "Clinicians can create labs_ordered"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert labs_ordered"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;


-- Policies for medical_history table
CREATE POLICY "Clinicians can create medical history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert medical_history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients)
;


-- Policies for medications table
CREATE POLICY "Clinicians can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients)
;


-- Policies for medications_prescribed table
CREATE POLICY "Clinicians can create medications_prescribed"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert medications_prescribed"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;


-- Policies for message_threads table
CREATE POLICY "Clinicians can create message threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can delete message threads"
  ON message_threads FOR DELETE
  TO authenticated
  USING ((auth.uid() = ANY (participants)))
;

CREATE POLICY "Clinicians can insert message_threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1)))
;

CREATE POLICY "Clinicians can update message threads"
  ON message_threads FOR UPDATE
  TO authenticated
  USING ((auth.uid() = ANY (participants)))
;

CREATE POLICY "Clinicians can view message threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING ((auth.uid() = ANY (participants)))
;


-- Policies for messages table
CREATE POLICY "Clinicians can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((sender_id = auth.uid()))
;

CREATE POLICY "Clinicians can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((sender_id = auth.uid()))
;

CREATE POLICY "Clinicians can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (((sender_id = auth.uid()) OR (recipient_id = auth.uid())))
;


-- Policies for orders table
CREATE POLICY "Clinicians can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;


-- Policies for patient_shares table
CREATE POLICY "Clinicians can insert patient_shares"
  ON patient_shares FOR INSERT
  TO authenticated
  WITH CHECK ((shared_by = auth.uid()))
;

CREATE POLICY "Patient_shares insert"
  ON patient_shares FOR INSERT
  TO authenticated
  WITH CHECK (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))))
;

CREATE POLICY "Patient_shares select"
  ON patient_shares FOR SELECT
  TO authenticated
  USING (((shared_with = ( SELECT auth.uid() AS uid)) OR (shared_by = ( SELECT auth.uid() AS uid))))
;

CREATE POLICY "Patient_shares_delete"
  ON patient_shares FOR DELETE
  TO authenticated
  USING (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))))
;

CREATE POLICY "Patient_shares_update"
  ON patient_shares FOR UPDATE
  TO authenticated
  USING (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))))
  WITH CHECK (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))))
;


-- Policies for patients table
CREATE POLICY "Clinicians can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;


-- Policies for transcription_jobs table
CREATE POLICY "Clinicians can create transcription jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL))
;

CREATE POLICY "Clinicians can insert transcription_jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((created_by = auth.uid()))
;

CREATE POLICY "Clinicians can update transcription jobs"
  ON transcription_jobs FOR UPDATE
  TO authenticated
  USING ((created_by = auth.uid()))
;


-- Policies for visit_notes table
CREATE POLICY "Clinicians can insert visit_notes"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK ((created_by = auth.uid()))
;

CREATE POLICY "Visit_notes insert"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v)
;


-- Policies for visit_recordings table
CREATE POLICY "Clinicians can insert visit_recordings"
  ON visit_recordings FOR INSERT
  TO authenticated
  WITH CHECK ((uploaded_by = auth.uid()))
;

CREATE POLICY "Visit_recordings insert"
  ON visit_recordings FOR INSERT
  TO authenticated
  WITH CHECK (((uploaded_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v)
;


-- Policies for visits table
CREATE POLICY "Clinicians can insert visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())))
;

CREATE POLICY "Clinicians can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (((clinician_id = auth.uid()) OR (created_by = auth.uid()) OR (last_edited_by = auth.uid())))
  WITH CHECK (((clinician_id = auth.uid()) OR (created_by = auth.uid())))
;


