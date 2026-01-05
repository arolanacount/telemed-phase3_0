/*
Smoke test: create a visit (with note_format) and visit_notes using SUPABASE_SERVICE_ROLE_KEY,
then fetch the visit with nested visit_notes to verify subfields are persisted and returned.

Env vars required:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Run: node scripts/smoke_create_visit_and_notes.js
*/

const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  try {
    // Ensure a clinician exists
    let { data: clinician } = await supabase.from('clinicians').select('id').limit(1).single()

    if (!clinician) {
      const name = `smoke-${Date.now()}`
      const { data: newClinician, error: clinErr } = await supabase.from('clinicians').insert({ display_name: name }).select('id').single()
      if (clinErr) throw clinErr
      clinician = newClinician
      console.log('Created clinician:', clinician.id)
    }

    // Find or create a patient owned by clinician
    let { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('clinician_id', clinician.id)
      .limit(1)
      .single()

    if (!patient) {
      const first = `Smoke`;
      const last = `Patient-${Date.now()}`;
      const { data: newPatient, error: patErr } = await supabase.from('patients').insert({ first_name: first, last_name: last, clinician_id: clinician.id }).select('id').single()
      if (patErr) throw patErr
      patient = newPatient
      console.log('Created patient:', patient.id)
    }

    // Create visit with note_format
    const noteFormat = 'birp'
    const visitPayload = {
      patient_id: patient.id,
      clinician_id: clinician.id,
      visit_type: 'telehealth_video',
      note_format: noteFormat,
      visit_status: 'draft',
      started_at: new Date().toISOString()
    }

    const { data: visit, error: visitErr } = await supabase.from('visits').insert(visitPayload).select('id').single()
    if (visitErr) throw visitErr
    console.log('Created visit:', visit.id)

    // Insert visit_notes for the visit
    const notesPayload = {
      visit_id: visit.id,
      chief_complaint: 'Smoke test complaint',
      behavior: 'Irritability, pacing',
      intervention: 'CBT technique, breathing exercise',
      response: 'Patient responded well; decreased anxiety',
      mental_status: 'Alert and oriented x3',
      follow_up: 'Return in 1 week',
      referrals: 'Therapy referral'
    }

    const { data: notes, error: notesErr } = await supabase.from('visit_notes').insert(notesPayload).select('*').single()
    if (notesErr) throw notesErr
    console.log('Inserted visit_notes:', notes.id)

    // Fetch visit with nested visit_notes as our API does
    const { data: fetched, error: fetchErr } = await supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        visit_type,
        note_format,
        visit_status,
        started_at,
        visit_notes (
          id,
          chief_complaint,
          data,
          behavior,
          intervention,
          response,
          goal,
          problem,
          mental_status,
          follow_up,
          referrals
        )
      `)
      .eq('id', visit.id)
      .single()

    if (fetchErr) throw fetchErr

    console.log('Fetched visit:', JSON.stringify(fetched, null, 2))

    // Basic assertions
    if (!fetched.note_format || fetched.note_format !== noteFormat) {
      console.error('note_format did not persist correctly')
      process.exit(2)
    }

    if (!fetched.visit_notes || fetched.visit_notes.length === 0) {
      console.error('visit_notes not returned')
      process.exit(2)
    }

    const fetchedNotes = fetched.visit_notes[0]
    if (fetchedNotes.behavior !== notesPayload.behavior || fetchedNotes.intervention !== notesPayload.intervention) {
      console.error('visit_notes subfields mismatch', fetchedNotes)
      process.exit(2)
    }

    console.log('Smoke create+notes test passed ✅')
  } catch (err) {
    console.error('Smoke test failed:', err)
    process.exit(1)
  }
}

main()
