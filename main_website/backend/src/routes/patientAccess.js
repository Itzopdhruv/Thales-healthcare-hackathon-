import express from 'express';
import { 
  requestPatientAccess, 
  verifyOTPAndGrantAccess, 
  getPatientRecords, 
  revokePatientAccess,
  getActiveAccessRequests 
} from '../controllers/patientAccessController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Request access to patient records (send OTP)
router.post('/request-access', requestPatientAccess);

// Verify OTP and grant access
router.post('/verify-otp', verifyOTPAndGrantAccess);

// Get patient records (protected by access validation)
router.get('/patient/:patientId', getPatientRecords);

// Revoke patient access
router.delete('/access/:accessId', revokePatientAccess);

// Get all active access requests for admin
router.get('/active-requests', getActiveAccessRequests);

export default router;
