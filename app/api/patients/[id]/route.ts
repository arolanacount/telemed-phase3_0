import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in patient GET API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const { id } = await params

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      // @ts-ignore - Supabase .or() typing issue
      .or(`clinician_id.eq.${user.id},exists.(select 1 from patient_shares where patient_shares.patient_id = '${id}' and patient_shares.shared_with = '${user.id}')`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      console.error('Error fetching patient:', error)
      return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error in patient GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in patient PUT API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const { id } = await params
    const body = await request.json()

    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('clinician_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (existingPatient.clinician_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('patients')
      .update({
        ...body,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating patient:', error)
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in patient PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in patient DELETE API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const { id } = await params

    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('clinician_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (existingPatient.clinician_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting patient:', error)
      return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in patient DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
