import React, { useState, useEffect } from 'react';
import './RecordingIndicator.css';

const RecordingIndicator = ({ 
  isRecording, 
  recordingDuration, 
  onStopRecording,
  onUploadComplete,
  uploadProgress 
}) => {
  const [displayDuration, setDisplayDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setDisplayDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDisplayDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && uploadProgress === 0) return null;

  return (
    <div className="recording-indicator">
      {isRecording ? (
        <div className="recording-active">
          <div className="recording-dot"></div>
          <span className="recording-text">Recording</span>
          <span className="recording-duration">{formatDuration(displayDuration)}</span>
          <button 
            className="stop-recording-btn"
            onClick={onStopRecording}
            title="Stop Recording"
          >
            ⏹️
          </button>
        </div>
      ) : uploadProgress > 0 ? (
        <div className="uploading-status">
          <div className="upload-spinner"></div>
          <span className="upload-text">
            {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
          </span>
          <div className="upload-progress">
            <div 
              className="upload-progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="upload-percentage">{uploadProgress}%</span>
        </div>
      ) : (
        <div className="recording-complete">
          <div className="complete-icon">✅</div>
          <span className="complete-text">Recording Complete</span>
        </div>
      )}
    </div>
  );
};

export default RecordingIndicator;







