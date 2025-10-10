import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Use API key from environment
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBrG_OBo9Z3O9yIWRkqzJD60HX5qbrFHas'
const genAI = new GoogleGenerativeAI(apiKey)

// POST /api/prescriptions/ocr - Process prescription image with Gemini Vision
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    console.log('Using API key:', apiKey.substring(0, 10) + '...')

    // Read image
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

        // Use Gemini Pro Vision for image analysis
        console.log('Starting Gemini Vision analysis...')
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `Analyze this prescription image and extract medicine information. Return a JSON response with this exact structure:

{
  "rawText": "Full text extracted from the prescription",
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "Dosage strength (e.g., 500mg, 10ml)",
      "quantity": 10,
      "instructions": "How to take the medicine",
      "frequency": "How often to take (e.g., twice daily)",
      "duration": "How long to take (e.g., 7 days)",
      "confidence": "high"
    }
  ],
  "patientInfo": {
    "name": "Patient name if visible",
    "age": "Age if visible",
    "doctor": "Doctor name if visible"
  }
}

Instructions:
1. Extract ALL medicines mentioned in the prescription
2. Use generic medicine names when possible
3. Extract dosage, quantity, and instructions accurately
4. If information is unclear, mark confidence as "medium" or "low"
5. Return ONLY valid JSON, no additional text or markdown`

    try {
      // Try different model names
      const models = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro']
      let result = null
      let lastError = null

      for (const modelName of models) {
        try {
          console.log(`Trying model: ${modelName}`)
          const currentModel = genAI.getGenerativeModel({ model: modelName })
          
          result = await currentModel.generateContent([
            prompt,
            {
              inlineData: {
                data: base64,
                mimeType: mimeType
              }
            }
          ])
          console.log(`✅ Success with model: ${modelName}`)
          break
        } catch (error) {
          console.log(`❌ Failed with model ${modelName}:`, error.message)
          lastError = error
          continue
        }
      }

      if (!result) {
        throw lastError || new Error('All models failed')
      }

      const response = await result.response
      const text = response.text()
      console.log('Gemini response received:', text.substring(0, 200) + '...')

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const data = {
          rawText: parsed.rawText || 'Text extracted from prescription',
          medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
          patientInfo: parsed.patientInfo || {}
        }
        console.log('Successfully parsed Gemini response')
        return NextResponse.json({ success: true, data })
      } else {
        throw new Error('No JSON found in Gemini response')
      }

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      
      // Enhanced fallback - no default medicines, let user add manually
      const fallbackData = {
        rawText: 'OCR processing failed - Gemini API models not available. Please add medicines manually.',
        medicines: [],
        patientInfo: {
          name: '',
          doctor: ''
        }
      }
      
      return NextResponse.json({ success: true, data: fallbackData })
    }
  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process prescription image' }, { status: 500 })
  }
}

