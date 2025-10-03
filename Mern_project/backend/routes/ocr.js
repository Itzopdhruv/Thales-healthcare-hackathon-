const express = require('express');
const router = express.Router();
const { extractTextFromImage } = require('../controllers/ocrController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /api/ocr/extract - Extract text from prescription image
router.post('/extract', upload.single('file'), extractTextFromImage);

module.exports = router;
