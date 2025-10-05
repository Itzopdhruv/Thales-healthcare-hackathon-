import express from 'express';
import {
  createMedicalHistoryEntry,
  getMedicalHistory,
  updateMedicalHistoryEntry,
  deleteMedicalHistoryEntry
} from '../controllers/medicalHistoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreateMedicalHistory } from '../middleware/validation.js';

const router = express.Router();

// Protected routes for medical history management
router.post('/create', authenticateToken, validateCreateMedicalHistory, createMedicalHistoryEntry);
router.get('/:abhaId', authenticateToken, getMedicalHistory);
router.put('/:entryId', authenticateToken, updateMedicalHistoryEntry);
router.delete('/:entryId', authenticateToken, deleteMedicalHistoryEntry);

export default router;
