import { MeetingRecording } from '../models/RecordingModels.js';
import recordingSummarizationService from '../services/recordingSummarizationService.js';

/**
 * Summarization Controller
 * Handles AI-powered meeting summary generation
 */

// Generate meeting summary
export const generateMeetingSummary = async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log(`🤖 Starting summary generation for recording: ${recordingId}`);

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

    // Check if merged recording is ready
    if (recording.mergedRecording.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Merged recording not ready yet. Please wait for audio processing to complete.'
      });
    }

    // Update summary status to processing
    recording.summary.status = 'processing';
    await recording.save();

    try {
      // Prepare appointment info for AI
      const appointmentInfo = {
        patientName: recording.appointment?.patient?.name || 'Test Patient',
        doctorName: recording.appointment?.doctor?.name || 'Test Doctor',
        appointmentDate: recording.appointment?.appointmentDate || new Date().toISOString(),
        appointmentTime: recording.appointment?.appointmentTime || 'Test Time',
        meetingId: recording.meetingId || 'Test Meeting'
      };

      // Generate summary using AI
      const summary = await recordingSummarizationService.generateMeetingSummary(
        recording.mergedRecording.filePath,
        appointmentInfo
      );

      // Update recording with generated summary
      recording.summary = {
        ...summary,
        status: 'completed'
      };

      await recording.save();

      console.log(`✅ Summary generated successfully for recording: ${recordingId}`);

      res.json({
        success: true,
        message: 'Meeting summary generated successfully',
        data: {
          recordingId: recording._id,
          summary: recording.summary,
          appointment: {
            patient: recording.appointment?.patient?.name || 'Test Patient',
            doctor: recording.appointment?.doctor?.name || 'Test Doctor',
            date: recording.appointment?.appointmentDate || new Date().toISOString(),
            time: recording.appointment?.appointmentTime || 'Test Time'
          }
        }
      });

    } catch (aiError) {
      console.error('❌ AI summarization failed:', aiError);
      
      // Update status to failed
      recording.summary.status = 'failed';
      await recording.save();

      res.status(500).json({
        success: false,
        message: 'AI summarization failed',
        error: aiError.message
      });
    }

  } catch (error) {
    console.error('❌ Error generating meeting summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating meeting summary',
      error: error.message
    });
  }
};

// Get meeting summary
export const getMeetingSummary = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await MeetingRecording.findById(recordingId)
      .populate('appointment', 'patient doctor appointmentDate appointmentTime')
      .populate('appointment.patient', 'name')
      .populate('appointment.doctor', 'name');

    console.log('🔍 Debug - Recording appointment:', recording?.appointment);
    console.log('🔍 Debug - Appointment populated:', !!recording?.appointment);
    console.log('🔍 Debug - Appointment ID:', recording?.appointment?._id);
    console.log('🔍 Debug - Patient data:', recording?.appointment?.patient);
    console.log('🔍 Debug - Doctor data:', recording?.appointment?.doctor);

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Check if summary exists
    if (!recording.summary || !recording.summary.content) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found. Please generate the summary first.',
        data: {
          recordingId: recording._id,
          status: recording.status,
          summaryExists: false
        }
      });
    }

    // Always include appointment data, even if populate failed
    const appointmentData = {
      patient: recording.appointment?.patient?.name || 'Unknown Patient',
      doctor: recording.appointment?.doctor?.name || 'Unknown Doctor',
      date: recording.appointment?.appointmentDate || new Date().toISOString(),
      time: recording.appointment?.appointmentTime || 'Unknown Time'
    };

    console.log('🔍 Debug - Final appointment data:', appointmentData);
    console.log('🔍 Debug - Summary exists:', !!recording.summary);
    console.log('🔍 Debug - Summary content length:', recording.summary?.content?.length || 0);

    res.json({
      success: true,
      data: {
        recordingId: recording._id,
        summary: recording.summary,
        appointment: appointmentData,
        mergedRecording: recording.mergedRecording,
        patientRecording: recording.patientRecording,
        doctorRecording: recording.doctorRecording,
        status: recording.status
      }
    });

  } catch (error) {
    console.error('❌ Error getting meeting summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting meeting summary',
      error: error.message
    });
  }
};

// Get all recordings for a patient
export const getPatientRecordings = async (req, res) => {
  try {
    const { patientId } = req.params;

    const recordings = await MeetingRecording.find({
      'appointment.patient': patientId
    })
    .populate('appointment', 'patient doctor appointmentDate appointmentTime')
    .populate('appointment.patient', 'name')
    .populate('appointment.doctor', 'name')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recordings.map(recording => ({
        recordingId: recording._id,
        meetingId: recording.meetingId,
        appointment: {
          patient: recording.appointment?.patient?.name || 'Test Patient',
          doctor: recording.appointment?.doctor?.name || 'Test Doctor',
          date: recording.appointment?.appointmentDate || new Date().toISOString(),
          time: recording.appointment?.appointmentTime || 'Test Time'
        },
        summary: recording.summary,
        status: recording.status,
        createdAt: recording.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error getting patient recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting patient recordings',
      error: error.message
    });
  }
};

// Get all recordings for a doctor
export const getDoctorRecordings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const recordings = await MeetingRecording.find({
      'appointment.doctor': doctorId
    })
    .populate('appointment', 'patient doctor appointmentDate appointmentTime')
    .populate('appointment.patient', 'name')
    .populate('appointment.doctor', 'name')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recordings.map(recording => ({
        recordingId: recording._id,
        meetingId: recording.meetingId,
        appointment: {
          patient: recording.appointment?.patient?.name || 'Test Patient',
          doctor: recording.appointment?.doctor?.name || 'Test Doctor',
          date: recording.appointment?.appointmentDate || new Date().toISOString(),
          time: recording.appointment?.appointmentTime || 'Test Time'
        },
        summary: recording.summary,
        status: recording.status,
        createdAt: recording.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error getting doctor recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting doctor recordings',
      error: error.message
    });
  }
};


