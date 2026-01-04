'use client'

import Layout from '@/components/Layout'
import { createPatient } from '../actions'
import { useState } from 'react'

interface DuplicatePatient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone?: string
  email?: string
  clinician_id: string
}

export default function NewPatient() {
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean
    duplicates?: DuplicatePatient[]
    message?: string
  } | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    passport_number: '',
    drivers_license: '',
    email: '',
    phone: ''
  })

  const checkForDuplicates = async () => {
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      alert('Please fill in first name, last name, and date of birth before checking for duplicates.')
      return
    }

    setCheckingDuplicates(true)
    setDuplicateCheck(null)

    try {
      const response = await fetch('/api/patients/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setDuplicateCheck(data)
      } else {
        setDuplicateCheck({
          isDuplicate: false,
          message: data.message || 'Failed to check for duplicates'
        })
      }
    } catch (error) {
      setDuplicateCheck({
        isDuplicate: false,
        message: 'Failed to check for duplicates. Please try again.'
      })
    } finally {
      setCheckingDuplicates(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  return (
    <Layout>
      <div className="max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add New Patient</h1>
          <p className="text-slate-600 mt-1">Create a new patient record</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          {/* Duplicate Check Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Duplicate Prevention</h3>
            <p className="text-sm text-blue-800 mb-3">
              Check for existing patients with similar information before creating a new record.
            </p>
            <button
              type="button"
              onClick={checkForDuplicates}
              disabled={checkingDuplicates || !formData.first_name || !formData.last_name || !formData.date_of_birth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {checkingDuplicates ? 'Checking...' : 'Check for Duplicates'}
            </button>
          </div>

          {/* Duplicate Check Results */}
          {duplicateCheck && (
            <div className={`mb-6 p-4 border rounded-lg ${
              duplicateCheck.isDuplicate
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <div className="flex items-start">
                <svg className={`w-5 h-5 mr-2 mt-0.5 ${
                  duplicateCheck.isDuplicate ? 'text-amber-600' : 'text-green-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={duplicateCheck.isDuplicate
                          ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        } />
                </svg>
                <div>
                  <p className="font-medium">
                    {duplicateCheck.isDuplicate ? 'Potential Duplicate Patients Found' : 'No Duplicate Patients Found'}
                  </p>
                  <p className="text-sm">{duplicateCheck.message}</p>
                  {duplicateCheck.isDuplicate && duplicateCheck.duplicates && (
                    <div className="mt-2 space-y-1">
                      {duplicateCheck.duplicates.slice(0, 3).map((dup: DuplicatePatient) => (
                        <div key={dup.id} className="text-xs bg-white p-2 rounded border">
                          {dup.first_name} {dup.last_name} - DOB: {new Date(dup.date_of_birth).toLocaleDateString()}
                          {dup.email && ` • ${dup.email}`}
                          {dup.phone && ` • ${dup.phone}`}
                        </div>
                      ))}
                      {duplicateCheck.duplicates.length > 3 && (
                        <p className="text-xs">...and {duplicateCheck.duplicates.length - 3} more potential duplicates</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form action={createPatient} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  National ID
                </label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Passport Number
                </label>
                <input
                  type="text"
                  name="passport_number"
                  value={formData.passport_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Driver's License
                </label>
                <input
                  type="text"
                  name="drivers_license"
                  value={formData.drivers_license}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-3 sm:space-y-0 pt-4 sm:pt-6 border-t border-slate-200">
              <a
                href="/patients"
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center sm:text-left"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Patient
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}