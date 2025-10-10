import { NextRequest, NextResponse } from 'next/server'

// POST /api/prescriptions/ocr-simple - Simple OCR test without Gemini
export async function POST(request: NextRequest) {
  try {
    console.log('Simple OCR API called')
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    console.log('Image file received:', imageFile?.name, imageFile?.type, imageFile?.size)
    
    if (!imageFile) {
      console.log('No image file provided')
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Return mock data for testing
    const mockData = {
      rawText: "Sample prescription text extracted from image",
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          quantity: 10,
          instructions: "Take with food",
          frequency: "Twice daily",
          duration: "5 days",
          confidence: "high"
        },
        {
          name: "Ibuprofen",
          dosage: "400mg",
          quantity: 20,
          instructions: "Take as needed for pain",
          frequency: "Every 6 hours",
          duration: "As needed",
          confidence: "medium"
        }
      ],
      patientInfo: {
        name: "John Doe",
        age: "35",
        doctor: "Dr. Smith"
      }
    }

    console.log('Returning mock data:', mockData)

    return NextResponse.json({
      success: true,
      data: mockData
    })
  } catch (error) {
    console.error('Simple OCR processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process prescription image' },
      { status: 500 }
    )
  }
}
