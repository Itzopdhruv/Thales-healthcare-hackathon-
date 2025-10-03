const axios = require('axios');
const { isValidMedicine } = require('./drugApiService');

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBatNYZ5hVjHFBcIc5OdWwMU3yC0oBICvw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Validate and clean extracted data
const validateExtractedData = async (data) => {
  try {
    const medicines = data['Medicines Prescribed'];
    if (!medicines || !Array.isArray(medicines)) {
      return data;
    }

    // Validate each medicine name
    const validationPromises = medicines.map(medicine => 
      isValidMedicine(medicine).then(isValid => ({ medicine, isValid }))
    );
    
    const validationResults = await Promise.all(validationPromises);
    const validMedicines = validationResults
      .filter(result => result.isValid)
      .map(result => result.medicine);

    data['Medicines Prescribed'] = validMedicines.length > 0 ? validMedicines : null;
    return data;
  } catch (error) {
    console.error('Error validating extracted data:', error);
    return data;
  }
};

// Extract prescription data using Google Gemini API
const extractPrescriptionData = async (base64Image, mimeType) => {
  try {
    const requestBody = {
      contents: [{
        parts: [{
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        }]
      }],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      },
      systemInstruction: {
        parts: [{
          text: `You are a medical assistant AI. A scanned image of a handwritten doctor's prescription will be provided.

From this prescription, extract the following structured information. If any information is missing or unreadable, return \`null\` for that field.

Respond ONLY with a valid JSON object with these exact fields:

- "Patient's Name": Full name of the patient as a string.
- "Medicines Prescribed": A list of valid medicine names (no dosages, instructions, or duplicates). Only include real medicines. Return \`null\` if none are found.
- "Doctor's Name": Full name of the doctor as a string.
- "Clinic Name": Name of the clinic or hospital (if present).
- "Date": Date on the prescription in YYYY-MM-DD format, if written.

Strictly return a JSON object. Do not include any explanation or markdown.`
        }]
      }
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const extractedText = response.data.candidates[0].content.parts[0].text;
      
      try {
        const data = JSON.parse(extractedText);
        const validatedData = await validateExtractedData(data);
        return validatedData;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Gemini response:', extractedText);
        throw new Error(`JSON parse error: ${parseError.message}`);
      }
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};

// Alternative OCR using Google Cloud Vision API (if Gemini fails)
const extractWithVisionAPI = async (base64Image, mimeType) => {
  try {
    const requestBody = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    };

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.responses && response.data.responses[0]) {
      const extractedText = response.data.responses[0].fullTextAnnotation?.text || '';
      
      // Simple parsing for common prescription formats
      const lines = extractedText.split('\n');
      const result = {
        "Patient's Name": null,
        "Medicines Prescribed": [],
        "Doctor's Name": null,
        "Clinic Name": null,
        "Date": null
      };

      // Basic pattern matching for prescription data
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('patient') || lowerLine.includes('name:')) {
          result["Patient's Name"] = line.replace(/patient|name:?/gi, '').trim();
        } else if (lowerLine.includes('doctor') || lowerLine.includes('dr.')) {
          result["Doctor's Name"] = line.replace(/doctor|dr\.?/gi, '').trim();
        } else if (lowerLine.includes('clinic') || lowerLine.includes('hospital')) {
          result["Clinic Name"] = line.replace(/clinic|hospital/gi, '').trim();
        }
      }

      return result;
    }

    throw new Error('No text detected in image');
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
};

module.exports = {
  extractPrescriptionData,
  extractWithVisionAPI,
  validateExtractedData
};
