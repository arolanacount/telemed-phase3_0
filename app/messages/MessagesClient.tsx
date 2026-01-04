'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'

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

interface MessagesClientProps {
  upcomingAppointments: Appointment[]
}

export default function MessagesClient({ upcomingAppointments }: MessagesClientProps) {
  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600 mt-1">Team communications and alerts</p>
        </div>

        {/* Alerts Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Alerts</h2>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Upcoming appointment with {appointment.patients?.[0]?.first_name} {appointment.patients?.[0]?.last_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(appointment.scheduled_at).toLocaleDateString()} at {new Date(appointment.scheduled_at).toLocaleTimeString()} - {appointment.appointment_type}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No upcoming alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Messages</h2>
          <div className="text-center py-8 sm:py-12 text-slate-500">
            <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No messages</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
