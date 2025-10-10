import { NextRequest, NextResponse } from 'next/server'
import { FastInventoryService } from '@/lib/services/fastInventoryService'
import { medicines } from '@/lib/database'

interface ProcessPrescriptionRequest {
  medicines: Array<{
    name: string
    dosage: string
    quantity: number
    instructions: string
    frequency: string
    duration: string
  }>
  patientName: string
  doctorName: string
  notes?: string
}

interface ProcessPrescriptionResponse {
  success: boolean
  data?: {
    prescriptionId: string
    inventoryCheck: any[]
    alternatives: any[]
    totalCost: number
    canProcess: boolean
    missingMedicines: string[]
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ProcessPrescriptionResponse>> {
  try {
    const body: ProcessPrescriptionRequest = await request.json()
    const { medicines: prescriptionMedicines, patientName, doctorName, notes } = body

    if (!prescriptionMedicines || prescriptionMedicines.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No medicines provided' 
      }, { status: 400 })
    }

    // Use fast inventory service for quick processing
    const inventoryService = new FastInventoryService(medicines)

    // Check inventory availability
    const inventoryCheck = inventoryService.checkInventoryAvailability(
      prescriptionMedicines.map(med => ({
        name: med.name,
        quantity: med.quantity
      }))
    )

    // Find alternatives for unavailable medicines
    const alternatives: any[] = []
    const missingMedicines: string[] = []

    try {
      for (const check of inventoryCheck) {
        if (!check.isAvailable) {
          missingMedicines.push(check.medicineName)
          
          // Find alternatives
          const medicineDetails = prescriptionMedicines.find(med => 
            med.name.toLowerCase().includes(check.medicineName.toLowerCase())
          )
          
          if (medicineDetails) {
            const medicineAlternatives = inventoryService.findAlternatives(
              check.medicineName,
              check.category,
              check.requestedQuantity
            )
            
            alternatives.push({
              originalMedicine: check.medicineName,
              requestedQuantity: check.requestedQuantity,
              alternatives: medicineAlternatives
            })
          }
        }
      }
    } catch (error) {
      console.error('Error finding alternatives:', error)
      // Continue without alternatives if there's an error
    }

    // Calculate total cost
    const totalCost = inventoryService.calculatePrescriptionCost(
      prescriptionMedicines.map(med => ({
        name: med.name,
        quantity: med.quantity
      }))
    )

    // Generate prescription ID
    const prescriptionId = `RX-${Date.now().toString().slice(-6)}`

    // Check if prescription can be processed
    const canProcess = inventoryCheck.every(check => check.isAvailable)

    return NextResponse.json({
      success: true,
      data: {
        prescriptionId,
        inventoryCheck,
        alternatives,
        totalCost,
        canProcess,
        missingMedicines
      }
    })

  } catch (error) {
    console.error('Prescription processing error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process prescription: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}