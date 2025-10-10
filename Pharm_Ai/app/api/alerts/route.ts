import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/lib/database'

// GET /api/alerts - Get all stock alerts
export async function GET(request: NextRequest) {
  try {
    const alerts = await alertService.getAll()
    
    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// PUT /api/alerts - Mark all alerts as read
export async function PUT(request: NextRequest) {
  try {
    await alertService.markAllAsRead()
    
    return NextResponse.json({
      success: true,
      message: 'All alerts marked as read'
    })
  } catch (error) {
    console.error('Error marking alerts as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark alerts as read' },
      { status: 500 }
    )
  }
}
