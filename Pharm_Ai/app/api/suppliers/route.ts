import { NextResponse } from 'next/server'
import { getSuppliers } from '@/lib/database'

// GET /api/suppliers - Get all suppliers
export async function GET() {
  try {
    const suppliers = getSuppliers()
    
    return NextResponse.json({
      success: true,
      data: suppliers
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
