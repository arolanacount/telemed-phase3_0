import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import CalendarClient from './CalendarClient'

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  appointment_type: string
  status: string
  location?: string
  notes?: string
  patients: any
}

async function getAppointments(userId: string) {
  try {
    const { createClient } = await import('@/lib/supabaseServer')
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1) // Start of tomorrow

    // Get today's appointments (scheduled_at >= today AND scheduled_at < tomorrow)
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status,
        location,
        notes,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true })

    if (todayError) {
      console.error('Error fetching today appointments:', todayError)
    }

    // Get upcoming appointments (scheduled_at >= tomorrow)
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status,
        location,
        notes,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .gte('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true })

    if (upcomingError) {
      console.error('Error fetching upcoming appointments:', upcomingError)
    }

    return {
      todayAppointments: todayAppointments || [],
      upcomingAppointments: upcomingAppointments || []
    }
  } catch (error) {
    console.error('Error in getAppointments:', error)
    return {
      todayAppointments: [],
      upcomingAppointments: []
    }
  }
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

export default async function CalendarPage() {
  const user = await requireAuth()
  const { todayAppointments, upcomingAppointments } = await getAppointments(user.id)

  // Combine all appointments for the calendar view
  const allAppointments = [...todayAppointments, ...upcomingAppointments]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Appointment Calendar</h1>
            <p className="text-slate-600 mt-1">View and manage your appointments on an interactive calendar</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/appointments"
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-center sm:text-left"
            >
              📋 List View
            </Link>
            <Link
              href="/appointments/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left"
            >
              Schedule Appointment
            </Link>
          </div>
        </div>

        <CalendarClient appointments={allAppointments} />

        {/* Upcoming Appointments Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Appointments</h2>

          {upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments
                .slice(0, 6)
                .map((appointment: Appointment) => (
                  <div key={appointment.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 space-y-1">
                      <div>📅 {new Date(appointment.scheduled_at).toLocaleDateString()}</div>
                      <div>🕐 {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>📋 {appointment.appointment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No upcoming appointments</p>
              <p className="text-sm mt-1">Schedule your first appointment to get started</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
