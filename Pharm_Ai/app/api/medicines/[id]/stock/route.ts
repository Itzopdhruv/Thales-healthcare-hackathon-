import { NextRequest, NextResponse } from 'next/server'
import { medicineService } from '@/lib/database'

// POST /api/medicines/[id]/stock - Update medicine stock
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const { quantity, reason, userId, notes } = body
    
    // Validate required fields
    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { success: false, error: 'Quantity is required' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate quantity
    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a number' },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be zero' },
        { status: 400 }
      )
    }

    const medicine = await medicineService.updateStock(
      params.id,
      quantity,
      reason,
      userId,
      notes
    )
    
    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: medicine,
      message: 'Stock updated successfully'
    })
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}
