import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can access this patient
    const { data: hasPermission } = await supabase
      .rpc('can_access_patient', { p_patient_id: resolvedParams.id })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all shares for this patient
    const { data: shares, error: sharesError } = await supabase
      .from('patient_shares')
      .select(`
        id,
        patient_id,
        shared_by,
        shared_with,
        permission_level,
        created_at,
        expires_at,
        clinicians!patient_shares_shared_with_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('patient_id', resolvedParams.id)
      .is('expires_at', null)
      .order('created_at', { ascending: false })

    if (sharesError) {
      console.error('Error fetching patient shares:', sharesError)
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    return NextResponse.json({
      shares: shares || []
    })

  } catch (error) {
    console.error('Error in patient shares:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
