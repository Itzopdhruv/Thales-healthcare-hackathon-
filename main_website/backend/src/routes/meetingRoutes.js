import express from 'express';
import {
  doctorJoinsMeeting,
  patientJoinsMeeting,
  checkDoctorJoined,
  doctorLeavesMeeting,
  patientLeavesMeeting
} from '../controllers/meetingController.js';

const router = express.Router();

// Doctor joins a meeting
router.post('/doctor-joins/:meetingId', doctorJoinsMeeting);

// Patient joins a meeting
router.post('/patient-joins/:meetingId', patientJoinsMeeting);

// Check if doctor has joined a meeting
router.get('/check-doctor-joined/:meetingId', checkDoctorJoined);

// Doctor leaves a meeting
router.post('/doctor-leaves/:meetingId', doctorLeavesMeeting);

// Patient leaves a meeting
router.post('/patient-leaves/:meetingId', patientLeavesMeeting);

export default router;







