import { notFound, redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import SharedPatientTabs from './SharedPatientTabs'
import Link from 'next/link'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  national_id: string
  passport_number: string
  drivers_license: string
  email: string
  phone: string
  address: string
  city: string
  parish: string
  postal_code: string
  country: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  blood_type: string
  occupation: string
  marital_status: string
  smoking_status: string
  alcohol_use: string
  created_at: string
  updated_at: string
}

async function getSharedPatient(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First try direct query (works for owned patients)
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (patient && !error) {
    return {
      patient: patient,
      permissionLevel: 'full' // Owner has full access
    }
  }

  // If direct query fails, check if user has access via shares
  const { data: hasAccess } = await supabase.rpc('can_access_patient', {
    p_patient_id: id
  })

  if (hasAccess) {
    // Get the permission level
    const { data: shareData } = await supabase
      .from('patient_shares')
      .select('permission_level')
      .eq('shared_with', user.id)
      .eq('patient_id', id)
      .is('expires_at', null)
      .maybeSingle()

    // Use RPC to get patient data (bypasses RLS)
    const { data: patientData, error: rpcError } = await supabase.rpc('get_shared_patient_data', {
      p_patient_id: id
    })

    if (patientData && !rpcError) {
      return {
        patient: patientData,
        permissionLevel: shareData?.permission_level || 'read'
      }
    }
  }

  return null
}

export default async function SharedPatientProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  const resolvedParams = await params
  const result = await getSharedPatient(resolvedParams.id)

  if (!result) {
    notFound()
  }

  const { patient, permissionLevel } = result

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-slate-600 mt-1">
                Patient ID: {patient.id.slice(0, 8)}... (Shared - {permissionLevel.toUpperCase()})
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                href="/shared-patients"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left"
              >
                Back to Shared Patients
              </Link>
            </div>
          </div>
        </div>

        {/* Shared Patient Tabs */}
        <SharedPatientTabs
          patient={patient}
          permissionLevel={permissionLevel}
        />
      </div>
    </Layout>
  )
}
