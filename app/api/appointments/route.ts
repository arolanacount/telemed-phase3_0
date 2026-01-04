import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in appointments API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const { searchParams } = new URL(request.url)
    const todayOnly = searchParams.get('today') === 'true'

    let query = supabase
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
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},exists.(select 1 from patients where patients.id = appointments.patient_id and (patients.clinician_id = '${user.id}' or exists.(select 1 from patient_shares where patient_shares.patient_id = patients.id and patient_shares.shared_with = '${user.id}')))`)

    if (todayOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      query = query
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
    }

    const { data: appointments, error } = await query
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Get total appointments count for dashboard
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},exists.(select 1 from patients where patients.id = appointments.patient_id and (patients.clinician_id = '${user.id}' or exists.(select 1 from patient_shares where patient_shares.patient_id = patients.id and patient_shares.shared_with = '${user.id}')))`)

    return NextResponse.json({
      appointments,
      stats: {
        total: totalAppointments || 0
      }
    })
  } catch (error) {
    console.error('Error in appointments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user securely
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in appointments POST API:', { error: userError?.message })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const body = await request.json()
    const { patient_id } = body

    // Verify user has access to the patient
    if (patient_id) {
      const { data: patientAccess } = await supabase.rpc('can_access_patient', {
        p_patient_id: patient_id
      })

      if (!patientAccess) {
        return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...body,
        clinician_id: user.id,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in appointments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
