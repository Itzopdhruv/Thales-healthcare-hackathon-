import express from 'express';
import { analyzeMedicalInput, getAudioResponse, checkAIDoctorHealth } from '../controllers/aiDoctorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Health check endpoint
router.get('/health', checkAIDoctorHealth);

// Analyze medical input (audio, image, text)
router.post('/analyze', authenticateToken, analyzeMedicalInput);

// Get audio response file
router.get('/audio/:filename', authenticateToken, getAudioResponse);

export default router;
