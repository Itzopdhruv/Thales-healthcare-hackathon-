import express from 'express';
import {
  uploadReport,
  getPatientReports,
  getReportById,
  downloadReport,
  updateReport,
  deleteReport,
  getOCRStatus,
  chatWithAI
} from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/reports/upload
 * @desc    Upload and process a medical document
 * @access  Private
 */
router.post('/upload', upload.single('file'), handleUploadError, uploadReport);

/**
 * @route   GET /api/reports/patient/:abhaId
 * @desc    Get all reports for a specific patient
 * @access  Private
 */
router.get('/patient/:abhaId', getPatientReports);

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get a specific report by ID
 * @access  Private
 */
router.get('/:reportId', getReportById);

/**
 * @route   GET /api/reports/:reportId/download
 * @desc    Download report file
 * @access  Private
 */
router.get('/:reportId/download', downloadReport);

/**
 * @route   PUT /api/reports/:reportId
 * @desc    Update report details
 * @access  Private
 */
router.put('/:reportId', updateReport);

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:reportId', deleteReport);

/**
 * @route   GET /api/reports/:reportId/ocr-status
 * @desc    Get OCR processing status
 * @access  Private
 */
router.get('/:reportId/ocr-status', getOCRStatus);

/**
 * @route   POST /api/reports/chat
 * @desc    Chat with AI about uploaded reports
 * @access  Private
 */
router.post('/chat', chatWithAI);

export default router;
