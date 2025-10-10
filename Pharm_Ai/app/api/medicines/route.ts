import { NextRequest, NextResponse } from 'next/server'
import { medicineService } from '@/lib/database'

// GET /api/medicines - Get all medicines with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      lowStock: searchParams.get('lowStock') === 'true'
    }

    const medicines = await medicineService.getAll(filters)
    
    return NextResponse.json({
      success: true,
      data: medicines,
      count: medicines.length
    })
  } catch (error) {
    console.error('Error fetching medicines:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medicines' },
      { status: 500 }
    )
  }
}

// POST /api/medicines - Create new medicine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received medicine data:', body)
    
    // Validate required fields
    const requiredFields = [
      'name', 'genericName', 'category', 'manufacturer', 'batchNumber',
      'expiryDate', 'stock', 'minStock', 'maxStock', 'price', 'costPrice',
      'dosage', 'unit', 'supplier'
    ]
    
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0)
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields)
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate data types and ranges
    if (body.stock < 0 || body.minStock < 0 || body.maxStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock values cannot be negative' },
        { status: 400 }
      )
    }

    if (body.price <= 0 || body.costPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price values must be positive' },
        { status: 400 }
      )
    }

    if (body.minStock > body.maxStock) {
      return NextResponse.json(
        { success: false, error: 'Minimum stock cannot be greater than maximum stock' },
        { status: 400 }
      )
    }

    // Validate expiry date
    const expiryDate = new Date(body.expiryDate)
    if (expiryDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiry date must be in the future' },
        { status: 400 }
      )
    }

    const medicine = await medicineService.create({
      name: body.name,
      genericName: body.genericName,
      category: body.category,
      manufacturer: body.manufacturer,
      batchNumber: body.batchNumber,
      expiryDate: body.expiryDate,
      stock: body.stock,
      minStock: body.minStock,
      maxStock: body.maxStock,
      price: body.price,
      costPrice: body.costPrice,
      description: body.description || '',
      sideEffects: body.sideEffects || [],
      contraindications: body.contraindications || [],
      dosage: body.dosage,
      unit: body.unit,
      prescriptionRequired: body.prescriptionRequired || false,
      status: body.status || 'active',
      lastRestocked: getCurrentTimestamp(),
      supplier: body.supplier,
      barcode: body.barcode,
      imageUrl: body.imageUrl
    })

    return NextResponse.json({
      success: true,
      data: medicine,
      message: 'Medicine created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating medicine:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create medicine' },
      { status: 500 }
    )
  }
}

function getCurrentTimestamp() {
  return new Date().toISOString()
}
