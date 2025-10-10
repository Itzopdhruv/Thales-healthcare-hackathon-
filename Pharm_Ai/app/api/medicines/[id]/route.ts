import { NextRequest, NextResponse } from 'next/server'
import { medicineService } from '@/lib/database'

// GET /api/medicines/[id] - Get medicine by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medicine = await medicineService.getById(params.id)
    
    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: medicine
    })
  } catch (error) {
    console.error('Error fetching medicine:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medicine' },
      { status: 500 }
    )
  }
}

// PUT /api/medicines/[id] - Update medicine
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate data if provided
    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock cannot be negative' },
        { status: 400 }
      )
    }

    if (body.price !== undefined && body.price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive' },
        { status: 400 }
      )
    }

    if (body.costPrice !== undefined && body.costPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cost price must be positive' },
        { status: 400 }
      )
    }

    if (body.expiryDate && new Date(body.expiryDate) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiry date must be in the future' },
        { status: 400 }
      )
    }

    const medicine = await medicineService.update(params.id, body)
    
    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: medicine,
      message: 'Medicine updated successfully'
    })
  } catch (error) {
    console.error('Error updating medicine:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update medicine' },
      { status: 500 }
    )
  }
}

// DELETE /api/medicines/[id] - Delete medicine
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await medicineService.delete(params.id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Medicine deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting medicine:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete medicine' },
      { status: 500 }
    )
  }
}
