import express from 'express';
import { 
  createPatientWithABHA, 
  generateABHAIdOnly, 
  getPatientByABHAId, 
  updatePatientRecord 
} from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validatePatientCreation, 
  validateABHALookup, 
  validatePatientUpdate 
} from '../middleware/patientValidation.js';

const router = express.Router();

// Public routes
router.post('/create-with-abha', validatePatientCreation, createPatientWithABHA);
router.get('/generate-abha', generateABHAIdOnly);
router.get('/lookup/:abhaId', getPatientByABHAId);

// Protected routes (require authentication)
router.put('/update/:abhaId', authenticateToken, validatePatientUpdate, updatePatientRecord);

export default router;
