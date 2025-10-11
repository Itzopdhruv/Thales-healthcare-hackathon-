import Report from '../models/Report.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { extractMedicalData, validateMedicalData, generateAIAnalysis } from '../services/ocrService.js';
import { summarizeReportWithGemini, summarizeReportFromFile } from '../services/geminiService.js';
import path from 'path';
import fs from 'fs';

/**
 * Upload and process a medical document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { abhaId, documentType, title, description, patientName, patientPhone, patientAge, patientGender, patientBloodType } = req.body;
    const uploaderId = req.userId || req.patientId; // allow admin/doctor or patient upload

    // Validate required fields (allow ABHA-only uploads; patientName/phone are optional)
    if (!documentType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Document type and title are required'
      });
    }

    // Find or create Patient preferring ABHA; fallback to name+phone if provided
    const normalizePhone = (phone) => (phone || '').toString().replace(/\D/g, '');
    let patient = null;
    if (abhaId) {
      patient = await Patient.findOne({ abhaId });
      if (!patient) {
        // try legacy User
        const legacyUser = await User.findOne({ abhaId, role: 'patient' });
        if (legacyUser) {
          patient = await Patient.findOneAndUpdate(
            { abhaId: legacyUser.abhaId },
            { name: legacyUser.name, phone: legacyUser.phone || '', abhaId: legacyUser.abhaId },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        }
      }
    }

    if (!patient && (patientName || patientPhone)) {
      const phoneNorm = normalizePhone(patientPhone);
      const nameRegex = patientName ? new RegExp(`^${patientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : undefined;
      if (nameRegex) {
        patient = await Patient.findOne({ name: nameRegex, ...(patientPhone ? { phone: { $in: [patientPhone, phoneNorm] } } : {}) });
      }
    }

    if (!patient) {
      patient = await Patient.create({
        name: (patientName && patientName.trim()) || 'Unknown Patient',
        phone: normalizePhone(patientPhone) || patientPhone || '',
        abhaId: abhaId || null,
        age: patientAge || null,
        gender: patientGender || undefined,
        bloodType: patientBloodType || undefined
      });
    }
    else {
      let changed = false;
      if (abhaId && !patient.abhaId) { patient.abhaId = abhaId; changed = true; }
      if (patientAge && !patient.age) { patient.age = patientAge; changed = true; }
      if (patientGender && !patient.gender) { patient.gender = patientGender; changed = true; }
      if (patientBloodType && !patient.bloodType) { patient.bloodType = patientBloodType; changed = true; }
      if (changed) await patient.save();
    }

    // Create report record
    const reportData = {
      abhaId,
      patientId: patient._id,
      uploadedBy: uploaderId,
      documentType,
      title,
      description: description || '',
      originalFileName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      tags: [documentType],
      category: getCategoryFromDocumentType(documentType)
    };

    const report = new Report(reportData);
    await report.save();

    // Process OCR in background (don't await)
    processOCRAsync(report._id, req.file.buffer, req.file.mimetype, documentType);

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: {
        reportId: report._id,
        fileName: report.fileName,
        documentType: report.documentType,
        title: report.title,
        uploadStatus: 'Processing OCR...'
      }
    });

  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload report',
      error: error.message
    });
  }
};

/**
 * Process OCR asynchronously
 * @param {string} reportId - Report ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - MIME type
 * @param {string} documentType - Document type
 */
const processOCRAsync = async (reportId, fileBuffer, mimeType, documentType) => {
  try {
    // Update status to processing
    await Report.findByIdAndUpdate(reportId, {
      'ocrData.processingStatus': 'processing'
    });

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');

    // Extract medical data using OCR
    const ocrResult = await extractMedicalData(base64Image, mimeType, documentType);

    if (ocrResult.success) {
      // Validate and clean the extracted data
      const validatedData = validateMedicalData(ocrResult.data, documentType);
      
      // Generate AI analysis
      const aiAnalysis = generateAIAnalysis(validatedData, documentType);

      // Update report with OCR results
      await Report.findByIdAndUpdate(reportId, {
        'ocrData.extractedText': JSON.stringify(validatedData, null, 2),
        'ocrData.structuredData': validatedData,
        'ocrData.confidence': ocrResult.confidence,
        'ocrData.processingStatus': 'completed',
        'ocrData.processedAt': new Date(),
        'medicalData': mapToMedicalData(validatedData, documentType),
        'aiAnalysis': aiAnalysis
      });

      console.log(`✅ OCR processing completed for report ${reportId}`);
    } else {
      // Update with error status
      await Report.findByIdAndUpdate(reportId, {
        'ocrData.processingStatus': 'failed',
        'ocrData.errorMessage': ocrResult.error,
        'ocrData.processedAt': new Date()
      });

      console.error(`❌ OCR processing failed for report ${reportId}:`, ocrResult.error);
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Update with error status
    await Report.findByIdAndUpdate(reportId, {
      'ocrData.processingStatus': 'failed',
      'ocrData.errorMessage': error.message,
      'ocrData.processedAt': new Date()
    });
  }
};

/**
 * Map extracted data to medical data structure
 * @param {Object} data - Extracted data
 * @param {string} documentType - Document type
 * @returns {Object} Mapped medical data
 */
const mapToMedicalData = (data, documentType) => {
  const medicalData = {
    diagnosis: {
      primary: data.diagnosis || data.primaryDiagnosis || null,
      secondary: data.secondaryDiagnosis || [],
      icd10Codes: []
    },
    treatment: {
      medications: data.medicines || [],
      procedures: data.procedures || [],
      followUp: data.followUp || { required: false, date: null, instructions: '' }
    },
    vitalSigns: data.vitalSigns || {},
    labResults: data.labValues || []
  };

  return medicalData;
};

/**
 * Get category from document type
 * @param {string} documentType - Document type
 * @returns {string} Category
 */
const getCategoryFromDocumentType = (documentType) => {
  const categoryMap = {
    'prescription': 'prescription',
    'lab_report': 'diagnostic',
    'scan_report': 'diagnostic',
    'discharge_summary': 'treatment',
    'other': 'diagnostic'
  };
  return categoryMap[documentType] || 'diagnostic';
};

/**
 * Get all reports for a patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPatientReports = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { documentType, category, page = 1, limit = 10 } = req.query;
    const userId = req.userId;

    // Build query
    const query = { abhaId, isActive: true };
    
    if (documentType) {
      query.documentType = documentType;
    }
    
    if (category) {
      query.category = category;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reports
    const reports = await Report.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-filePath -ocrData.extractedText');

    // Get total count
    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get patient reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

/**
 * Get a specific report by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const report = await Report.findById(reportId)
      .populate('uploadedBy', 'name email')
      .populate('patientId', 'name phone abhaId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    if (!report.canAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this report'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

/**
 * View report file in browser
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const viewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    let hasAccess = false;
    
    // Admin/doctor bypass
    if (req.user?.role === 'admin' || req.user?.role === 'doctor') {
      hasAccess = true;
    } else if (req.auth?.type === 'patient') {
      // For patient tokens, check by ABHA ID
      const patientAbhaId = req.patient?.abhaId;
      if (patientAbhaId) {
        hasAccess = report.canAccessByAbhaId(patientAbhaId);
      }
    } else {
      // For regular user tokens, check by user ID
      hasAccess = report.canAccess(userId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this report'
      });
    }

    // Reconstruct file path if missing
    let filePath = report.filePath;
    if (!filePath && report.fileName) {
      filePath = path.join(process.cwd(), 'src', 'uploads', 'reports', report.fileName);
    }

    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for viewing in browser (inline)
    res.setHeader('Content-Type', report.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.originalFileName || 'report.pdf'}"`);
    
    // Get file size if not stored
    let fileSize = report.fileSize;
    if (!fileSize) {
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }
    res.setHeader('Content-Length', fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('View report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view report',
      error: error.message
    });
  }
};

/**
 * Download report file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    let hasAccess = false;
    
    // Admin/doctor bypass
    if (req.user?.role === 'admin' || req.user?.role === 'doctor') {
      hasAccess = true;
    } else if (req.auth?.type === 'patient') {
      // For patient tokens, check by ABHA ID
      const patientAbhaId = req.patient?.abhaId;
      if (patientAbhaId) {
        hasAccess = report.canAccessByAbhaId(patientAbhaId);
      }
    } else {
      // For regular user tokens, check by user ID
      hasAccess = report.canAccess(userId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this report'
      });
    }

    // Reconstruct file path if missing
    let filePath = report.filePath;
    if (!filePath && report.fileName) {
      filePath = path.join(process.cwd(), 'src', 'uploads', 'reports', report.fileName);
    }

    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', report.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.originalFileName || 'report.pdf'}"`);
    
    // Get file size if not stored
    let fileSize = report.fileSize;
    if (!fileSize) {
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }
    res.setHeader('Content-Length', fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    });
  }
};

/**
 * Update report details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can edit (only uploader or admin)
    if (report.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the uploader can edit this report'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'tags', 'category', 'visibility'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
};

/**
 * Delete report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can delete (uploader or admin)
    if (report.uploadedBy.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the uploader can delete this report'
      });
    }

    // Soft delete
    await Report.findByIdAndUpdate(reportId, { isActive: false });

    // Optionally delete physical file
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
};

/**
 * Get OCR processing status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOCRStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const report = await Report.findById(reportId)
      .select('ocrData.processingStatus ocrData.confidence ocrData.errorMessage ocrData.processedAt');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    if (!report.canAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this report'
      });
    }

    res.json({
      success: true,
      data: {
        processingStatus: report.ocrData.processingStatus,
        confidence: report.ocrData.confidence,
        errorMessage: report.ocrData.errorMessage,
        processedAt: report.ocrData.processedAt
      }
    });

  } catch (error) {
    console.error('Get OCR status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OCR status',
      error: error.message
    });
  }
};

// @desc    Chat with AI about uploaded reports
// @route   POST /api/reports/chat
// @access  Private (Admin/Doctor)
export const chatWithAI = async (req, res) => {
  try {
    const { message, patientId, reportContext, chatHistory, reportId } = req.body;

    if (!message || !patientId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message and patient ID are required' 
      });
    }

    // Get patient's reports for context
    const reports = await Report.find({ abhaId: patientId, isActive: true })
      .sort({ uploadedAt: -1 })
      .limit(5); // Last 5 reports

    // Build context for AI
    let context = `You are a specialized medical AI assistant. You can ONLY answer questions related to health, medical reports, and medical conditions. You must NOT answer questions about other topics.

Patient Context:
- Patient ID: ${patientId}
- Number of uploaded reports: ${reports.length}

Recent Reports Context:
${reports.map((report, index) => `
Report ${index + 1}:
- Title: ${report.title}
- Type: ${report.documentType}
- Uploaded: ${report.uploadedAt}
- OCR Status: ${report.ocrData?.processingStatus || 'Unknown'}
${report.ocrData?.structuredData ? `- Extracted Data: ${JSON.stringify(report.ocrData.structuredData, null, 2)}` : ''}
`).join('\n')}

${reportContext ? `Additional Context: ${reportContext}` : ''}

Chat History:
${chatHistory ? chatHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n') : 'No previous conversation'}

IMPORTANT RULES:
1. ONLY answer health and medical questions
2. If asked about non-medical topics, politely redirect to health topics
3. Be helpful but always recommend consulting a healthcare professional for serious concerns
4. Use the uploaded report data to provide relevant insights
5. Keep responses concise and professional

User Question: ${message}`;

    // If a specific report is in context, try to summarize using Gemini
    let aiResponse;
    if (reportId) {
      const r = await Report.findById(reportId).select('title documentType ocrData filePath mimeType');
      if (r) {
        // Prefer summarizing directly from the uploaded file if OCR is not ready
        if (r.filePath && r.mimeType) {
          aiResponse = await summarizeReportFromFile({ filePath: r.filePath, mimeType: r.mimeType, title: r.title });
        } else {
          const text = await summarizeReportWithGemini({
            title: r.title,
            documentType: r.documentType,
            ocrText: r.ocrData?.extractedText,
            structuredData: r.ocrData?.structuredData
          });
          aiResponse = text;
        }
      }
    }

    if (!aiResponse) {
      aiResponse = 'I generated a concise summary is not available for this report right now.';
    }

    res.status(200).json({
      success: true,
      message: aiResponse,
      data: { 
        response: aiResponse,
        reportCount: reports.length,
        context: context.substring(0, 500) + '...' // Truncated for response
      }
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process chat request', 
      error: error.message 
    });
  }
};

