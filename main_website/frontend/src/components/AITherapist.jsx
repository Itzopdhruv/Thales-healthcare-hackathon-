import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, message, Progress, Card, Row, Col, Statistic, List, Avatar, Typography, Space, Divider, Upload, Tabs } from 'antd';
import { 
  BulbOutlined, 
  CameraOutlined, 
  SendOutlined, 
  CloseOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  WarningOutlined,
  UploadOutlined
} from '@ant-design/icons';
import './AITherapist.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AITherapist = ({ isVisible, onClose, patientData }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [moodHistory, setMoodHistory] = useState([]);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [emotionData, setEmotionData] = useState(null);
  const [faceDetectionData, setFaceDetectionData] = useState(null);
  const [sessionId] = useState(`session_${Date.now()}_${patientData?.id || 'anonymous'}`);
  const [sessionStats, setSessionStats] = useState({
    totalMessages: 0,
    sessionDuration: 0,
    moodChanges: 0,
    crisisDetected: false
  });

  // Track mood changes
  useEffect(() => {
    // Mood state changed - no logging needed
  }, [currentMood, moodHistory]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [activeTab, setActiveTab] = useState('therapy');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionStartTime = useRef(Date.now());

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check browser compatibility and permissions
  useEffect(() => {
    const checkBrowserCompatibility = async () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isFirefox = userAgent.includes('firefox');
      const isChrome = userAgent.includes('chrome');
      const isEdge = userAgent.includes('edge');
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
      
      console.log('🌐 Browser detection:', { isFirefox, isChrome, isEdge, isSafari });
      
      if (isFirefox) {
        console.log('🦊 Firefox detected - using compatibility mode');
        
        // Check if permissions API is available
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            console.log('📷 Camera permission status:', permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              message.warning('Firefox: Camera access is denied. Please enable it in Firefox settings and refresh the page.');
            } else if (permissionStatus.state === 'prompt') {
              message.info('Firefox: Click "Start Webcam" to allow camera access.');
            }
          } catch (error) {
            console.log('⚠️ Permission API not available:', error);
          }
        }
        
        message.info('Firefox detected. If face detection doesn\'t work, try Chrome or Edge for better compatibility.');
      }
      
      // Check for required APIs
      if (!navigator.mediaDevices) {
        message.error('Your browser doesn\'t support camera access. Please use a modern browser like Chrome, Firefox, or Edge.');
      }
    };
    
    checkBrowserCompatibility();
  }, []);

  // Initialize webcam with enhanced Firefox compatibility
  const initializeWebcam = async () => {
    try {
      console.log('🎥 Initializing webcam...');
      console.log('🌐 Browser:', navigator.userAgent);
      console.log('📱 MediaDevices supported:', !!navigator.mediaDevices);
      console.log('🎬 getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
      
      // Enhanced Firefox detection
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      console.log('🦊 Firefox detected:', isFirefox);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback for older browsers
        if (navigator.getUserMedia) {
          console.log('⚠️ Using legacy getUserMedia API');
          return new Promise((resolve, reject) => {
            navigator.getUserMedia(
              { video: true, audio: false },
              (stream) => {
                console.log('✅ Legacy webcam stream obtained:', stream);
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.onloadedmetadata = () => {
                    console.log('📹 Legacy video metadata loaded');
                    setIsWebcamActive(true);
                    startEmotionDetection();
                  };
                }
                resolve(stream);
              },
              (error) => {
                console.error('❌ Legacy getUserMedia error:', error);
                reject(error);
              }
            );
          });
        } else {
          throw new Error('getUserMedia not supported in this browser');
        }
      }
      
      // Enhanced video constraints for Firefox compatibility
      const constraints = isFirefox ? {
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { min: 15, ideal: 30, max: 60 }
        },
        audio: false
      } : {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: { ideal: 'user' },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };
      
      console.log('🎯 Using constraints for', isFirefox ? 'Firefox' : 'other browser', ':', constraints);
      
      console.log('Requesting webcam with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Webcam stream obtained:', stream);
      console.log('Stream tracks:', stream.getTracks());
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load with multiple event listeners
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded');
          console.log('📐 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          console.log('🎥 Video readyState:', videoRef.current.readyState);
          setIsWebcamActive(true);
          console.log('✅ Webcam marked as active');
          startEmotionDetection();
        };
        
        videoRef.current.oncanplay = () => {
          console.log('▶️ Video can play');
          if (!isWebcamActive) {
            console.log('🔄 Setting webcam active from canplay event');
            setIsWebcamActive(true);
            startEmotionDetection();
          }
        };
        
        videoRef.current.onplaying = () => {
          console.log('🎬 Video is playing');
          if (!isWebcamActive) {
            console.log('🔄 Setting webcam active from playing event');
            setIsWebcamActive(true);
            startEmotionDetection();
          }
        };
        
        // Add a timeout-based activation for Chrome/Edge
        setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject && !isWebcamActive) {
            console.log('⏰ Timeout-based webcam activation attempt...');
            const video = videoRef.current;
            if (video.readyState >= 2 && video.videoWidth > 0) {
              console.log('✅ Video is ready, forcing webcam active');
              setIsWebcamActive(true);
              startEmotionDetection();
            } else {
              console.log('❌ Video still not ready after timeout');
              console.log('  - readyState:', video.readyState);
              console.log('  - videoWidth:', video.videoWidth);
              console.log('  - videoHeight:', video.videoHeight);
            }
          }
        }, 3000); // Wait 3 seconds after stream is set
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          message.error('Error loading video stream');
        };
      }
    } catch (error) {
      console.error('💥 Error accessing webcam:', error);
      console.error('🔍 Error name:', error.name);
      console.error('📝 Error message:', error.message);
      
      let errorMessage = 'Could not access webcam. ';
      
      if (error.name === 'NotAllowedError') {
        if (isFirefox) {
          errorMessage += 'Firefox: Please allow camera access in the address bar (camera icon) and refresh the page.';
        } else {
          errorMessage += 'Please allow camera access and refresh the page.';
        }
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera.';
      } else if (error.name === 'NotSupportedError') {
        if (isFirefox) {
          errorMessage += 'Firefox: Camera not supported. Try updating Firefox or use Chrome/Edge.';
        } else {
          errorMessage += 'Camera not supported in this browser. Try Chrome or Edge.';
        }
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Trying with basic settings...';
        // Try with basic constraints
        try {
          const basicConstraints = { video: true, audio: false };
          console.log('🔄 Retrying with basic constraints:', basicConstraints);
          const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          console.log('✅ Basic webcam stream obtained:', stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              console.log('📹 Basic video metadata loaded');
              setIsWebcamActive(true);
              startEmotionDetection();
            };
          }
          message.success('Webcam activated with basic settings!');
          return;
        } catch (retryError) {
          console.error('❌ Basic constraints also failed:', retryError);
          errorMessage += ' Basic settings also failed.';
        }
      } else {
        errorMessage += 'Please check permissions and try again.';
      }
      
      message.error(errorMessage);
    }
  };

  // Handle video upload
  const handleVideoUpload = (file) => {
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.srcObject = null;
      setIsWebcamActive(true);
      startEmotionDetection();
      message.success('Video uploaded successfully!');
    }
  };

  // Start emotion detection with Firefox compatibility
  const startEmotionDetection = () => {
    console.log('🚀 Starting emotion detection loop...');
    const detectEmotions = async () => {
      // Enhanced webcam status check
      const hasVideo = videoRef.current && videoRef.current.srcObject;
      const hasCanvas = canvasRef.current;
      const isVideoReady = videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0;
      
      console.log('🔍 Detection conditions:');
      console.log('  - hasVideo:', hasVideo);
      console.log('  - hasCanvas:', hasCanvas);
      console.log('  - isWebcamActive:', isWebcamActive);
      console.log('  - isVideoReady:', isVideoReady);
      
      // More aggressive webcam detection - try even if isWebcamActive is false
      if (hasVideo && hasCanvas && (isWebcamActive || isVideoReady)) {
        console.log('✅ Proceeding with emotion detection...');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;
        
        // Enhanced video check with more detailed logging
        console.log('🔍 Video state check:');
        console.log('  - readyState:', video.readyState, '(4=HAVE_ENOUGH_DATA)');
        console.log('  - videoWidth:', video.videoWidth);
        console.log('  - videoHeight:', video.videoHeight);
        console.log('  - isWebcamActive:', isWebcamActive);
        console.log('  - video.srcObject:', video.srcObject ? 'Present' : 'Missing');
        
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
          console.log('⏳ Video not ready, waiting... (readyState:', video.readyState, ')');
          setTimeout(detectEmotions, 1000);
          return;
        }
        
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8); // Lower quality for better performance
          console.log('🎥 Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('📊 Image data length:', imageData.length);
          console.log('🖼️ Image data preview:', imageData.substring(0, 50) + '...');
          
          // Enhanced image validation
          if (imageData.length < 100) {
            console.log('❌ Image data too small, skipping detection');
            setTimeout(detectEmotions, 2000);
            return;
          }
          
          const base64Data = imageData.split(',')[1];
          console.log('🔢 Base64 data length:', base64Data.length);
          console.log('📝 Base64 data preview:', base64Data.substring(0, 50) + '...');
          console.log('✅ Image data looks valid, proceeding with detection...');
          
          try {
            console.log('Sending emotion detection request...');
            const response = await fetch('http://localhost:8001/detect-emotion', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                image_data: base64Data,
                session_id: `session_${Date.now()}_${patientData?.id || 'anonymous'}`
              })
            });
            
            console.log('Emotion detection response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              
              // Always update emotion data
              setEmotionData(data);
              
              // Update mood based on detected emotion
              updateMoodFromEmotion(data.emotion);
              
              // Store face detection data for visual feedback
              setFaceDetectionData({
                emotion: data.emotion,
                confidence: data.confidence,
                timestamp: Date.now()
              });
            } else {
              console.error('❌ Emotion detection failed:', response.status, response.statusText);
              const errorText = await response.text();
              console.error('Error response:', errorText);
            }
          } catch (error) {
            console.error('💥 Emotion detection error:', error);
          }
        } catch (error) {
          console.error('💥 Canvas drawing error:', error);
        }
      } else {
        console.log('⏸️ Webcam not active or video not ready, skipping detection...');
        
        // Try to force activation if video is actually ready
        if (hasVideo && isVideoReady && !isWebcamActive) {
          console.log('🔄 Video is ready but webcam not marked active, forcing activation...');
          setIsWebcamActive(true);
          // Don't call startEmotionDetection here to avoid infinite loop
        }
      }
      
      if (isWebcamActive || (videoRef.current && videoRef.current.srcObject && videoRef.current.readyState >= 2)) {
        console.log('⏰ Scheduling next detection in 3 seconds...');
        setTimeout(detectEmotions, 3000); // Check every 3 seconds for better performance
      } else {
        console.log('⏹️ Webcam inactive, stopping detection loop');
        // Try to reinitialize webcam after 5 seconds
        setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject && !isWebcamActive) {
            console.log('🔄 Attempting to reactivate webcam...');
            const video = videoRef.current;
            if (video.readyState >= 2 && video.videoWidth > 0) {
              console.log('✅ Webcam is ready, reactivating...');
              setIsWebcamActive(true);
              startEmotionDetection();
            }
          }
        }, 5000);
      }
    };
    
    console.log('🎬 Calling detectEmotions for the first time...');
    detectEmotions();
  };

  // Update mood based on detected emotion
  const updateMoodFromEmotion = (emotion) => {
    const emotionToMood = {
      'Happy': 'happy',
      'Sad': 'sad', 
      'Angry': 'angry',
      'Fear': 'sad',
      'Surprise': 'neutral',
      'Disgust': 'sad',
      'Neutral': 'neutral'
    };
    
    const newMood = emotionToMood[emotion] || 'neutral';
    
    // Only update if mood actually changed
    if (currentMood !== newMood) {
      setCurrentMood(newMood);
      setMoodHistory(prev => [...prev, { mood: newMood, timestamp: Date.now() }]);
      setSessionStats(prev => ({ ...prev, moodChanges: prev.moodChanges + 1 }));
      
      // Update backend
      fetch('http://localhost:8001/update-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          mood: newMood
        })
      }).catch(err => console.log('Backend mood update failed:', err));
    }
  };

  // Send message to AI Therapist
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const chatData = {
        message: inputMessage,
        session_id: sessionId
      };
      
      console.log('💬 Sending chat message:', chatData);
      
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData)
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          mood: currentMood,
          crisis_detected: false
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Update session progress
        setSessionProgress(prev => Math.min(prev + 2, 100));
        setSessionStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));
        
      } else {
        throw new Error('Failed to get response from AI Therapist');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get mood icon
  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'happy': return <SmileOutlined style={{ color: '#667eea' }} />;
      case 'sad': return <FrownOutlined style={{ color: '#ff4d4f' }} />;
      case 'neutral': return <MehOutlined style={{ color: '#1890ff' }} />;
      default: return <MehOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Get mood color
  const getMoodColor = (mood) => {
    switch (mood) {
      case 'happy': return '#667eea';
      case 'sad': return '#ff4d4f';
      case 'neutral': return '#1890ff';
      default: return '#1890ff';
    }
  };

  // Save session
  const saveSession = async () => {
    console.log('💾 Save Session button clicked!');
    
    const sessionData = {
      patient_id: patientData?.id || 'anonymous',
      start_time: sessionStartTime.current,
      end_time: Date.now(),
      messages: messages,
      mood_history: moodHistory,
      emotion_data: emotionData,
      session_stats: sessionStats,
      crisis_detected: isCrisisMode
    };

    console.log('💾 Session data to save:', sessionData);

    try {
      console.log('💾 Sending request to backend...');
      const response = await fetch('http://localhost:8001/save-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });
      
      console.log('💾 Backend response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('💾 Backend response:', result);
        setSessionHistory(prev => [...prev, sessionData]);
        message.success('Session saved successfully!');
      } else {
        console.error('💾 Backend error:', response.status, response.statusText);
        message.error('Failed to save session - server error.');
      }
    } catch (error) {
      console.error('💾 Error saving session:', error);
      message.error('Failed to save session - network error.');
    }
  };

  // Load session history
  const loadSessionHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8001/session-history/${patientData?.id || 'anonymous'}`);
      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  // Initialize session
  useEffect(() => {
    if (isVisible) {
      sessionStartTime.current = Date.now();
      loadSessionHistory();
    }
  }, [isVisible]);

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        sessionDuration: Math.floor((Date.now() - sessionStartTime.current) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Modal
      title={
        <div className="ai-therapist-header">
          <BulbOutlined className="therapist-icon" />
          <span>AI Therapist - FIDO</span>
          {isCrisisMode && <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />}
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      width={1400}
      height={700}
      footer={null}
      className="ai-therapist-modal"
      destroyOnClose
    >
      <div className="ai-therapist-container">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="ai-therapist-tabs"
          tabBarStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: 0,
            borderRadius: '20px 20px 0 0',
            padding: '0 24px'
          }}
        >
          <TabPane 
            tab={
              <span className="tab-label">
                <CameraOutlined />
                Therapy Session
              </span>
            } 
            key="therapy"
          >
            <div className="therapy-tab-content">
              <Row gutter={16} style={{ height: '80vh', minHeight: '500px' }}>
                {/* Left Panel - Camera/Webcam */}
                <Col span={12}>
                  <Card className="camera-container" title="Emotion Detection">
                    {/* Webcam Section */}
                    <div className="webcam-section">
                      <div className="webcam-container">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="webcam-feed"
                          style={{ display: isWebcamActive ? 'block' : 'none' }}
                        />
                        <canvas
                          ref={canvasRef}
                          style={{ display: 'none' }}
                        />
                        {/* Face Detection Overlay */}
                        {isWebcamActive && faceDetectionData && (
                          <div className="face-detection-overlay">
                            <div className="face-box">
                              <div className="face-box-border"></div>
                              <div className="emotion-label">
                                {faceDetectionData.emotion}
                                <span className="confidence">
                                  ({Math.round(faceDetectionData.confidence * 100)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {isWebcamActive && !faceDetectionData && (
                          <div className="face-detection-overlay">
                            <div className="no-face-message">
                              <div className="no-face-text">Looking for face...</div>
                            </div>
                          </div>
                        )}
                        {!isWebcamActive && (
                          <div className="webcam-placeholder">
                            <CameraOutlined />
                            <p>Enable webcam for emotion detection</p>
                            <div className="webcam-buttons">
                              <Button 
                                type="primary" 
                                icon={<CameraOutlined />}
                                onClick={initializeWebcam}
                                className="webcam-btn"
                              >
                                Start Webcam
                              </Button>
                              <Upload
                                accept="video/*,image/*"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                  handleVideoUpload(file);
                                  return false;
                                }}
                              >
                                <Button 
                                  icon={<UploadOutlined />}
                                  className="upload-btn"
                                >
                                  Upload Video
                                </Button>
                              </Upload>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Mood Display */}
                      <div className="current-mood">
                        <Text strong>Current Mood: </Text>
                        <span style={{ color: getMoodColor(currentMood) }}>
                          {getMoodIcon(currentMood)} {currentMood.toUpperCase()}
                        </span>
                        {emotionData && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                            (Confidence: {Math.round(emotionData.confidence * 100)}%)
                          </span>
                        )}
                      </div>
                      
                    </div>
                  </Card>
                </Col>

                {/* Right Panel - Chat Interface */}
                <Col span={12}>
                  <Card className="chat-container" title="Chat with FIDO">
                    {/* Messages */}
                    <div className="messages-container">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                          <div className="message-content">
                            <div className="message-text">{msg.text}</div>
                            <div className="message-meta">
                              <span className="timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                              {msg.mood && (
                                <span className="message-mood">
                                  {getMoodIcon(msg.mood)}
                                </span>
                              )}
                              {msg.crisis_detected && (
                                <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="message ai">
                          <div className="message-content">
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Section */}
                    <div className="input-section">
                      <TextArea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Share your thoughts with FIDO..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        disabled={isLoading}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={sendMessage}
                        loading={isLoading}
                        disabled={!inputMessage.trim()}
                        className="send-button"
                      >
                        Send
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span className="tab-label">
                <ThunderboltOutlined />
                Session Analytics
              </span>
            } 
            key="analytics"
          >
            <div className="analytics-tab-content">
              <Row gutter={[24, 24]}>
                {/* Session Progress */}
                <Col span={8}>
                  <Card size="small" title="Session Progress" className="progress-card">
                    <Progress 
                      percent={sessionProgress} 
                      strokeColor={{
                        '0%': '#667eea',
                        '100%': '#764ba2',
                      }}
                      showInfo={false}
                    />
                    <Text type="secondary">
                      {sessionProgress}% Complete
                    </Text>
                  </Card>
                </Col>

                {/* Session Stats */}
                <Col span={8}>
                  <Card size="small" title="Session Statistics" className="stats-card">
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Statistic
                          title="Messages"
                          value={sessionStats.totalMessages}
                          prefix={<SendOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Duration"
                          value={Math.floor(sessionStats.sessionDuration / 60)}
                          suffix="min"
                          prefix={<ThunderboltOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Mood Changes"
                          value={sessionStats.moodChanges}
                          prefix={<HeartOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Crisis"
                          value={sessionStats.crisisDetected ? 'Yes' : 'No'}
                          valueStyle={{ color: sessionStats.crisisDetected ? '#ff4d4f' : '#667eea' }}
                          prefix={<WarningOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Mood History */}
                <Col span={8}>
                  <Card size="small" title="Mood History" className="mood-card">
                    <div className="mood-timeline">
                      {moodHistory.slice(-5).map((entry, index) => (
                        <div key={index} className="mood-entry">
                          <span className="mood-time">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="mood-icon" style={{ color: getMoodColor(entry.mood) }}>
                            {getMoodIcon(entry.mood)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {/* Session History */}
                <Col span={12}>
                  <Card size="small" title="Previous Sessions" className="history-card">
                    <List
                      size="small"
                      dataSource={sessionHistory.slice(-3)}
                      renderItem={(session, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<HistoryOutlined />} />}
                            title={`Session ${sessionHistory.length - index}`}
                            description={`${Math.floor(session.session_stats?.sessionDuration / 60) || 0} min • ${session.messages?.length || 0} messages`}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                {/* Action Buttons */}
                <Col span={12}>
                  <Card size="small" title="Session Actions" className="action-card">
                    <div className="action-buttons">
                      <Button 
                        type="primary" 
                        onClick={() => {
                          console.log('🔴 Save Session button clicked!');
                          saveSession();
                        }}
                        icon={<HeartOutlined />}
                        block
                        size="large"
                      >
                        Save Session
                      </Button>
                      <Button 
                        onClick={onClose}
                        icon={<CloseOutlined />}
                        block
                        size="large"
                        style={{ marginTop: 12 }}
                      >
                        Close Session
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </Modal>
  );
};

export default AITherapist;