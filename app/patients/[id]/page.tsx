import { notFound } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import PatientMerge from './PatientMerge'
import PatientTabs from './PatientTabs'

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

async function getPatient(id: string) {
  const supabase = await createClient()

  // First try direct query (works for owned patients)
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (patient && !error) {
    return patient
  }

  // If direct query fails, check if user has access via shares
  const { data: hasAccess } = await supabase.rpc('can_access_patient', {
    p_patient_id: id
  })

  if (hasAccess) {
    // Use RPC to get patient data (bypasses RLS)
    const { data: patientData, error: rpcError } = await supabase.rpc('get_shared_patient_data', {
      p_patient_id: id
    })

    if (patientData && !rpcError) {
      return patientData
    }
  }
  return null
}

async function getClinicianRole() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: clinician } = await supabase
    .from('clinicians')
    .select('role')
    .eq('id', user.id)
    .single()

  return clinician?.role || null
}

export default async function PatientProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  const resolvedParams = await params
  const patient = await getPatient(resolvedParams.id)
  const clinicianRole = await getClinicianRole()

  if (!patient) {
    notFound()
  }

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
                Patient ID: {patient.id.slice(0, 8)}...
              </p>
                  </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <a
                href={`/patients/${patient.id}/edit`}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center sm:text-left"
              >
                Edit Patient
              </a>
              <a
                href="/patients"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left"
              >
                Back to Patients
              </a>
            </div>
          </div>
        </div>

        {/* Admin Patient Merge Section */}
        {clinicianRole === 'admin' && (
          <div className="mb-6">
            <PatientMerge patientId={patient.id} patientName={`${patient.first_name} ${patient.last_name}`} />
          </div>
        )}

        {/* Patient Tabs */}
        <PatientTabs
          patient={patient}
          clinicianRole={clinicianRole}
        />
      </div>
    </Layout>
  )
}
