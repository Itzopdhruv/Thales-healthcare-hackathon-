import { NextRequest, NextResponse } from 'next/server'
import { EnhancedInventoryService } from '@/lib/services/enhancedInventoryService'
import { medicines } from '@/lib/database'

interface AlternativesRequest {
  medicineName: string
  category?: string
  requestedQuantity?: number
  maxResults?: number
}

interface AlternativesResponse {
  success: boolean
  data?: {
    originalMedicine: string
    alternatives: any[]
    totalAlternatives: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AlternativesResponse>> {
  try {
    const body: AlternativesRequest = await request.json()
    const { 
      medicineName, 
      category = 'General', 
      requestedQuantity = 1, 
      maxResults = 5 
    } = body

    if (!medicineName || medicineName.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Medicine name is required' 
      }, { status: 400 })
    }

    // Initialize enhanced inventory service
    const inventoryService = new EnhancedInventoryService(medicines)
    await inventoryService.initialize()

    // Find alternatives using vector search
    const alternatives = await inventoryService.findAlternatives(
      medicineName,
      category,
      requestedQuantity,
      maxResults
    )

    return NextResponse.json({
      success: true,
      data: {
        originalMedicine: medicineName,
        alternatives,
        totalAlternatives: alternatives.length
      }
    })

  } catch (error) {
    console.error('Medicine alternatives error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to find alternatives' 
    }, { status: 500 })
  }
}
