import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  updatePrescriptionStatus,
  getPrescriptionById
} from '../controllers/prescriptionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreatePrescription } from '../middleware/validation.js';

const router = express.Router();

// Protected routes for prescription management
router.post('/create', authenticateToken, validateCreatePrescription, createPrescription);
router.get('/:abhaId', authenticateToken, getPrescriptions);
router.get('/details/:prescriptionId', authenticateToken, getPrescriptionById);
router.put('/:prescriptionId/status', authenticateToken, updatePrescriptionStatus);

export default router;
