const fetch = require('node-fetch')

async function run() {
  const base = process.env.BASE_URL || 'http://localhost:3001'
  const id = process.env.VISIT_ID || '00000000-0000-0000-0000-000000000000'

  console.log('Base:', base)
  console.log('Visit ID:', id)

  async function tryFetch(path, opts = {}) {
    try {
      const res = await fetch(`${base}${path}`, opts)
      const text = await res.text()
      console.log(path, res.status)
      console.log(text)
    } catch (err) {
      console.error('Error fetching', path, err.message)
    }
  }

  await tryFetch(`/api/visits/${id}`)
  await tryFetch(`/api/visits/${id}/notes`)
  await tryFetch(`/api/visits/${id}/generate-note`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Test' }) })
  await tryFetch(`/api/visits/${id}/finalize`, { method: 'POST' })
}

run()
