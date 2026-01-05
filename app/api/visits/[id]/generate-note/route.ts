import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClientForApi(request)
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt } = body || {}

    // NOTE: This is a placeholder implementation. Hook in AI/LLM service here.
    // For now: create/update a visit_notes record and mark visit.ai_generated

    const generatedText = `AI-generated note (placeholder). Prompt: ${prompt || 'default'}`

    // Upsert visit_notes (create if missing, otherwise update)
    const { data: existingNotes } = await supabase
      .from('visit_notes')
      .select('id')
      .eq('visit_id', id)
      .single()

    let noteResult
    if (existingNotes) {
      const { data: updatedNote, error } = await supabase
        .from('visit_notes')
        .update({
          assessment: generatedText,
          ai_generated: true,
          ai_confidence: { generated_by: 'placeholder', confidence: 0.6 },
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', id)
        .select()
        .single()

      if (error) throw error
      noteResult = updatedNote
    } else {
      const { data: newNote, error } = await supabase
        .from('visit_notes')
        .insert({
          visit_id: id,
          assessment: generatedText,
          ai_generated: true,
          ai_confidence: { generated_by: 'placeholder', confidence: 0.6 },
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      noteResult = newNote
    }

    // Mark visit record as ai_generated
    const { data: updatedVisit } = await supabase
      .from('visits')
      .update({ ai_generated: true, ai_confidence: { generated_by: 'placeholder', confidence: 0.6 }, last_edited_by: user.id })
      .eq('id', id)
      .select()
      .single()

    return NextResponse.json({ note: noteResult, visit: updatedVisit })
  } catch (error) {
    console.error('Error in generate-note POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
