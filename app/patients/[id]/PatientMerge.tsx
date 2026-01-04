'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email?: string
  phone?: string
}

interface PatientMergeProps {
  patientId: string
  patientName: string
}

export default function PatientMerge({ patientId, patientName }: PatientMergeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [mergeMessage, setMergeMessage] = useState('')
  const [confirmMerge, setConfirmMerge] = useState('')
  const router = useRouter()

  const searchPatients = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      // Filter out the current patient from results
      setSearchResults(data.patients.filter((p: Patient) => p.id !== patientId))
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const mergePatients = async () => {
    if (!selectedPatient) return

    // Require confirmation
    if (confirmMerge !== 'MERGE') {
      setMergeMessage('Please type "MERGE" to confirm the merge operation')
      return
    }

    setIsMerging(true)
    setMergeMessage('')

    try {
      const response = await fetch('/api/patients/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourcePatientId: selectedPatient.id,
          targetPatientId: patientId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMergeMessage(`Successfully merged ${selectedPatient.first_name} ${selectedPatient.last_name} into ${patientName}`)
        setSearchResults([])
        setSelectedPatient(null)
        setSearchQuery('')
        setConfirmMerge('')
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setMergeMessage(data.error || 'Failed to merge patients')
      }
    } catch (error) {
      console.error('Error merging patients:', error)
      setMergeMessage('An error occurred while merging patients')
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold text-amber-900">Admin: Merge Duplicate Patients</h3>
      </div>

      <p className="text-amber-800 text-sm mb-4">
        Search for potential duplicate patients to merge into this record. All visits, notes, and medical records will be transferred.
      </p>

      {/* Search Section */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
          />
          <button
            onClick={searchPatients}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-amber-900 mb-2">Potential Duplicates:</h4>
          <div className="space-y-2">
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPatient?.id === patient.id
                    ? 'border-amber-500 bg-amber-100'
                    : 'border-amber-300 bg-white hover:bg-amber-50'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="font-medium text-slate-900">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-slate-600">
                  DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                  {patient.email && ` • ${patient.email}`}
                  {patient.phone && ` • ${patient.phone}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Action */}
      {selectedPatient && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm mb-3">
            <strong>Warning:</strong> This will merge <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> into <strong>{patientName}</strong>.
            All records from the source patient will be transferred to this patient, and the source patient record will be deleted.
          </p>

          <div className="mb-3">
            <label className="block text-sm font-medium text-red-800 mb-2">
              Type "MERGE" to confirm this destructive operation:
            </label>
            <input
              type="text"
              value={confirmMerge}
              onChange={(e) => setConfirmMerge(e.target.value)}
              placeholder="Type MERGE here"
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
            />
          </div>

          <button
            onClick={mergePatients}
            disabled={isMerging || confirmMerge !== 'MERGE'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMerging ? 'Merging...' : 'Confirm Merge'}
          </button>
        </div>
      )}

      {/* Message */}
      {mergeMessage && (
        <div className={`p-3 rounded-lg ${
          mergeMessage.includes('Successfully')
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {mergeMessage}
        </div>
      )}
    </div>
  )
}
