import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventoryService'
import { medicines, salesService } from '@/lib/database'

interface FinalizePrescriptionRequest {
  prescriptionId: string
  medicines: Array<{
    name: string
    quantity: number
    price: number
    isAlternative?: boolean
    originalMedicine?: string
    alternativeName?: string
  }>
  patientName: string
  doctorName: string
  notes?: string
  totalAmount: number
  paymentMethod?: 'cash' | 'card' | 'insurance' | 'other'
}

interface FinalizePrescriptionResponse {
  success: boolean
  data?: {
    prescriptionId: string
    invoiceId: string
    totalAmount: number
    updatedInventory: any[]
    processedMedicines: any[]
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<FinalizePrescriptionResponse>> {
  try {
    const body: FinalizePrescriptionRequest = await request.json()
    const { prescriptionId, medicines: prescriptionMedicines, patientName, doctorName, notes, totalAmount, paymentMethod = 'cash' } = body

    if (!prescriptionMedicines || prescriptionMedicines.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No medicines provided' 
      }, { status: 400 })
    }

    // Initialize inventory service
    const inventoryService = new InventoryService(medicines)

    // Prepare medicines for sales record
    const salesMedicines = prescriptionMedicines.map(med => {
      // Try exact match first, then partial match
      let medicine = medicines.find(m => m.name === med.name)
      if (!medicine) {
        // Try partial matching for alternatives
        medicine = medicines.find(m => 
          m.name.toLowerCase().includes(med.name.toLowerCase()) ||
          med.name.toLowerCase().includes(m.name.toLowerCase())
        )
      }
      
      return {
        medicineId: medicine?.id || '',
        medicineName: medicine?.name || med.name,
        quantity: med.quantity,
        unitPrice: med.price,
        totalPrice: med.price * med.quantity,
        isAlternative: med.isAlternative || false,
        originalMedicine: med.originalMedicine
      }
    })

    // Record the sale
    const saleRecord = await salesService.recordSale({
      prescriptionId,
      customerName: patientName,
      doctorName,
      medicines: salesMedicines,
      totalAmount,
      paymentMethod,
      status: 'completed',
      soldBy: 'system', // In real app, this would be the logged-in user
      notes
    })

    // Update inventory (this is now handled by salesService.recordSale)
    const updatedInventory = medicines.map(med => ({
      id: med.id,
      name: med.name,
      stock: med.stock,
      category: med.category
    }))

    // Generate invoice ID
    const invoiceId = `INV-${Date.now().toString().slice(-8)}`

    // Create processed medicines record
    const processedMedicines = prescriptionMedicines.map(med => ({
      name: med.name,
      quantity: med.quantity,
      price: med.price,
      total: med.price * med.quantity,
      isAlternative: med.isAlternative || false,
      originalMedicine: med.originalMedicine
    }))

    return NextResponse.json({
      success: true,
      data: {
        prescriptionId,
        invoiceId,
        totalAmount,
        updatedInventory,
        processedMedicines,
        saleId: saleRecord.id
      }
    })

  } catch (error) {
    console.error('Prescription finalization error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to finalize prescription' 
    }, { status: 500 })
  }
}
