import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

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

    const { data: appointments, error } = await supabase
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
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    return appointments || []
  } catch (error) {
    console.error('Error in getAppointments:', error)
    return []
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

export default async function Appointments() {
  const user = await requireAuth()
  const appointments = await getAppointments(user.id)

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Appointments</h1>
            <p className="text-slate-600 mt-1">View and manage your appointments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/calendar"
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-center sm:text-left"
            >
              📅 Calendar View
            </Link>
            <Link
              href="/appointments/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left"
            >
              Schedule Appointment
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {appointments.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {appointments.map((appointment: Appointment) => (
                <div key={appointment.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                          {appointment.patients?.first_name} {appointment.patients?.last_name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-1">
                          <span className="font-medium">{formatAppointmentType(appointment.appointment_type)}</span>
                          <div className="flex items-center gap-1 sm:gap-4">
                            <span>{new Date(appointment.scheduled_at).toLocaleDateString()}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{appointment.duration_minutes} min</span>
                          </div>
                        </div>
                        {appointment.location && (
                          <div className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
                            📍 {appointment.location}
                          </div>
                        )}
                        {appointment.notes && (
                          <div className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
                            📝 {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {formatStatus(appointment.status)}
                      </span>
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center py-12 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No appointments yet</p>
                <p className="text-sm mt-2">Schedule your first appointment to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
