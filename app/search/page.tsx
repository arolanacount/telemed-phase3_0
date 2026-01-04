import { notFound } from 'next/navigation'
import Layout from '@/components/Layout'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

interface SearchResult {
  type: 'patient' | 'visit' | 'appointment'
  id: string
  title: string
  subtitle: string
  url: string
}

async function performSearch(query: string, userId: string): Promise<SearchResult[]> {
  const supabase = await createClient()

  const results: SearchResult[] = []

  // Search patients
  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(5)

  if (patients) {
    for (const patient of patients) {
      results.push({
        type: 'patient',
        id: patient.id,
        title: `${patient.first_name} ${patient.last_name}`,
        subtitle: patient.email || 'No email',
        url: `/patients/${patient.id}`
      })
    }
  }

  // Search visits
  const { data: visits } = await supabase
    .from('visits')
    .select(`
      id,
      chief_complaint,
      patients (
        first_name,
        last_name
      )
    `)
    .ilike('chief_complaint', `%${query}%`)
    .limit(5)

  if (visits) {
    for (const visit of visits) {
      if (visit.patients) {
        if (visit.patients && Array.isArray(visit.patients) && visit.patients.length > 0) {
          const patient = visit.patients[0]
          results.push({
            type: 'visit',
            id: visit.id,
            title: `Visit: ${patient.first_name} ${patient.last_name}`,
            subtitle: visit.chief_complaint || 'No chief complaint',
            url: `/visits/${visit.id}`
          })
        }
      }
    }
  }

  // Search appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_type,
      patients (
        first_name,
        last_name
      )
    `)
    .ilike('appointment_type', `%${query}%`)
    .limit(5)

  if (appointments) {
    for (const appointment of appointments) {
      if (appointment.patients) {
        if (appointment.patients && Array.isArray(appointment.patients) && appointment.patients.length > 0) {
          const patient = appointment.patients[0]
          results.push({
            type: 'appointment',
            id: appointment.id,
            title: `Appointment: ${patient.first_name} ${patient.last_name}`,
            subtitle: appointment.appointment_type,
            url: `/appointments/${appointment.id}`
          })
        }
      }
    }
  }

  return results
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await getUser()
  const params = await searchParams
  const query = params.q?.trim()

  if (!query) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Global Search</h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Search across all your patients, visits, and appointments to find exactly what you need
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, symptoms, or appointment type..."
                  className="w-full px-6 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-slate-900"
                  autoFocus
                />
                <svg className="absolute right-4 top-4 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Press ⌘K anywhere in the app to quickly access search
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const results = await performSearch(query, user.id)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Search Results</h1>
              <p className="text-slate-600 mt-1">
                {results.length} results found for "<span className="font-medium">{query}</span>"
              </p>
            </div>
            <Link
              href="/search"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              New Search
            </Link>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="space-y-6">
            {/* Group results by type */}
            {['patient', 'visit', 'appointment'].map((type) => {
              const typeResults = results.filter(r => r.type === type)
              if (typeResults.length === 0) return null

              return (
                <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      {type === 'patient' && (
                        <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {type === 'visit' && (
                        <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      {type === 'appointment' && (
                        <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <h2 className="font-semibold text-slate-900 capitalize">
                        {type === 'patient' ? 'Patients' : type === 'visit' ? 'Visits' : 'Appointments'}
                        <span className="ml-2 text-sm font-normal text-slate-600">({typeResults.length})</span>
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {typeResults.map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.url}
                        className="block p-6 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {result.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                result.type === 'patient' ? 'bg-blue-100 text-blue-800' :
                                result.type === 'visit' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {result.type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 truncate">{result.subtitle}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className="text-sm text-slate-500">View</span>
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No results found</h2>
            <p className="text-slate-600 mb-6">We couldn't find anything matching "{query}"</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>Try searching for:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Patient names (first or last)</li>
                <li>Email addresses</li>
                <li>Chief complaints or symptoms</li>
                <li>Appointment types</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
