import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    // Check if user can access this patient
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify patient access
    const { data: hasAccess } = await supabase.rpc('can_access_patient', {
      p_patient_id: resolvedParams.id
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch visits for this patient
    const { data: visits, error } = await supabase
      .from('visits')
      .select('id, started_at, visit_type, visit_status, chief_complaint')
      .eq('patient_id', resolvedParams.id)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching visits:', error)
      return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 })
    }

    return NextResponse.json(visits || [])
  } catch (error) {
    console.error('Error in GET /api/patients/[id]/visits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
