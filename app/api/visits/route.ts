import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in visits API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get visits for patients the clinician owns or has access to
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        visit_type,
        visit_status,
        started_at,
        ended_at,
        chief_complaint,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},created_by.eq.${user.id},exists.(select 1 from patients where patients.id = visits.patient_id and (patients.clinician_id = '${user.id}' or exists.(select 1 from patient_shares where patient_shares.patient_id = patients.id and patient_shares.shared_with = '${user.id}')))`)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching visits:', error)
      return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 })
    }

    // Get today's visits count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: todayVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},created_by.eq.${user.id},exists.(select 1 from patients where patients.id = visits.patient_id and (patients.clinician_id = '${user.id}' or exists.(select 1 from patient_shares where patient_shares.patient_id = patients.id and patient_shares.shared_with = '${user.id}')))`)
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())

    // Get pending notes count (draft or in_progress status)
    const { count: pendingNotes } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},created_by.eq.${user.id},exists.(select 1 from patients where patients.id = visits.patient_id and (patients.clinician_id = '${user.id}' or exists.(select 1 from patient_shares where patient_shares.patient_id = patients.id and patient_shares.shared_with = '${user.id}')))`)
      .in('visit_status', ['draft', 'in_progress', 'pending_review'])

    return NextResponse.json({
      visits,
      stats: {
        today: todayVisits || 0,
        pending: pendingNotes || 0
      }
    })
  } catch (error) {
    console.error('Error in visits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in visits POST API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const body = await request.json()

    // Extract note_format separately as it may not exist in schema yet
    const { note_format, ...visitData } = body

    const { data, error } = await supabase
      .from('visits')
      .insert({
        ...visitData,
        clinician_id: user.id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating visit:', error)
      return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in visits POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
