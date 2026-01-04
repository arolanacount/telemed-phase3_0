import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { first_name, last_name, date_of_birth, email, phone, national_id, passport_number, drivers_license, excludePatientId } = await request.json()

    // For signup duplicate checks, we don't require authentication
    // But for patient management duplicate checks, we do
    const { data: { user } } = await supabase.auth.getUser()

    if (!first_name || !last_name || !date_of_birth) {
      return NextResponse.json({
        isDuplicate: false,
        message: 'Insufficient data to check for duplicates'
      })
    }

    let query = supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        national_id,
        passport_number,
        drivers_license,
        clinician_id
      `)

    // Build complex OR condition for duplicate detection
    let orConditions = []

    // Primary match: name and DOB
    orConditions.push(`and(first_name.ilike.${first_name},last_name.ilike.${last_name},date_of_birth.eq.${date_of_birth})`)

    // Strong ID matches (exact matches on any ID field)
    if (national_id) {
      orConditions.push(`national_id.eq.${national_id}`)
    }
    if (passport_number) {
      orConditions.push(`passport_number.eq.${passport_number}`)
    }
    if (drivers_license) {
      orConditions.push(`drivers_license.eq.${drivers_license}`)
    }

    // Email match (if provided)
    if (email) {
      orConditions.push(`email.ilike.${email}`)
    }

    // Phone match (if provided)
    if (phone) {
      orConditions.push(`phone.ilike.${phone}`)
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','))
    }

    // If checking during patient creation (authenticated), respect RLS
    // If checking during signup (unauthenticated), bypass RLS for broader search
    if (!user) {
        // For signup, we want to check across all patients regardless of clinician
        // This requires a SECURITY DEFINER function to bypass RLS
        const { data: potentialDuplicates, error } = await supabase
          .rpc('check_patient_duplicates_signup', {
            p_first_name: first_name,
            p_last_name: last_name,
            p_date_of_birth: date_of_birth,
            p_email: email,
            p_phone: phone,
            p_national_id: national_id,
            p_passport_number: passport_number,
            p_drivers_license: drivers_license
          })

      if (error) {
        console.error('Error checking for duplicates:', error)
        return NextResponse.json({ error: 'Failed to check for duplicates' }, { status: 500 })
      }

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          potentialDuplicates,
          message: `Found ${potentialDuplicates.length} potential duplicate patient(s) with same name and birth date`
        })
      }
    } else {
      // Authenticated user - use normal RLS query for patient management
      if (excludePatientId) {
        query = query.neq('id', excludePatientId)
      }

      const { data: potentialDuplicates, error } = await query.limit(10)

      if (error) {
        console.error('Error checking for duplicates:', error)
        return NextResponse.json({ error: 'Failed to check for duplicates' }, { status: 500 })
      }

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          potentialDuplicates,
          message: `Found ${potentialDuplicates.length} potential duplicate(s)`
        })
      }
    }

    return NextResponse.json({
      isDuplicate: false,
      message: 'No duplicates found'
    })
  } catch (error) {
    console.error('Error in duplicate check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
