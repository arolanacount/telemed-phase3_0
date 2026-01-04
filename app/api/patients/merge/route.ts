import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
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

    const { sourcePatientId, targetPatientId } = await request.json()

    if (!sourcePatientId || !targetPatientId) {
      return NextResponse.json({ error: 'Source and target patient IDs required' }, { status: 400 })
    }

    if (sourcePatientId === targetPatientId) {
      return NextResponse.json({ error: 'Source and target patients cannot be the same' }, { status: 400 })
    }

    // Verify both patients exist
    const { data: sourcePatient, error: sourceError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', sourcePatientId)
      .single()

    const { data: targetPatient, error: targetError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', targetPatientId)
      .single()

    if (sourceError || !sourcePatient) {
      return NextResponse.json({ error: 'Source patient not found' }, { status: 404 })
    }

    if (targetError || !targetPatient) {
      return NextResponse.json({ error: 'Target patient not found' }, { status: 404 })
    }

    // Begin transaction - move all related records
    const { error: mergeError } = await supabase.rpc('merge_patient_records', {
      source_patient_id: sourcePatientId,
      target_patient_id: targetPatientId,
      admin_user_id: user.id
    })

    if (mergeError) {
      console.error('Merge error:', mergeError)
      return NextResponse.json({
        error: 'Failed to merge patient records',
        details: mergeError.message
      }, { status: 500 })
    }

    // Delete the source patient record (now empty)
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', sourcePatientId)

    if (deleteError) {
      console.error('Error deleting source patient:', deleteError)
      // Don't return error here as the merge was successful
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${sourcePatient.first_name} ${sourcePatient.last_name} into ${targetPatient.first_name} ${targetPatient.last_name}`,
      mergedPatient: targetPatient
    })

  } catch (error) {
    console.error('Error in patient merge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
