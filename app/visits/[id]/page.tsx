'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabase'

interface Visit {
  id: string
  patient_id: string
  visit_type: string
  visit_status: string
  started_at: string
  ended_at?: string
  location?: string
  chief_complaint?: string
  note_format?: string
  patients: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    email?: string
    phone?: string
  }[]
  visit_notes?: VisitNote[]
}

interface VisitNote {
  id: string
  chief_complaint: string
  history_present_illness: string
  review_of_systems: any
  vitals: any
  physical_exam: any
  assessment: string
  diagnoses: any[]
  plan: string
  // Format-specific fields
  data?: string // For DAP format
  behavior?: string // For BIRP format
  intervention?: string // For BIRP/GIRP/PIRP formats
  response?: string // For BIRP/GIRP/PIRP formats
  goal?: string // For GIRP format
  problem?: string // For PIRP format
}

// Function to get tabs based on note format
const getTabsForFormat = (format: string) => {
  const baseTabs = [
    { id: 'overview', name: 'Overview', icon: '📋' }
  ]

  switch (format) {
    case 'soap':
      return [
        ...baseTabs,
        { id: 'subjective', name: 'Subjective', icon: '👤' },
        { id: 'objective', name: 'Objective', icon: '🔍' },
        { id: 'assessment', name: 'Assessment', icon: '💭' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
    case 'dap':
      return [
        ...baseTabs,
        { id: 'data', name: 'Data', icon: '📊' },
        { id: 'assessment', name: 'Assessment', icon: '💭' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
    case 'birp':
      return [
        ...baseTabs,
        { id: 'behavior', name: 'Behavior', icon: '🧠' },
        { id: 'intervention', name: 'Intervention', icon: '🔧' },
        { id: 'response', name: 'Response', icon: '💬' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
    case 'girp':
      return [
        ...baseTabs,
        { id: 'goal', name: 'Goal', icon: '🎯' },
        { id: 'intervention', name: 'Intervention', icon: '🔧' },
        { id: 'response', name: 'Response', icon: '💬' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
    case 'pirp':
      return [
        ...baseTabs,
        { id: 'problem', name: 'Problem', icon: '⚠️' },
        { id: 'intervention', name: 'Intervention', icon: '🔧' },
        { id: 'response', name: 'Response', icon: '💬' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
    default:
      // Fallback to SOAP
      return [
        ...baseTabs,
        { id: 'subjective', name: 'Subjective', icon: '👤' },
        { id: 'objective', name: 'Objective', icon: '🔍' },
        { id: 'assessment', name: 'Assessment', icon: '💭' },
        { id: 'plan', name: 'Plan', icon: '📝' }
      ]
  }
}

export default function VisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const [visitId, setVisitId] = useState<string>('')
  const [visit, setVisit] = useState<Visit | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteData, setNoteData] = useState<Partial<VisitNote>>({})
  const router = useRouter()

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Render tab content based on format and active tab
  const renderTabContent = (tabId: string, format: string) => {
    switch (format) {
      case 'soap':
        switch (tabId) {
          case 'subjective':
            return (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Subjective</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Chief Complaint</label>
                    <textarea
                      value={noteData.chief_complaint || ''}
                      onChange={(e) => {
                        setNoteData(prev => ({ ...prev, chief_complaint: e.target.value }))
                        saveNote('chief_complaint', e.target.value)
                      }}
                      rows={4}
                      placeholder="Patient's reported symptoms and concerns..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">History of Present Illness</label>
                    <textarea
                      value={noteData.history_present_illness || ''}
                      onChange={(e) => {
                        setNoteData(prev => ({ ...prev, history_present_illness: e.target.value }))
                        saveNote('history_present_illness', e.target.value)
                      }}
                      rows={6}
                      placeholder="Detailed chronology of symptoms..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    />
                  </div>
                </div>
                {saving && <p className="text-sm text-slate-500">Saving...</p>}
              </div>
            )
          case 'objective':
            return (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Objective</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Review of Systems</label>
                    <textarea
                      value={JSON.stringify(noteData.review_of_systems || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setNoteData(prev => ({ ...prev, review_of_systems: parsed }))
                          saveNote('review_of_systems', parsed)
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={6}
                      placeholder="Systematic review findings..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vital Signs</label>
                    <textarea
                      value={JSON.stringify(noteData.vitals || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setNoteData(prev => ({ ...prev, vitals: parsed }))
                          saveNote('vitals', parsed)
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={4}
                      placeholder="Blood pressure, heart rate, temperature..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Physical Exam</label>
                    <textarea
                      value={JSON.stringify(noteData.physical_exam || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setNoteData(prev => ({ ...prev, physical_exam: parsed }))
                          saveNote('physical_exam', parsed)
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={6}
                      placeholder="Examination findings by system..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono text-sm"
                    />
                  </div>
                </div>
                {saving && <p className="text-sm text-slate-500">Saving...</p>}
              </div>
            )
          case 'assessment':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assessment</label>
                  <textarea
                    value={noteData.assessment || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, assessment: e.target.value }))
                      saveNote('assessment', e.target.value)
                    }}
                    rows={8}
                    placeholder="Clinical impressions and diagnoses..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          case 'plan':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
                  <textarea
                    value={noteData.plan || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, plan: e.target.value }))
                      saveNote('plan', e.target.value)
                    }}
                    rows={8}
                    placeholder="Treatment plan and follow-up..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          default:
            return null
        }

      case 'dap':
        switch (tabId) {
          case 'data':
            return (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Data</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Combined Subjective & Objective Data</label>
                    <textarea
                      value={noteData.data || ''}
                      onChange={(e) => {
                        setNoteData(prev => ({ ...prev, data: e.target.value }))
                        saveNote('data', e.target.value)
                      }}
                      rows={12}
                      placeholder="Patient's reported information and clinical findings..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    />
                  </div>
                </div>
                {saving && <p className="text-sm text-slate-500">Saving...</p>}
              </div>
            )
          case 'assessment':
          case 'plan':
            return renderTabContent(tabId, 'soap') // Reuse SOAP assessment/plan
          default:
            return null
        }

      case 'birp':
        switch (tabId) {
          case 'behavior':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Behavior</label>
                  <textarea
                    value={noteData.behavior || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, behavior: e.target.value }))
                      saveNote('behavior', e.target.value)
                    }}
                    rows={8}
                    placeholder="Client's presenting behaviors and symptoms..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          case 'intervention':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Intervention</label>
                  <textarea
                    value={noteData.intervention || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, intervention: e.target.value }))
                      saveNote('intervention', e.target.value)
                    }}
                    rows={8}
                    placeholder="Therapeutic interventions and techniques used..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          case 'response':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Response</label>
                  <textarea
                    value={noteData.response || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, response: e.target.value }))
                      saveNote('response', e.target.value)
                    }}
                    rows={8}
                    placeholder="Client's response to interventions..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          case 'plan':
            return renderTabContent(tabId, 'soap') // Reuse SOAP plan
          default:
            return null
        }

      case 'girp':
      case 'pirp':
        const goalLabel = format === 'girp' ? 'Goal' : 'Problem'
        const goalPlaceholder = format === 'girp'
          ? 'Specific, measurable treatment goals...'
          : 'Identified problems or issues...'

        switch (tabId) {
          case 'goal':
          case 'problem':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{goalLabel}</label>
                  <textarea
                    value={noteData[tabId] || ''}
                    onChange={(e) => {
                      setNoteData(prev => ({ ...prev, [tabId]: e.target.value }))
                      saveNote(tabId, e.target.value)
                    }}
                    rows={8}
                    placeholder={goalPlaceholder}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                </div>
              </div>
            )
          case 'intervention':
          case 'response':
          case 'plan':
            return renderTabContent(tabId, 'birp') // Reuse BIRP sections
          default:
            return null
        }

      default:
        return renderTabContent(tabId, 'soap') // Default to SOAP
    }
  }

  const updateROS = (system: string, symptom: string, checked: boolean) => {
    const updatedROS = {
      ...noteData.review_of_systems,
      [system]: {
        ...noteData.review_of_systems?.[system],
        [symptom]: checked
      }
    }
    setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
    saveNote('review_of_systems', updatedROS)
  }

  const updateVitals = (field: string, value: string | number) => {
    const updatedVitals = {
      ...noteData.vitals,
      [field]: value
    }
    setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
    saveNote('vitals', updatedVitals)
  }

  const updatePhysicalExam = (system: string, finding: string, value: string | boolean) => {
    const updatedExam = {
      ...noteData.physical_exam,
      [system]: {
        ...noteData.physical_exam?.[system],
        [finding]: value
      }
    }
    setNoteData(prev => ({ ...prev, physical_exam: updatedExam }))
    saveNote('physical_exam', updatedExam)
  }

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setVisitId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (visitId) {
      fetchVisit()
    }
  }, [visitId])

  const fetchVisit = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          patient_id,
          visit_type,
          visit_status,
          started_at,
          ended_at,
          location,
          chief_complaint,
          patients (
            id,
            first_name,
            last_name,
            date_of_birth,
            email,
            phone
          ),
          visit_notes (
            id,
            chief_complaint,
            history_present_illness,
            review_of_systems,
            vitals,
            physical_exam,
            assessment,
            diagnoses,
            plan
          )
        `)
        .eq('id', visitId)
        .single()

      if (error) throw error

      setVisit(data)
      if (data.visit_notes && data.visit_notes.length > 0) {
        setNoteData(data.visit_notes[0])
      }
    } catch (error) {
      console.error('Error fetching visit:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNote = async (section: string, value: any) => {
    if (!visit) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updateData = { [section]: value, updated_by: user.id }

      // Check if visit_notes exists for this visit
      const existingNote = visit.visit_notes?.[0]

      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from('visit_notes')
          .update(updateData)
          .eq('id', existingNote.id)

        if (error) throw error
      } else {
        // Create new note
        const { error } = await supabase
          .from('visit_notes')
          .insert({
            visit_id: visit.id,
            [section]: value,
            created_by: user.id,
            updated_by: user.id
          })

        if (error) throw error
      }

      // Update local state
      setNoteData(prev => ({ ...prev, [section]: value }))
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }

  const finalizeVisit = async () => {
    if (!visit) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('visits')
        .update({
          visit_status: 'finalized',
          finalized_by: user.id,
          finalized_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .eq('id', visit.id)

      if (error) throw error

      // Refresh the visit data
      fetchVisit()
    } catch (error) {
      console.error('Error finalizing visit:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </Layout>
    )
  }

  if (!visit) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Visit not found</h2>
          <p className="text-slate-600">The visit you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Visit: {visit.patients[0]?.first_name} {visit.patients[0]?.last_name}
              </h1>
              <p className="text-slate-600 mt-1">
                {new Date(visit.started_at).toLocaleDateString()} • {visit.visit_type.replace('_', ' ')}
                {visit.location && ` • ${visit.location}`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                visit.visit_status === 'draft' ? 'bg-gray-100 text-gray-800' :
                visit.visit_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                visit.visit_status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                visit.visit_status === 'finalized' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {visit.visit_status.replace('_', ' ')}
              </span>
              {visit.visit_status !== 'finalized' && (
                <button
                  onClick={finalizeVisit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Finalize Visit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Tab Navigation - Hidden on mobile */}
        <div className="hidden lg:block mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {getTabsForFormat(visit?.note_format || 'soap').map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Desktop Tab Content - Hidden on mobile */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Visit Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {visit.patients[0]?.first_name} {visit.patients[0]?.last_name}</p>
                      <p><span className="font-medium">DOB:</span> {visit.patients[0]?.date_of_birth ? new Date(visit.patients[0].date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                      <p><span className="font-medium">Email:</span> {visit.patients[0]?.email || 'Not provided'}</p>
                      <p><span className="font-medium">Phone:</span> {visit.patients[0]?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Visit Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Type:</span> {visit.visit_type.replace('_', ' ')}</p>
                      <p><span className="font-medium">Format:</span> {visit.note_format?.toUpperCase() || 'SOAP'}</p>
                      <p><span className="font-medium">Started:</span> {new Date(visit.started_at).toLocaleString()}</p>
                      {visit.ended_at && <p><span className="font-medium">Ended:</span> {new Date(visit.ended_at).toLocaleString()}</p>}
                      <p><span className="font-medium">Location:</span> {visit.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {visit.chief_complaint && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Chief Complaint</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{visit.chief_complaint}</p>
                </div>
              )}
            </div>
          ) : (
            renderTabContent(activeTab, visit?.note_format || 'soap')
          )}

          {/* Mobile Accordion - Hidden on desktop */}
          <div className="lg:hidden bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
            {getTabsForFormat(visit?.note_format || 'soap').map((tab) => (
              <div key={tab.id} className="border-slate-200">
                <button
                  onClick={() => toggleSection(tab.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-slate-500 transform transition-transform ${
                      expandedSections.has(tab.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.has(tab.id) && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {renderTabContent(tab.id, visit?.note_format || 'soap')}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>


          {activeTab === 'ros' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Review of Systems</h3>
              <div className="space-y-6">
                <p className="text-sm text-slate-600">Check all systems that are relevant to this visit:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Constitutional */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Constitutional</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.constitutional?.fever || false}
                          onChange={(e) => updateROS('constitutional', 'fever', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Fever</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.constitutional?.chills || false}
                          onChange={(e) => updateROS('constitutional', 'chills', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Chills</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.constitutional?.fatigue || false}
                          onChange={(e) => updateROS('constitutional', 'fatigue', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Fatigue</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.constitutional?.weight_change || false}
                          onChange={(e) => updateROS('constitutional', 'weight_change', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Weight change</span>
                      </label>
                    </div>
                  </div>

                  {/* Cardiovascular */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Cardiovascular</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.cardiovascular?.chest_pain || false}
                          onChange={(e) => {
                            const updatedROS = {
                              ...noteData.review_of_systems,
                              cardiovascular: {
                                ...noteData.review_of_systems?.cardiovascular,
                                chest_pain: e.target.checked
                              }
                            }
                            setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                            saveNote('review_of_systems', updatedROS)
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Chest pain</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.cardiovascular?.palpitations || false}
                          onChange={(e) => {
                            const updatedROS = {
                              ...noteData.review_of_systems,
                              cardiovascular: {
                                ...noteData.review_of_systems?.cardiovascular,
                                palpitations: e.target.checked
                              }
                            }
                            setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                            saveNote('review_of_systems', updatedROS)
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Palpitations</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.cardiovascular?.shortness_of_breath || false}
                          onChange={(e) => {
                            const updatedROS = {
                              ...noteData.review_of_systems,
                              cardiovascular: {
                                ...noteData.review_of_systems?.cardiovascular,
                                shortness_of_breath: e.target.checked
                              }
                            }
                            setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                            saveNote('review_of_systems', updatedROS)
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Shortness of breath</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.cardiovascular?.edema || false}
                          onChange={(e) => {
                            const updatedROS = {
                              ...noteData.review_of_systems,
                              cardiovascular: {
                                ...noteData.review_of_systems?.cardiovascular,
                                edema: e.target.checked
                              }
                            }
                            setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                            saveNote('review_of_systems', updatedROS)
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Edema</span>
                      </label>
                    </div>
                  </div>

                  {/* Respiratory */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Respiratory</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.respiratory?.cough || false}
                          onChange={(e) => updateROS('respiratory', 'cough', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Cough</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.respiratory?.sputum || false}
                          onChange={(e) => updateROS('respiratory', 'sputum', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Sputum</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.respiratory?.hemoptysis || false}
                          onChange={(e) => updateROS('respiratory', 'hemoptysis', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Hemoptysis</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.respiratory?.wheezing || false}
                          onChange={(e) => updateROS('respiratory', 'wheezing', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Wheezing</span>
                      </label>
                    </div>
                  </div>

                  {/* Gastrointestinal */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Gastrointestinal</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.gastrointestinal?.nausea || false}
                          onChange={(e) => updateROS('gastrointestinal', 'nausea', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Nausea</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.gastrointestinal?.vomiting || false}
                          onChange={(e) => updateROS('gastrointestinal', 'vomiting', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Vomiting</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.gastrointestinal?.diarrhea || false}
                          onChange={(e) => updateROS('gastrointestinal', 'diarrhea', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Diarrhea</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={noteData.review_of_systems?.gastrointestinal?.constipation || false}
                          onChange={(e) => updateROS('gastrointestinal', 'constipation', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Constipation</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional ROS Notes
                  </label>
                  <textarea
                    value={noteData.review_of_systems?.additional_notes || ''}
                    onChange={(e) => {
                      const updatedROS = {
                        ...noteData.review_of_systems,
                        additional_notes: e.target.value
                      }
                      setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                      saveNote('review_of_systems', updatedROS)
                    }}
                    placeholder="Any additional symptoms or systems not covered above..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Vital Signs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Blood Pressure */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Blood Pressure
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="120"
                      value={noteData.vitals?.blood_pressure_systolic || ''}
                      onChange={(e) => updateVitals('blood_pressure_systolic', e.target.value)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-slate-500">/</span>
                    <input
                      type="number"
                      placeholder="80"
                      value={noteData.vitals?.blood_pressure_diastolic || ''}
                      onChange={(e) => updateVitals('blood_pressure_diastolic', e.target.value)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-sm text-slate-600 ml-2">mmHg</span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Heart Rate
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="72"
                      value={noteData.vitals?.heart_rate || ''}
                      onChange={(e) => updateVitals('heart_rate', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-sm text-slate-600">bpm</span>
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Respiratory Rate
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="16"
                      value={noteData.vitals?.respiratory_rate || ''}
                      onChange={(e) => updateVitals('respiratory_rate', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-sm text-slate-600">breaths/min</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Temperature
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={noteData.vitals?.temperature || ''}
                      onChange={(e) => updateVitals('temperature', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <select
                      value={noteData.vitals?.temperature_unit || 'F'}
                      onChange={(e) => updateVitals('temperature_unit', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      <option value="F">°F</option>
                      <option value="C">°C</option>
                    </select>
                  </div>
                </div>

                {/* Oxygen Saturation */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    O₂ Saturation
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="98"
                      value={noteData.vitals?.oxygen_saturation || ''}
                      onChange={(e) => updateVitals('oxygen_saturation', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Weight
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="150"
                      value={noteData.vitals?.weight || ''}
                      onChange={(e) => updateVitals('weight', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <select
                      value={noteData.vitals?.weight_unit || 'lbs'}
                      onChange={(e) => updateVitals('weight_unit', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Height
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="5"
                      value={noteData.vitals?.height_feet || ''}
                      onChange={(e) => updateVitals('height_feet', e.target.value)}
                      className="w-16 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-slate-500">ft</span>
                    <input
                      type="number"
                      placeholder="8"
                      value={noteData.vitals?.height_inches || ''}
                      onChange={(e) => updateVitals('height_inches', e.target.value)}
                      className="w-16 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <span className="text-slate-500">in</span>
                  </div>
                </div>

                {/* BMI */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    BMI (calculated)
                  </label>
                  <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700">
                    --
                  </div>
                </div>

                {/* Pain Scale */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Pain Scale (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={noteData.vitals?.pain_scale || 0}
                    onChange={(e) => updateVitals('pain_scale', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exam' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Physical Examination</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* General */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 border-b border-slate-200 pb-2">General</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Appearance</span>
                        <select
                          value={noteData.physical_exam?.general?.appearance || 'normal'}
                          onChange={(e) => updatePhysicalExam('general', 'appearance', e.target.value)}
                          className="px-3 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="not-examined">Not Examined</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mental Status</span>
                        <select
                          value={noteData.physical_exam?.general?.mental_status || 'alert'}
                          onChange={(e) => updatePhysicalExam('general', 'mental_status', e.target.value)}
                          className="px-3 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        >
                          <option value="alert">Alert</option>
                          <option value="confused">Confused</option>
                          <option value="lethargic">Lethargic</option>
                          <option value="not-examined">Not Examined</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Vital Signs Summary */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 border-b border-slate-200 pb-2">Vital Signs Summary</h4>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Vital signs will be displayed here once entered in the Vitals tab.</p>
                    </div>
                  </div>
                </div>

                {/* Organ Systems */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Organ Systems</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HEENT */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-700">HEENT</h5>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Normocephalic</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.heent?.normocephalic || false}
                            onChange={(e) => updatePhysicalExam('heent', 'normocephalic', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Extraocular movements intact</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.heent?.extraocular_movements_intact || false}
                            onChange={(e) => updatePhysicalExam('heent', 'extraocular_movements_intact', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Oropharynx clear</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.heent?.oropharynx_clear || false}
                            onChange={(e) => updatePhysicalExam('heent', 'oropharynx_clear', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cardiovascular */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-700">Cardiovascular</h5>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Regular rate and rhythm</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.cardiovascular?.regular_rate_rhythm || false}
                            onChange={(e) => updatePhysicalExam('cardiovascular', 'regular_rate_rhythm', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>No murmurs</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.cardiovascular?.no_murmurs || false}
                            onChange={(e) => updatePhysicalExam('cardiovascular', 'no_murmurs', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Peripheral pulses 2+</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.cardiovascular?.peripheral_pulses_2_plus || false}
                            onChange={(e) => updatePhysicalExam('cardiovascular', 'peripheral_pulses_2_plus', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Respiratory */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-700">Respiratory</h5>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Lungs clear to auscultation</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.respiratory?.lungs_clear || false}
                            onChange={(e) => updatePhysicalExam('respiratory', 'lungs_clear', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>No wheezes/rhonchi</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.respiratory?.no_wheezes_rhonchi || false}
                            onChange={(e) => updatePhysicalExam('respiratory', 'no_wheezes_rhonchi', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Good air movement</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.respiratory?.good_air_movement || false}
                            onChange={(e) => updatePhysicalExam('respiratory', 'good_air_movement', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gastrointestinal */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-700">Gastrointestinal</h5>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Abdomen soft/non-tender</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.gastrointestinal?.abdomen_soft || false}
                            onChange={(e) => updatePhysicalExam('gastrointestinal', 'abdomen_soft', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>No organomegaly</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.gastrointestinal?.no_organomegaly || false}
                            onChange={(e) => updatePhysicalExam('gastrointestinal', 'no_organomegaly', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Normoactive bowel sounds</span>
                          <input
                            type="checkbox"
                            checked={noteData.physical_exam?.gastrointestinal?.normoactive_bowel_sounds || false}
                            onChange={(e) => updatePhysicalExam('gastrointestinal', 'normoactive_bowel_sounds', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Physical Exam Notes
                  </label>
                  <textarea
                    value={noteData.physical_exam?.additional_notes || ''}
                    onChange={(e) => {
                      const updatedExam = {
                        ...noteData.physical_exam,
                        additional_notes: e.target.value
                      }
                      setNoteData(prev => ({ ...prev, physical_exam: updatedExam }))
                      saveNote('physical_exam', updatedExam)
                    }}
                    placeholder="Any additional findings or detailed descriptions..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessment' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Assessment</h3>
              <textarea
                value={noteData.assessment || ''}
                onChange={(e) => {
                  setNoteData(prev => ({ ...prev, assessment: e.target.value }))
                  saveNote('assessment', e.target.value)
                }}
                placeholder="Provide your clinical assessment and impressions..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
              />
              {saving && <p className="text-sm text-slate-500 mt-2">Saving...</p>}
            </div>
          )}

          {activeTab === 'plan' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Plan</h3>
              <textarea
                value={noteData.plan || ''}
                onChange={(e) => {
                  setNoteData(prev => ({ ...prev, plan: e.target.value }))
                  saveNote('plan', e.target.value)
                }}
                placeholder="Outline the treatment plan, medications, follow-up, etc..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
              />
              {saving && <p className="text-sm text-slate-500 mt-2">Saving...</p>}
            </div>
          )}
        </div>

        {/* Mobile Accordion - Hidden on desktop */}
        <div className="lg:hidden bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
            {getTabsForFormat(visit?.note_format || 'soap').map((tab) => (
              <div key={tab.id} className="border-slate-200">
                <button
                  onClick={() => toggleSection(tab.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-slate-500 transform transition-transform ${
                      expandedSections.has(tab.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.has(tab.id) && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {(() => {
                      switch (tab.id) {
                        case 'overview':
                          return (
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Visit Overview</h3>
                                <div className="grid grid-cols-1 gap-6">
                                  <div>
                                    <h4 className="font-medium text-slate-900 mb-2">Patient Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Name:</span> {visit.patients[0]?.first_name} {visit.patients[0]?.last_name}</p>
                                      <p><span className="font-medium">DOB:</span> {visit.patients[0]?.date_of_birth ? new Date(visit.patients[0].date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                                      <p><span className="font-medium">Email:</span> {visit.patients[0]?.email || 'Not provided'}</p>
                                      <p><span className="font-medium">Phone:</span> {visit.patients[0]?.phone || 'Not provided'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-slate-900 mb-2">Visit Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Type:</span> {visit.visit_type.replace('_', ' ')}</p>
                                      <p><span className="font-medium">Started:</span> {new Date(visit.started_at).toLocaleString()}</p>
                                      {visit.ended_at && <p><span className="font-medium">Ended:</span> {new Date(visit.ended_at).toLocaleString()}</p>}
                                      <p><span className="font-medium">Location:</span> {visit.location || 'Not specified'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        case 'complaint':
                          return (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Chief Complaint</label>
                                <textarea
                                  value={noteData.chief_complaint || ''}
                                  onChange={(e) => {
                                    setNoteData(prev => ({ ...prev, chief_complaint: e.target.value }))
                                    saveNote('chief_complaint', e.target.value)
                                  }}
                                  rows={6}
                                  placeholder="Enter the patient's chief complaint..."
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                />
                                {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                              </div>
                            </div>
                          )
                        case 'hpi':
                          return (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">History of Present Illness</label>
                                <textarea
                                  value={noteData.history_present_illness || ''}
                                  onChange={(e) => {
                                    setNoteData(prev => ({ ...prev, history_present_illness: e.target.value }))
                                    saveNote('history_present_illness', e.target.value)
                                  }}
                                  rows={8}
                                  placeholder="Enter detailed history of present illness..."
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                />
                                {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                              </div>
                            </div>
                          )
                        case 'ros':
                          return (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-slate-900">Review of Systems</h3>
                              <div className="grid grid-cols-1 gap-6">
                                {/* ROS content - simplified for mobile */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-slate-900">General Symptoms</h4>
                                  <textarea
                                    value={noteData.review_of_systems?.general?.notes || ''}
                                    onChange={(e) => {
                                      const updatedROS = {
                                        ...noteData.review_of_systems,
                                        general: {
                                          ...noteData.review_of_systems?.general,
                                          notes: e.target.value
                                        }
                                      }
                                      setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                                      saveNote('review_of_systems', updatedROS)
                                    }}
                                    rows={3}
                                    placeholder="Fever, fatigue, weight changes..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                                <div className="space-y-4">
                                  <h4 className="font-medium text-slate-900">Cardiovascular</h4>
                                  <textarea
                                    value={noteData.review_of_systems?.cardiovascular?.notes || ''}
                                    onChange={(e) => {
                                      const updatedROS = {
                                        ...noteData.review_of_systems,
                                        cardiovascular: {
                                          ...noteData.review_of_systems?.cardiovascular,
                                          notes: e.target.value
                                        }
                                      }
                                      setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                                      saveNote('review_of_systems', updatedROS)
                                    }}
                                    rows={3}
                                    placeholder="Chest pain, palpitations..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                                <div className="space-y-4">
                                  <h4 className="font-medium text-slate-900">Respiratory</h4>
                                  <textarea
                                    value={noteData.review_of_systems?.respiratory?.notes || ''}
                                    onChange={(e) => {
                                      const updatedROS = {
                                        ...noteData.review_of_systems,
                                        respiratory: {
                                          ...noteData.review_of_systems?.respiratory,
                                          notes: e.target.value
                                        }
                                      }
                                      setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                                      saveNote('review_of_systems', updatedROS)
                                    }}
                                    rows={3}
                                    placeholder="Cough, shortness of breath..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                                <div className="space-y-4">
                                  <h4 className="font-medium text-slate-900">Additional Notes</h4>
                                  <textarea
                                    value={noteData.review_of_systems?.additional_notes || ''}
                                    onChange={(e) => {
                                      const updatedROS = {
                                        ...noteData.review_of_systems,
                                        additional_notes: e.target.value
                                      }
                                      setNoteData(prev => ({ ...prev, review_of_systems: updatedROS }))
                                      saveNote('review_of_systems', updatedROS)
                                    }}
                                    rows={3}
                                    placeholder="Any other systems or concerns..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                              </div>
                              {saving && <p className="text-sm text-slate-500">Saving...</p>}
                            </div>
                          )
                        case 'vitals':
                          return (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-slate-900">Vital Signs</h3>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">BP</label>
                                    <input
                                      type="text"
                                      value={noteData.vitals?.blood_pressure || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, blood_pressure: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="120/80"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">HR</label>
                                    <input
                                      type="number"
                                      value={noteData.vitals?.heart_rate || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, heart_rate: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="72"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">RR</label>
                                    <input
                                      type="number"
                                      value={noteData.vitals?.respiratory_rate || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, respiratory_rate: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="16"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Temp °F</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={noteData.vitals?.temperature || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, temperature: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="98.6"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">O2 Sat %</label>
                                    <input
                                      type="number"
                                      value={noteData.vitals?.oxygen_saturation || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, oxygen_saturation: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="98"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Pain (0-10)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={noteData.vitals?.pain_scale || ''}
                                      onChange={(e) => {
                                        const vitals = noteData.vitals || {}
                                        const updatedVitals = { ...vitals, pain_scale: e.target.value }
                                        setNoteData(prev => ({ ...prev, vitals: updatedVitals }))
                                        saveNote('vitals', updatedVitals)
                                      }}
                                      placeholder="0"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                              {saving && <p className="text-sm text-slate-500">Saving...</p>}
                            </div>
                          )
                        case 'exam':
                          return (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-slate-900">Physical Examination</h3>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-slate-900 mb-2">General</h4>
                                  <textarea
                                    value={noteData.physical_exam?.general || ''}
                                    onChange={(e) => {
                                      const physicalExam = noteData.physical_exam || {}
                                      const updatedExam = { ...physicalExam, general: e.target.value }
                                      setNoteData(prev => ({ ...prev, physical_exam: updatedExam }))
                                      saveNote('physical_exam', updatedExam)
                                    }}
                                    rows={3}
                                    placeholder="General appearance, distress level..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900 mb-2">Cardiovascular</h4>
                                  <textarea
                                    value={noteData.physical_exam?.cardiovascular || ''}
                                    onChange={(e) => {
                                      const physicalExam = noteData.physical_exam || {}
                                      const updatedExam = { ...physicalExam, cardiovascular: e.target.value }
                                      setNoteData(prev => ({ ...prev, physical_exam: updatedExam }))
                                      saveNote('physical_exam', updatedExam)
                                    }}
                                    rows={3}
                                    placeholder="Heart sounds, pulses, edema..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900 mb-2">Respiratory</h4>
                                  <textarea
                                    value={noteData.physical_exam?.respiratory || ''}
                                    onChange={(e) => {
                                      const physicalExam = noteData.physical_exam || {}
                                      const updatedExam = { ...physicalExam, respiratory: e.target.value }
                                      setNoteData(prev => ({ ...prev, physical_exam: updatedExam }))
                                      saveNote('physical_exam', updatedExam)
                                    }}
                                    rows={3}
                                    placeholder="Breath sounds, respiratory effort..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm"
                                  />
                                </div>
                              </div>
                              {saving && <p className="text-sm text-slate-500">Saving...</p>}
                            </div>
                          )
                        case 'assessment':
                          return (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Assessment</label>
                                <textarea
                                  value={noteData.assessment || ''}
                                  onChange={(e) => {
                                    setNoteData(prev => ({ ...prev, assessment: e.target.value }))
                                    saveNote('assessment', e.target.value)
                                  }}
                                  rows={8}
                                  placeholder="Enter assessment and clinical impressions..."
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                                />
                                {saving && <p className="text-sm text-slate-500 mt-1">Saving...</p>}
                              </div>
                            </div>
                          )
                        case 'plan':
                          return (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
                                <textarea
                                  value={noteData.plan || ''}
                                  onChange={(e) => {
                                    setNoteData(prev => ({ ...prev, plan: e.target.value }))
                                    saveNote('plan', e.target.value)
                                  }}
                                  rows={6}
                                  placeholder="Outline the treatment plan, medications, follow-up, etc..."
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
                                />
                                {saving && <p className="text-sm text-slate-500 mt-2">Saving...</p>}
                              </div>
                            </div>
                          )
                        default:
                          return null
                      }
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
