'use client'

import Layout from '@/components/Layout'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  appointment_type: string
  status: string
  location?: string
  notes?: string
  created_at: string
  updated_at: string
  patients: any
}


function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatStatus(status: string) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatAppointmentType(type: string) {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function AppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const resolvedParams = use(params)

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const response = await fetch(`/api/appointments/${resolvedParams.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch appointment')
        }
        const data = await response.json()
        console.log('Initial appointment data loaded:', data)
        console.log('Initial status:', data.status)
        setAppointment(data)
      } catch (err) {
        console.error('Error fetching appointment:', err)
        setError('Failed to load appointment')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [resolvedParams.id])

  // Debug: Log appointment state changes
  useEffect(() => {
    console.log('Appointment state changed:', appointment)
    if (appointment) {
      console.log('Current appointment status:', appointment.status)
    }
  }, [appointment])

  const updateAppointmentStatus = async (newStatus: string) => {
    if (!appointment) return

    console.log('Starting appointment status update:', { appointmentId: appointment.id, newStatus, currentStatus: appointment.status })
    setUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update appointment')
      }

      const updatedAppointment = await response.json()
      console.log('API Response - updated appointment:', updatedAppointment)
      console.log('API Response - status:', updatedAppointment.status)

      // Force a new object reference to ensure React re-renders
      const newAppointment = { ...updatedAppointment }
      console.log('Setting new appointment state:', newAppointment)
      console.log('New status:', newAppointment.status)

      setAppointment(newAppointment)
      setRefreshKey(prev => prev + 1) // Force re-render
    } catch (err) {
      console.error('Error updating appointment:', err)
      setError('Failed to update appointment status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">Loading appointment...</div>
        </div>
      </Layout>
    )
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center text-red-600">
            {error || 'Appointment not found'}
          </div>
        </div>
      </Layout>
    )
  }

  const appointmentDate = new Date(appointment.scheduled_at)
  const isPastAppointment = appointmentDate < new Date()
  const isToday = appointmentDate.toDateString() === new Date().toDateString()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/appointments"
              className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
            >
              ← Back to Appointments
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Appointment Details</h1>
            <p className="text-slate-600 mt-1">
              {(appointment.patients as any)?.first_name} {(appointment.patients as any)?.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {(() => {
              console.log('Rendering appointment status badge:', appointment.status, 'formatted:', formatStatus(appointment.status))
              return (
                <span key={`status-${appointment.status}-${refreshKey}`} className={`px-3 py-1 text-sm rounded-full ${getStatusColor(appointment.status)}`}>
                  {formatStatus(appointment.status)}
                </span>
              )
            })()}
          </div>
        </div>

        <div key={`appointment-${appointment.id}-${appointment.status}-${refreshKey}`} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Appointment Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Date & Time</label>
                  <div className="mt-1 text-slate-900">
                    {appointmentDate.toLocaleDateString()} at {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Duration</label>
                  <div className="mt-1 text-slate-900">{appointment.duration_minutes} minutes</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <div className="mt-1 text-slate-900">{formatAppointmentType(appointment.appointment_type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                      {formatStatus(appointment.status)}
                    </span>
                  </div>
                </div>
                {appointment.location && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <div className="mt-1 text-slate-900">📍 {appointment.location}</div>
                  </div>
                )}
                {appointment.notes && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <div className="mt-1 text-slate-900 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                      {appointment.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Patient Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <div className="mt-1 text-slate-900">
                    {appointment.patients?.first_name} {appointment.patients?.last_name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                  <div className="mt-1 text-slate-900">
                    {appointment.patients?.date_of_birth ? new Date(appointment.patients.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <div className="mt-1 text-slate-900">
                    {appointment.patients?.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="mt-1 text-slate-900">
                    {appointment.patients?.email || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/patients/${appointment.patients?.id}`}
                  className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                >
                  View Full Patient Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div key={`quick-actions-${appointment.status}-${refreshKey}`} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {(() => {
                  console.log('Rendering Quick Actions - status:', appointment.status, 'isToday:', isToday)
                  console.log('Should show Start button:', appointment.status === 'scheduled' && isToday)
                  console.log('Should show Complete button:', appointment.status === 'in_progress')
                  console.log('Should show Cancel button:', appointment.status !== 'completed' && appointment.status !== 'cancelled')
                  return null
                })()}
                {appointment.status === 'scheduled' && isToday && (
                  <button
                    onClick={() => updateAppointmentStatus('in_progress')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(() => {
                      console.log('RENDERING Start Appointment button')
                      return updating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="sr-only">Starting...</span>
                        </>
                      ) : (
                        '🟢 Start Appointment'
                      )
                    })()}
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    onClick={() => updateAppointmentStatus('completed')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(() => {
                      console.log('RENDERING Complete Appointment button')
                      return updating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="sr-only">Completing...</span>
                        </>
                      ) : (
                        '✅ Complete Appointment'
                      )
                    })()}
                  </button>
                )}
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => updateAppointmentStatus('cancelled')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(() => {
                      console.log('RENDERING Cancel Appointment button')
                      return updating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="sr-only">Cancelling...</span>
                        </>
                      ) : (
                        '❌ Cancel Appointment'
                      )
                    })()}
                  </button>
                )}
                <Link
                  href={`/patients/${appointment.patients?.id}`}
                  className="w-full px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors text-center block"
                >
                  👤 View Patient
                </Link>
                <Link
                  href={`/visits/new?patient=${appointment.patients?.id}`}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  📝 Start Visit
                </Link>
              </div>
            </div>

            {/* Appointment Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Created</div>
                    <div className="text-xs text-slate-600">
                      {new Date(appointment.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {appointment.updated_at !== appointment.created_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Last Updated</div>
                      <div className="text-xs text-slate-600">
                        {new Date(appointment.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    appointment.status === 'scheduled' ? 'bg-blue-500' :
                    appointment.status === 'in_progress' ? 'bg-green-500' :
                    appointment.status === 'completed' ? 'bg-gray-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Current Status</div>
                    <div className="text-xs text-slate-600">
                      {formatStatus(appointment.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
