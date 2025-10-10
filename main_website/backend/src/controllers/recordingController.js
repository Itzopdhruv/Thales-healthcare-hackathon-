import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MeetingRecording } from '../models/RecordingModels.js';
import { Appointment } from '../models/AppointmentModels.js';

// File validation function
const validateAudioFile = (file) => {
  const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only audio files (WebM, MP3, WAV, M4A, AAC, OGG) are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 50MB.');
  }
  
  return true;
};

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/recordings';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      validateAudioFile(file);
      cb(null, true);
    } catch (error) {
      cb(new Error(error.message), false);
    }
  }
});

// Start recording session
export const startRecordingSession = async (req, res) => {
  try {
    const { appointmentId, meetingId, userType } = req.body;

    // Find or create recording session
    let recording = await MeetingRecording.findOne({ 
      appointment: appointmentId,
      meetingId: meetingId 
    });

    if (!recording) {
      recording = new MeetingRecording({
        appointment: appointmentId,
        meetingId: meetingId,
        recordingStartedAt: new Date(),
        status: 'recording'
      });
      await recording.save();
    }

    res.json({
      success: true,
      message: 'Recording session started',
      data: {
        recordingId: recording._id,
        meetingId: meetingId,
        status: recording.status
      }
    });
  } catch (error) {
    console.error('Error starting recording session:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting recording session',
      error: error.message
    });
  }
};

// Upload patient recording
export const uploadPatientRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    console.log(`📤 Patient recording upload: ${file.filename} (${file.size} bytes)`);

    // Validate file size - reject tiny files that are likely failed recordings
    if (file.size < 1000) {
      console.log('⚠️ Patient recording too small, removing file');
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Recording file is too small (less than 1KB). Please ensure you recorded audio properly and try again.'
      });
    }

    // Validate file type
    if (!file.mimetype.startsWith('audio/')) {
      console.log('⚠️ Invalid file type, removing file');
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please ensure you are uploading an audio file.'
      });
    }

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      // Clean up uploaded file if recording session doesn't exist
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Get duration from request body
    const duration = parseInt(req.body.duration) || 0;
    console.log(`⏱️ Patient recording duration: ${duration} seconds`);

    // Update patient recording info
    recording.patientRecording = {
      filePath: file.path,
      fileName: file.filename,
      fileSize: file.size,
      duration: duration,
      uploadedAt: new Date(),
      status: 'uploaded'
    };

    await recording.save();

    console.log(`📁 Patient recording uploaded: ${file.filename}`);

    // Check if both recordings are now available for processing
    const updatedRecording = await MeetingRecording.findById(recordingId);
    const bothRecordingsReady = updatedRecording.patientRecording.status === 'uploaded' && 
                               updatedRecording.doctorRecording.status === 'uploaded';

    if (bothRecordingsReady) {
      console.log('🎵 Both recordings ready - auto-processing...');
      // Auto-process when both are ready
      setTimeout(async () => {
        try {
          const { processRecordings } = await import('./audioProcessingController.js');
          // This will be handled by the frontend calling the process endpoint
        } catch (error) {
          console.error('Auto-processing failed:', error);
        }
      }, 1000);
    }

    res.json({
      success: true,
      message: 'Patient recording uploaded successfully',
      data: {
        fileName: file.filename,
        fileSize: file.size,
        recordingId: recording._id,
        bothRecordingsReady
      }
    });
  } catch (error) {
    console.error('Error uploading patient recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading patient recording',
      error: error.message
    });
  }
};

// Upload doctor recording
export const uploadDoctorRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    console.log(`📤 Doctor recording upload: ${file.filename} (${file.size} bytes)`);

    // Validate file size - reject tiny files that are likely failed recordings
    if (file.size < 1000) {
      console.log('⚠️ Doctor recording too small, removing file');
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Recording file is too small (less than 1KB). Please ensure you recorded audio properly and try again.'
      });
    }

    // Validate file type
    if (!file.mimetype.startsWith('audio/')) {
      console.log('⚠️ Invalid file type, removing file');
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please ensure you are uploading an audio file.'
      });
    }

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      // Clean up uploaded file if recording session doesn't exist
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Get duration from request body
    const duration = parseInt(req.body.duration) || 0;
    console.log(`⏱️ Doctor recording duration: ${duration} seconds`);

    // Update doctor recording info
    recording.doctorRecording = {
      filePath: file.path,
      fileName: file.filename,
      fileSize: file.size,
      duration: duration,
      uploadedAt: new Date(),
      status: 'uploaded'
    };

    await recording.save();

    console.log(`📁 Doctor recording uploaded: ${file.filename}`);

    // Check if both recordings are now available for processing
    const updatedRecording = await MeetingRecording.findById(recordingId);
    const bothRecordingsReady = updatedRecording.patientRecording.status === 'uploaded' && 
                               updatedRecording.doctorRecording.status === 'uploaded';

    if (bothRecordingsReady) {
      console.log('🎵 Both recordings ready - auto-processing...');
      // Auto-process when both are ready
      setTimeout(async () => {
        try {
          const { processRecordings } = await import('./audioProcessingController.js');
          // This will be handled by the frontend calling the process endpoint
        } catch (error) {
          console.error('Auto-processing failed:', error);
        }
      }, 1000);
    }

    res.json({
      success: true,
      message: 'Doctor recording uploaded successfully',
      data: {
        fileName: file.filename,
        fileSize: file.size,
        recordingId: recording._id,
        bothRecordingsReady
      }
    });
  } catch (error) {
    console.error('Error uploading doctor recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading doctor recording',
      error: error.message
    });
  }
};

// Get recording status
export const getRecordingStatus = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId)
      .populate('appointment', 'patient doctor appointmentDate appointmentTime')
      .populate('appointment.patient', 'name')
      .populate('appointment.doctor', 'name');

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    res.json({
      success: true,
      data: recording
    });
  } catch (error) {
    console.error('Error getting recording status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recording status',
      error: error.message
    });
  }
};

// Stop both recordings simultaneously
export const stopBothRecordings = async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log(`🛑 Stopping both recordings for session: ${recordingId}`);

    // Validate recordingId format
    if (!recordingId || recordingId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recording ID format. Recording ID must be a valid MongoDB ObjectId.',
        error: 'Invalid recordingId format'
      });
    }

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found. Please start a recording session first.',
        error: 'Recording session not found'
      });
    }

    // Update status to indicate both recordings should stop
    recording.status = 'stopping_both';
    await recording.save();

    console.log(`📁 Both recordings stopped: ${recordingId}`);

    res.json({
      success: true,
      message: 'Both recordings stopped successfully',
      data: {
        recordingId: recording._id,
        status: recording.status
      }
    });
  } catch (error) {
    console.error('Error stopping both recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping both recordings',
      error: error.message
    });
  }
};

// End recording session
export const endRecordingSession = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    recording.recordingEndedAt = new Date();
    recording.status = 'uploading';
    await recording.save();

    res.json({
      success: true,
      message: 'Recording session ended',
      data: {
        recordingId: recording._id,
        status: recording.status
      }
    });
  } catch (error) {
    console.error('Error ending recording session:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending recording session',
      error: error.message
    });
  }
};

// Get recording summary
export const getRecordingSummary = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId)
      .populate('appointment', 'patient doctor appointmentDate appointmentTime')
      .populate('appointment.patient', 'name')
      .populate('appointment.doctor', 'name');

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    res.json({
      success: true,
      data: {
        summary: recording.summary,
        mergedRecording: recording.mergedRecording,
        patientRecording: recording.patientRecording,
        doctorRecording: recording.doctorRecording,
        status: recording.status
      }
    });
  } catch (error) {
    console.error('Error getting recording summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recording summary',
      error: error.message
    });
  }
};

export { upload };
