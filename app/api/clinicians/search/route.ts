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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ clinicians: [] })
    }

    // Search clinicians by name or email (exclude current user)
    const { data: clinicians, error } = await supabase
      .from('clinicians')
      .select('id, full_name, email')
      .neq('id', user.id) // Exclude current user
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error searching clinicians:', error)
      return NextResponse.json({ error: 'Failed to search clinicians' }, { status: 500 })
    }

    return NextResponse.json({
      clinicians: clinicians || []
    })

  } catch (error) {
    console.error('Error in clinician search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
