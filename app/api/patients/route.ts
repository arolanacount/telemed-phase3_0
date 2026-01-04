import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in patients API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    // Get patients owned by the clinician or shared with them
    const { data: patients, error } = await supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        created_at,
        clinician_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    // Get counts for dashboard
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    const { count: recentPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        total: totalPatients || 0,
        recent: recentPatients || 0
      }
    })
  } catch (error) {
    console.error('Error in patients API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request)

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in patients POST API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    console.log('Creating patient for user:', { userId: user.id, email: user.email })

    // Check if clinician profile exists, create if not
    const { data: existingClinician } = await supabase
      .from('clinicians')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingClinician) {
      console.log('Creating clinician profile for user')
      const { error: clinicianError } = await supabase
        .from('clinicians')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          specialty: user.user_metadata?.specialty || null,
          role: 'clinician'
        })

      if (clinicianError) {
        console.error('Failed to create clinician profile:', clinicianError)
      }
    }

    const body = await request.json()

    // Map frontend field names to database column names
    const patientData = {
      ...body,
      clinician_id: user.id,
      created_by: user.id,
      updated_by: user.id
    }

    // Map frontend fields to database columns
    if (patientData.gender_identity !== undefined) {
      patientData.gender = patientData.gender_identity
      delete patientData.gender_identity
    }

    // Remove fields that don't exist in our schema
    const fieldsToRemove = ['preferred_comm_method', 'primary_language', 'secondary_language', 'emergency_contact', 'insurance_provider', 'insurance_id', 'sex_at_birth', 'ethnicity', 'occupation_status', 'marital_status_details']
    fieldsToRemove.forEach(field => {
      if (patientData[field] !== undefined) {
        delete patientData[field]
      }
    })

    console.log('Creating patient with data:', patientData)

    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (error) {
      console.error('Error creating patient:', error)
      console.error('Patient data that failed:', patientData)
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in patients POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
