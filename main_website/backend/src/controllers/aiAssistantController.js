import { getGeminiModel, summarizeReportWithGemini } from '../services/geminiService.js';
import Report from '../models/Report.js';
import HealthRecord from '../models/HealthRecord.js';
import MedicalHistory from '../models/MedicalHistory.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

// AI Assistant Chat Controller
export const chatWithAIAssistant = async (req, res) => {
  try {
    const { message, patientContext, chatHistory } = req.body;
    const { patientId, patientData, medicalHistory, prescriptions, reports } = patientContext;

    if (!message || !patientId) {
      return res.status(400).json({
        success: false,
        error: 'Message and patient ID are required'
      });
    }

    // Get Gemini model
    const model = getGeminiModel();
    if (!model) {
      console.log('AI Assistant: Gemini model not available, using fallback response');
      // Provide a helpful fallback response instead of error
      const fallbackResponse = `I apologize, but the AI service is currently unavailable. However, I can still help you with the patient data I have access to:

Patient: ${patientData?.name || 'Unknown'}
Medical History Entries: ${medicalHistory?.length || 0}
Prescriptions: ${prescriptions?.length || 0}
Reports: ${reports?.length || 0}

Based on the available data, I can see that ${patientData?.name || 'the patient'} has ${medicalHistory?.length || 0} medical history entries, ${prescriptions?.length || 0} prescriptions, and ${reports?.length || 0} reports.

Please ask specific questions about the available medical records, and I'll do my best to help you analyze the data.`;

      return res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString()
      });
    }

    // Prepare comprehensive patient context
    let patientSummary = '';
    
    // Basic patient info
    if (patientData) {
      patientSummary += `Patient: ${patientData.name || 'Unknown'}\n`;
      patientSummary += `Age: ${patientData.age || 'Unknown'}\n`;
      patientSummary += `Gender: ${patientData.gender || 'Unknown'}\n`;
      patientSummary += `Blood Type: ${patientData.bloodType || 'Unknown'}\n`;
      patientSummary += `ABHA ID: ${patientData.abhaId || 'Unknown'}\n\n`;
    }

    // Medical history (Realistic data)
    if (medicalHistory && medicalHistory.length > 0) {
      patientSummary += `Medical History:\n`;
      medicalHistory.forEach((entry, index) => {
        patientSummary += `${index + 1}. ${entry.entryType || 'Entry'}: ${entry.summary || 'No description'}\n`;
        if (entry.date) patientSummary += `   Date: ${new Date(entry.date).toLocaleDateString()}\n`;
        if (entry.consultingDoctor) patientSummary += `   Doctor: ${entry.consultingDoctor}\n`;
        if (entry.hospitalClinicName) patientSummary += `   Hospital: ${entry.hospitalClinicName}\n`;
        if (entry.diagnosis?.primary) patientSummary += `   Diagnosis: ${entry.diagnosis.primary}\n`;
        patientSummary += '\n';
      });
    }

    // Prescriptions (Realistic data)
    if (prescriptions && prescriptions.length > 0) {
      patientSummary += `Current Medications:\n`;
      prescriptions.forEach((prescription, index) => {
        patientSummary += `${index + 1}. Prescription from ${prescription.doctor?.name || 'Unknown Doctor'}\n`;
        patientSummary += `   Hospital: ${prescription.hospitalClinic?.name || 'Unknown Hospital'}\n`;
        patientSummary += `   Diagnosis: ${prescription.diagnosis?.primary || 'Not specified'}\n`;
        patientSummary += `   Date: ${new Date(prescription.issuedDate).toLocaleDateString()}\n`;
        
        if (prescription.medications && prescription.medications.length > 0) {
          patientSummary += `   Medications:\n`;
          prescription.medications.forEach((med, medIndex) => {
            patientSummary += `     ${medIndex + 1}. ${med.name} - ${med.dosage} (${med.frequency})\n`;
          });
        }
        patientSummary += '\n';
      });
    }

    // Reports analysis
    let reportsSummary = '';
    if (reports && reports.length > 0) {
      reportsSummary += `Medical Reports Analysis:\n`;
      
      for (const report of reports) {
        try {
          // Try to get AI summary of the report
          let reportSummary = '';
          
          if (report.filePath) {
            // If file exists, analyze it with Gemini
            const fileAnalysis = await summarizeReportFromFile({
              filePath: report.filePath,
              mimeType: report.mimeType,
              title: report.title || 'Medical Report'
            });
            reportSummary = fileAnalysis.summary || 'Unable to analyze report content';
          } else if (report.ocrData) {
            // Use OCR data if available
            const ocrAnalysis = await summarizeReportWithGemini({
              title: report.title || 'Medical Report',
              documentType: report.documentType || 'General',
              ocrText: report.ocrData,
              structuredData: {}
            });
            reportSummary = ocrAnalysis.summary || 'Unable to analyze OCR data';
          } else {
            reportSummary = `Report: ${report.title || 'Untitled'} (${report.documentType || 'General'}) - No content available for analysis`;
          }

          reportsSummary += `\n${report.title || 'Report'} (${report.documentType || 'General'}):\n`;
          reportsSummary += `${reportSummary}\n`;
          reportsSummary += `Upload Date: ${new Date(report.uploadDate).toLocaleDateString()}\n`;
          reportsSummary += `---\n`;
        } catch (error) {
          console.error('Error analyzing report:', error);
          reportsSummary += `\n${report.title || 'Report'}: Error analyzing content\n`;
        }
      }
    }

    // Prepare chat context
    let chatContext = '';
    if (chatHistory && chatHistory.length > 0) {
      chatContext = '\nPrevious conversation:\n';
      chatHistory.slice(-5).forEach(msg => {
        chatContext += `${msg.type === 'user' ? 'Doctor' : 'AI'}: ${msg.content}\n`;
      });
    }

    // Create realistic prompt based on available data
    const prompt = `You are an AI medical assistant helping a doctor with a patient's health information. 

PATIENT INFORMATION:
${patientSummary}

${reportsSummary}

${chatContext}

DOCTOR'S QUESTION: ${message}

IMPORTANT: Format your response as exactly 5-7 crisp, readable bullet points with a line break after each point. Each point should be:
• Clear and concise (1-2 sentences max)
• Focused on one key finding or recommendation
• Easy to scan and understand
• Actionable when possible

Structure your response like this with line breaks:
• Point 1: Key finding or observation

• Point 2: Critical concern or issue

• Point 3: Specific recommendation

• Point 4: Data gap or limitation

• Point 5: Next steps or follow-up needed

• Point 6: Additional context (if needed)

• Point 7: Urgent action required (if applicable)

Add a blank line after each bullet point for better readability. Avoid lengthy paragraphs, bold formatting, or complex structures.`;

    // Generate AI response
    let aiResponse;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text();
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      // Fallback response when Gemini fails
      aiResponse = `• AI service temporarily unavailable - using available patient data

• Patient: ${patientData?.name || 'Unknown'} with ${medicalHistory?.length || 0} medical entries

• Prescriptions: ${prescriptions?.length || 0} active prescriptions on record

• Reports: ${reports?.length || 0} uploaded medical reports available

• Data access: Limited to stored records without AI analysis

• Recommendation: Ask specific questions about available data

• Next step: Try again later for full AI-powered analysis`;
    }

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI assistant request',
      details: error.message
    });
  }
};

// Helper function to analyze report files
const summarizeReportFromFile = async ({ filePath, mimeType, title }) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read file content
    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');
    
    // Use Gemini to analyze the file
    const model = getGeminiModel();
    const prompt = `Analyze this medical report and provide a comprehensive summary focusing on:
    1. Key findings and diagnoses
    2. Important measurements and values
    3. Recommendations or next steps
    4. Any concerning or notable observations
    
    Report Title: ${title}
    File Type: ${mimeType}
    
    Please provide a detailed but concise analysis.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Content
        }
      },
      prompt
    ]);
    
    const response = await result.response;
    return {
      summary: response.text(),
      success: true
    };
  } catch (error) {
    console.error('Error analyzing file:', error);
    return {
      summary: 'Unable to analyze this report file',
      success: false
    };
  }
};

// Get patient context for AI assistant
export const getPatientContext = async (req, res) => {
  try {
    const { patientId } = req.params; // This is actually abhaId
    console.log('AI Assistant: Getting patient context for abhaId:', patientId);

    // Get patient data by abhaId (prefer new Patient model, fallback to User)
    let patient = await Patient.findOne({ abhaId: patientId });
    if (!patient) {
      patient = await User.findOne({ abhaId: patientId });
    }
    if (!patient) {
      console.log('AI Assistant: Patient not found with abhaId:', patientId);
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    console.log('AI Assistant: Found patient:', patient.name, 'with ID:', patient._id);

    // Get medical history by abhaId
    const medicalHistory = await MedicalHistory.find({ abhaId: patientId }).sort({ date: -1 });

    // Get prescriptions by abhaId
    const prescriptions = await Prescription.find({ abhaId: patientId }).sort({ issuedDate: -1 });

    // Get health records (reports) by abhaId
    const healthRecords = await HealthRecord.find({ abhaId: patientId }).sort({ createdAt: -1 });
    
    // Get reports from Report model by abhaId
    const reports = await Report.find({ abhaId: patientId }).sort({ uploadDate: -1 });

    console.log('AI Assistant: Found data - Medical History:', medicalHistory.length, 'Prescriptions:', prescriptions.length, 'Health Records:', healthRecords.length, 'Reports:', reports.length);

    res.json({
      success: true,
      data: {
        patientId,
        patientData: patient,
        medicalHistory,
        prescriptions,
        reports: [...reports, ...healthRecords.flatMap(hr => hr.reports)]
      }
    });

  } catch (error) {
    console.error('Error getting patient context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get patient context',
      details: error.message
    });
  }
};
