import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/database'

// GET /api/categories - Get all medicine categories
export async function GET() {
  try {
    const categories = getCategories()
    
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
