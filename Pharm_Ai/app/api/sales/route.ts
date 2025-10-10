import { NextRequest, NextResponse } from 'next/server'
import { salesService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerName = searchParams.get('customerName')
    const status = searchParams.get('status')

    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      customerName: customerName || undefined,
      status: status || undefined
    }

    const sales = await salesService.getAllSales(filters)
    
    return NextResponse.json({
      success: true,
      data: sales
    })
  } catch (error) {
    console.error('Sales fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sales data'
    }, { status: 500 })
  }
}
