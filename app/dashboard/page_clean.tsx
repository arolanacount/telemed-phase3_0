import Layout from '@/components/Layout'
import { getUser, getClinician, ensureClinicianExists } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './DashboardClient'

async function getDashboardData() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { stats: { totalPatients: 0, todayVisits: 0, pendingNotes: 0, totalAppointments: 0, sharedPatients: 0 }, todayAppointments: [], recentPatients: [] }

    // Get patient stats (patients created by this clinician)
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinician_id', user.id)

    // Get shared patients count
    const { count: sharedPatients } = await supabase
      .from('patient_shares')
      .select('*', { count: 'exact', head: true })
      .eq('shared_with', user.id)
      .is('expires_at', null)

    // Get today's visits
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: todayVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())

    // Get pending notes
    const { count: pendingNotes } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .in('visit_status', ['draft', 'in_progress', 'pending_review'])

    // Get today's appointments
    const { data: todayAppointments, count: totalAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status,
        patients (
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true })

    // Get recent patients (based on most recent visits, not creation date)
    const { data: recentPatients } = await supabase
      .from('visits')
      .select(`
        patient_id,
        patients!inner (
          id,
          first_name,
          last_name
        ),
        started_at
      `)
      .order('started_at', { ascending: false })
      .limit(50) // Get more to ensure we have unique patients

    // Extract unique patients by patient_id, keeping only the most recent visit for each
    const uniquePatients = new Map()
    if (recentPatients) {
      for (const visit of recentPatients) {
        if (visit.patients && Array.isArray(visit.patients) && visit.patients.length > 0 && !uniquePatients.has(visit.patient_id)) {
          const patient = visit.patients[0] as { first_name: string; last_name: string }
          uniquePatients.set(visit.patient_id, {
            id: visit.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            last_visit: visit.started_at
          })
        }
      }
    }

    // Convert to array and take first 5
    const recentPatientsList = Array.from(uniquePatients.values()).slice(0, 5)

    return {
      stats: {
        totalPatients: totalPatients || 0,
        todayVisits: todayVisits || 0,
        pendingNotes: pendingNotes || 0,
        totalAppointments: totalAppointments || 0,
        sharedPatients: sharedPatients || 0
      },
      todayAppointments: todayAppointments || [],
      recentPatients: recentPatientsList || []
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      stats: {
        totalPatients: 0,
        todayVisits: 0,
        pendingNotes: 0,
        totalAppointments: 0,
        sharedPatients: 0
      },
      todayAppointments: [],
      recentPatients: []
    }
  }
}

export default async function Dashboard() {
  const user = await getUser()

  // Ensure clinician record exists
  const clinician = await ensureClinicianExists(user.id, {
    full_name: user.user_metadata?.full_name,
    specialty: user.user_metadata?.specialty,
  })

  if (!clinician) {
    // This should not happen since ensureClinicianExists creates a record,
    // but if it does, show an error
    throw new Error('Unable to create clinician profile. Please contact support.')
  }

  const dashboardData = await getDashboardData()

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome, {clinician?.full_name || user.email}
          </h1>
          <p className="text-slate-600 mt-1">
            {clinician?.specialty || 'Clinician Dashboard'}
          </p>
        </div>

        <DashboardClient initialData={dashboardData} />
      </div>
    </Layout>
  )
}
