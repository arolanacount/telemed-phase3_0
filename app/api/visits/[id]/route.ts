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

    // Get visit with patient info and notes (include note_format and subcategory fields)
    const { data: visit, error } = await supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        visit_type,
        note_format,
        visit_status,
        started_at,
        ended_at,
        location,
        chief_complaint,
        patients (
          id,
          first_name,
          last_name,
          date_of_birth,
          email,
          phone
        ),
        visit_notes (
          id,
          chief_complaint,
          history_present_illness,
          review_of_systems,
          vitals,
          physical_exam,
          assessment,
          diagnoses,
          plan,
          data,
          behavior,
          intervention,
          response,
          goal,
          problem,
          mental_status,
          risk_assessment,
          rating_scales,
          treatment_goals,
          medications_review,
          follow_up,
          referrals,
          ai_generated,
          ai_confidence,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching visit:', error)
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    return NextResponse.json(visit)
  } catch (error) {
    console.error('Error in visits/[id] GET:', error)
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

    // Update visit
    const { data, error } = await supabase
      .from('visits')
      .update({
        ...body,
        last_edited_by: user.id,
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating visit:', error)
      return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in visits/[id] PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if visit can be deleted (only draft visits)
    const { data: visit, error: fetchError } = await supabase
      .from('visits')
      .select('visit_status')
      .eq('id', id)
      .single()

    if (fetchError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    if (visit.visit_status !== 'draft') {
      return NextResponse.json({ error: 'Only draft visits can be deleted' }, { status: 400 })
    }

    // Delete visit (cascade will handle visit_notes and visit_recordings)
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting visit:', error)
      return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Visit deleted successfully' })
  } catch (error) {
    console.error('Error in visits/[id] DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
