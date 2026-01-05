/*
Simple smoke test to exercise visit_notes persistence.
Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VISIT_ID (UUID of an existing visit)
Run: node scripts/smoke_visit_notes_persist.js
*/

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const visitId = process.env.VISIT_ID

  if (!url || !key || !visitId) {
    console.error('Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and VISIT_ID env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const testPayload = {
    mental_status: 'Alert and oriented x3. Affect euthymic. Thought process linear.',
    follow_up: 'Return in 2 weeks or sooner if symptoms worsen.',
    referrals: 'Refer to Behavioral Health for CBT evaluation.'
  }

  try {
    // Attempt update; if no row exists it will insert one
    const { data: existing } = await supabase.from('visit_notes').select('id').eq('visit_id', visitId).single()

    if (existing && existing.id) {
      const { error } = await supabase.from('visit_notes').update({ ...testPayload }).eq('visit_id', visitId)
      if (error) throw error
      console.log('Updated visit_notes for visit', visitId)
    } else {
      const { error } = await supabase.from('visit_notes').insert({ visit_id: visitId, ...testPayload })
      if (error) throw error
      console.log('Inserted visit_notes for visit', visitId)
    }

    const { data, error } = await supabase.from('visit_notes').select('*').eq('visit_id', visitId).single()
    if (error) throw error
    console.log('Fetched note:', data)
  } catch (err) {
    console.error('Smoke test failed:', err)
    process.exit(1)
  }
}

main()
