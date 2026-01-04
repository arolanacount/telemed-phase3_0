'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabase'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email?: string
}

export default function NewVisit() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [formData, setFormData] = useState({
    visit_type: 'telehealth_video',
    location: '',
    chief_complaint: '',
    note_format: 'soap' // Default to SOAP format
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Search patients - shows results starting from first letter
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.length < 1) {
        setPatients([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        // Use "starts with" pattern to match names beginning with the search query
        const supabase = createClient()
        const searchPattern = `${searchQuery}%`
        
        const { data, error } = await supabase
          .from('patients')
          .select('id, first_name, last_name, email')
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
          .order('first_name', { ascending: true })
          .limit(10)

        if (!error && data) {
          setPatients(data)
        } else {
          console.error('Search error:', error)
          setPatients([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setPatients([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          visit_type: formData.visit_type,
          location: formData.location || null,
          chief_complaint: formData.chief_complaint || null,
          visit_status: 'draft',
          started_at: new Date().toISOString(),
          note_format: formData.note_format
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create visit')
      }

      const visit = await response.json()

      // Redirect to the visit page
      router.push(`/visits/${visit.id}`)
    } catch (error: any) {
      console.error('Error creating visit:', error)
      alert(error.message || 'Failed to create visit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Start New Visit</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Begin a medical visit with a patient</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                Select Patient
              </label>

              {!selectedPatient ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a patient..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowPatientDropdown(true)
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="w-full pl-4 pr-10 py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {showPatientDropdown && searchQuery.length >= 1 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPatientDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {isSearching ? (
                          <div className="px-4 py-3 text-center text-slate-500 text-sm">
                            Searching...
                          </div>
                        ) : patients.length > 0 ? (
                          patients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(patient)
                                setSearchQuery(`${patient.first_name} ${patient.last_name}`)
                                setShowPatientDropdown(false)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-slate-600">
                                    {patient.first_name[0]}{patient.last_name[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{patient.first_name} {patient.last_name}</div>
                                  {patient.email && <div className="text-sm text-slate-600 truncate">{patient.email}</div>}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-slate-500 text-sm">
                            No patients found
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-600">
                          {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{selectedPatient.first_name} {selectedPatient.last_name}</div>
                        {selectedPatient.email && <div className="text-sm text-slate-600 truncate">{selectedPatient.email}</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setSearchQuery('')
                        setShowPatientDropdown(false)
                      }}
                      className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors self-start sm:self-auto"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Visit Type */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                  Visit Type
                </label>
                <select
                  value={formData.visit_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, visit_type: e.target.value }))}
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  <option value="telehealth_video">📹 Telehealth Video</option>
                  <option value="telehealth_audio">📞 Telehealth Audio</option>
                  <option value="in_person">🏥 In Person</option>
                  <option value="home_visit">🏠 Home Visit</option>
                  <option value="wellness">🛡️ Wellness Visit</option>
                  <option value="sick">🤒 Sick Visit</option>
                  <option value="chronic_care">💊 Chronic Care</option>
                  <option value="medication_refill">💊 Medication Refill</option>
                </select>
              </div>

              {/* Note Format */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                  Note Format
                </label>
                <select
                  value={formData.note_format}
                  onChange={(e) => setFormData(prev => ({ ...prev, note_format: e.target.value }))}
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  <option value="soap">📋 SOAP (Subjective, Objective, Assessment, Plan)</option>
                  <option value="dap">📊 DAP (Data, Assessment, Plan)</option>
                  <option value="birp">🧠 BIRP (Behavior, Intervention, Response, Plan)</option>
                  <option value="girp">🎯 GIRP (Goal, Intervention, Response, Plan)</option>
                  <option value="pirp">🔧 PIRP (Problem, Intervention, Response, Plan)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the documentation format for this visit
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Room 101, Zoom link, or phone number"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Optional - auto-filled based on visit type</p>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                Chief Complaint
              </label>
              <textarea
                rows={4}
                placeholder="Describe the main reason for this visit (e.g., 'Patient reports chest pain for 2 days', 'Follow-up for hypertension', 'Annual physical exam')"
                value={formData.chief_complaint}
                onChange={(e) => setFormData(prev => ({ ...prev, chief_complaint: e.target.value }))}
                className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Optional but recommended - this will be the starting point for your visit documentation</p>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Starting a Visit</h4>
                  <p className="text-sm text-blue-800">
                    After creating this visit, you'll be taken to the documentation interface where you can record the encounter,
                    take notes, and generate AI-powered clinical summaries.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm sm:text-base text-slate-600 hover:text-slate-800 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedPatient}
                className="px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {submitting ? 'Starting Visit...' : 'Start Visit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
