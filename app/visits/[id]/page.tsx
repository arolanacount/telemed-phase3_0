import { notFound } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import VisitClient from './VisitClient'

async function getVisit(id: string) {
  const supabase = await createClient()

  // First try a direct query (works for owned visits)
  const { data: visit, error } = await supabase
    .from('visits')
    .select('*, patients(*)')
    .eq('id', id)
    .maybeSingle()

  if (visit && !error) return visit

  // If direct select fails (due to access), try RPC helper
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_shared_visit_data', { p_visit_id: id })
  if (rpcResult && !rpcError) return rpcResult

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

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  const resolved = await params
  const visit = await getVisit(resolved.id)
  const clinicianRole = await getClinicianRole()

  if (!visit) notFound()

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Visit for {visit.patients?.first_name} {visit.patients?.last_name}</h1>
              <p className="text-slate-600 mt-1">Visit ID: {visit.id}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <a href="/visits" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left">Back to Visits</a>
            </div>
          </div>
        </div>

        <VisitClient visitId={visit.id} initialVisit={visit} />
      </div>
    </Layout>
  )
}
