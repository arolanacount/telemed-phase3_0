import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function POST(
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

    // Check if visit exists and can be finalized
    const { data: visit, error: fetchError } = await supabase
      .from('visits')
      .select('visit_status, visit_notes(*)')
      .eq('id', id)
      .single()

    if (fetchError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    if (visit.visit_status === 'finalized') {
      return NextResponse.json({ error: 'Visit is already finalized' }, { status: 400 })
    }

    // Check if visit has notes (optional but recommended)
    const hasNotes = visit.visit_notes && visit.visit_notes.length > 0

    const now = new Date().toISOString()

    // Update visit status to finalized
    const { data: updatedVisit, error: updateError } = await supabase
      .from('visits')
      .update({
        visit_status: 'finalized',
        finalized_by: user.id,
        finalized_at: now,
        ended_at: visit.visit_status === 'in_progress' ? now : undefined,
        last_edited_by: user.id,
        last_edited_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select(`
        id,
        visit_status,
        finalized_at,
        ended_at,
        patients (
          first_name,
          last_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error finalizing visit:', updateError)
      return NextResponse.json({ error: 'Failed to finalize visit' }, { status: 500 })
    }

    return NextResponse.json({
      visit: updatedVisit,
      warnings: hasNotes ? [] : ['Visit finalized without clinical notes']
    })
  } catch (error) {
    console.error('Error in visits/[id]/finalize POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
