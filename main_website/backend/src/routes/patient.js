import express from 'express';
import { 
  uploadProfileImage,
  getPatientProfile
} from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/auth.js';
// Validation middleware imports removed as they're not currently used

const router = express.Router();

// Public routes
router.get('/profile/:abhaId', getPatientProfile);

// Protected routes (require authentication)
router.post('/upload-profile-image', authenticateToken, uploadProfileImage);

export default router;
