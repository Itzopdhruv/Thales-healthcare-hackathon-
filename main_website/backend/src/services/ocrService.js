import axios from 'axios';

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables. OCR functionality will be limited.');
}

/**
 * Extract medical data from document image using Google Gemini API
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @param {string} documentType - Type of document (prescription, lab_report, etc.)
 * @returns {Object} Extracted and structured medical data
 */
export const extractMedicalData = async (base64Image, mimeType, documentType = 'other') => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const systemInstruction = getSystemInstruction(documentType);
    
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
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      },
      systemInstruction: {
        parts: [{
          text: systemInstruction
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
        return {
          success: true,
          data: data,
          confidence: calculateConfidence(data),
          processingStatus: 'completed',
          processedAt: new Date()
        };
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
    return {
      success: false,
      error: error.message,
      processingStatus: 'failed',
      processedAt: new Date()
    };
  }
};

/**
 * Get system instruction based on document type
 * @param {string} documentType - Type of document
 * @returns {string} System instruction for the AI
 */
const getSystemInstruction = (documentType) => {
  const baseInstruction = `You are a medical AI assistant specialized in extracting structured data from medical documents. 
  Analyze the provided image and extract medical information in a structured JSON format.`;

  const documentSpecificInstructions = {
    prescription: `
    Extract prescription data with these exact fields:
    - "patientName": Full name of the patient
    - "doctorName": Full name of the prescribing doctor
    - "clinicName": Name of clinic/hospital
    - "date": Prescription date in YYYY-MM-DD format
    - "medicines": Array of objects with {name, dosage, frequency, duration, instructions}
    - "diagnosis": Primary diagnosis
    - "symptoms": Array of symptoms mentioned
    - "followUp": Object with {required: boolean, date: string, instructions: string}
    - "notes": Any additional notes or instructions`,

    lab_report: `
    Extract lab report data with these exact fields:
    - "patientName": Full name of the patient
    - "labName": Name of the laboratory
    - "reportDate": Report date in YYYY-MM-DD format
    - "labValues": Array of objects with {testName, value, unit, normalRange, status}
    - "vitalSigns": Object with {bloodPressure, temperature, heartRate, weight, height}
    - "summary": Brief summary of findings
    - "recommendations": Array of recommendations`,

    scan_report: `
    Extract scan report data with these exact fields:
    - "patientName": Full name of the patient
    - "scanType": Type of scan (CT, MRI, X-Ray, etc.)
    - "bodyPart": Part of body scanned
    - "reportDate": Report date in YYYY-MM-DD format
    - "findings": Detailed findings from the scan
    - "impression": Radiologist's impression
    - "recommendations": Array of recommendations
    - "technician": Name of the technician
    - "radiologist": Name of the radiologist`,

    discharge_summary: `
    Extract discharge summary data with these exact fields:
    - "patientName": Full name of the patient
    - "admissionDate": Admission date in YYYY-MM-DD format
    - "dischargeDate": Discharge date in YYYY-MM-DD format
    - "primaryDiagnosis": Primary diagnosis
    - "secondaryDiagnosis": Array of secondary diagnoses
    - "procedures": Array of procedures performed
    - "medications": Array of discharge medications
    - "followUp": Follow-up instructions
    - "vitalSigns": Object with vital signs at discharge`,

    other: `
    Extract general medical document data with these exact fields:
    - "patientName": Full name of the patient (if mentioned)
    - "doctorName": Name of the doctor (if mentioned)
    - "clinicName": Name of clinic/hospital (if mentioned)
    - "date": Document date in YYYY-MM-DD format (if mentioned)
    - "content": Main content or summary
    - "keyFindings": Array of key findings
    - "recommendations": Array of recommendations`
  };

  return `${baseInstruction}\n\nFor a ${documentType} document, ${documentSpecificInstructions[documentType] || documentSpecificInstructions.other}

  IMPORTANT RULES:
  1. Return ONLY valid JSON, no explanations or markdown
  2. Use null for missing information
  3. Ensure all dates are in YYYY-MM-DD format
  4. Be precise with medical terminology
  5. If text is unclear or unreadable, mark as null
  6. For lab values, include normal ranges when available
  7. For medicines, extract exact names and dosages`;
};

/**
 * Calculate confidence score based on extracted data completeness
 * @param {Object} data - Extracted data
 * @returns {number} Confidence score between 0 and 1
 */
const calculateConfidence = (data) => {
  let score = 0;
  let totalFields = 0;

  // Check for essential fields based on document type
  const essentialFields = ['patientName', 'date'];
  essentialFields.forEach(field => {
    totalFields++;
    if (data[field] && data[field] !== null) {
      score++;
    }
  });

  // Check for document-specific fields
  if (data.medicines && Array.isArray(data.medicines) && data.medicines.length > 0) {
    score += 0.5;
  }
  if (data.labValues && Array.isArray(data.labValues) && data.labValues.length > 0) {
    score += 0.5;
  }
  if (data.findings && data.findings.length > 0) {
    score += 0.5;
  }

  totalFields += 1.5; // Account for the additional checks

  return Math.min(score / totalFields, 1);
};

/**
 * Validate extracted medical data
 * @param {Object} data - Extracted data
 * @param {string} documentType - Type of document
 * @returns {Object} Validated and cleaned data
 */
export const validateMedicalData = (data, documentType) => {
  const validatedData = { ...data };

  // Clean and validate common fields
  if (validatedData.patientName) {
    validatedData.patientName = validatedData.patientName.trim();
  }

  if (validatedData.doctorName) {
    validatedData.doctorName = validatedData.doctorName.trim();
  }

  if (validatedData.clinicName) {
    validatedData.clinicName = validatedData.clinicName.trim();
  }

  // Validate date format
  if (validatedData.date) {
    const date = new Date(validatedData.date);
    if (isNaN(date.getTime())) {
      validatedData.date = null;
    } else {
      validatedData.date = date.toISOString().split('T')[0];
    }
  }

  // Validate medicines array
  if (validatedData.medicines && Array.isArray(validatedData.medicines)) {
    validatedData.medicines = validatedData.medicines
      .filter(med => med.name && med.name.trim().length > 0)
      .map(med => ({
        name: med.name.trim(),
        dosage: med.dosage ? med.dosage.trim() : '',
        frequency: med.frequency ? med.frequency.trim() : '',
        duration: med.duration ? med.duration.trim() : '',
        instructions: med.instructions ? med.instructions.trim() : ''
      }));
  }

  // Validate lab values
  if (validatedData.labValues && Array.isArray(validatedData.labValues)) {
    validatedData.labValues = validatedData.labValues
      .filter(lab => lab.testName && lab.testName.trim().length > 0)
      .map(lab => ({
        testName: lab.testName.trim(),
        value: lab.value ? lab.value.trim() : '',
        unit: lab.unit ? lab.unit.trim() : '',
        normalRange: lab.normalRange ? lab.normalRange.trim() : '',
        status: lab.status || 'normal'
      }));
  }

  return validatedData;
};

/**
 * Generate AI analysis summary for the extracted data
 * @param {Object} data - Extracted medical data
 * @param {string} documentType - Type of document
 * @returns {Object} AI analysis summary
 */
export const generateAIAnalysis = (data, documentType) => {
  const analysis = {
    summary: '',
    keyFindings: [],
    recommendations: [],
    riskFactors: [],
    generatedAt: new Date(),
    model: 'gemini-2.0-flash-exp',
    confidence: 0.8
  };

  // Generate summary based on document type
  switch (documentType) {
    case 'prescription':
      analysis.summary = `Prescription for ${data.patientName || 'patient'} with ${data.medicines?.length || 0} medications prescribed by ${data.doctorName || 'doctor'}.`;
      if (data.diagnosis) {
        analysis.keyFindings.push(`Primary diagnosis: ${data.diagnosis}`);
      }
      if (data.medicines && data.medicines.length > 0) {
        analysis.recommendations.push('Review medication interactions and dosages');
        analysis.recommendations.push('Ensure patient understands medication instructions');
      }
      break;

    case 'lab_report':
      analysis.summary = `Lab report for ${data.patientName || 'patient'} with ${data.labValues?.length || 0} test results.`;
      if (data.labValues) {
        const abnormalValues = data.labValues.filter(lab => lab.status !== 'normal');
        if (abnormalValues.length > 0) {
          analysis.keyFindings.push(`${abnormalValues.length} abnormal lab values detected`);
          analysis.riskFactors.push('Abnormal lab values require medical attention');
        }
      }
      break;

    case 'scan_report':
      analysis.summary = `Scan report for ${data.patientName || 'patient'} - ${data.scanType || 'medical imaging'} of ${data.bodyPart || 'body part'}.`;
      if (data.findings) {
        analysis.keyFindings.push(`Key findings: ${data.findings.substring(0, 100)}...`);
      }
      if (data.impression) {
        analysis.recommendations.push(`Radiologist impression: ${data.impression}`);
      }
      break;

    default:
      analysis.summary = `Medical document for ${data.patientName || 'patient'} processed successfully.`;
      if (data.keyFindings && data.keyFindings.length > 0) {
        analysis.keyFindings = data.keyFindings;
      }
      if (data.recommendations && data.recommendations.length > 0) {
        analysis.recommendations = data.recommendations;
      }
  }

  return analysis;
};
