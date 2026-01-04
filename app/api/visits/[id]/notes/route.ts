import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get visit notes
    const { data: notes, error } = await supabase
      .from('visit_notes')
      .select('*')
      .eq('visit_id', id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching visit notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json(notes || null)
  } catch (error) {
    console.error('Error in visits/[id]/notes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if notes already exist for this visit
    const { data: existingNotes } = await supabase
      .from('visit_notes')
      .select('id')
      .eq('visit_id', id)
      .single()

    let result
    if (existingNotes) {
      // Update existing notes
      const { data, error } = await supabase
        .from('visit_notes')
        .update({
          ...body,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new notes
      const { data, error } = await supabase
        .from('visit_notes')
        .insert({
          visit_id: id,
          ...body,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in visits/[id]/notes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update specific sections of notes
    const { data, error } = await supabase
      .from('visit_notes')
      .update({
        ...body,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('visit_id', id)
      .select()
      .single()

    if (error) {
      // If no notes exist yet, create them
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('visit_notes')
          .insert({
            visit_id: id,
            ...body,
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single()

        if (insertError) throw insertError
        return NextResponse.json(newData)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in visits/[id]/notes PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
