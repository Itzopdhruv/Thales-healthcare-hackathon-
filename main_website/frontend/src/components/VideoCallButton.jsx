import React, { useState, useEffect } from 'react';
import './VideoCallButton.css';
import RecordingAlert from './RecordingAlert';
import RecordingIndicator from './RecordingIndicator';
import MeetingSummary from './MeetingSummary';
import { useAudioRecording } from '../hooks/useAudioRecording';

const VideoCallButton = ({ 
  appointment, 
  userType, // 'admin' or 'patient'
  onCallStart,
  onCallEnd 
}) => {
  const [isCallEnabled, setIsCallEnabled] = useState(false);
  const [timeUntilCall, setTimeUntilCall] = useState('');
  const [showMeetingIdModal, setShowMeetingIdModal] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Recording states
  const [showRecordingAlert, setShowRecordingAlert] = useState(false);
  const [showMeetingSummary, setShowMeetingSummary] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const [recordingSessionStarted, setRecordingSessionStarted] = useState(false);
  
  // Audio recording hook
  const {
    isRecording,
    recordingDuration,
    uploadProgress,
    recordingBlob,
    error: recordingError,
    setError: setRecordingError,
    startRecording,
    stopRecording,
    uploadRecording,
    processRecordings,
    resetRecording,
    formatDuration
  } = useAudioRecording();

  // State for recording error display
  const [showRecordingError, setShowRecordingError] = useState(false);
  const [recordingSuccess, setRecordingSuccess] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Always enable video call for testing (removed 5-minute rule)
  useEffect(() => {
    if (!appointment || !appointment.appointmentDate || !appointment.appointmentTime) {
      setIsCallEnabled(false);
      return;
    }

    // Always enable call for testing purposes
    setIsCallEnabled(true);
    setTimeUntilCall('Available');
  }, [appointment]);

  // Function to mark appointment as serviced
  const markAppointmentAsServiced = async (appointmentId) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/serviced`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Appointment marked as serviced');
        // Optionally refresh the appointment data or trigger a callback
        if (onCallEnd) {
          onCallEnd(appointmentId);
        }
      } else {
        console.error('❌ Failed to mark appointment as serviced');
      }
    } catch (error) {
      console.error('❌ Error marking appointment as serviced:', error);
    }
  };

  // Extract meeting ID from virtual meeting link
  const extractMeetingId = () => {
    if (!appointment || !appointment.virtualMeetingLink) return '';
    
    // Extract meeting ID from URL like "https://meet.jit.si/slot-abc123-20240115"
    const urlParts = appointment.virtualMeetingLink.split('/');
    return urlParts[urlParts.length - 1] || '';
  };

  const handleStartCall = () => {
    const meetingIdFromAppointment = extractMeetingId();
    setMeetingId(meetingIdFromAppointment);
    setShowMeetingIdModal(true);
    setCopySuccess(false);
    
    if (onCallStart) {
      onCallStart(appointment._id, meetingIdFromAppointment);
    }
  };

  const handleStartVideoCall = async () => {
    const meetingIdFromAppointment = extractMeetingId();
    
    if (!meetingIdFromAppointment) {
      alert('No meeting ID available for this appointment');
      return;
    }

    // Determine if user is admin or patient
    const isAdmin = userType === 'admin';
    
    // Get display names
    const doctorName = appointment.doctor?.name || 'Dr. Unknown';
    const patientName = appointment.patient?.name || 'Patient';
    const displayName = isAdmin ? `Dr. ${doctorName}` : patientName;
    
    // If patient is trying to join, check if doctor is already in the meeting
    if (!isAdmin) {
      const doctorJoined = await checkDoctorJoined(meetingIdFromAppointment);
      if (!doctorJoined) {
        setErrorMessage('Doctor has not joined the meeting yet. Please wait for the doctor to start the video call first.');
        setShowErrorModal(true);
        return;
      }
    }
    
    // Create Jitsi URL with proper display names and admin as master
    const jitsiUrl = `https://meet.jit.si/${meetingIdFromAppointment}?jitsi_meet_external_api=1&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(displayName)}&userInfo.email=${encodeURIComponent(isAdmin ? 'doctor@ayulink.com' : 'patient@ayulink.com')}${isAdmin ? '&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.enableWelcomePage=false' : ''}`;
    
    // Open Jitsi Meet in new tab
    const jitsiWindow = window.open(jitsiUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!jitsiWindow) {
      alert('Please allow popups for this site to start the video call');
      return;
    }

    // Call the callback if provided
    if (onCallStart) {
      onCallStart(appointment._id, meetingIdFromAppointment);
    }

    // Notify backend about doctor/patient joining
    if (isAdmin) {
      await notifyDoctorJoined(meetingIdFromAppointment, appointment.doctor?._id, appointment._id);
      alert(`🎥 Video call started! You are Dr. ${doctorName} (Host).`);
    } else {
      await notifyPatientJoined(meetingIdFromAppointment, appointment.patient?._id, appointment._id);
      alert(`🎥 Joining video call as ${patientName}...`);
    }

    // Monitor when the Jitsi window closes to mark appointment as serviced
    const checkWindowClosed = setInterval(() => {
      if (jitsiWindow.closed) {
        clearInterval(checkWindowClosed);
        console.log('🎥 Video call ended, marking appointment as serviced');
        markAppointmentAsServiced(appointment._id);
      }
    }, 1000); // Check every second

    // Start recording session and show alert
    console.log('🎤 Starting recording session...');
    await startRecordingSession(meetingIdFromAppointment);
    console.log('🎤 Setting showRecordingAlert to true');
    setShowRecordingAlert(true);
  };

  // Check if doctor has joined the meeting
  const checkDoctorJoined = async (meetingId) => {
    try {
      // Check if there's an active meeting with doctor
      const response = await fetch(`/api/meetings/check-doctor-joined/${meetingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.doctorJoined;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking doctor status:', error);
      return false;
    }
  };

  // Notify backend that doctor joined
  const notifyDoctorJoined = async (meetingId, doctorId, appointmentId) => {
    try {
      await fetch(`/api/meetings/doctor-joins/${meetingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId,
          appointmentId
        })
      });
    } catch (error) {
      console.error('Error notifying doctor joined:', error);
    }
  };

  // Notify backend that patient joined
  const notifyPatientJoined = async (meetingId, patientId, appointmentId) => {
    try {
      await fetch(`/api/meetings/patient-joins/${meetingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId,
          appointmentId
        })
      });
    } catch (error) {
      console.error('Error notifying patient joined:', error);
    }
  };

  // Start recording session
  const startRecordingSession = async (meetingId) => {
    try {
      const response = await fetch('/api/recordings/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment._id,
          meetingId: meetingId,
          userType: userType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecordingId(data.data.recordingId);
        setRecordingSessionStarted(true);
        console.log('🎤 Recording session started:', data.data.recordingId);
      }
    } catch (error) {
      console.error('Error starting recording session:', error);
    }
  };

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      setRecordingError(null); // Clear any previous errors
      await startRecording();
      setShowRecordingAlert(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Failed to start recording: ' + error.message);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      stopRecording();
      
      if (recordingId) {
        // Wait for blob to be ready
        console.log('⏳ Waiting for recording blob...');
        let attempts = 0;
        const maxAttempts = 20;
        let blobReady = false;
        let currentBlob = null;
        
        // Set up event listener for blob ready event
        const handleBlobReady = (event) => {
          console.log('🎵 [EVENT] Recording blob ready event received:', event.detail);
          currentBlob = event.detail.blob;
          blobReady = true;
        };
        
        window.addEventListener('recordingBlobReady', handleBlobReady);
        
        // Poll for blob while waiting for event
        while (!blobReady && !recordingBlob && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // Clean up event listener
        window.removeEventListener('recordingBlobReady', handleBlobReady);
        
        // Use the blob from event or state
        const finalBlob = currentBlob || recordingBlob;
        
        if (!finalBlob) {
          console.error('❌ No recording blob available for upload');
          setRecordingError('No recording to upload - recording blob is null or undefined');
          return;
        }
        
        console.log('📤 Uploading recording with blob:', finalBlob.size, 'bytes');
        
        // Create FormData and upload directly
        const formData = new FormData();
        formData.append('audio', finalBlob, `recording-${Date.now()}.webm`);
        
        const uploadResponse = await fetch(`/api/recordings/${recordingId}/${userType}`, {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        // Check if both recordings are ready for processing
        if (uploadResult?.bothRecordingsReady) {
          console.log('🎵 Both recordings ready - starting processing...');
          // Process recordings (merge and generate summary)
          await processRecordings(recordingId);
          console.log('✅ Recording completed and processed');
        } else {
          console.log('⏳ Waiting for both recordings to be ready...');
          // Start polling to check when both are ready
          pollForProcessing(recordingId);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  // Poll for processing when both recordings are ready
  const pollForProcessing = async (recordingId) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/recordings/${recordingId}/status`);
        const data = await response.json();
        
        if (data.success) {
          const bothReady = data.data.patientRecording?.status === 'uploaded' && 
                           data.data.doctorRecording?.status === 'uploaded';
          
          if (bothReady) {
            console.log('🎵 Both recordings ready - starting processing...');
            await processRecordings(recordingId);
            console.log('✅ Recording completed and processed');
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Check every second
        } else {
          console.log('⏰ Timeout waiting for both recordings');
        }
      } catch (error) {
        console.error('Error polling for processing:', error);
      }
    };
    
    poll();
  };

  // Generate AI summary
  const generateSummary = async (recordingId) => {
    try {
      console.log('🤖 [VIDEO CALL] Generating AI summary for recording:', recordingId);
      
      const response = await fetch(`/api/recordings/${recordingId}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🤖 [VIDEO CALL] Summary generation response status:', response.status);

      const data = await response.json();
      console.log('🤖 [VIDEO CALL] Summary generation response data:', data);
      
      // Check for populate errors
      if (data.success && data.data) {
        console.log('🤖 [VIDEO CALL] Generated summary data structure:');
        console.log('  - summary exists:', !!data.data.summary);
        console.log('  - appointment exists:', !!data.data.appointment);
        console.log('  - appointment.patient:', data.data.appointment?.patient || 'MISSING');
        console.log('  - appointment.doctor:', data.data.appointment?.doctor || 'MISSING');
        console.log('  - appointment.date:', data.data.appointment?.date || 'MISSING');
        console.log('  - appointment.time:', data.data.appointment?.time || 'MISSING');
        
        if (data.data.summary) {
          console.log('  - summary.content length:', data.data.summary.content?.length || 0);
          console.log('  - summary.keyPoints count:', data.data.summary.keyPoints?.length || 0);
          console.log('  - summary.medications count:', data.data.summary.medications?.length || 0);
          console.log('  - summary.followUpInstructions length:', data.data.summary.followUpInstructions?.length || 0);
          console.log('  - summary.status:', data.data.summary.status);
        }
        
        if (!data.data.appointment) {
          console.error('❌ [VIDEO CALL] POPULATE ERROR: Appointment data is missing from generated summary!');
          console.error('   This means the backend populate() failed during summary generation');
        } else {
          console.log('✅ [VIDEO CALL] Appointment data is present in generated summary');
        }
      }
      
      if (data.success) {
        console.log('✅ [VIDEO CALL] AI summary generated successfully');
        setShowMeetingSummary(true);
      } else {
        console.error('❌ [VIDEO CALL] Summary generation failed:', data.message);
        setRecordingError(data.message);
      }
    } catch (error) {
      console.error('❌ [VIDEO CALL] Error generating summary:', error);
      setRecordingError('Summary generation failed: ' + error.message);
    }
  };

  // Force process recordings (even if only one is available)
  const forceProcessRecordings = async (recordingId) => {
    try {
      const response = await fetch(`/api/recordings/${recordingId}/force-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Recordings force processed successfully');
        // Generate AI summary
        await generateSummary(recordingId);
      } else {
        console.error('❌ Force processing failed:', data.message);
        setRecordingError(data.message);
      }
    } catch (error) {
      console.error('Error force processing recordings:', error);
      setRecordingError('Force processing failed: ' + error.message);
    }
  };

  // Handle stopping both recordings simultaneously
    const handleStopBothRecordings = async () => {
      try {
        console.log('🛑 Stopping both recordings...');
        
        if (!recordingId) {
          console.error('❌ No recording session ID available');
          setRecordingError('No recording session started. Please start recording first.');
          return;
        }

        console.log('📝 Recording ID:', recordingId);
        console.log('🎵 Recording blob exists:', !!recordingBlob);
        console.log('🎵 Recording blob size:', recordingBlob?.size || 'N/A');
        console.log('🎵 Is recording:', isRecording);
        
        // First stop the current recording
        console.log('🛑 Stopping current recording...');
        stopRecording();
        
        // Wait for the blob to be created using both polling and event listener
        console.log('⏳ Waiting for audio blob to be created...');
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max wait
        let blobReady = false;
        let finalBlob = null;
        
        // Set up event listener for blob ready event
        const handleBlobReady = (event) => {
          console.log('🎵 [EVENT] Recording blob ready event received:', event.detail);
          finalBlob = event.detail.blob;
          blobReady = true;
        };
        
        window.addEventListener('recordingBlobReady', handleBlobReady);
        
        // Poll for blob while waiting for event
        while (!blobReady && !recordingBlob && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          console.log(`⏳ Waiting for blob... attempt ${attempts}/${maxAttempts}`);
        }
        
        // Clean up event listener
        window.removeEventListener('recordingBlobReady', handleBlobReady);
        
        // Use the blob from event or state
        const currentBlob = finalBlob || recordingBlob;
        
        if (!currentBlob) {
          console.error('❌ Timeout waiting for audio blob to be created');
          setRecordingError('Recording failed - no audio data captured. Please try again.');
          return;
        }

        console.log('✅ Audio blob found:', currentBlob.size, 'bytes');
        console.log('✅ Audio blob type:', currentBlob.type);

        // Validate the recording blob before upload
        if (currentBlob.size === 0) {
          console.error('❌ Recording blob is empty (0 bytes)');
          setRecordingError('Recording failed - no audio data was captured. Please check your microphone and try again.');
          return;
        }

        if (currentBlob.size < 1000) {
          console.error('❌ Recording blob is too small:', currentBlob.size, 'bytes');
          setRecordingError(`Recording failed - audio is too short (${currentBlob.size} bytes). Please record for at least 3-5 seconds.`);
          return;
        }

        if (!currentBlob.type || !currentBlob.type.startsWith('audio/')) {
          console.error('❌ Invalid recording blob type:', currentBlob.type);
          setRecordingError('Recording failed - invalid audio format. Please try again.');
          return;
        }
        
        console.log('✅ Audio blob ready for upload:', currentBlob.size, 'bytes');
        console.log('✅ Audio blob type:', currentBlob.type);
        
        // Upload current recording with the blob we found
        console.log('📤 Uploading current recording...');
        console.log('📤 Using blob:', currentBlob.size, 'bytes, type:', currentBlob.type);
        
        // Create a temporary FormData with the current blob
        const formData = new FormData();
        formData.append('audio', currentBlob, `recording-${Date.now()}.webm`);
        
        // Upload directly using fetch instead of the hook's uploadRecording
        const uploadResponse = await fetch(`/api/recordings/${recordingId}/${userType}`, {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        console.log('📤 Upload result:', uploadResult);
        
        // Check if upload was successful
        if (!uploadResult) {
          console.error('❌ Upload failed: No result returned');
          setRecordingError('Failed to upload recording: No result returned');
          return;
        }
        
        if (uploadResult.error || !uploadResult.success) {
          console.error('❌ Upload failed:', uploadResult.error || 'Upload unsuccessful');
          setRecordingError('Failed to upload recording: ' + (uploadResult.error || 'Upload unsuccessful'));
          return;
        }
        
        console.log('✅ Upload successful:', uploadResult);
      
      // Wait a moment for upload to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force processing immediately (this will work even with just one recording)
      console.log('🎵 Force processing recordings...');
      try {
        await forceProcessRecordings(recordingId);
        console.log('✅ Both recordings stopped and processed');
        // Show success message
        setRecordingError(null); // Clear any previous errors
        setRecordingSuccess(true); // Show success message
        setTimeout(() => setRecordingSuccess(false), 3000); // Hide after 3 seconds
        
        // Show summary generation loading state
        setIsGeneratingSummary(true);
        console.log('📋 Starting summary generation...');
        
        // Generate summary after processing
        try {
          await generateSummary();
          console.log('✅ Summary generation completed');
        } catch (summaryError) {
          console.error('❌ Summary generation failed:', summaryError);
        } finally {
          setIsGeneratingSummary(false);
        }
      } catch (processingError) {
        console.error('❌ Force processing failed:', processingError);
        // Don't show error to user, just log it
        console.log('⚠️ Processing failed, but recording was stopped successfully');
        // Show success message for stopping recording
        setRecordingError(null); // Clear any previous errors
        setRecordingSuccess(true); // Show success message
        setTimeout(() => setRecordingSuccess(false), 3000); // Hide after 3 seconds
      }
      
    } catch (error) {
      console.error('Error stopping both recordings:', error);
      setRecordingError(`Error: ${error.message}`);
    }
  };

  // Handle skip recording
  const handleSkipRecording = () => {
    setShowRecordingAlert(false);
    resetRecording();
  };


  // Handle show summary
  const handleShowSummary = async () => {
    if (recordingId) {
      console.log('📋 [VIDEO CALL] Opening meeting summary modal for recording:', recordingId);
      setShowMeetingSummary(true);
    } else {
      console.log('📋 [VIDEO CALL] No recording ID, creating a new recording session for summary...');
      // Create a new recording session for this appointment
      try {
        const meetingId = extractMeetingId();
        if (meetingId) {
          const newRecordingId = await startRecordingSession(meetingId);
          if (newRecordingId) {
            setRecordingId(newRecordingId);
            setShowMeetingSummary(true);
          } else {
            alert('Unable to create recording session for summary. Please try again.');
          }
        } else {
          alert('No meeting ID available for this appointment.');
        }
      } catch (error) {
        console.error('❌ [VIDEO CALL] Error creating recording session for summary:', error);
        alert('Error creating recording session. Please try again.');
      }
    }
  };

  const handleCopyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy meeting ID:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = meetingId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowMeetingIdModal(false);
    setMeetingId('');
    setCopySuccess(false);
    
    if (onCallEnd) {
      onCallEnd(appointment._id);
    }
  };

  // Don't render if appointment is cancelled or no-show (but allow completed for admin)
  if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
    return null;
  }
  
  // For completed appointments, only show to admin users
  if (appointment.status === 'COMPLETED' && userType !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="video-call-container">
        {isCallEnabled ? (
          <button
            className="video-call-btn enabled"
            onClick={handleStartVideoCall}
            title="Start video call"
          >
            📹 Video Call
          </button>
        ) : (
          <div className="video-call-disabled">
            <span className="video-call-icon">📹</span>
            <span className="video-call-text">
              No Meeting ID Available
            </span>
          </div>
        )}
        

        
        {/* Stop Both Recordings Button */}
        {recordingSessionStarted && recordingId && (
          <button 
            className="stop-both-btn"
            onClick={handleStopBothRecordings}
            title="Stop Both Patient and Doctor Recordings"
          >
            🛑 Stop Both Recordings
          </button>
        )}

        {/* Recording Summary Button - Show for SERVICED appointments */}
        {appointment.status === 'SERVICED' && (
          <button 
            className="summary-btn"
            onClick={handleShowSummary}
            title="View Meeting Summary"
          >
            📋 Summary
          </button>
        )}
        
        {/* Recording Error Display */}
        {recordingError && (
          <div className="recording-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{recordingError}</span>
            <button 
              className="error-close-btn"
              onClick={() => setRecordingError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Recording Success Display */}
        {recordingSuccess && (
          <div className="recording-success">
            <span className="success-icon">✅</span>
            <span className="success-text">Recording stopped successfully!</span>
          </div>
        )}

        {/* Summary Generation Loading Display */}
        {isGeneratingSummary && (
          <div className="summary-generating">
            <div className="loading-spinner-small"></div>
            <span className="generating-text">Please wait for meeting summary...</span>
          </div>
        )}
      </div>

      {/* Meeting ID Modal */}
      {showMeetingIdModal && (
        <div className="jitsi-modal-overlay" onClick={handleCloseModal}>
          <div className="jitsi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jitsi-modal-header">
              <h3>📹 Video Call Meeting ID</h3>
              <button className="close-modal-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="jitsi-modal-body">
              <div className="meeting-info">
                <p><strong>Doctor:</strong> Dr. {appointment.doctor?.name}</p>
                <p><strong>Patient:</strong> {appointment.patient?.name}</p>
                <p><strong>Time:</strong> {appointment.appointmentTime}</p>
              </div>
              
              <div className="meeting-id-section">
                <h4>🎯 Your Meeting ID:</h4>
                <div className="meeting-id-container">
                  <input 
                    type="text" 
                    value={meetingId} 
                    readOnly 
                    className="meeting-id-input"
                  />
                  <button 
                    className={`copy-meeting-id-btn ${copySuccess ? 'success' : ''}`}
                    onClick={handleCopyMeetingId}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
              
              <div className="instructions-section">
                <h4>📋 How to Join:</h4>
                <ol>
                  <li>Copy the Meeting ID above</li>
                  <li>Go to <a href="https://meet.jit.si" target="_blank" rel="noopener noreferrer">meet.jit.si</a></li>
                  <li>Paste the Meeting ID in the room name field</li>
                  <li>Click "Go" to join the video call</li>
                </ol>
              </div>
              
              <div className="meeting-actions">
                <button 
                  className="open-jitsi-btn"
                  onClick={() => {
                    const isAdmin = userType === 'admin';
                    const doctorName = appointment.doctor?.name || 'Dr. Unknown';
                    const patientName = appointment.patient?.name || 'Patient';
                    const displayName = isAdmin ? `Dr. ${doctorName}` : patientName;
                    
                    const jitsiUrl = `https://meet.jit.si/${meetingId}?jitsi_meet_external_api=1&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(displayName)}&userInfo.email=${encodeURIComponent(isAdmin ? 'doctor@ayulink.com' : 'patient@ayulink.com')}${isAdmin ? '&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.enableWelcomePage=false' : ''}`;
                    window.open(jitsiUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                    handleCloseModal();
                  }}
                >
                  🚀 Start Video Call
                </button>
                <button 
                  className="close-modal-btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="error-modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error-modal-header">
              <div className="error-icon">⚠️</div>
              <h3>Doctor Not Available</h3>
              <button className="close-error-btn" onClick={() => setShowErrorModal(false)}>×</button>
            </div>
            <div className="error-modal-body">
              <div className="error-content">
                <div className="error-message">
                  {errorMessage}
                </div>
                <div className="error-details">
                  <p>Please wait for the doctor to start the video call first.</p>
                  <p>You will be able to join once the doctor is ready.</p>
                </div>
              </div>
              <div className="error-actions">
                <button 
                  className="error-ok-btn"
                  onClick={() => setShowErrorModal(false)}
                >
                  Got it
                </button>
                <button 
                  className="error-retry-btn"
                  onClick={() => {
                    setShowErrorModal(false);
                    handleStartVideoCall();
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firefox Warning */}
      {navigator.userAgent.toLowerCase().includes('firefox') && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          🦊 <strong>Firefox Detected:</strong> If recording fails, try using Chrome or Edge for better compatibility.
        </div>
      )}

      {/* Recording Alert */}
      <RecordingAlert
        isVisible={showRecordingAlert}
        userType={userType}
        onStartRecording={handleStartRecording}
        onSkip={handleSkipRecording}
        onClose={() => setShowRecordingAlert(false)}
      />

      {/* Recording Indicator */}
      <RecordingIndicator
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        onStopRecording={handleStopRecording}
        onUploadComplete={() => console.log('Upload complete')}
        uploadProgress={uploadProgress}
      />

      {/* Meeting Summary Modal */}
      <MeetingSummary
        recordingId={recordingId}
        isVisible={showMeetingSummary}
        onClose={() => setShowMeetingSummary(false)}
      />
    </>
  );
};

export default VideoCallButton;
