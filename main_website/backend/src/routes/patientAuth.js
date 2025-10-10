import express from 'express';
import { requestOtp, verifyOtp } from '../controllers/patientAuthController.js';
import { uploadProfileImage } from '../controllers/patientController.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Request OTP (dummy)
router.post('/request-otp', requestOtp);

// Verify OTP and login
router.post('/verify-otp', verifyOtp);

// Upload profile image
router.post('/upload-profile-image', upload.single('profileImage'), uploadProfileImage);

export default router;

















