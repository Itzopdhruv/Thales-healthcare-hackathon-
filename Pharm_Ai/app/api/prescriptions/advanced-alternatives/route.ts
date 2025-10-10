import { NextRequest, NextResponse } from 'next/server'
import { EnhancedInventoryService } from '@/lib/services/enhancedInventoryService'
import { FastInventoryService } from '@/lib/services/fastInventoryService'
import { medicines } from '@/lib/database'

interface AdvancedAlternativesRequest {
  medicines: Array<{
    name: string
    category: string
    requestedQuantity: number
  }>
}

interface AdvancedAlternativesResponse {
  success: boolean
  data?: {
    alternatives: any[]
    totalAlternatives: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AdvancedAlternativesResponse>> {
  try {
    console.log('Advanced alternatives API called')
    const body: AdvancedAlternativesRequest = await request.json()
    const { medicines: prescriptionMedicines } = body

    console.log('Request medicines:', prescriptionMedicines)

    if (!prescriptionMedicines || prescriptionMedicines.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No medicines provided' 
      }, { status: 400 })
    }

    // Use fast inventory service directly (more reliable)
    console.log('Using fast inventory service for alternatives...')
    const fastService = new FastInventoryService(medicines)
    const allAlternatives = []
    
    for (const medicine of prescriptionMedicines) {
      try {
        console.log(`Finding alternatives for ${medicine.name}...`)
        const alternatives = fastService.findAlternatives(
          medicine.name,
          medicine.category,
          medicine.requestedQuantity,
          3
        )
        
        console.log(`Found ${alternatives.length} alternatives for ${medicine.name}`)
        
        if (alternatives.length > 0) {
          allAlternatives.push({
            originalMedicine: medicine.name,
            requestedQuantity: medicine.requestedQuantity,
            alternatives: alternatives.map(alt => ({
              ...alt,
              therapeuticMatch: false,
              ingredientMatch: false,
              activeIngredients: [],
              therapeuticClass: alt.category
            }))
          })
        }
      } catch (altError) {
        console.error(`Error finding alternatives for ${medicine.name}:`, altError)
      }
    }
    
    console.log(`Total alternatives found: ${allAlternatives.length}`)
    
    return NextResponse.json({
      success: true,
      data: {
        alternatives: allAlternatives,
        totalAlternatives: allAlternatives.length
      }
    })

  } catch (error) {
    console.error('Advanced alternatives error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to find advanced alternatives' 
    }, { status: 500 })
  }
}
