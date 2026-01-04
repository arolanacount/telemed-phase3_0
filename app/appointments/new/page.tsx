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

export default function NewAppointment() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [formData, setFormData] = useState({
    scheduled_at: '',
    duration_minutes: 30,
    appointment_type: 'in_person',
    location: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length < 2) {
        setPatients([])
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (!error && data) {
        setPatients(data)
      }
    }

    const debounceTimer = setTimeout(searchPatients, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
          duration_minutes: formData.duration_minutes,
          appointment_type: formData.appointment_type,
          location: formData.location || null,
          notes: formData.notes || null,
          status: 'scheduled'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create appointment')
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating appointment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Failed to create appointment: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Schedule New Appointment</h1>
          <p className="text-slate-600 mt-1">Book an appointment with a patient</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
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
                      className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {showPatientDropdown && patients.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPatientDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {patients.map((patient) => (
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
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-slate-600">
                                  {patient.first_name[0]}{patient.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{patient.first_name} {patient.last_name}</div>
                                {patient.email && <div className="text-sm text-slate-600">{patient.email}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900">{selectedPatient.first_name} {selectedPatient.last_name}</div>
                        {selectedPatient.email && <div className="text-sm text-slate-600">{selectedPatient.email}</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setSearchQuery('')
                        setShowPatientDropdown(false)
                      }}
                      className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors self-start sm:self-auto"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Appointment Type
                </label>
                <select
                  value={formData.appointment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointment_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  <option value="in_person">🏥 In Person</option>
                  <option value="telehealth_video">📹 Telehealth Video</option>
                  <option value="telehealth_audio">📞 Telehealth Audio</option>
                  <option value="wellness">🛡️ Wellness Visit</option>
                  <option value="sick">🤒 Sick Visit</option>
                  <option value="chronic_care">💊 Chronic Care</option>
                  <option value="home_visit">🏠 Home Visit</option>
                  <option value="medication_refill">💊 Medication Refill</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Clinic address, room number, or telehealth meeting link"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Optional - leave blank for telehealth appointments</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Appointment Notes
              </label>
              <textarea
                rows={4}
                placeholder="Any special instructions, preparation needed, or additional context for this appointment..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Optional - visible to you and the patient</p>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedPatient}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="sr-only">Scheduling...</span>
                  </>
                ) : (
                  'Schedule Appointment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
