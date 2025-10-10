import { Appointment } from '../models/AppointmentModels.js';

// Store active meetings with doctor participation
const activeMeetings = new Map();

// Doctor joins a meeting
export const doctorJoinsMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { doctorId, appointmentId } = req.body;

    console.log(`👨‍⚕️ Doctor ${doctorId} joining meeting ${meetingId}`);

    // Store the meeting as active with doctor
    activeMeetings.set(meetingId, {
      doctorId,
      appointmentId,
      doctorJoined: true,
      joinedAt: new Date(),
      participants: []
    });

    res.json({
      success: true,
      message: 'Doctor joined meeting successfully',
      data: {
        meetingId,
        doctorId,
        doctorJoined: true
      }
    });
  } catch (error) {
    console.error('Error in doctorJoinsMeeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining meeting',
      error: error.message
    });
  }
};

// Patient joins a meeting
export const patientJoinsMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { patientId, appointmentId } = req.body;

    console.log(`👤 Patient ${patientId} joining meeting ${meetingId}`);

    // Check if doctor is already in the meeting
    const meeting = activeMeetings.get(meetingId);
    if (!meeting || !meeting.doctorJoined) {
      return res.status(403).json({
        success: false,
        message: 'Doctor has not joined the meeting yet. Please wait for the doctor to start the video call first.',
        doctorJoined: false
      });
    }

    // Add patient to the meeting
    if (meeting.participants) {
      meeting.participants.push({
        patientId,
        joinedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Patient joined meeting successfully',
      data: {
        meetingId,
        patientId,
        doctorJoined: true
      }
    });
  } catch (error) {
    console.error('Error in patientJoinsMeeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining meeting',
      error: error.message
    });
  }
};

// Check if doctor has joined a meeting
export const checkDoctorJoined = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = activeMeetings.get(meetingId);
    const doctorJoined = meeting ? meeting.doctorJoined : false;

    console.log(`🔍 Checking doctor status for meeting ${meetingId}: ${doctorJoined}`);

    res.json({
      success: true,
      doctorJoined,
      data: {
        meetingId,
        doctorJoined,
        meeting: meeting || null
      }
    });
  } catch (error) {
    console.error('Error in checkDoctorJoined:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking doctor status',
      error: error.message
    });
  }
};

// Doctor leaves a meeting
export const doctorLeavesMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { doctorId } = req.body;

    console.log(`👨‍⚕️ Doctor ${doctorId} leaving meeting ${meetingId}`);

    const meeting = activeMeetings.get(meetingId);
    if (meeting && meeting.doctorId === doctorId) {
      meeting.doctorJoined = false;
      meeting.doctorLeftAt = new Date();
    }

    res.json({
      success: true,
      message: 'Doctor left meeting successfully',
      data: {
        meetingId,
        doctorId,
        doctorJoined: false
      }
    });
  } catch (error) {
    console.error('Error in doctorLeavesMeeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving meeting',
      error: error.message
    });
  }
};

// Patient leaves a meeting
export const patientLeavesMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { patientId } = req.body;

    console.log(`👤 Patient ${patientId} leaving meeting ${meetingId}`);

    const meeting = activeMeetings.get(meetingId);
    if (meeting && meeting.participants) {
      meeting.participants = meeting.participants.filter(p => p.patientId !== patientId);
    }

    res.json({
      success: true,
      message: 'Patient left meeting successfully',
      data: {
        meetingId,
        patientId
      }
    });
  } catch (error) {
    console.error('Error in patientLeavesMeeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving meeting',
      error: error.message
    });
  }
};

// Clean up old meetings (run periodically)
export const cleanupOldMeetings = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [meetingId, meeting] of activeMeetings.entries()) {
    if (meeting.joinedAt < oneHourAgo) {
      console.log(`🧹 Cleaning up old meeting: ${meetingId}`);
      activeMeetings.delete(meetingId);
    }
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupOldMeetings, 30 * 60 * 1000);


