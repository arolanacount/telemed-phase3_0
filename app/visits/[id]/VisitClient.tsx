"use client"

import React, { useEffect, useState } from 'react'

interface Props {
  visitId: string
  initialVisit?: any
}

export default function VisitClient({ visitId, initialVisit }: Props) {
  const [visit, setVisit] = useState<any>(initialVisit || null)
  const [notes, setNotes] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [backupNotes, setBackupNotes] = useState<any | null>(null)

  async function fetchVisit() {
    const res = await fetch(`/api/visits/${visitId}`)
    if (res.ok) {
      const data = await res.json()
      setVisit(data)
    }
  }

  async function fetchNotes() {
    const res = await fetch(`/api/visits/${visitId}/notes`)
    if (res.ok) {
      const data = await res.json()
      setNotes(data)
    }
  }

  useEffect(() => {
    if (!initialVisit) fetchVisit()
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId])

  async function saveNotes() {
    setSaving(true)
    try {
      const res = await fetch(`/api/visits/${visitId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes)
      })
      if (res.ok) {
        await fetchNotes()
        setEditing(false)
      } else {
        console.error('Failed to save notes', await res.text())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function generateNote() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/visits/${visitId}/generate-note`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Generate a clinical note summary.' }) })
      if (res.ok) {
        await fetchNotes()
        await fetchVisit()
      } else {
        console.error('Generate-note failed', await res.text())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function finalize() {
    if (!confirm('Are you sure you want to finalize this visit? This will lock it.')) return
    setFinalizing(true)
    try {
      const res = await fetch(`/api/visits/${visitId}/finalize`, { method: 'POST' })
      if (res.ok) {
        await fetchVisit()
      } else {
        console.error('Finalize failed', await res.text())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFinalizing(false)
    }
  }

  if (!visit) return <div>Loading visit...</div>

  const isAIGenerated = notes?.ai_generated || visit?.ai_generated

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Visit: {visit.id.slice(0, 8)}...</h2>
            <p className="text-sm text-slate-600">Status: {visit.visit_status}</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={generateNote} disabled={generating} className="px-3 py-2 bg-yellow-500 text-white rounded">{generating ? 'Generating...' : 'Generate Note'}</button>
            <button onClick={finalize} disabled={finalizing} className="px-3 py-2 bg-green-600 text-white rounded">{finalizing ? 'Finalizing...' : 'Finalize'}</button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">Chief complaint</h3>
        <p className="text-slate-700">{visit.chief_complaint || '—'}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Clinical Notes {isAIGenerated && <span className="text-yellow-600 ml-2">(AI-generated — review)</span>}</h3>
          <div className="space-x-2">
            <button onClick={() => { setEditing(!editing); if (!notes) setNotes({}) }} className="px-2 py-1 border rounded">{editing ? 'Cancel' : 'Edit'}</button>
            <button onClick={saveNotes} disabled={!editing || saving} className="px-2 py-1 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        {!notes && <div className="text-slate-500">No notes yet</div>}

        {notes && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Chief Complaint</label>
              <input className="w-full border rounded p-2" value={notes.chief_complaint || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, chief_complaint: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium">History of Present Illness (HPI)</label>
              <textarea className="w-full border rounded p-2 min-h-[100px]" value={notes.history_present_illness || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, history_present_illness: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium">Review of Systems (ROS)</label>
              <textarea className="w-full border rounded p-2 min-h-[80px]" value={notes.review_of_systems || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, review_of_systems: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium">Vitals / Physical Exam</label>
              <textarea className="w-full border rounded p-2 min-h-[80px]" value={notes.vitals || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, vitals: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium">Assessment</label>
              <textarea className="w-full border rounded p-2 min-h-[100px]" value={notes.assessment || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, assessment: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium">Plan</label>
              <textarea className="w-full border rounded p-2 min-h-[100px]" value={notes.plan || ''} readOnly={!editing} onChange={(e) => setNotes({ ...notes, plan: e.target.value })} />
            </div>

            <div className="flex space-x-2">
              <button onClick={async () => { if (!confirm('Regenerate will replace the current note with AI-generated content and you will be able to undo it. Proceed?')) return; setBackupNotes(JSON.parse(JSON.stringify(notes))); await generateNote(); }} disabled={generating} className="px-3 py-2 bg-yellow-500 text-white rounded">{generating ? 'Generating...' : 'Regenerate'}</button>
              {backupNotes && (
                <button onClick={async () => {
                  if (!confirm('Restore your previous note from backup?')) return
                  setSaving(true)
                  try {
                    const res = await fetch(`/api/visits/${visitId}/notes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backupNotes) })
                    if (res.ok) {
                      await fetchNotes()
                      setBackupNotes(null)
                    } else {
                      console.error('Failed to restore backup', await res.text())
                    }
                  } catch (err) {
                    console.error(err)
                  } finally {
                    setSaving(false)
                  }
                }} className="px-3 py-2 bg-gray-200 border rounded">Undo Regenerate</button>
              )}
            </div>

            <div className="text-sm text-slate-500">Tip: AI-generated content should be reviewed and edited before finalizing.</div>
          </div>
        )}
      </div>
    </div>
  )
}
