import express from 'express';
import { requestOtp, verifyOtp } from '../controllers/patientAuthController.js';

const router = express.Router();

// Request OTP (dummy)
router.post('/request-otp', requestOtp);

// Verify OTP and login
router.post('/verify-otp', verifyOtp);

export default router;







