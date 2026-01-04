'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Clinician {
  id: string
  full_name: string
  email: string
}

interface PatientShareProps {
  patientId: string
  patientName: string
}

export default function PatientShare({ patientId, patientName }: PatientShareProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Clinician[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null)
  const permissionLevel: 'full' = 'full'
  const [expiresAt, setExpiresAt] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [currentShares, setCurrentShares] = useState<any[]>([])
  const router = useRouter()

  // Load current shares when component mounts
  useEffect(() => {
    loadCurrentShares()
  }, [])

  const loadCurrentShares = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/shares`)
      const data = await response.json()
      if (response.ok) {
        setCurrentShares(data.shares || [])
      }
    } catch (error) {
      console.error('Error loading shares:', error)
    }
  }

  const searchClinicians = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/clinicians/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.clinicians || [])
    } catch (error) {
      console.error('Error searching clinicians:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const sharePatient = async () => {
    if (!selectedClinician) return

    setIsSharing(true)
    setShareMessage('')

    try {
      const response = await fetch(`/api/patients/${patientId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharedWith: selectedClinician.id,
          permissionLevel,
          expiresAt: expiresAt || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShareMessage(`Successfully shared ${patientName} with ${selectedClinician.full_name}`)
        setSelectedClinician(null)
        setSearchQuery('')
        setSearchResults([])
        setExpiresAt('')
        loadCurrentShares()
        setTimeout(() => setShareMessage(''), 5000)
      } else {
        setShareMessage(data.error || 'Failed to share patient')
      }
    } catch (error) {
      console.error('Error sharing patient:', error)
      setShareMessage('Failed to share patient')
    } finally {
      setIsSharing(false)
    }
  }

  const revokeShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setShareMessage('Share revoked successfully')
        loadCurrentShares()
        setTimeout(() => setShareMessage(''), 3000)
      } else {
        setShareMessage(data.error || 'Failed to revoke share')
      }
    } catch (error) {
      console.error('Error revoking share:', error)
      setShareMessage('Failed to revoke share')
    }
  }

  return (
    <div className="space-y-6">
      {/* Share Patient Section */}
      <div>
        <h4 className="text-md font-medium text-slate-900 mb-3">Share Patient</h4>
        <div className="space-y-4">
          {/* Clinician Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search for Clinician
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchClinicians()}
                placeholder="Search by name or email..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              />
              <button
                onClick={searchClinicians}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="sr-only">Searching...</span>
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-slate-700 mb-2">Select Clinician:</h5>
              <div className="space-y-2">
                {searchResults.map((clinician) => (
                  <div
                    key={clinician.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClinician?.id === clinician.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedClinician(clinician)}
                  >
                    <div className="font-medium text-slate-900">{clinician.full_name}</div>
                    <div className="text-sm text-slate-600">{clinician.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission Settings */}
          {selectedClinician && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">Sharing with:</h5>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-slate-900">{selectedClinician.full_name}</div>
                  <div className="text-sm text-slate-600">{selectedClinician.email}</div>
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiration (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty for no expiration</p>
              </div>

              <button
                onClick={sharePatient}
                disabled={isSharing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="sr-only">Sharing...</span>
                  </>
                ) : (
                  'Share Patient'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current Shares Section */}
      <div>
        <h4 className="text-md font-medium text-slate-900 mb-3">Current Shares</h4>
        {currentShares.length > 0 ? (
          <div className="space-y-3">
            {currentShares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">{share.clinicians?.full_name}</div>
                  <div className="text-sm text-slate-600">{share.clinicians?.email}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Shared: {new Date(share.created_at).toLocaleDateString()}
                    {share.expires_at && ` | Expires: ${new Date(share.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => revokeShare(share.id)}
                  className="px-3 py-1 text-red-600 hover:text-red-800 text-sm border border-red-200 rounded hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <p>No active shares for this patient</p>
          </div>
        )}
      </div>

      {/* Status Message */}
      {shareMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          shareMessage.includes('Successfully') || shareMessage.includes('revoked')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {shareMessage}
        </div>
      )}
    </div>
  )
}
