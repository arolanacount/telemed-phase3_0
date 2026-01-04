import Layout from '@/components/Layout'
import { generateDemoPatients } from '@/app/patients/actions'
import { redirect } from 'next/navigation'

async function handleGeneratePatients() {
  'use server'

  const result = await generateDemoPatients()

  if (!result.success) {
    throw new Error(result.message)
  }

  // Redirect back to patients page on success
  redirect('/patients')
}

export default function GeneratePatientsPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Generate Demo Patients</h1>
          <p className="text-slate-600 mt-1">
            Generate 50 demo patients with realistic Jamaican data for testing purposes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Demo Patient Generation</h3>
            <p className="text-slate-600 text-sm mb-4">
              This will create 50 patients with:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4">
              <li>• First name: "demo-patient"</li>
              <li>• Last name: Random Jamaican surnames (some hyphenated)</li>
              <li>• Randomly populated fields (sometimes incomplete)</li>
              <li>• All patients assigned to your clinician account</li>
            </ul>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <form action={handleGeneratePatients}>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Generate 50 Demo Patients
              </button>
            </form>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            <p>Note: This operation may take a few seconds to complete.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
