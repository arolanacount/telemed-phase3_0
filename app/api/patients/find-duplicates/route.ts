import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: clinician, error: clinicianError } = await supabase
      .from('clinicians')
      .select('role')
      .eq('id', user.id)
      .single()

    if (clinicianError || clinician?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find duplicate patients by grouping on name + DOB
    const { data: duplicates, error } = await supabase
      .rpc('find_patient_duplicates')

    if (error) {
      console.error('Error finding duplicates:', error)
      return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 })
    }

    return NextResponse.json({
      duplicates: duplicates || [],
      totalGroups: duplicates?.length || 0
    })

  } catch (error) {
    console.error('Error in find duplicates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
