'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PatientShare from './PatientShare'

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

interface PatientTabsProps {
  patient: Patient
  clinicianRole: string | null
}

interface MedicalHistory {
  id: string
  condition: string
  diagnosis_date: string
  status: string
  notes: string
  created_at: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string | null
  prescribing_physician: string
  notes: string
  created_at: string
}

interface Allergy {
  id: string
  allergen: string
  reaction: string
  severity: string
  notes: string
  created_at: string
}

interface Visit {
  id: string
  started_at: string
  visit_type: string
  visit_status: string
  chief_complaint: string
}

export default function PatientTabs({ patient, clinicianRole }: PatientTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loadingVisits, setLoadingVisits] = useState(false)

  // Fetch visits data
  useEffect(() => {
    const fetchVisits = async () => {
      setLoadingVisits(true)
      try {
        const response = await fetch(`/api/patients/${patient.id}/visits`)
        if (response.ok) {
          const data = await response.json()
          setVisits(data)
        }
      } catch (error) {
        console.error('Error fetching visits:', error)
      } finally {
        setLoadingVisits(false)
      }
    }

    fetchVisits()
  }, [patient.id])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'medical-history', label: 'Medical History' },
    { id: 'medications', label: 'Medications' },
    { id: 'allergies', label: 'Allergies' },
    { id: 'visits', label: 'Visits' },
    { id: 'documents', label: 'Documents' }
  ]

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <dt className="text-sm font-medium text-slate-500">Full Name</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.first_name} {patient.last_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Date of Birth</dt>
            <dd className="text-sm text-slate-900 mt-1">
              {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Gender</dt>
            <dd className="text-sm text-slate-900 mt-1 capitalize">{patient.gender || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">National ID</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.national_id || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Passport Number</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.passport_number || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Driver's License</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.drivers_license || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.email || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Phone</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.phone || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Blood Type</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.blood_type || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Marital Status</dt>
            <dd className="text-sm text-slate-900 mt-1 capitalize">{patient.marital_status || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Occupation</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.occupation || 'Not set'}</dd>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <dt className="text-sm font-medium text-slate-500">Address</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.address || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">City</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.city || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Parish</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.parish || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Postal Code</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.postal_code || 'Not set'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Country</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.country || 'Not set'}</dd>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <dt className="text-sm font-medium text-slate-500">Name</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.emergency_contact_name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Phone</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.emergency_contact_phone || 'Not set'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Relationship</dt>
            <dd className="text-sm text-slate-900 mt-1">{patient.emergency_contact_relationship || 'Not set'}</dd>
          </div>
        </div>
      </div>

      {/* Lifestyle Information */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Lifestyle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <dt className="text-sm font-medium text-slate-500">Smoking Status</dt>
            <dd className="text-sm text-slate-900 mt-1 capitalize">{patient.smoking_status || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Alcohol Use</dt>
            <dd className="text-sm text-slate-900 mt-1 capitalize">{patient.alcohol_use || 'Not set'}</dd>
          </div>
        </div>
      </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <dt className="text-sm font-medium text-slate-500">Created</dt>
                <dd className="text-sm text-slate-900 mt-1">
                  {patient.created_at ? new Date(patient.created_at).toLocaleString() : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last Updated</dt>
                <dd className="text-sm text-slate-900 mt-1">
                  {patient.updated_at ? new Date(patient.updated_at).toLocaleString() : 'Unknown'}
                </dd>
              </div>
            </div>
          </div>

          {/* Patient Sharing */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Patient</h3>
            <PatientShare
              patientId={patient.id}
              patientName={`${patient.first_name} ${patient.last_name}`}
            />
          </div>
        </div>
  )

  const renderMedicalHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Medical History</h3>
        {clinicianRole === 'admin' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Medical History
          </button>
        )}
      </div>

      {medicalHistory.length > 0 ? (
        <div className="space-y-3">
          {medicalHistory.map((history) => (
            <div key={history.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900">{history.condition}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  history.status === 'active' ? 'bg-red-100 text-red-800' :
                  history.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {history.status}
                </span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <div>Diagnosed: {new Date(history.diagnosis_date).toLocaleDateString()}</div>
                {history.notes && <div>Notes: {history.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No medical history recorded</p>
          <p className="text-sm mt-1">Medical history entries will appear here</p>
        </div>
      )}
    </div>
  )

  const renderMedicationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Current Medications</h3>
        {clinicianRole === 'admin' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Medication
          </button>
        )}
      </div>

      {medications.length > 0 ? (
        <div className="space-y-3">
          {medications.map((medication) => (
            <div key={medication.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900">{medication.name}</h4>
                <span className="text-sm text-slate-600">
                  {medication.dosage} - {medication.frequency}
                </span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <div>Started: {new Date(medication.start_date).toLocaleDateString()}</div>
                {medication.end_date && (
                  <div>Ended: {new Date(medication.end_date).toLocaleDateString()}</div>
                )}
                {medication.prescribing_physician && (
                  <div>Prescribed by: {medication.prescribing_physician}</div>
                )}
                {medication.notes && <div>Notes: {medication.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No current medications</p>
          <p className="text-sm mt-1">Current medications will appear here</p>
        </div>
      )}
    </div>
  )

  const renderAllergiesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Allergies</h3>
        {clinicianRole === 'admin' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Allergy
          </button>
        )}
      </div>

      {allergies.length > 0 ? (
        <div className="space-y-3">
          {allergies.map((allergy) => (
            <div key={allergy.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900">{allergy.allergen}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  allergy.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {allergy.severity}
                </span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <div>Reaction: {allergy.reaction}</div>
                {allergy.notes && <div>Notes: {allergy.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No allergies recorded</p>
          <p className="text-sm mt-1">Known allergies will appear here</p>
        </div>
      )}
    </div>
  )

  const renderVisitsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Visit History</h3>

      {loadingVisits ? (
        <div className="text-center py-8 text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-2">Loading visit history...</p>
        </div>
      ) : visits.length > 0 ? (
        <div className="space-y-3">
          {visits.map((visit) => (
            <div key={visit.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-slate-900">
                    {new Date(visit.started_at).toLocaleDateString()} - {visit.visit_type}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">{visit.chief_complaint}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  visit.visit_status === 'completed' ? 'bg-green-100 text-green-800' :
                  visit.visit_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {visit.visit_status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3">
                <Link
                  href={`/visits/${visit.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Visit Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No visits recorded</p>
          <p className="text-sm mt-1">Visit history will appear here</p>
        </div>
      )}
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
        {clinicianRole === 'admin' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upload Document
          </button>
        )}
      </div>

      <div className="text-center py-8 text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No documents uploaded</p>
        <p className="text-sm mt-1">Patient documents will appear here</p>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'medical-history':
        return renderMedicalHistoryTab()
      case 'medications':
        return renderMedicationsTab()
      case 'allergies':
        return renderAllergiesTab()
      case 'visits':
        return renderVisitsTab()
      case 'documents':
        return renderDocumentsTab()
      default:
        return renderOverviewTab()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Desktop Tab Navigation - Hidden on mobile */}
      <div className="hidden lg:block border-b border-slate-200">
        <nav className="flex space-x-8 px-4 sm:px-6">
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop Tab Content */}
      <div className="hidden lg:block p-4 sm:p-6">
        {renderTabContent()}
      </div>

      {/* Mobile Accordion - Hidden on desktop */}
      <div className="lg:hidden divide-y divide-slate-200">
        {tabs.map((tab) => (
          <div key={tab.id} className="border-slate-200">
            <button
              onClick={() => toggleSection(tab.id)}
              className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-slate-900">{tab.label}</h3>
              <svg
                className={`w-5 h-5 text-slate-500 transform transition-transform ${
                  expandedSections.has(tab.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.has(tab.id) && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                {(() => {
                  switch (tab.id) {
                    case 'overview':
                      return renderOverviewTab()
                    case 'medical-history':
                      return renderMedicalHistoryTab()
                    case 'medications':
                      return renderMedicationsTab()
                    case 'allergies':
                      return renderAllergiesTab()
                    case 'visits':
                      return renderVisitsTab()
                    case 'documents':
                      return renderDocumentsTab()
                    default:
                      return renderOverviewTab()
                  }
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
