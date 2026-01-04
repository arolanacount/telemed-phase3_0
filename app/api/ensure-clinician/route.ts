import { ensureClinicianExists } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('userId') as string
        const fullName = formData.get('fullName') as string
        const specialty = formData.get('specialty') as string
        const role = formData.get('role') as string
        const email = formData.get('email') as string

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const clinician = await ensureClinicianExists(userId, {
      full_name: fullName || undefined,
      specialty: specialty || undefined,
      role: role || undefined,
    })

    return NextResponse.json({ success: true, clinician })
  } catch (error: any) {
    console.error('Error ensuring clinician exists:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create clinician profile' },
      { status: 500 }
    )
  }
}
