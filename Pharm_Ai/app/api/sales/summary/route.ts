import { NextRequest, NextResponse } from 'next/server'
import { salesService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const summary = await salesService.getSalesSummary(
      startDate || undefined,
      endDate || undefined
    )
    
    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('Sales summary error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sales summary'
    }, { status: 500 })
  }
}
