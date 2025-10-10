import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/lib/database'

// GET /api/transactions - Get all transactions with optional medicine filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicineId = searchParams.get('medicineId') || undefined

    const transactions = await transactionService.getAll(medicineId)
    
    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
