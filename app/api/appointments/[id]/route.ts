import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch appointment with patient details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status,
        location,
        notes,
        created_at,
        updated_at,
        patients (
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching appointment:', error)
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    console.log('API GET - Fetched appointment status:', appointment.status, 'for ID:', id)
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error in appointments/[id] GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    // Validate status
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update appointment status
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    // First check if appointment exists and user has access
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, clinician_id, patient_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAppointment) {
      console.error('Appointment not found or no access:', { id, error: fetchError })
      return NextResponse.json({ error: 'Appointment not found or access denied' }, { status: 404 })
    }

    // Check if user has permission to update this appointment
    if (existingAppointment.clinician_id !== user.id) {
      console.error('User does not have permission to update appointment:', {
        appointment_clinician: existingAppointment.clinician_id,
        user_id: user.id
      })
      return NextResponse.json({ error: 'You do not have permission to update this appointment' }, { status: 403 })
    }

    console.log('Updating appointment:', { id, clinician_id: existingAppointment.clinician_id, user_id: user.id, status })

    // Update the appointment using service role client (bypasses RLS issues)
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: updateResult, error: updateError } = await serviceSupabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    // Fetch the updated appointment data
    const { data: updatedAppointment, error: selectError } = await supabase
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
      .eq('id', id)
      .single()

    if (selectError) {
      console.error('Error fetching updated appointment:', selectError)
      return NextResponse.json({ error: 'Failed to fetch updated appointment' }, { status: 500 })
    }

    console.log('API PUT - Updated appointment status to:', updatedAppointment.status, 'for ID:', id)
    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error in appointments/[id] PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
