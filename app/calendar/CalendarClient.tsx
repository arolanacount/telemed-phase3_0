'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

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

interface CalendarClientProps {
  appointments: Appointment[]
}

export default function CalendarClient({ appointments }: CalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc: Record<string, Appointment[]>, appointment) => {
    const date = new Date(appointment.scheduled_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(appointment)
    return acc
  }, {})

  // Function to check if a date has appointments
  const hasAppointments = (date: Date) => {
    const dateString = date.toDateString()
    return appointmentsByDate[dateString] && appointmentsByDate[dateString].length > 0
  }

  // Function to get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toDateString()
    return appointmentsByDate[dateString] || []
  }

  // Custom tile content to show appointment indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasAppointments(date)) {
      const count = getAppointmentsForDate(date).length
      return (
        <div className="flex items-center justify-center mt-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
          {count > 1 && (
            <span className="text-xs text-blue-600 ml-1 font-medium">{count}</span>
          )}
        </div>
      )
    }
    return null
  }

  const formatAppointmentType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusColor = (status: string) => {
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

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <style jsx global>{`
            .react-calendar {
              width: 100%;
              border: none;
              font-family: inherit;
              background: white;
            }
            .react-calendar__tile {
              padding: 0.75em 0.5em;
              position: relative;
              color: #1f2937;
              min-height: 3rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .react-calendar__tile--active {
              border: 2px solid #1e40af !important;
              background: transparent !important;
              color: #1f2937 !important;
            }
            .react-calendar__tile--now {
              background: #eff6ff;
              color: #1f2937;
            }
            .react-calendar__tile:enabled:hover {
              background-color: #f1f5f9;
            }
            .react-calendar__navigation button {
              color: #1f2937;
              font-weight: 600;
            }
            .react-calendar__navigation button:enabled:hover {
              background-color: #f1f5f9;
            }
            .react-calendar__month-view__weekdays__weekday {
              font-weight: 600;
              color: #374151;
            }
            .react-calendar__month-view__days__day--neighboringMonth {
              color: #9ca3af;
            }
          `}</style>
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full"
          />
        </div>
      </div>

      {/* Appointments for Selected Date */}
      <div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Appointments"
              : `Appointments for ${selectedDate.toLocaleDateString()}`
            }
          </h2>

          {getAppointmentsForDate(selectedDate).length > 0 ? (
            <div className="space-y-4">
              {getAppointmentsForDate(selectedDate).map((appointment: Appointment) => (
                <div key={appointment.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-slate-900">
                      {appointment.patients?.first_name} {appointment.patients?.last_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                      {formatStatus(appointment.status)}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div>🕐 {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>📋 {formatAppointmentType(appointment.appointment_type)}</div>
                    <div>⏱️ {appointment.duration_minutes} min</div>
                    {appointment.location && <div>📍 {appointment.location}</div>}
                  </div>

                  <div className="mt-3">
                    <a
                      href={`/appointments/${appointment.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No appointments on this date</p>
              <p className="text-sm mt-1">Select another date to see appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
