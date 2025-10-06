import express from 'express';
import { chatWithAIAssistant, getPatientContext } from '../controllers/aiAssistantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// AI Assistant routes
router.post('/chat', authenticateToken, chatWithAIAssistant);
router.get('/patient-context/:patientId', authenticateToken, getPatientContext);

export default router;







