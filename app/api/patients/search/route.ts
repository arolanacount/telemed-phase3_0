import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ No authenticated user in search API:', { error: userError?.message, hasUser: !!user })
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!query.trim()) {
      return NextResponse.json({
        patients: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    // Use RPC function for comprehensive searching including dates
    const { data: searchResults, error } = await supabase.rpc('search_patients_comprehensive', {
      search_query: query,
      page_limit: limit,
      page_offset: offset
    })

    if (error) {
      console.error('Error searching patients:', error)
      return NextResponse.json({ error: 'Failed to search patients' }, { status: 500 })
    }

    // Extract data from RPC response
    const patients = searchResults?.patients || []
    const totalCount = searchResults?.total_count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      patients: patients || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error in patients search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
