'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  appointment_type: string
  status: string
  patients: {
    first_name: string
    last_name: string
  }[]
}

interface DashboardData {
  stats: {
    totalPatients: number
    todayVisits: number
    pendingNotes: number
    totalAppointments: number
    sharedPatients: number
  }
  todayAppointments: Appointment[]
  upcomingAppointments?: Appointment[]
  recentPatients: any[]
}

// Simple toast component
function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-200 text-slate-900 px-3 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 transition-all duration-500 ease-in-out">
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-yellow-800 hover:text-slate-900 text-sm ml-2"
      >
        ×
      </button>
    </div>
  )
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {

  // Force a re-render check
  const [forceUpdate, setForceUpdate] = useState(0)

  const [dashboardData, setDashboardData] = useState(initialData)
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null)
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState<string>('')

  // Show toast for appointments within 2 months
  useEffect(() => {
    const now = new Date()
    const twoMonthsFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)) // 60 days

    const upcomingWithinTwoMonths = dashboardData.upcomingAppointments?.filter(apt => {
      const appointmentDate = new Date(apt.scheduled_at)
      return appointmentDate <= twoMonthsFromNow && !dismissedReminders.includes(apt.id)
    }) || []

    if (upcomingWithinTwoMonths.length > 0) {
      setToastMessage("Upcoming appointments: see alert messages!")

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        setToastMessage("")
      }, 5000)

      // Cleanup timeout on unmount or when dependencies change
      return () => clearTimeout(timeout)
    }
  }, [dashboardData.upcomingAppointments, dismissedReminders])

  const dismissReminder = (appointmentId: string) => {
    setDismissedReminders(prev => [...prev, appointmentId])
  }

  const handleToastClose = () => {
    setToastMessage('')
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    console.log('Starting appointment update:', { appointmentId, newStatus })
    setUpdatingAppointment(appointmentId)

    try {
      const supabase = createClient()
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log('API Response status:', response.status)

      if (response.ok) {
        const updatedAppointment = await response.json()
        console.log('API Response - full data:', updatedAppointment)
        console.log('API Response - status field:', updatedAppointment.status)
        console.log('API Response - patients field:', updatedAppointment.patients)

        // Update local state
        setDashboardData(prevData => {
          const currentAppointment = prevData.todayAppointments.find(apt => apt.id === appointmentId)
          console.log('Current appointment in state:', currentAppointment)
          console.log('Current status in state:', currentAppointment?.status)

          const updatedAppointments = prevData.todayAppointments.map(apt => {
            if (apt.id === appointmentId) {
              const newAppointment = { ...updatedAppointment }
              console.log('Creating new appointment object:', newAppointment)
              console.log('New appointment status:', newAppointment.status)
              return newAppointment
            }
            return apt
          })

          const updatedAppointmentInState = updatedAppointments.find(apt => apt.id === appointmentId)
          console.log('Updated appointment in new state:', updatedAppointmentInState)
          console.log('Updated status in new state:', updatedAppointmentInState?.status)

          return {
            ...prevData,
            todayAppointments: updatedAppointments
          }
        })

        console.log('State update completed')
      } else {
        const errorText = await response.text()
        console.error('API Error response:', errorText)
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    } finally {
      setUpdatingAppointment(null)
      console.log('Appointment update process completed')
    }
  }

  const getStatusActions = (appointment: Appointment) => {
    const status = appointment.status || 'scheduled'
    console.log('🔍 getStatusActions called for appointment:', appointment.id, 'status:', status, 'full appointment:', appointment)
    switch (status) {
      case 'scheduled':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
              disabled={updatingAppointment === appointment.id}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              {updatingAppointment === appointment.id ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="sr-only">Starting...</span>
                </>
              ) : (
                'Start'
              )}
            </button>
            <button
              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
              disabled={updatingAppointment === appointment.id}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              {updatingAppointment === appointment.id ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="sr-only">Cancelling...</span>
                </>
              ) : (
                'Cancel'
              )}
            </button>
          </div>
        )
      case 'in_progress':
        console.log('Rendering Complete button for in_progress appointment')
        return (
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            disabled={updatingAppointment === appointment.id}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
          >
            {updatingAppointment === appointment.id ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="sr-only">Completing...</span>
              </>
            ) : (
              'Complete'
            )}
          </button>
        )
      default:
        console.log('No actions for status:', appointment.status)
        return null
    }
  }

  return (
    <div className="max-w-full">

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-4">
          <p className="text-sm text-slate-600">Common tasks to get you started</p>
        </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/patients/new"
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-6 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Add New Patient</h3>
              <p className="text-xs sm:text-sm text-slate-600">Register a new patient in the system</p>
            </Link>

            <Link
              href="/visits/new"
              className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-6 border border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Start New Visit</h3>
              <p className="text-xs sm:text-sm text-slate-600">Begin documenting a patient encounter</p>
            </Link>

            <Link
              href="/appointments/new"
              className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-6 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Schedule Appointment</h3>
              <p className="text-xs sm:text-sm text-slate-600">Book a future patient appointment</p>
            </Link>

          <Link
            href="/patients"
            className="group relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 sm:p-6 border border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Browse Patients</h3>
            <p className="text-xs sm:text-sm text-slate-600">View and manage your patient database</p>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">My Patients</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.stats.totalPatients}</p>
              <Link
                href="/patients"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
              >
                View Patients →
              </Link>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Shared With Me</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.stats.sharedPatients || 0}</p>
              <Link
                href="/shared-patients"
                className="text-sm text-green-600 hover:text-green-800 font-medium mt-1 inline-block"
              >
                View Shared →
              </Link>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Visits Today</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.stats.todayVisits}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Notes</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.stats.pendingNotes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Appointments</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.stats.totalAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Today's Appointments
          </h2>
          {dashboardData.todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {appointment.patients?.[0]?.first_name} {appointment.patients?.[0]?.last_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(appointment.scheduled_at).toLocaleTimeString()} - {appointment.appointment_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const displayStatus = appointment.status || 'scheduled'
                      return (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          displayStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          displayStatus === 'in_progress' ? 'bg-green-100 text-green-800' :
                          displayStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {displayStatus === 'in_progress' ? 'In Progress' :
                           displayStatus === 'scheduled' ? 'Scheduled' :
                           displayStatus === 'completed' ? 'Completed' :
                           displayStatus === 'cancelled' ? 'Cancelled' :
                           displayStatus}
                        </span>
                      )
                    })()}
                    {getStatusActions(appointment)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Upcoming Appointments
          </h2>
          {dashboardData.upcomingAppointments && dashboardData.upcomingAppointments.filter(apt => apt.status === 'scheduled').length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingAppointments
                .filter(apt => apt.status === 'scheduled')
                .slice(0, 10)
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {appointment.patients?.[0]?.first_name} {appointment.patients?.[0]?.last_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(appointment.scheduled_at).toLocaleDateString()} - {appointment.appointment_type}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Scheduled
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No upcoming appointments</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Patients
          </h2>
          {dashboardData.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentPatients.map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      Last visit: {new Date(patient.last_visit).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No recent patients</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={handleToastClose} />
      )}

    </div>
  )
}
