import express from 'express';
import { 
  uploadProfileImage,
  getPatientProfile,
  lookupPatient,
  generateABHAId,
  createPatientWithABHA
} from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/auth.js';
// Validation middleware imports removed as they're not currently used

const router = express.Router();

// Public routes
router.get('/profile/:abhaId', getPatientProfile);
router.get('/lookup/:patientId', lookupPatient);
router.get('/generate-abha', generateABHAId);
router.post('/create-with-abha', createPatientWithABHA);

// Protected routes (require authentication)
router.post('/upload-profile-image', authenticateToken, uploadProfileImage);

export default router;
