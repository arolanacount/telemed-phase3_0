'use client'

import { useState } from 'react'

// Simple toast component
function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-blue-200 hover:text-white"
      >
        ×
      </button>
    </div>
  )
}

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

interface SharedPatientsClientProps {
  sharedWithMeData: {
    patients: SharedWithMePatient[]
    totalCount: number
    totalPages: number
    currentPage: number
  }
  sharedByMeData: {
    patients: SharedByMePatient[]
    totalCount: number
    totalPages: number
    currentPage: number
  }
  initialTab: string
  limit: number
}

export default function SharedPatientsClient({
  sharedWithMeData,
  sharedByMeData,
  initialTab,
  limit
}: SharedPatientsClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string>('')

  const handleCardClick = (patientId: string, event: React.MouseEvent) => {
    // Don't handle clicks on the View button
    if ((event.target as HTMLElement).closest('a[href*="/shared-patients/"]')) {
      return
    }

    event.preventDefault()

    if (selectedPatientId === patientId) {
      // Second click - open details
      window.location.href = `/shared-patients/${patientId}`
    } else {
      // First click - select the card
      setSelectedPatientId(patientId)
      setToastMessage('Tap again to open patient details')
      setTimeout(() => setToastMessage(''), 3000) // Auto-hide after 3 seconds
    }
  }

  const handleToastClose = () => {
    setToastMessage('')
  }

  const tabs = [
    {
      id: 'shared-with-me',
      name: 'Shared With Me',
      description: 'Patients shared with you by other clinicians',
      data: sharedWithMeData
    },
    {
      id: 'shared-by-me',
      name: 'Shared By Me',
      description: 'Patients you have shared with other clinicians',
      data: sharedByMeData
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="mb-4">
        <p className="text-sm text-slate-600">{activeTabData.description}</p>
      </div>

      {/* Patient List */}
      <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
        {/* Mobile card layout */}
        <div className="block lg:hidden">
          <div className="divide-y divide-slate-200">
            {activeTabData.data.patients.map((patient) => (
              <div
                key={patient.id}
                onClick={(e) => handleCardClick(patient.id, e)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedPatientId === patient.id
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <a
                        href={`/shared-patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View →
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: {patient.id.slice(0, 8)}...
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">DOB:</span>
                        <span className="ml-1 text-slate-900">
                          {new Date(patient.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Shared:</span>
                        <span className="ml-1 text-slate-900">
                          {new Date(patient.shared_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs">
                      <div className="text-slate-900 truncate">{patient.email}</div>
                      {patient.phone && (
                        <div className="text-slate-500 truncate">{patient.phone}</div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        {activeTab === 'shared-with-me' ? 'Shared by:' : 'Shared with:'}
                        <span className="ml-1 font-medium">
                          {activeTab === 'shared-with-me'
                            ? (patient as SharedWithMePatient).sharer_name
                            : (patient as SharedByMePatient).recipient_name}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        patient.permission_level === 'full'
                          ? 'bg-green-100 text-green-800'
                          : patient.permission_level === 'write'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {patient.permission_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table layout */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {activeTab === 'shared-with-me' ? 'Shared By' : 'Shared With'}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Shared Date
                  </th>
                  <th className="relative px-4 lg:px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {activeTabData.data.patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-700">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            ID: {patient.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-slate-500">
                        Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{patient.email}</div>
                      <div className="text-sm text-slate-500">{patient.phone}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {activeTab === 'shared-with-me'
                        ? (patient as SharedWithMePatient).sharer_name
                        : (patient as SharedByMePatient).recipient_name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        patient.permission_level === 'full'
                          ? 'bg-green-100 text-green-800'
                          : patient.permission_level === 'write'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {patient.permission_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(patient.shared_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/shared-patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {activeTabData.data.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <a
                href={`/shared-patients?page=${Math.max(1, activeTabData.data.currentPage - 1)}&tab=${activeTab}`}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTabData.data.currentPage <= 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                }`}
                onClick={(e) => activeTabData.data.currentPage <= 1 && e.preventDefault()}
              >
                Previous
              </a>
              <a
                href={`/shared-patients?page=${Math.min(activeTabData.data.totalPages, activeTabData.data.currentPage + 1)}&tab=${activeTab}`}
                className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTabData.data.currentPage >= activeTabData.data.totalPages
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                }`}
                onClick={(e) => activeTabData.data.currentPage >= activeTabData.data.totalPages && e.preventDefault()}
              >
                Next
              </a>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{(activeTabData.data.currentPage - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(activeTabData.data.currentPage * limit, activeTabData.data.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{activeTabData.data.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <a
                    href={`/shared-patients?page=${Math.max(1, activeTabData.data.currentPage - 1)}&tab=${activeTab}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${
                      activeTabData.data.currentPage <= 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={(e) => activeTabData.data.currentPage <= 1 && e.preventDefault()}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>

                  {/* Page numbers would go here - simplified for now */}

                  <a
                    href={`/shared-patients?page=${Math.min(activeTabData.data.totalPages, activeTabData.data.currentPage + 1)}&tab=${activeTab}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                      activeTabData.data.currentPage >= activeTabData.data.totalPages
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={(e) => activeTabData.data.currentPage >= activeTabData.data.totalPages && e.preventDefault()}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={handleToastClose} />
      )}
    </div>
  )
}
