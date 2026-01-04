import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUser, getClinician } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import SharedPatientsClient from './SharedPatientsClient'

interface SharedWithMePatient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  phone: string
  created_at: string
  shared_at: string
  permission_level: 'read' | 'write' | 'full'
  sharer_name: string
}

interface SharedByMePatient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  phone: string
  created_at: string
  shared_at: string
  permission_level: 'read' | 'write' | 'full'
  recipient_name: string
}

async function getSharedWithMePatients(page: number = 1, limit: number = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { patients: [], totalCount: 0, totalPages: 0, currentPage: 1 }

  const offset = (page - 1) * limit

  // Get shares where current user is the recipient
  const { data: sharesData, error: sharesError, count } = await supabase
    .from('patient_shares')
    .select('patient_id, permission_level, created_at, shared_by', { count: 'exact' })
    .eq('shared_with', user.id)
    .is('expires_at', null)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (sharesError || !sharesData || sharesData.length === 0) {
    console.log('No shares found:', { error: sharesError?.message, count: sharesData?.length || 0 })
    return { patients: [], totalCount: 0, totalPages: 0, currentPage: page }
  }

  // For each share, validate access and get patient data
  const patients: any[] = []

  for (const share of sharesData) {
    // Use RPC to confirm access (bypasses RLS issues)
    const { data: hasAccess } = await supabase.rpc('can_access_patient', {
      p_patient_id: share.patient_id
    })

    if (hasAccess) {
      // Get patient data using SECURITY DEFINER function (bypasses RLS)
      const { data: patient } = await supabase.rpc('get_shared_patient_data', {
        p_patient_id: share.patient_id
      })

      if (patient) {
        // Get sharer name
        const { data: sharer } = await supabase
          .from('clinicians')
          .select('full_name')
          .eq('id', share.shared_by)
          .maybeSingle()

        patients.push({
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          email: patient.email,
          phone: patient.phone,
          created_at: patient.created_at,
          shared_at: share.created_at,
          permission_level: share.permission_level,
          sharer_name: sharer?.full_name || 'Unknown'
        })
      }
    }
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return {
    patients,
    totalCount,
    totalPages,
    currentPage: page
  }
}

async function getSharedByMePatients(page: number = 1, limit: number = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { patients: [], totalCount: 0, totalPages: 0, currentPage: 1 }

  const offset = (page - 1) * limit

  // Get shares where current user is the sharer
  const { data: sharesData, error: sharesError, count } = await supabase
    .from('patient_shares')
    .select('patient_id, permission_level, created_at, shared_with', { count: 'exact' })
    .eq('shared_by', user.id)
    .is('expires_at', null)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (sharesError || !sharesData || sharesData.length === 0) {
    console.log('No shares found:', { error: sharesError?.message, count: sharesData?.length || 0 })
    return { patients: [], totalCount: 0, totalPages: 0, currentPage: page }
  }

  // For each share, get patient data and recipient info
  const patients: any[] = []

  for (const share of sharesData) {
    // Get patient data using SECURITY DEFINER function (bypasses RLS)
    const { data: patient } = await supabase.rpc('get_shared_patient_data', {
      p_patient_id: share.patient_id
    })

    if (patient) {
      // Get recipient name
      const { data: recipient } = await supabase
        .from('clinicians')
        .select('full_name')
        .eq('id', share.shared_with)
        .maybeSingle()

      patients.push({
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        email: patient.email,
        phone: patient.phone,
        created_at: patient.created_at,
        shared_at: share.created_at,
        permission_level: share.permission_level,
        recipient_name: recipient?.full_name || 'Unknown'
      })
    }
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return {
    patients,
    totalCount,
    totalPages,
    currentPage: page
  }
}

export default async function SharedPatients({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; tab?: string }>
}) {
  const user = await getUser()
  const clinician = await getClinician(user.id)

  if (!clinician) {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1')
  const limit = parseInt(resolvedParams.limit || '10')
  const activeTab = resolvedParams.tab || 'shared-with-me'

  // Get both types of shared patients data
  const sharedWithMeData = await getSharedWithMePatients(page, limit)
  const sharedByMeData = await getSharedByMePatients(page, limit)

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Shared Patients</h1>
          <p className="text-slate-600 mt-1">Manage patients shared with you and by you</p>
        </div>

        <SharedPatientsClient
          sharedWithMeData={sharedWithMeData}
          sharedByMeData={sharedByMeData}
          initialTab={activeTab}
          limit={limit}
        />
      </div>
    </Layout>
  )
}
