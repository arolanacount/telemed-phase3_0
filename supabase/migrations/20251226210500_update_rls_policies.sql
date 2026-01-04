-- Update RLS Policies to Match Current Remote Database
-- Based on CSV export from Supabase Dashboard
-- Generated: 2025-12-26

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clinicians can insert allergies" ON allergies;
DROP POLICY IF EXISTS "Clinicians can update allergies" ON allergies;
DROP POLICY IF EXISTS "Clinicians can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Clinicians can update appointments" ON appointments;
DROP POLICY IF EXISTS "Clinicians can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Clinicians can view appointments" ON appointments;
DROP POLICY IF EXISTS "Clinicians can view appointments for their patients" ON appointments;
DROP POLICY IF EXISTS "Clinicians can read own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can update own profile" ON clinicians;
DROP POLICY IF EXISTS "Clinicians insert" ON clinicians;
DROP POLICY IF EXISTS "Clinicians can create labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can insert labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can update labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can view labs_ordered" ON labs_ordered;
DROP POLICY IF EXISTS "Clinicians can create medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can insert medical_history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can update medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can update medical_history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can view medical history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can view medical_history" ON medical_history;
DROP POLICY IF EXISTS "Clinicians can create medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can insert medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can update medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can view medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can create medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can insert medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can update medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can view medications_prescribed" ON medications_prescribed;
DROP POLICY IF EXISTS "Clinicians can create message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can delete message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can insert message_threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can update message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can view message threads" ON message_threads;
DROP POLICY IF EXISTS "Clinicians can create messages" ON messages;
DROP POLICY IF EXISTS "Clinicians can insert messages" ON messages;
DROP POLICY IF EXISTS "Clinicians can view messages" ON messages;
DROP POLICY IF EXISTS "Clinicians can create orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can insert orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can update orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can view orders" ON orders;
DROP POLICY IF EXISTS "Clinicians can insert patient_shares" ON patient_shares;
DROP POLICY IF EXISTS "Patient_shares insert" ON patient_shares;
DROP POLICY IF EXISTS "Patient_shares select" ON patient_shares;
DROP POLICY IF EXISTS "Patient_shares_delete" ON patient_shares;
DROP POLICY IF EXISTS "Patient_shares_update" ON patient_shares;
DROP POLICY IF EXISTS "Clinicians can insert patients" ON patients;
DROP POLICY IF EXISTS "Clinicians can update their own patients" ON patients;
DROP POLICY IF EXISTS "Clinicians can view their own patients" ON patients;
DROP POLICY IF EXISTS "Clinicians can create transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can insert transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can update transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can update transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can view transcription jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can view transcription_jobs" ON transcription_jobs;
DROP POLICY IF EXISTS "Clinicians can insert visit_notes" ON visit_notes;
DROP POLICY IF EXISTS "Clinicians can update visit_notes" ON visit_notes;
DROP POLICY IF EXISTS "Clinicians can view visit_notes" ON visit_notes;
DROP POLICY IF EXISTS "Visit_notes delete" ON visit_notes;
DROP POLICY IF EXISTS "Visit_notes insert" ON visit_notes;
DROP POLICY IF EXISTS "Visit_notes select" ON visit_notes;
DROP POLICY IF EXISTS "Visit_notes update" ON visit_notes;
DROP POLICY IF EXISTS "Clinicians can insert visit_recordings" ON visit_recordings;
DROP POLICY IF EXISTS "Clinicians can update visit_recordings" ON visit_recordings;
DROP POLICY IF EXISTS "Clinicians can view visit_recordings" ON visit_recordings;
DROP POLICY IF EXISTS "Visit_recordings delete" ON visit_recordings;
DROP POLICY IF EXISTS "Visit_recordings insert" ON visit_recordings;
DROP POLICY IF EXISTS "Visit_recordings select" ON visit_recordings;
DROP POLICY IF EXISTS "Visit_recordings update" ON visit_recordings;
DROP POLICY IF EXISTS "Clinicians can insert visits" ON visits;
DROP POLICY IF EXISTS "Clinicians can update visits" ON visits;
DROP POLICY IF EXISTS "Clinicians can view accessible visits" ON visits;

-- Now recreate all policies with current definitions

-- Allergies policies
CREATE POLICY "Clinicians can insert allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = allergies.patient_id) AND (patients.clinician_id = auth.uid()))))));

CREATE POLICY "Clinicians can update allergies"
  ON allergies FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = allergies.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares
          WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid())))))))));

-- Appointments policies
CREATE POLICY "Clinicians can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = appointments.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (clinician_id = auth.uid()))));

CREATE POLICY "Clinicians can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING ((clinician_id = auth.uid()))
  WITH CHECK ((clinician_id = auth.uid()));

CREATE POLICY "Clinicians can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = appointments.patient_id) AND (ps.shared_with = auth.uid())))) OR (clinician_id = auth.uid()))));

CREATE POLICY "Clinicians can view appointments for their patients"
  ON appointments FOR SELECT
  TO authenticated
  USING ((((clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = appointments.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = patients.id) AND (ps.shared_with = auth.uid()) AND ((ps.expires_at IS NULL) OR (ps.expires_at > now()))))))))))));

-- Clinicians policies
CREATE POLICY "Clinicians can read own profile"
  ON clinicians FOR SELECT
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Clinicians can update own profile"
  ON clinicians FOR UPDATE
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Clinicians insert"
  ON clinicians FOR INSERT
  TO authenticated
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

-- Labs ordered policies
CREATE POLICY "Clinicians can create labs_ordered"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert labs_ordered"
  ON labs_ordered FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update labs_ordered"
  ON labs_ordered FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = labs_ordered.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (clinician_id = auth.uid()))));

CREATE POLICY "Clinicians can view labs_ordered"
  ON labs_ordered FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = labs_ordered.patient_id) AND (ps.shared_with = auth.uid())))) OR (clinician_id = auth.uid()))));

-- Medical history policies
CREATE POLICY "Clinicians can create medical history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert medical_history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = medical_history.patient_id) AND (patients.clinician_id = auth.uid()))))));

CREATE POLICY "Clinicians can update medical history"
  ON medical_history FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = medical_history.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares
          WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid()) AND (patient_shares.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level])))))))));

CREATE POLICY "Clinicians can update medical_history"
  ON medical_history FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medical_history.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (EXISTS ( SELECT 1
   FROM patients p
  WHERE ((p.id = medical_history.patient_id) AND (p.clinician_id = auth.uid()))))));

CREATE POLICY "Clinicians can view medical history"
  ON medical_history FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = medical_history.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares
          WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid()))))))));

CREATE POLICY "Clinicians can view medical_history"
  ON medical_history FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medical_history.patient_id) AND (ps.shared_with = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM patients p
  WHERE ((p.id = medical_history.patient_id) AND (p.clinician_id = auth.uid()))))));

-- Medications policies
CREATE POLICY "Clinicians can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = medications.patient_id) AND (patients.clinician_id = auth.uid()))))));

CREATE POLICY "Clinicians can update medications"
  ON medications FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medications.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (EXISTS ( SELECT 1
   FROM patients p
  WHERE ((p.id = medications.patient_id) AND (p.clinician_id = auth.uid()))))));

CREATE POLICY "Clinicians can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medications.patient_id) AND (ps.shared_with = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM patients p
  WHERE ((p.id = medications.patient_id) AND (p.clinician_id = auth.uid()))))));

-- Medications prescribed policies
CREATE POLICY "Clinicians can create medications_prescribed"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert medications_prescribed"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update medications_prescribed"
  ON medications_prescribed FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medications_prescribed.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (clinician_id = auth.uid()))));

CREATE POLICY "Clinicians can view medications_prescribed"
  ON medications_prescribed FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = medications_prescribed.patient_id) AND (ps.shared_with = auth.uid())))) OR (clinician_id = auth.uid()))));

-- Message threads policies
CREATE POLICY "Clinicians can create message threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can delete message threads"
  ON message_threads FOR DELETE
  TO authenticated
  USING ((auth.uid() = ANY (participants)));

CREATE POLICY "Clinicians can insert message_threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1)));

CREATE POLICY "Clinicians can update message threads"
  ON message_threads FOR UPDATE
  TO authenticated
  USING ((auth.uid() = ANY (participants)));

CREATE POLICY "Clinicians can view message threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING ((auth.uid() = ANY (participants)));

-- Messages policies
CREATE POLICY "Clinicians can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((sender_id = auth.uid()));

CREATE POLICY "Clinicians can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((sender_id = auth.uid()));

CREATE POLICY "Clinicians can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (((sender_id = auth.uid()) OR (recipient_id = auth.uid())));

-- Orders policies
CREATE POLICY "Clinicians can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = orders.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))) OR (clinician_id = auth.uid()))));

CREATE POLICY "Clinicians can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM patient_shares ps
  WHERE ((ps.patient_id = orders.patient_id) AND (ps.shared_with = auth.uid())))) OR (clinician_id = auth.uid()))));

-- Patient shares policies
CREATE POLICY "Clinicians can insert patient_shares"
  ON patient_shares FOR INSERT
  TO authenticated
  WITH CHECK ((shared_by = auth.uid()));

CREATE POLICY "Patient_shares insert"
  ON patient_shares FOR INSERT
  TO authenticated
  WITH CHECK (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))));

CREATE POLICY "Patient_shares select"
  ON patient_shares FOR SELECT
  TO authenticated
  USING (((shared_with = ( SELECT auth.uid() AS uid)) OR (shared_by = ( SELECT auth.uid() AS uid))));

CREATE POLICY "Patient_shares_delete"
  ON patient_shares FOR DELETE
  TO authenticated
  USING (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))));

CREATE POLICY "Patient_shares_update"
  ON patient_shares FOR UPDATE
  TO authenticated
  USING (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))))
  WITH CHECK (((shared_by = ( SELECT auth.uid() AS uid)) OR (shared_with = ( SELECT auth.uid() AS uid))));

-- Patients policies
CREATE POLICY "Clinicians can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update their own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING ((((clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patient_shares
  WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid()) AND (patient_shares.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level])) AND ((patient_shares.expires_at IS NULL) OR (patient_shares.expires_at > now())))))))
  WITH CHECK ((((clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patient_shares
  WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid()) AND (patient_shares.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level])) AND ((patient_shares.expires_at IS NULL) OR (patient_shares.expires_at > now())))))));

CREATE POLICY "Clinicians can view their own patients"
  ON patients FOR SELECT
  TO authenticated
  USING ((((clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patient_shares
  WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid()) AND ((patient_shares.expires_at IS NULL) OR (patient_shares.expires_at > now()))))))));

-- Transcription jobs policies
CREATE POLICY "Clinicians can create transcription jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY "Clinicians can insert transcription_jobs"
  ON transcription_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((created_by = auth.uid()));

CREATE POLICY "Clinicians can update transcription jobs"
  ON transcription_jobs FOR UPDATE
  TO authenticated
  USING ((created_by = auth.uid()));

CREATE POLICY "Clinicians can update transcription_jobs"
  ON transcription_jobs FOR UPDATE
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = transcription_jobs.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))))))));

CREATE POLICY "Clinicians can view transcription jobs"
  ON transcription_jobs FOR SELECT
  TO authenticated
  USING ((((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM visits
  WHERE ((visits.id = transcription_jobs.visit_id) AND ((visits.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patients
          WHERE ((patients.id = visits.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM patient_shares
                  WHERE ((patient_shares.patient_id = patients.id) AND (patient_shares.shared_with = auth.uid())))))))))))));

CREATE POLICY "Clinicians can view transcription_jobs"
  ON transcription_jobs FOR SELECT
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = transcription_jobs.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid())))))))));

-- Visit notes policies
CREATE POLICY "Clinicians can insert visit_notes"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK ((created_by = auth.uid()));

CREATE POLICY "Clinicians can update visit_notes"
  ON visit_notes FOR UPDATE
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_notes.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))))))));

CREATE POLICY "Clinicians can view visit_notes"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_notes.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid())))))))));

CREATE POLICY "Visit_notes delete"
  ON visit_notes FOR DELETE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_notes.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid)))))))))));

CREATE POLICY "Visit_notes insert"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK ((((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_notes.visit_id) AND (v.clinician_id = ( SELECT auth.uid() AS uid))))))));

CREATE POLICY "Visit_notes select"
  ON visit_notes FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_notes.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid)))))))))));

CREATE POLICY "Visit_notes update"
  ON visit_notes FOR UPDATE
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_notes.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid))))))))) ))
  WITH CHECK ((((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_notes.visit_id) AND (v.clinician_id = ( SELECT auth.uid() AS uid))))))));

-- Visit recordings policies
CREATE POLICY "Clinicians can insert visit_recordings"
  ON visit_recordings FOR INSERT
  TO authenticated
  WITH CHECK ((uploaded_by = auth.uid()));

CREATE POLICY "Clinicians can update visit_recordings"
  ON visit_recordings FOR UPDATE
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_recordings.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid()) AND (ps.permission_level = ANY (ARRAY['write'::permission_level, 'full'::permission_level]))))))))));

CREATE POLICY "Clinicians can view visit_recordings"
  ON visit_recordings FOR SELECT
  TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_recordings.visit_id) AND ((v.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = v.patient_id) AND (ps.shared_with = auth.uid())))))))));

CREATE POLICY "Visit_recordings delete"
  ON visit_recordings FOR DELETE
  TO authenticated
  USING ((((uploaded_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_recordings.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid)))))))))));

CREATE POLICY "Visit_recordings insert"
  ON visit_recordings FOR INSERT
  TO authenticated
  WITH CHECK ((((uploaded_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_recordings.visit_id) AND (v.clinician_id = ( SELECT auth.uid() AS uid))))))));

CREATE POLICY "Visit_recordings select"
  ON visit_recordings FOR SELECT
  TO authenticated
  USING ((((EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_recordings.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid))))))))) ));

CREATE POLICY "Visit_recordings update"
  ON visit_recordings FOR UPDATE
  TO authenticated
  USING ((((uploaded_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (visits v
     JOIN patients p ON ((p.id = v.patient_id)))
  WHERE ((v.id = visit_recordings.visit_id) AND ((v.clinician_id = ( SELECT auth.uid() AS uid)) OR (p.clinician_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = p.id) AND (ps.shared_with = ( SELECT auth.uid() AS uid)))))))) ))
  WITH CHECK ((((uploaded_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM visits v
  WHERE ((v.id = visit_recordings.visit_id) AND (v.clinician_id = ( SELECT auth.uid() AS uid))))))));

-- Visits policies
CREATE POLICY "Clinicians can insert visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (((created_by = auth.uid()) OR (clinician_id = auth.uid())));

CREATE POLICY "Clinicians can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (((clinician_id = auth.uid()) OR (created_by = auth.uid()) OR (last_edited_by = auth.uid())))
  WITH CHECK (((clinician_id = auth.uid()) OR (created_by = auth.uid())));

CREATE POLICY "Clinicians can view accessible visits"
  ON visits FOR SELECT
  TO authenticated
  USING ((((clinician_id = auth.uid()) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM patients
  WHERE ((patients.id = visits.patient_id) AND ((patients.clinician_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM patient_shares ps
          WHERE ((ps.patient_id = patients.id) AND (ps.shared_with = auth.uid()) AND ((ps.expires_at IS NULL) OR (ps.expires_at > now()))))))))))));
