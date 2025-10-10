import { NextRequest, NextResponse } from 'next/server'
import { EnhancedInventoryService } from '@/lib/services/enhancedInventoryService'
import { medicines } from '@/lib/database'

interface SearchRequest {
  query: string
  maxResults?: number
}

interface SearchResponse {
  success: boolean
  data?: {
    results: any[]
    query: string
    totalResults: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const body: SearchRequest = await request.json()
    const { query, maxResults = 10 } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query is required' 
      }, { status: 400 })
    }

    // Initialize enhanced inventory service
    const inventoryService = new EnhancedInventoryService(medicines)
    await inventoryService.initialize()

    // Perform semantic search
    const results = await inventoryService.searchMedicines(query, maxResults)

    return NextResponse.json({
      success: true,
      data: {
        results,
        query,
        totalResults: results.length
      }
    })

  } catch (error) {
    console.error('Medicine search error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search medicines' 
    }, { status: 500 })
  }
}
