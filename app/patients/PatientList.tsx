'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import React from 'react'

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

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  created_at: string
  shared_at?: string
  permission_level?: 'read' | 'write' | 'full'
  sharer_name?: string
  recipient_name?: string
}

interface PatientListProps {
  initialPatients: Patient[]
  totalCount: number
  totalPages: number
  currentPage: number
  limit: number
  isAdmin?: boolean
  isSharedView?: boolean
  sharedByMe?: boolean
}

interface DuplicateGroup {
  group_id: number
  duplicate_count: number
  patient_ids: string[]
  patients: Patient[]
}

// Function to highlight matching text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function PatientList({
  initialPatients,
  totalCount,
  totalPages,
  currentPage,
  limit,
  isAdmin = false,
  isSharedView = false,
  sharedByMe = false
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTotalCount, setSearchTotalCount] = useState(0)
  const [searchTotalPages, setSearchTotalPages] = useState(0)
  const [searchCurrentPage, setSearchCurrentPage] = useState(1)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [duplicateMode, setDuplicateMode] = useState(false)
  const [findingDuplicates, setFindingDuplicates] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [mergingDuplicates, setMergingDuplicates] = useState(false)

  const displayData = useMemo(() => {
    if (duplicateMode) {
      // In duplicate mode, show flattened list of all duplicate patients
      return duplicateGroups.flatMap(group => group.patients)
    }

    if (!searchQuery.trim()) {
      return initialPatients
    }

    // If we have search results from API, use those
    if (searchResults.length > 0) {
      return searchResults
    }

    // Fallback to client-side filtering for immediate feedback
    const query = searchQuery.toLowerCase()
    return initialPatients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
      const dob = patient.date_of_birth || ''
      const phone = patient.phone || ''
      const email = patient.email || ''

      return (
        fullName.includes(query) ||
        dob.includes(query) ||
        phone.includes(query) ||
        email.includes(query) ||
        patient.id.includes(query)
      )
    })
  }, [initialPatients, searchQuery, searchResults, duplicateMode, duplicateGroups])

  const performSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchTotalCount(0)
      setSearchTotalPages(0)
      setSearchCurrentPage(1)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.patients || [])
        setSearchTotalCount(data.pagination?.totalCount || 0)
        setSearchTotalPages(data.pagination?.totalPages || 0)
        setSearchCurrentPage(page)
      } else {
        console.error('Search failed:', data.error)
        setSearchResults([])
        setSearchTotalCount(0)
        setSearchTotalPages(0)
        setSearchCurrentPage(1)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setSearchTotalCount(0)
      setSearchTotalPages(0)
      setSearchCurrentPage(1)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (query: string, page: number = 1) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        performSearch(query, page)
      }, 300)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSearchCurrentPage(1) // Reset to first page when starting a new search
    debouncedSearch(value, 1)
  }

  const handleCardClick = (patientId: string, event: React.MouseEvent) => {
    // Don't handle clicks on the View button
    if ((event.target as HTMLElement).closest('a[href*="/patients/"]')) {
      return
    }

    event.preventDefault()

    if (selectedPatientId === patientId) {
      // Second click - open details
      window.location.href = `/patients/${patientId}`
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

  const findDuplicates = async () => {
    setFindingDuplicates(true)
    setDuplicateGroups([])
    setDuplicateMode(false)

    try {
      const response = await fetch('/api/patients/find-duplicates')
      const data = await response.json()

      if (response.ok) {
        setDuplicateGroups(data.duplicates || [])
        setDuplicateMode(true)
        setToastMessage(`Found ${data.totalGroups || 0} groups of duplicate patients`)
      } else {
        setToastMessage(data.error || 'Failed to find duplicates')
      }
    } catch (error) {
      console.error('Error finding duplicates:', error)
      setToastMessage('Failed to find duplicates')
    } finally {
      setFindingDuplicates(false)
    }

    setTimeout(() => setToastMessage(''), 4000)
  }

  const mergeDuplicates = async () => {
    if (duplicateGroups.length === 0) return

    setMergingDuplicates(true)
    let mergedCount = 0
    let errorCount = 0

    try {
      // Merge each group of duplicates
      for (const group of duplicateGroups) {
        if (group.patients.length < 2) continue

        // Keep the oldest patient (first in array) and merge others into it
        const targetPatient = group.patients[0]
        const sourcePatients = group.patients.slice(1)

        for (const sourcePatient of sourcePatients) {
          try {
            const response = await fetch('/api/patients/merge', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourcePatientId: sourcePatient.id,
                targetPatientId: targetPatient.id,
              }),
            })

            if (response.ok) {
              mergedCount++
            } else {
              errorCount++
              console.error('Failed to merge patient:', sourcePatient.id)
            }
          } catch (error) {
            errorCount++
            console.error('Error merging patient:', sourcePatient.id, error)
          }
        }
      }

      if (mergedCount > 0) {
        setToastMessage(`Successfully merged ${mergedCount} duplicate patients`)
        // Reset duplicate mode and refresh the page
        setDuplicateMode(false)
        setDuplicateGroups([])
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (errorCount > 0) {
        setToastMessage(`Failed to merge ${errorCount} patients`)
      } else {
        setToastMessage('No patients to merge')
      }
    } catch (error) {
      console.error('Error in merge process:', error)
      setToastMessage('Failed to merge duplicates')
    } finally {
      setMergingDuplicates(false)
    }

    setTimeout(() => setToastMessage(''), 5000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, date of birth, phone, email, or patient ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={duplicateMode ? mergeDuplicates : findDuplicates}
                disabled={findingDuplicates || mergingDuplicates || (duplicateMode && duplicateGroups.length === 0)}
                className={`w-full sm:w-auto px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${
                  duplicateMode
                    ? duplicateGroups.length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                    : 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
                }`}
              >
                {(findingDuplicates || mergingDuplicates) ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="sr-only">
                      {findingDuplicates ? 'Finding...' : 'Merging...'}
                    </span>
                  </>
                ) : duplicateMode ? (
                  duplicateGroups.length === 0 ? 'No Duplicates Found' : 'Merge Duplicates'
                ) : (
                  'Find Duplicates'
                )}
              </button>

              {duplicateMode && (
                <button
                  onClick={() => {
                    setDuplicateMode(false)
                    setDuplicateGroups([])
                    setToastMessage('')
                  }}
                  disabled={mergingDuplicates}
                  className="w-full sm:w-auto px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
                >
                  Return to Patient List
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {(() => {
        if (duplicateMode) {
          // Show duplicate information
          return (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-amber-800 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <strong>Duplicate Mode:</strong> Found {duplicateGroups.length} groups of duplicate patients
                ({duplicateGroups.reduce((sum, group) => sum + group.duplicate_count, 0)} total patients)
              </div>
              <div className="text-sm text-slate-600">
                Showing all duplicate patients for review
              </div>
            </div>
          )
        }

        // Use search pagination if searching, otherwise use regular pagination
        const isSearching = searchQuery.trim().length > 0
        const displayTotalPages = isSearching ? searchTotalPages : totalPages
        const displayTotalCount = isSearching ? searchTotalCount : totalCount
        const displayCurrentPage = isSearching ? searchCurrentPage : currentPage

        // Don't show pagination in duplicate mode - only show the duplicate information banner
        if (duplicateMode) {
          return null
        }

        return displayTotalPages > 1 ? (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              {isSearching ? (
                `Found ${displayTotalCount} patient${displayTotalCount !== 1 ? 's' : ''} matching "${searchQuery}"`
              ) : (
                `Showing ${((displayCurrentPage - 1) * limit) + 1} to ${Math.min(displayCurrentPage * limit, displayTotalCount)} of ${displayTotalCount} patients`
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Previous button */}
              {displayCurrentPage > 1 ? (
                isSearching ? (
                  <button
                    onClick={() => performSearch(searchQuery, displayCurrentPage - 1)}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </button>
                ) : (
                  <Link
                    href={`/patients?page=${displayCurrentPage - 1}&limit=${limit}`}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </Link>
                )
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                  Previous
                </span>
              )}

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                  let pageNum
                  if (displayTotalPages <= 5) {
                    pageNum = i + 1
                  } else if (displayCurrentPage <= 3) {
                    pageNum = i + 1
                  } else if (displayCurrentPage >= displayTotalPages - 2) {
                    pageNum = displayTotalPages - 4 + i
                  } else {
                    pageNum = displayCurrentPage - 2 + i
                  }

                  // For search results, only enable pages that actually have results
                  const isEnabled = !isSearching || pageNum <= displayTotalPages

                  return isEnabled ? (
                    <Link
                      key={pageNum}
                      href={isSearching ? '#' : `/patients?page=${pageNum}&limit=${limit}`}
                      onClick={isSearching ? (e) => {
                        e.preventDefault()
                        performSearch(searchQuery, pageNum)
                      } : undefined}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === displayCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ) : (
                    <span
                      key={pageNum}
                      className="px-3 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                    >
                      {pageNum}
                    </span>
                  )
                })}
              </div>

              {/* Next button */}
              {displayCurrentPage < displayTotalPages ? (
                isSearching ? (
                  <button
                    onClick={() => performSearch(searchQuery, displayCurrentPage + 1)}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <Link
                    href={`/patients?page=${displayCurrentPage + 1}&limit=${limit}`}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Next
                  </Link>
                )
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          </div>
        ) : null
      })()}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {displayData.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <svg
              className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 ${
                duplicateMode ? 'text-amber-300' : 'text-slate-300'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-1">
              {duplicateMode
                ? 'No duplicate patients found'
                : searchQuery
                ? 'No patients found'
                : isSharedView
                ? 'No shared patients'
                : 'No patients yet'
              }
            </h3>
            <p className="text-sm sm:text-base text-slate-500">
              {duplicateMode
                ? 'All patients appear to be unique. No duplicates detected.'
                : searchQuery
                ? 'Try adjusting your search criteria.'
                : isSharedView
                ? 'No patients have been shared with you yet.'
                : 'Get started by adding your first patient.'
              }
            </p>
            {!searchQuery && !duplicateMode && !isSharedView && (
              <Link
                href="/patients/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Patient
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="block lg:hidden">
              <div className="space-y-1">
                {displayData.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={(e) => handleCardClick(patient.id, e)}
                    className={`block p-4 cursor-pointer transition-all border border-slate-200 rounded-lg ${
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
                          <h3 className={`text-sm font-medium truncate transition-colors ${
                            selectedPatientId === patient.id
                              ? 'text-blue-700 font-semibold'
                              : 'text-slate-900 hover:text-blue-600'
                          }`}>
                            {highlightText(`${patient.first_name} ${patient.last_name}`, searchQuery)}
                          </h3>
                          <Link
                            href={`/patients/${patient.id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View →
                          </Link>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          ID: {patient.id.slice(0, 8)}...
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">DOB:</span>
                            <span className="ml-1 text-slate-900">
                              {patient.date_of_birth ? highlightText(patient.date_of_birth, searchQuery) : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Added:</span>
                            <span className="ml-1 text-slate-900">
                              {formatDate(patient.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 text-xs">
                          <div className="text-slate-900 truncate">
                            {patient.email && highlightText(patient.email, searchQuery)}
                          </div>
                          {patient.phone && (
                            <div className="text-slate-500 truncate">
                              {highlightText(patient.phone, searchQuery)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop table layout */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse border-spacing-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      DOB
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    {isSharedView ? (
                      <>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {sharedByMe ? 'Shared With' : 'Shared By'}
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Permission
                        </th>
                      </>
                    ) : (
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Added
                      </th>
                    )}
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={(e) => handleCardClick(patient.id, e)}
                      className={`cursor-pointer transition-all border-b border-slate-100 ${
                        selectedPatientId === patient.id
                          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            selectedPatientId === patient.id
                              ? 'bg-blue-200'
                              : 'bg-blue-100 hover:bg-blue-200'
                          }`}>
                            <span className="text-blue-600 font-medium text-sm">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium transition-colors ${
                              selectedPatientId === patient.id
                                ? 'text-blue-700 font-semibold'
                                : 'text-slate-900 hover:text-blue-600'
                            }`}>
                              {highlightText(`${patient.first_name} ${patient.last_name}`, searchQuery)}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {patient.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {patient.date_of_birth ? highlightText(patient.date_of_birth, searchQuery) : 'N/A'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {patient.email && highlightText(patient.email, searchQuery)}
                        </div>
                        {patient.phone && (
                          <div className="text-sm text-slate-500">
                            {highlightText(patient.phone, searchQuery)}
                          </div>
                        )}
                      </td>
                      {isSharedView ? (
                        <>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {sharedByMe ? (patient.recipient_name || 'Unknown') : (patient.sharer_name || 'Unknown')}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              FULL ACCESS
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(patient.created_at)}
                        </td>
                      )}
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mini Pagination Controls - Bottom */}
        {(() => {
          // Use search pagination if searching, otherwise use regular pagination
          const isSearching = searchQuery.trim().length > 0
          const displayTotalPages = isSearching ? searchTotalPages : totalPages
          const displayCurrentPage = isSearching ? searchCurrentPage : currentPage

          // Don't show pagination in duplicate mode
          if (duplicateMode) {
            return null
          }

          return displayTotalPages > 1 ? (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-4">
                {/* Previous button */}
                {displayCurrentPage > 1 ? (
                  isSearching ? (
                    <button
                      onClick={() => performSearch(searchQuery, displayCurrentPage - 1)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      ← Previous
                    </button>
                  ) : (
                    <Link
                      href={`/patients?page=${displayCurrentPage - 1}&limit=${limit}`}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      ← Previous
                    </Link>
                  )
                ) : (
                  <span className="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                    ← Previous
                  </span>
                )}

                {/* Next button */}
                {displayCurrentPage < displayTotalPages ? (
                  isSearching ? (
                    <button
                      onClick={() => performSearch(searchQuery, displayCurrentPage + 1)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <Link
                      href={`/patients?page=${displayCurrentPage + 1}&limit=${limit}`}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Next →
                    </Link>
                  )
                ) : (
                  <span className="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                    Next →
                  </span>
                )}
              </div>
            </div>
          ) : null
        })()}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={handleToastClose} />
      )}
    </>
  )
}
