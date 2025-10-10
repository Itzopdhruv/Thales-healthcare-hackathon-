import { MeetingRecording } from '../models/RecordingModels.js';
import audioMergingService from '../services/audioMergingService.js';
import simpleAudioMergingService from '../services/simpleAudioMergingService.js';
import fs from 'fs';

/**
 * Process recordings after both patient and doctor uploads are complete
 * This controller handles the merging and AI processing workflow
 */

// Process recordings when both are uploaded
export const processRecordings = async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log(`🔄 Processing recordings for session: ${recordingId}`);

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Check if both recordings are uploaded
    const patientUploaded = recording.patientRecording.status === 'uploaded';
    const doctorUploaded = recording.doctorRecording.status === 'uploaded';

    if (!patientUploaded && !doctorUploaded) {
      return res.status(400).json({
        success: false,
        message: 'No recordings available to process'
      });
    }

    // Update status to processing
    recording.mergedRecording.status = 'processing';
    recording.status = 'processing';
    await recording.save();

    let mergedFileInfo;

    try {
      if (patientUploaded && doctorUploaded) {
        // Both recordings available - merge them
        console.log('🎵 Both recordings available - merging audio files');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.mergeAudioFiles(
            recording.patientRecording.filePath,
            recording.doctorRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple merge:', ffmpegError.message);
          // Fallback to simple merge
          mergedFileInfo = await simpleAudioMergingService.mergeAudioFiles(
            recording.patientRecording.filePath,
            recording.doctorRecording.filePath,
            outputFileName
          );
        }
      } else if (patientUploaded) {
        // Only patient recording available
        console.log('🎵 Only patient recording available - processing single file');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.processSingleAudio(
            recording.patientRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple processing:', ffmpegError.message);
          // Fallback to simple processing
          mergedFileInfo = await simpleAudioMergingService.processSingleAudio(
            recording.patientRecording.filePath,
            outputFileName
          );
        }
      } else if (doctorUploaded) {
        // Only doctor recording available
        console.log('🎵 Only doctor recording available - processing single file');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.processSingleAudio(
            recording.doctorRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple processing:', ffmpegError.message);
          // Fallback to simple processing
          mergedFileInfo = await simpleAudioMergingService.processSingleAudio(
            recording.doctorRecording.filePath,
            outputFileName
          );
        }
      }

      // Update recording with merged file info
      recording.mergedRecording = {
        ...mergedFileInfo,
        mergedAt: new Date(),
        status: 'completed'
      };

      recording.status = 'completed';
      await recording.save();

      console.log(`✅ Recording processing completed: ${mergedFileInfo.fileName}`);

      res.json({
        success: true,
        message: 'Recordings processed successfully',
        data: {
          recordingId: recording._id,
          mergedFile: mergedFileInfo,
          status: recording.status
        }
      });

    } catch (error) {
      console.error('❌ Audio processing error:', error);
      
      // Update status to failed
      recording.mergedRecording.status = 'failed';
      recording.status = 'failed';
      await recording.save();

      res.status(500).json({
        success: false,
        message: 'Processing failed: Audio processing failed',
        error: error.message,
        details: {
          recordingId: recording._id,
          patientUploaded,
          doctorUploaded,
          errorType: error.name || 'UnknownError'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error processing recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing recordings',
      error: error.message
    });
  }
};

// Force processing of recordings (even if only one is available)
export const forceProcessRecordings = async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log(`🔄 Force processing recordings for session: ${recordingId}`);

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Update status to processing
    recording.mergedRecording.status = 'processing';
    recording.status = 'processing';
    await recording.save();

    let mergedFileInfo;

    try {
      const patientUploaded = recording.patientRecording.status === 'uploaded';
      const doctorUploaded = recording.doctorRecording.status === 'uploaded';

      if (patientUploaded && doctorUploaded) {
        // Both recordings available - merge them
        console.log('🎵 Both recordings available - merging audio files');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.mergeAudioFiles(
            recording.patientRecording.filePath,
            recording.doctorRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple merge:', ffmpegError.message);
          // Fallback to simple merge
          mergedFileInfo = await simpleAudioMergingService.mergeAudioFiles(
            recording.patientRecording.filePath,
            recording.doctorRecording.filePath,
            outputFileName
          );
        }
      } else if (patientUploaded) {
        // Only patient recording available
        console.log('🎵 Only patient recording available - processing single file');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.processSingleAudio(
            recording.patientRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple processing:', ffmpegError.message);
          // Fallback to simple processing
          mergedFileInfo = await simpleAudioMergingService.processSingleAudio(
            recording.patientRecording.filePath,
            outputFileName
          );
        }
      } else if (doctorUploaded) {
        // Only doctor recording available
        console.log('🎵 Only doctor recording available - processing single file');
        
        const outputFileName = audioMergingService.generateMergedFileName(recording.meetingId);
        
        try {
          // Try FFmpeg first
          mergedFileInfo = await audioMergingService.processSingleAudio(
            recording.doctorRecording.filePath,
            outputFileName
          );
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg failed, using simple processing:', ffmpegError.message);
          // Fallback to simple processing
          mergedFileInfo = await simpleAudioMergingService.processSingleAudio(
            recording.doctorRecording.filePath,
            outputFileName
          );
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'No recordings available to process'
        });
      }

      // Update recording with merged file info
      recording.mergedRecording = {
        ...mergedFileInfo,
        mergedAt: new Date(),
        status: 'completed'
      };

      recording.status = 'completed';
      await recording.save();

      console.log(`✅ Force processing completed: ${mergedFileInfo.fileName}`);

      res.json({
        success: true,
        message: 'Recordings force processed successfully',
        data: {
          recordingId: recording._id,
          mergedFile: mergedFileInfo,
          status: recording.status
        }
      });

    } catch (error) {
      console.error('❌ Force processing error:', error);
      
      // Update status to failed
      recording.mergedRecording.status = 'failed';
      recording.status = 'failed';
      await recording.save();

      res.status(500).json({
        success: false,
        message: 'Force processing failed',
        error: error.message
      });
    }

  } catch (error) {
    console.error('❌ Error force processing recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error force processing recordings',
      error: error.message
    });
  }
};

// Check if recordings are ready for processing
export const checkProcessingStatus = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    const patientUploaded = recording.patientRecording.status === 'uploaded';
    const doctorUploaded = recording.doctorRecording.status === 'uploaded';
    const canProcess = patientUploaded || doctorUploaded;

    res.json({
      success: true,
      data: {
        recordingId: recording._id,
        patientUploaded,
        doctorUploaded,
        canProcess,
        status: recording.status,
        mergedRecording: recording.mergedRecording
      }
    });

  } catch (error) {
    console.error('❌ Error checking processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking processing status',
      error: error.message
    });
  }
};

// Get merged recording file
export const getMergedRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    if (recording.mergedRecording.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Merged recording not ready yet'
      });
    }

    const filePath = recording.mergedRecording.filePath;
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Merged recording file not found'
      });
    }

    // Send file as download
    res.download(filePath, recording.mergedRecording.fileName);

  } catch (error) {
    console.error('❌ Error getting merged recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting merged recording',
      error: error.message
    });
  }
};
