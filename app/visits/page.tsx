import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

async function getVisits(userId: string) {
  try {
    const { createClient } = await import('@/lib/supabaseServer')
    const supabase = await createClient()

    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        visit_type,
        visit_status,
        started_at,
        ended_at,
        chief_complaint,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching visits:', error)
      return []
    }

    return visits || []
  } catch (error) {
    console.error('Error in getVisits:', error)
    return []
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'pending_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'finalized':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatStatus(status: string) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default async function Visits() {
  const user = await requireAuth()
  const visits = await getVisits(user.id)

  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Visits</h1>
            <p className="text-slate-600 mt-1">View and manage patient visits</p>
          </div>
          <Link href="/visits/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:text-left">
            Start New Visit
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {visits.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {visits.map((visit: any) => (
                <div key={visit.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                          {visit.patients?.first_name} {visit.patients?.last_name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600 mt-1">
                          <span>{visit.visit_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(visit.started_at).toLocaleDateString()}</span>
                          {visit.chief_complaint && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">{visit.chief_complaint}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visit.visit_status)} self-start sm:self-auto`}>
                        {formatStatus(visit.visit_status)}
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/visits/${visit.id}`}
                          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/visits/${visit.id}`}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                        >
                          Continue Visit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center py-12 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No visits yet</p>
                <p className="text-sm mt-2">Start a new visit to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
