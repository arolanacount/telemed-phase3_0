import { Suspense } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { getUser, getClinician } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import PatientList from './PatientList'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  created_at: string
}

async function getPatients(page: number = 1, limit: number = 20) {
  const supabase = await createClient()

  const offset = (page - 1) * limit

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })

  // Get paginated patients
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, phone, email, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching patients:', error)
    return { patients: [], totalCount: 0, totalPages: 0, currentPage: page }
  }

  const totalPages = Math.ceil((totalCount || 0) / limit)

  return {
    patients: patients || [],
    totalCount: totalCount || 0,
    totalPages,
    currentPage: page,
    limit
  }
}

export default async function Patients({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const user = await getUser()
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1')
  const limit = parseInt(resolvedParams.limit || '20')

  const { patients, totalCount, totalPages, currentPage } = await getPatients(page, limit)
  const clinician = await getClinician(user.id)
  const isAdmin = clinician?.role === 'admin'
  const userRole = clinician?.role || 'unknown'
  const isDemoDoctor = user.email === 'demodoctor@telemed.com'

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Patients</h1>
            <p className="text-slate-600 mt-1">Manage your patient records</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/patients/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left"
            >
              Add Patient
            </Link>
            {isDemoDoctor && (
              <span
                className="px-4 py-2 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed text-center sm:text-left"
                title="Demo patient generation is currently disabled"
              >
                Generate Demo Patients (Disabled)
              </span>
            )}
            <div className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
              Role: {userRole} | Email: {user.email}
            </div>
          </div>
        </div>

        <PatientList
          initialPatients={patients}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          limit={limit}
          isAdmin={isAdmin}
        />
      </div>
    </Layout>
  )
}
