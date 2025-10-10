import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/lib/database'

// PUT /api/alerts/[id] - Mark specific alert as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await alertService.markAsRead(params.id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alert marked as read'
    })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark alert as read' },
      { status: 500 }
    )
  }
}
