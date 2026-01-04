import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(
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

    // Check if user owns the patient or has full sharing permission
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinician_id')
      .eq('id', resolvedParams.id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check permissions
    const { data: hasPermission } = await supabase
      .rpc('can_access_patient', { p_patient_id: resolvedParams.id })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can share (owns patient or has full permission)
    const { data: sharePermission } = await supabase
      .from('patient_shares')
      .select('permission_level')
      .eq('patient_id', resolvedParams.id)
      .eq('shared_with', user.id)
      .eq('permission_level', 'full')
      .is('expires_at', null)
      .single()

    const canShare = patient.clinician_id === user.id || sharePermission

    if (!canShare) {
      return NextResponse.json({ error: 'Insufficient permissions to share this patient' }, { status: 403 })
    }

    const { sharedWith, permissionLevel, expiresAt } = await request.json()

    if (!sharedWith || !permissionLevel) {
      return NextResponse.json({ error: 'sharedWith and permissionLevel are required' }, { status: 400 })
    }

    if (!['read', 'write', 'full'].includes(permissionLevel)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 })
    }

    // Verify the target clinician exists
    const { data: targetClinician, error: clinicianError } = await supabase
      .from('clinicians')
      .select('id, full_name, email')
      .eq('id', sharedWith)
      .single()

    if (clinicianError || !targetClinician) {
      return NextResponse.json({ error: 'Target clinician not found' }, { status: 404 })
    }

    // Don't allow sharing with yourself
    if (sharedWith === user.id) {
      return NextResponse.json({ error: 'Cannot share patient with yourself' }, { status: 400 })
    }

    // Check if share already exists
    const { data: existingShare } = await supabase
      .from('patient_shares')
      .select('id')
      .eq('patient_id', resolvedParams.id)
      .eq('shared_with', sharedWith)
      .is('expires_at', null)
      .single()

    if (existingShare) {
      return NextResponse.json({ error: 'Patient is already shared with this clinician' }, { status: 400 })
    }

    // Create the share
    const { data: share, error: shareError } = await supabase
      .from('patient_shares')
      .insert({
        patient_id: resolvedParams.id,
        shared_by: user.id,
        shared_with: sharedWith,
        permission_level: permissionLevel,
        expires_at: expiresAt || null,
      })
      .select()
      .single()

    if (shareError) {
      console.error('Error creating patient share:', shareError)
      return NextResponse.json({ error: 'Failed to share patient' }, { status: 500 })
    }

    // Verify the share was created and patient still exists
    console.log('Share creation - before verification:', {
      patientId: resolvedParams.id,
      sharedWith,
      permissionLevel
    })

    const { data: verifyPatient, error: verifyError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, clinician_id')
      .eq('id', resolvedParams.id)
      .single()

    console.log('Patient verification:', {
      patientId: resolvedParams.id,
      patientFound: !!verifyPatient,
      patientData: verifyPatient,
      verifyError: verifyError?.message
    })

    const { data: verifyShare, error: verifyShareError } = await supabase
      .from('patient_shares')
      .select('*')
      .eq('patient_id', resolvedParams.id)
      .eq('shared_with', sharedWith)
      .single()

    console.log('Share verification:', {
      shareFound: !!verifyShare,
      shareData: verifyShare,
      verifyShareError: verifyShareError?.message
    })

    // Check if user can access the patient after sharing
    const { data: accessCheck, error: accessError } = await supabase.rpc('can_access_patient', {
      p_patient_id: resolvedParams.id
    })

    console.log('Access check after sharing:', {
      canAccess: accessCheck,
      accessError: accessError?.message,
      currentUser: user.id,
      targetUser: sharedWith
    })

    return NextResponse.json({
      success: true,
      share: {
        ...share,
        clinicians: targetClinician
      }
    })

  } catch (error) {
    console.error('Error in patient share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
