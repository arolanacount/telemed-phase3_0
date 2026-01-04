import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function DELETE(
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

    // Get the share to check permissions
    const { data: share, error: shareError } = await supabase
      .from('patient_shares')
      .select('id, patient_id, shared_by, shared_with')
      .eq('id', resolvedParams.id)
      .single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if user can revoke this share (must be the one who shared it or an admin)
    const { data: clinician } = await supabase
      .from('clinicians')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = share.shared_by === user.id
    const isAdmin = clinician?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions to revoke this share' }, { status: 403 })
    }

    // Revoke the share
    const { error: deleteError } = await supabase
      .from('patient_shares')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error('Error revoking share:', deleteError)
      return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Share revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
