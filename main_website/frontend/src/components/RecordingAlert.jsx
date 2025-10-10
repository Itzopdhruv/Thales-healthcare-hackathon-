import React, { useState } from 'react';
import './RecordingAlert.css';

const RecordingAlert = ({ 
  isVisible, 
  userType, 
  onStartRecording, 
  onSkip, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRecording = async () => {
    setIsLoading(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    console.log('🎤 RecordingAlert: Not visible, returning null');
    return null;
  }

  console.log('🎤 RecordingAlert: Rendering alert modal');
  return (
    <div className="recording-alert-overlay">
      <div className="recording-alert-card">
        <div className="recording-alert-header">
          <div className="recording-icon">🎤</div>
          <h3>
            {userType === 'patient' 
              ? 'Record Meeting Audio' 
              : 'Help Patient Record'
            }
          </h3>
          <button className="close-alert-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="recording-alert-body">
          <div className="recording-message">
            {userType === 'patient' ? (
              <>
                <p>Record this meeting for later help and summary</p>
                <p>Your recording will help generate a detailed summary of your consultation</p>
              </>
            ) : (
              <>
                <p>Patient is recording this meeting</p>
                <p>Please also record for better audio quality and backup</p>
              </>
            )}
          </div>
          
          <div className="recording-tips">
            <h4>📋 Recording Tips:</h4>
            <ul>
              <li>Use headphones for best quality</li>
              <li>Speak clearly and close to microphone</li>
              <li>Ensure good internet connection</li>
              <li>Find a quiet location</li>
            </ul>
          </div>
        </div>
        
        <div className="recording-alert-actions">
          <button 
            className="skip-btn"
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip
          </button>
          <button 
            className="start-recording-btn"
            onClick={handleStartRecording}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Recording'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingAlert;

