import express from 'express';
import {
  startRecordingSession,
  uploadPatientRecording,
  uploadDoctorRecording,
  getRecordingStatus,
  endRecordingSession,
  getRecordingSummary,
  stopBothRecordings,
  upload
} from '../controllers/recordingController.js';
import {
  processRecordings,
  checkProcessingStatus,
  getMergedRecording,
  forceProcessRecordings
} from '../controllers/audioProcessingController.js';
import {
  generateMeetingSummary,
  getMeetingSummary,
  getPatientRecordings,
  getDoctorRecordings
} from '../controllers/summarizationController.js';

const router = express.Router();

// Start recording session
router.post('/start', startRecordingSession);

// Upload recordings
router.post('/:recordingId/patient', upload.single('audio'), uploadPatientRecording);
router.post('/:recordingId/doctor', upload.single('audio'), uploadDoctorRecording);

// Recording management
router.get('/:recordingId/status', getRecordingStatus);
router.post('/:recordingId/stop-both', stopBothRecordings);
router.post('/:recordingId/end', endRecordingSession);
router.get('/:recordingId/summary', getRecordingSummary);

// Audio processing
router.post('/:recordingId/process', processRecordings);
router.post('/:recordingId/force-process', forceProcessRecordings);
router.get('/:recordingId/processing-status', checkProcessingStatus);
router.get('/:recordingId/merged-file', getMergedRecording);

// AI Summarization
router.post('/:recordingId/generate-summary', generateMeetingSummary);
router.get('/:recordingId/summary', getMeetingSummary);
router.get('/patient/:patientId/recordings', getPatientRecordings);
router.get('/doctor/:doctorId/recordings', getDoctorRecordings);

export default router;
