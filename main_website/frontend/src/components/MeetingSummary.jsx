import React, { useState, useEffect } from 'react';
import './MeetingSummary.css';

const MeetingSummary = ({ 
  recordingId, 
  isVisible, 
  onClose 
}) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && recordingId) {
      fetchSummary();
    }
  }, [isVisible, recordingId]);

  const fetchSummary = async () => {
    try {
      console.log('🔍 [FRONTEND] Generating and fetching summary for recording:', recordingId);
      setLoading(true);
      setError(null);

      // First generate the summary (POST)
      console.log('🤖 [FRONTEND] Generating AI summary...');
      const generateController = new AbortController();
      const generateTimeout = setTimeout(() => generateController.abort(), 60000); // 60 second timeout
      
      const generateResponse = await fetch(`/api/recordings/${recordingId}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: generateController.signal
      });
      
      clearTimeout(generateTimeout);
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to generate summary (${generateResponse.status})`);
      }
      
      const generateData = await generateResponse.json();
      console.log('🤖 [FRONTEND] Summary generation response:', generateData);
      
      // Check if summary generation was successful
      if (!generateData.success) {
        throw new Error(generateData.message || 'Summary generation failed');
      }
      
      // Then fetch the generated summary (GET)
      console.log('🔍 [FRONTEND] Fetching generated summary...');
      const fetchController = new AbortController();
      const fetchTimeout = setTimeout(() => fetchController.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/recordings/${recordingId}/summary`, {
        signal: fetchController.signal
      });
      
      clearTimeout(fetchTimeout);
      console.log('🔍 [FRONTEND] Summary fetch response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch summary (${response.status})`);
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] Summary fetch response data:', data);
      
      // Check if summary generation failed
      if (!data.success) {
        throw new Error(data.message || 'Summary generation failed');
      }
      
      // Check if summary data exists
      if (!data.data || !data.data.summary) {
        throw new Error('No summary data available');
      }
      
      // Check for populate errors
      if (data.success && data.data) {
        console.log('🔍 [FRONTEND] Summary data structure:');
        console.log('  - summary exists:', !!data.data.summary);
        console.log('  - appointment exists:', !!data.data.appointment);
        console.log('  - appointment.patient:', data.data.appointment?.patient || 'MISSING');
        console.log('  - appointment.doctor:', data.data.appointment?.doctor || 'MISSING');
        console.log('  - appointment.date:', data.data.appointment?.date || 'MISSING');
        console.log('  - appointment.time:', data.data.appointment?.time || 'MISSING');
        
        if (data.data.summary) {
          console.log('  - summary.content exists:', !!data.data.summary.content);
          console.log('  - summary.keyPoints count:', data.data.summary.keyPoints?.length || 0);
          console.log('  - summary.medications count:', data.data.summary.medications?.length || 0);
          console.log('  - summary.followUpInstructions exists:', !!data.data.summary.followUpInstructions);
        }
        
        if (!data.data.appointment) {
          console.error('❌ [FRONTEND] POPULATE ERROR: Appointment data is missing from response!');
          console.error('   This means the backend populate() failed or appointment doesn\'t exist');
        }
      }
      
      setSummary(data.data);
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching summary:', error);
      
      let errorMessage = 'Failed to load meeting summary';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Summary not found. Please generate the summary first.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    try {
      console.log('🤖 [FRONTEND] Generating AI summary for recording:', recordingId);
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recordings/${recordingId}/generate-summary`, {
        method: 'POST'
      });

      console.log('🤖 [FRONTEND] Summary generation response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      console.log('🤖 [FRONTEND] Summary generation response data:', data);
      
      // Check for populate errors in generated summary
      if (data.success && data.data) {
        console.log('🤖 [FRONTEND] Generated summary data structure:');
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
          console.error('❌ [FRONTEND] POPULATE ERROR: Appointment data is missing from generated summary!');
          console.error('   This means the backend populate() failed during summary generation');
        } else {
          console.log('✅ [FRONTEND] Appointment data is present in generated summary');
        }
      }
      
      setSummary(data.data);
    } catch (error) {
      console.error('❌ [FRONTEND] Error generating summary:', error);
      setError('Failed to generate meeting summary');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="meeting-summary-overlay" onClick={onClose}>
      <div className="meeting-summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="meeting-summary-header">
          <h3>📋 Meeting Summary</h3>
          <button className="close-summary-btn" onClick={onClose}>×</button>
        </div>

        <div className="meeting-summary-body">
          {loading ? (
            <div className="loading-state">
              <p>🤖 Meeting Summary is Generating</p>
              <p className="loading-subtitle">Please wait while AI processes your consultation...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button className="retry-btn" onClick={generateSummary}>
                Try Again
              </button>
            </div>
          ) : summary ? (
            <div className="summary-content">
              {summary.appointment && (
                <div className="appointment-info">
                  <h4>Appointment Details</h4>
                  <p><strong>Patient:</strong> {summary.appointment.patient}</p>
                  <p><strong>Doctor:</strong> {summary.appointment.doctor}</p>
                  <p><strong>Date:</strong> {new Date(summary.appointment.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {summary.appointment.time}</p>
                </div>
              )}

              {summary.summary && (
                <div className="summary-section">
                  <h4>Summary</h4>
                  <p>{summary.summary.content}</p>
                </div>
              )}

              {summary.summary?.keyPoints && summary.summary.keyPoints.length > 0 && (
                <div className="key-points-section">
                  <h4>Key Points</h4>
                  <ul>
                    {summary.summary.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.summary?.medications && summary.summary.medications.length > 0 && (
                <div className="medications-section">
                  <h4>Medications</h4>
                  {summary.summary.medications.map((med, index) => (
                    <div key={index} className="medication-item">
                      <strong>{med.name}</strong>
                      {med.dosage && <span> - {med.dosage}</span>}
                      {med.instructions && <p>{med.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}

              {summary.summary?.followUpInstructions && (
                <div className="follow-up-section">
                  <h4>Follow-up Instructions</h4>
                  <p>{summary.summary.followUpInstructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-summary-state">
              <div className="no-summary-icon">📝</div>
              <p>No summary available yet</p>
              <button className="generate-btn" onClick={generateSummary}>
                Generate Summary
              </button>
            </div>
          )}
        </div>

        <div className="meeting-summary-actions">
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingSummary;


