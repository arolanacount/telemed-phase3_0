import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/auth'
import MessagesClient from './MessagesClient'

export default async function Messages() {
  await requireAuth()

  // Get upcoming appointments for alerts section
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const twoMonthsFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)) // 60 days

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      appointment_type,
      status,
      patients (
        id,
        first_name,
        last_name
      )
    `)
    .gte('scheduled_at', today.toISOString())
    .lte('scheduled_at', twoMonthsFromNow.toISOString())
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(10)

  return (
    <MessagesClient upcomingAppointments={upcomingAppointments || []} />
  )
}
