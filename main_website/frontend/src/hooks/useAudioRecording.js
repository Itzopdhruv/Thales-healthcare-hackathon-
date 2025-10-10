import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for audio recording functionality
 * Handles browser audio recording, upload, and processing
 */
export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      console.log('🎤 [RECORDING] Starting recording...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }
      
      console.log('🎤 [RECORDING] Requesting microphone permission...');
      
      // Request microphone permission with browser-compatible constraints
      const userAgent = navigator.userAgent.toLowerCase();
      const isFirefox = userAgent.includes('firefox');
      const isChrome = userAgent.includes('chrome');
      const isEdge = userAgent.includes('edge');
      
      console.log('🌐 [RECORDING] Browser detected:', { isFirefox, isChrome, isEdge });
      
      // Start with basic constraints and add more if supported
      let audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true
      };
      
      // Add more constraints based on browser support
      if (isChrome || isEdge) {
        console.log('🌐 [RECORDING] Using Chrome/Edge audio constraints');
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        };
      } else if (isFirefox) {
        console.log('🦊 [RECORDING] Using Firefox-compatible audio constraints');
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true
          // Firefox may not support autoGainControl or sampleRate
        };
      } else {
        console.log('🌐 [RECORDING] Using basic audio constraints for unknown browser');
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true
        };
      }
      
      console.log('🎤 [RECORDING] Requesting microphone with constraints:', audioConstraints);
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints
        });
      } catch (constraintError) {
        console.warn('⚠️ [RECORDING] Audio constraints failed, trying basic constraints:', constraintError.message);
        
        // Fallback to basic constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          console.log('✅ [RECORDING] Fallback to basic audio constraints successful');
        } catch (basicError) {
          console.error('❌ [RECORDING] Even basic audio constraints failed:', basicError.message);
          throw basicError;
        }
      }

      console.log('🎤 [RECORDING] Microphone permission granted, stream:', stream);
      console.log('🎤 [RECORDING] Audio tracks:', stream.getAudioTracks().length);

      // Create MediaRecorder with Firefox-compatible MIME types
      console.log('🌐 [RECORDING] Browser detected:', isFirefox ? 'Firefox' : 'Other');
      
      let mimeType = 'audio/webm;codecs=opus';
      
      // Firefox-specific MIME type handling
      if (isFirefox) {
        console.log('🦊 [RECORDING] Firefox detected - using Firefox-compatible settings');
        // Firefox prefers audio/webm without codecs or audio/ogg
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
          console.log('🦊 [RECORDING] Using Firefox-compatible: audio/webm');
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
          console.log('🦊 [RECORDING] Using Firefox-compatible: audio/ogg;codecs=opus');
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
          console.log('🦊 [RECORDING] Using Firefox-compatible: audio/ogg');
        } else {
          mimeType = 'audio/wav';
          console.log('🦊 [RECORDING] Using fallback: audio/wav');
        }
      } else {
        // Chrome/Edge/Safari MIME type handling
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          console.log('⚠️ [RECORDING] Opus codec not supported, falling back to:', mimeType);
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          console.log('⚠️ [RECORDING] WebM not supported, falling back to:', mimeType);
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          console.log('⚠️ [RECORDING] MP4 not supported, falling back to:', mimeType);
        }
      }

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });
        console.log('✅ [RECORDING] MediaRecorder created with MIME type:', mimeType);
      } catch (mimeError) {
        console.warn('⚠️ [RECORDING] MIME type failed, trying default:', mimeError.message);
        
        // Fallback to default MediaRecorder without MIME type
        try {
          mediaRecorder = new MediaRecorder(stream);
          console.log('✅ [RECORDING] MediaRecorder created with default MIME type');
        } catch (defaultError) {
          console.error('❌ [RECORDING] MediaRecorder creation failed completely:', defaultError.message);
          throw new Error('MediaRecorder not supported in this browser');
        }
      }

      console.log('🎤 [RECORDING] MediaRecorder created:', mediaRecorder);
      console.log('🎤 [RECORDING] Using MIME type:', mimeType);
      console.log('🎤 [RECORDING] MIME type supported:', MediaRecorder.isTypeSupported(mimeType));

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        console.log('🎤 [RECORDING] Data available event triggered');
        console.log('🎤 [RECORDING] Event data size:', event.data.size, 'bytes');
        console.log('🎤 [RECORDING] Event data type:', event.data.type);
        console.log('🎤 [RECORDING] Event data constructor:', event.data.constructor.name);
        console.log('🎤 [RECORDING] Event data is Blob:', event.data instanceof Blob);
        console.log('🎤 [RECORDING] Event data is ArrayBuffer:', event.data instanceof ArrayBuffer);
        console.log('🎤 [RECORDING] Current chunks count before adding:', audioChunksRef.current.length);
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('✅ [RECORDING] Audio chunk added successfully');
          console.log('🎤 [RECORDING] Total chunks after adding:', audioChunksRef.current.length);
          console.log('🎤 [RECORDING] Total audio data size so far:', audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0), 'bytes');
          
          // Log details about the chunk
          console.log('🎤 [RECORDING] Chunk details:', {
            size: event.data.size,
            type: event.data.type,
            isBlob: event.data instanceof Blob,
            chunkIndex: audioChunksRef.current.length - 1
          });
        } else {
          console.warn('⚠️ [RECORDING] Empty audio chunk received');
          console.warn('⚠️ [RECORDING] This might indicate:');
          console.warn('   1. Microphone permission denied');
          console.warn('   2. No microphone connected');
          console.warn('   3. Browser compatibility issues');
          console.warn('   4. Audio constraints too restrictive');
          console.warn('   5. MediaRecorder not capturing audio properly');
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('🛑 [RECORDING] onstop event triggered');
        console.log('🛑 [RECORDING] Audio chunks available:', audioChunksRef.current.length);
        console.log('🛑 [RECORDING] Total audio data size:', audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0), 'bytes');
        
        // Log detailed chunk information
        console.log('🛑 [RECORDING] Chunk details:');
        audioChunksRef.current.forEach((chunk, index) => {
          console.log(`  Chunk ${index}: ${chunk.size} bytes, type: ${chunk.type}`);
        });
        
        if (audioChunksRef.current.length > 0) {
          // Use the same MIME type that was used for recording
          const mimeType = mediaRecorder.mimeType || 'audio/webm;codecs=opus';
          console.log('🛑 [RECORDING] Creating blob with MIME type:', mimeType);
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log('🎵 [RECORDING] Audio blob created successfully');
            console.log('🎵 [RECORDING] Blob size:', audioBlob.size, 'bytes');
            console.log('🎵 [RECORDING] Blob type:', audioBlob.type);
            console.log('🎵 [RECORDING] Blob is Blob:', audioBlob instanceof Blob);
            console.log('🎵 [RECORDING] Blob chunks used:', audioChunksRef.current.length);
            
            // Validate the blob immediately
            if (audioBlob.size === 0) {
              console.error('❌ [RECORDING] Created blob is empty!');
              setError('Recording failed - no audio data captured. Please check your microphone and try again.');
            } else if (audioBlob.size < 1000) {
              console.error('❌ [RECORDING] Created blob is too small:', audioBlob.size, 'bytes');
              setError('Recording failed - audio is too short. Please record for at least 3-5 seconds.');
            } else {
              console.log('✅ [RECORDING] Audio blob validation passed');
              console.log('✅ [RECORDING] Setting recording blob...');
              
              // Set the blob and immediately log the state change
              setRecordingBlob(audioBlob);
              console.log('✅ [RECORDING] Recording blob set successfully');
              console.log('✅ [RECORDING] Blob ready for upload:', audioBlob.size, 'bytes');
              
              // Trigger a custom event to notify components that blob is ready
              window.dispatchEvent(new CustomEvent('recordingBlobReady', { 
                detail: { blob: audioBlob, size: audioBlob.size } 
              }));
            }
          } catch (blobError) {
            console.error('❌ [RECORDING] Error creating blob:', blobError);
            setError('Recording failed - error creating audio blob: ' + blobError.message);
          }
        } else {
          console.error('❌ [RECORDING] No audio chunks available in onstop handler');
          console.error('❌ [RECORDING] This usually means:');
          console.error('   1. Microphone permission was denied');
          console.error('   2. No microphone is connected');
          console.error('   3. Browser does not support the audio format');
          console.error('   4. MediaRecorder failed to capture audio');
          console.error('   5. Audio constraints were too restrictive');
          setError('No audio was recorded. Please check your microphone permissions and try again.');
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          console.log('🛑 [RECORDING] Stopping track:', track.kind, track.label);
          console.log('🛑 [RECORDING] Track state before stop:', track.readyState);
          track.stop();
          console.log('🛑 [RECORDING] Track state after stop:', track.readyState);
        });
        console.log('🛑 [RECORDING] All tracks stopped');
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('🎤 Recording started');

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        setError('Audio recording not supported in this browser. Please use a modern browser.');
      } else {
        setError(`Failed to start recording: ${error.message}`);
      }
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('⏹️ [RECORDING] Stopping recording...');
    console.log('⏹️ [RECORDING] MediaRecorder exists:', !!mediaRecorderRef.current);
    console.log('⏹️ [RECORDING] Is recording:', isRecording);
    console.log('⏹️ [RECORDING] Audio chunks count:', audioChunksRef.current.length);
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      console.log('⏹️ [RECORDING] Recording stopped - blob will be created in onstop handler');
      
      // The blob creation happens in the onstop event handler
      // No need to create it here as it's asynchronous
    } else {
      console.error('❌ [RECORDING] Cannot stop recording - MediaRecorder or recording state invalid');
      setError('Cannot stop recording - no active recording session');
    }
  }, [isRecording]);

  // Upload recording
  const uploadRecording = useCallback(async (recordingId, userType) => {
    // Comprehensive validation before upload
    if (!recordingBlob) {
      const errorMsg = 'No recording to upload - recording blob is null or undefined';
      setError(errorMsg);
      console.error('❌ [UPLOAD]', errorMsg);
      return { error: errorMsg, success: false };
    }

    if (recordingBlob.size === 0) {
      const errorMsg = 'Recording blob is empty (0 bytes) - no audio was recorded';
      setError(errorMsg);
      console.error('❌ [UPLOAD]', errorMsg);
      return { error: errorMsg, success: false };
    }

    if (recordingBlob.size < 1000) {
      const errorMsg = `Recording blob is too small (${recordingBlob.size} bytes) - likely a failed recording`;
      setError(errorMsg);
      console.error('❌ [UPLOAD]', errorMsg);
      return { error: errorMsg, success: false };
    }

    if (!recordingBlob.type || !recordingBlob.type.startsWith('audio/')) {
      const errorMsg = `Invalid recording blob type: ${recordingBlob.type}`;
      setError(errorMsg);
      console.error('❌ [UPLOAD]', errorMsg);
      return { error: errorMsg, success: false };
    }

    try {
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('audio', recordingBlob, `recording-${Date.now()}.webm`);
      formData.append('duration', recordingDuration.toString());

      const endpoint = userType === 'patient' 
        ? `/api/recordings/${recordingId}/patient`
        : `/api/recordings/${recordingId}/doctor`;

      console.log('📤 [UPLOAD] Uploading to:', endpoint);
      console.log('📤 [UPLOAD] Blob size:', recordingBlob.size, 'bytes');
      console.log('📤 [UPLOAD] Blob type:', recordingBlob.type);
      console.log('📤 [UPLOAD] Recording ID:', recordingId);
      console.log('📤 [UPLOAD] User type:', userType);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      console.log('📤 [UPLOAD] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || 'Upload failed';
        console.error('❌ [UPLOAD] Server error:', errorMsg);
        setError(`Upload failed: ${errorMsg}`);
        return { error: errorMsg, success: false };
      }

      const result = await response.json();
      setUploadProgress(100);
      console.log('📤 [UPLOAD] Recording uploaded successfully:', result);

      return { ...result, success: true };

    } catch (error) {
      console.error('❌ [UPLOAD] Error uploading recording:', error);
      const errorMsg = `Upload failed: ${error.message}`;
      setError(errorMsg);
      return { error: errorMsg, success: false };
    }
  }, [recordingBlob]);

  // Process recordings (merge and generate summary)
  const processRecordings = useCallback(async (recordingId) => {
    try {
      setError(null);
      setUploadProgress(0);

      // First, process the recordings (merge audio)
      const processResponse = await fetch(`/api/recordings/${recordingId}/process`, {
        method: 'POST'
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.message || 'Processing failed');
      }

      setUploadProgress(50);

      // Then, generate AI summary
      const summaryResponse = await fetch(`/api/recordings/${recordingId}/generate-summary`, {
        method: 'POST'
      });

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.message || 'Summary generation failed');
      }

      setUploadProgress(100);
      console.log('🤖 Recording processed and summary generated');

      return await summaryResponse.json();

    } catch (error) {
      console.error('❌ Error processing recordings:', error);
      setError(`Processing failed: ${error.message}`);
      throw error;
    }
  }, []);

  // Reset recording state
  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingDuration(0);
    setUploadProgress(0);
    setRecordingBlob(null);
    setError(null);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Clean up MediaRecorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isRecording,
    recordingDuration,
    uploadProgress,
    recordingBlob,
    error,
    setError,
    
    // Actions
    startRecording,
    stopRecording,
    uploadRecording,
    processRecordings,
    resetRecording,
    
    // Utilities
    formatDuration
  };
};
