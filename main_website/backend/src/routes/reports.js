import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import {
  uploadReport,
  getPatientReports,
  getReportById,
  viewReport,
  downloadReport,
  updateReport,
  deleteReport,
  getOCRStatus,
  chatWithAI
} from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Custom auth middleware that accepts token from query param (for view/download links)
const authenticateTokenOrQuery = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first, then from query param
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // If no token in header, check query params
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.type === 'patient' || decoded?.patientId) {
      const patient = await Patient.findById(decoded.patientId);
      if (!patient) {
        return res.status(401).json({ success: false, message: 'Invalid token - patient not found' });
      }
      if (patient.isActive === false) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }
      req.patientId = patient._id;
      req.patient = patient;
      req.auth = { type: 'patient', id: patient._id };
    } else {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token - user not found' });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }
      req.userId = user._id;
      req.user = user;
      req.auth = { type: 'user', id: user._id, role: user.role };
    }
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * @route   POST /api/reports/upload
 * @desc    Upload and process a medical document
 * @access  Private
 */
router.post('/upload', authenticateToken, upload.single('file'), handleUploadError, uploadReport);

/**
 * @route   GET /api/reports/patient/:abhaId
 * @desc    Get all reports for a specific patient
 * @access  Private
 */
router.get('/patient/:abhaId', authenticateToken, getPatientReports);

/**
 * @route   GET /api/reports/:reportId/view
 * @desc    View report file in browser (accepts token in query param)
 * @access  Private
 */
router.get('/:reportId/view', authenticateTokenOrQuery, viewReport);

/**
 * @route   GET /api/reports/:reportId/download
 * @desc    Download report file (accepts token in query param)
 * @access  Private
 */
router.get('/:reportId/download', authenticateTokenOrQuery, downloadReport);

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get a specific report by ID
 * @access  Private
 */
router.get('/:reportId', authenticateToken, getReportById);

/**
 * @route   PUT /api/reports/:reportId
 * @desc    Update report details
 * @access  Private
 */
router.put('/:reportId', authenticateToken, updateReport);

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:reportId', authenticateToken, deleteReport);

/**
 * @route   GET /api/reports/:reportId/ocr-status
 * @desc    Get OCR processing status
 * @access  Private
 */
router.get('/:reportId/ocr-status', authenticateToken, getOCRStatus);

/**
 * @route   POST /api/reports/chat
 * @desc    Chat with AI about uploaded reports
 * @access  Private
 */
router.post('/chat', authenticateToken, chatWithAI);

export default router;
