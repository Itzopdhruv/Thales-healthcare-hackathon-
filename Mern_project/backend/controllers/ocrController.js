const { extractPrescriptionData } = require('../services/ocrService');

// Extract text from prescription image using OCR
const extractTextFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Convert buffer to base64 for Gemini API
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Extract prescription data using OCR service
    const result = await extractPrescriptionData(base64Image, mimeType);

    res.json(result);
  } catch (error) {
    console.error('OCR extraction error:', error);
    res.status(500).json({ 
      message: 'OCR extraction failed', 
      error: error.message 
    });
  }
};

module.exports = {
  extractTextFromImage
};
