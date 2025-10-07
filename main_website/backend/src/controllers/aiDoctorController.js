import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const AI_DOCTOR_API_URL = process.env.AI_DOCTOR_API_URL || 'http://localhost:8000';

export const analyzeMedicalInput = async (req, res) => {
  try {
    const { audioFile, imageFile, textInput } = req.body;
    
    console.log('AI Doctor Request:', {
      hasTextInput: !!textInput,
      hasAudioFile: !!audioFile,
      hasImageFile: !!imageFile,
      textInputLength: textInput?.length || 0,
      audioFileLength: audioFile?.length || 0,
      imageFileLength: imageFile?.length || 0
    });
    
    // Prepare JSON data for FastAPI
    const requestData = {
      text_input: textInput || null,
      audio_file: audioFile || null,
      image_file: imageFile || null
    };
    
    // Call FastAPI AI Doctor service
    const response = await axios.post(`${AI_DOCTOR_API_URL}/analyze`, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000 // 60 seconds timeout for AI processing
    });
    
    if (response.data.success) {
      res.json({
        success: true,
        message: 'Analysis completed successfully',
        data: response.data.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'AI Doctor analysis failed',
        error: response.data.error || 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('AI Doctor analysis error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'AI Doctor service is not available',
        error: 'Service connection refused'
      });
    } else if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: 'AI Doctor service error',
        error: error.response.data.detail || error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

export const getAudioResponse = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Forward request to FastAPI audio endpoint
    const response = await axios.get(`${AI_DOCTOR_API_URL}/audio/${filename}`, {
      responseType: 'stream'
    });
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Audio retrieval error:', error);
    res.status(404).json({
      success: false,
      message: 'Audio file not found',
      error: error.message
    });
  }
};

export const checkAIDoctorHealth = async (req, res) => {
  try {
    const response = await axios.get(`${AI_DOCTOR_API_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      message: 'AI Doctor service is healthy',
      data: response.data
    });
    
  } catch (error) {
    console.error('AI Doctor health check error:', error);
    res.status(503).json({
      success: false,
      message: 'AI Doctor service is not available',
      error: error.message
    });
  }
};
