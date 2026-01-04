import { createClient } from './supabaseServer'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  return user
}

export async function getClinician(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinicians')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // If no clinician record exists, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get clinician: ${error.message}`)
  }

  return data
}

export async function ensureClinicianExists(userId: string, userData?: { full_name?: string; specialty?: string; email?: string; role?: string }) {
  const supabase = await createClient()

  // Get current user data (this works in server context)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unable to authenticate user')
  }

  // Check if clinician record exists
  let existingClinician = await getClinician(userId)

  if (existingClinician) {
    // Update email if it's missing and we have user data
    const updates: any = {}
    let needsUpdate = false

    if (!existingClinician.email && user.email) {
      updates.email = user.email
      needsUpdate = true
    }

    // Ensure demodoctor@telemed.com has admin role
    const userEmail = userData?.email || user.email
    if (userEmail === 'demodoctor@telemed.com' && existingClinician.role !== 'admin') {
      updates.role = 'admin'
      needsUpdate = true
    }

    if (needsUpdate) {
      updates.updated_at = new Date().toISOString()
      await supabase
        .from('clinicians')
        .update(updates)
        .eq('id', userId)

      // Update the returned object
      existingClinician = { ...existingClinician, ...updates }
    }

    return existingClinician
  }

  // Determine role based on userData, email, or default
  let role = userData?.role || 'clinician'
  const userEmail = userData?.email || user.email
  if (userEmail === 'demodoctor@telemed.com') {
    role = 'admin' // Override for demo doctor
  }

  // If not, create one with available data
  const { data, error } = await supabase
    .from('clinicians')
    .insert({
      id: userId,
      full_name: userData?.full_name || user.user_metadata?.full_name || 'Unknown Clinician',
      specialty: userData?.specialty || user.user_metadata?.specialty || null,
      role: role,
      email: user.email,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create clinician record: ${error.message}`)
  }

  return data
}

export async function requireAuth() {
  return await getUser()
}
