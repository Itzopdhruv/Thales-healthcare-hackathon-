import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Input, 
  Upload, 
  message, 
  Spin, 
  Typography, 
  Space,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  SendOutlined, 
  AudioOutlined,
  CameraOutlined, 
  FileTextOutlined,
  RobotOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { aiDoctorAPI } from '../services/api';
import './AIDoctorChatbot.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const AIDoctorChatbot = ({ isVisible, onClose }) => {
  const [isOpen, setIsOpen] = useState(isVisible || false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chatboxSize, setChatboxSize] = useState({ width: 420, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatboxRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  // Initialize Web Speech API
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          message.info('Listening... Speak now!');
        };
        
        recognitionInstance.onresult = (event) => {
          console.log('Speech recognition result:', event);
          const transcript = event.results[0][0].transcript;
          console.log('Transcript:', transcript);
          setTextInput(prev => prev + (prev ? ' ' : '') + transcript);
          message.success('Speech converted to text!');
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Speech recognition error occurred.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            case 'aborted':
              // User manually stopped, don't show error
              console.log('Speech recognition aborted by user');
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          if (event.error !== 'aborted') {
            message.error(errorMessage);
          }
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
        console.log('Speech recognition initialized successfully');
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setRecognition(null);
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
      setRecognition(null);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (recognition) {
        recognition.stop();
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [recognition, mediaRecorder, isRecording]);

  // Resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !chatboxRef.current || !resizeDirection) return;
      
      const rect = chatboxRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newWidth = chatboxSize.width;
      let newHeight = chatboxSize.height;
      
      // Handle different resize directions
      switch (resizeDirection) {
        case 'nw': // Top-left
          newWidth = Math.max(300, Math.min(800, viewportWidth - e.clientX - 30));
          newHeight = Math.max(400, Math.min(800, e.clientY - 50));
          break;
        case 'ne': // Top-right
          newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
          newHeight = Math.max(400, Math.min(800, e.clientY - 50));
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(300, Math.min(800, viewportWidth - e.clientX - 30));
          newHeight = Math.max(400, Math.min(800, e.clientY - rect.top));
          break;
        case 'se': // Bottom-right
          newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
          newHeight = Math.max(400, Math.min(800, e.clientY - rect.top));
          break;
      }
      
      setChatboxSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, chatboxSize]);

  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleClose = () => {
    // Stop any active recording/listening before closing
    if (isListening && recognition) {
      recognition.stop();
    }
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsOpen(false);
    onClose && onClose();
  };


  const handleImageUpload = (file) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      message.success('Image file uploaded successfully');
      return false; // Prevent default upload behavior
    } else {
      message.error('Please upload an image file');
      return false;
    }
  };

  const startListening = () => {
    if (recognition && !isListening && !isRecording) {
      try {
        console.log('Starting speech recognition...');
        recognition.start();
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        message.error('Could not start speech recognition. Please try again.');
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      console.log('Stopping speech recognition...');
      setIsListening(false); // Immediately update state
      recognition.stop();
    }
  };

  const handleAudioButtonClick = () => {
    console.log('Audio button clicked. States:', { 
      isListening, 
      isRecording, 
      hasRecognition: !!recognition,
      speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    });
    
    if (isListening) {
      stopListening();
    } else if (isRecording) {
      stopRecording();
    } else {
      // Check if Web Speech API is supported
      if (recognition) {
        console.log('Using Web Speech API');
        startListening();
      } else {
        console.log('Using audio recording fallback');
        // Check if we can access microphone
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          startAudioRecording();
        } else {
          message.info('Microphone not available. Please type your question instead.');
          // Focus on the text input
          const textArea = document.querySelector('.medical-textarea');
          if (textArea) {
            textArea.focus();
          }
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('Stopping audio recording...');
      setIsRecording(false); // Immediately update state
      mediaRecorder.stop();
    }
  };

  // Fallback method: Record audio and send to FastAPI for transcription
  const startAudioRecording = async () => {
    try {
      console.log('Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('Audio recording stopped, processing...');
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
          
          console.log('Audio file created, size:', audioBlob.size);
          
          // Convert to base64 and send for transcription
          const base64Audio = await convertFileToBase64(audioFile);
          console.log('Audio converted to base64, length:', base64Audio.length);
          
          const response = await aiDoctorAPI.analyzeMedicalInput({
            audioFile: base64Audio
          });
          
          console.log('Transcription response:', response);
          
          if (response.success && response.data.speech_to_text) {
            setTextInput(prev => prev + (prev ? ' ' : '') + response.data.speech_to_text);
            message.success('Speech converted to text!');
          } else {
            message.warning('Could not convert speech to text. Please try again.');
          }
        } catch (transcriptionError) {
          console.error('Transcription error:', transcriptionError);
          message.error('Failed to convert speech to text.');
        } finally {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setMediaRecorder(null);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        message.error('Recording error occurred.');
        setIsRecording(false);
        setMediaRecorder(null);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      message.info('Recording started... Speak now!');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      message.error('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Test function to check speech recognition
  const testSpeechRecognition = () => {
    console.log('Testing speech recognition...');
    console.log('SpeechRecognition available:', !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    console.log('Recognition instance:', !!recognition);
    console.log('MediaDevices available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      message.success('Speech recognition is supported in this browser!');
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      message.info('Speech recognition not supported, but microphone access is available for audio recording.');
    } else {
      message.warning('Neither speech recognition nor microphone access is available. Please type your questions.');
    }
  };

  const playAudio = (audioBlob) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    
    const audio = new Audio(URL.createObjectURL(audioBlob));
    setCurrentAudio(audio);
    
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
    
    audio.play();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!textInput.trim() && !imageFile) {
      message.warning('Please provide some input (text or image)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare request data
      const requestData = {
        textInput: textInput.trim() || null
      };
      
      // Convert image file to base64 if provided
      if (imageFile) {
        requestData.imageFile = await convertFileToBase64(imageFile);
        console.log('Image file converted to base64, length:', requestData.imageFile.length);
      }
      
      console.log('Sending request data:', {
        hasTextInput: !!requestData.textInput,
        hasImageFile: !!requestData.imageFile
      });

      // Add user message to conversation
      const userMessage = {
        type: 'user',
        content: textInput.trim() || (imageFile ? 'Image message' : 'Text message'),
        timestamp: new Date().toLocaleTimeString(),
        hasImage: !!imageFile
      };
      
      setConversation(prev => [...prev, userMessage]);

      // Add AI generating message
      const generatingMessage = {
        type: 'doctor',
        content: '🤖 AI is generating response...',
        timestamp: new Date().toLocaleTimeString(),
        isGenerating: true
      };
      
      setConversation(prev => [...prev, generatingMessage]);

      // Call AI Doctor API
      const response = await aiDoctorAPI.analyzeMedicalInput(requestData);
      
      console.log('AI Doctor Response:', response);
      
      if (response.success) {
        const doctorMessage = {
          type: 'doctor',
          content: response.data.doctor_response,
          speechToText: response.data.speech_to_text,
          timestamp: new Date().toLocaleTimeString(),
          hasAudio: !!response.data.audio_response_url
        };
        
        console.log('Doctor message created:', doctorMessage);
        console.log('Audio response URL:', response.data.audio_response_url);
        
        // Replace the generating message with the actual response
        setConversation(prev => {
          const newConversation = [...prev];
          // Remove the last message (generating message) and add the real response
          newConversation[newConversation.length - 1] = doctorMessage;
          return newConversation;
        });
        
        // If there's an audio response, fetch and prepare it
        if (response.data.audio_response_url) {
          try {
            console.log('Fetching audio response...');
            const audioFilename = response.data.audio_response_url.split('/').pop();
            console.log('Audio filename:', audioFilename);
            const audioBlob = await aiDoctorAPI.getAudioResponse(audioFilename);
            console.log('Audio blob received:', audioBlob);
            doctorMessage.audioBlob = audioBlob;
            setConversation(prev => [...prev.slice(0, -1), doctorMessage]);
            message.success('AI Doctor analysis completed with audio response');
          } catch (audioError) {
            console.error('Error fetching audio response:', audioError);
            message.warning('Text response received, but audio could not be loaded');
          }
        } else {
          message.success('AI Doctor analysis completed');
        }
      } else {
        // Replace generating message with error message
        const errorMessage = {
          type: 'doctor',
          content: `❌ ${response.message || 'Analysis failed'}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        };
        
        setConversation(prev => {
          const newConversation = [...prev];
          newConversation[newConversation.length - 1] = errorMessage;
          return newConversation;
        });
        
        message.error(response.message || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('AI Doctor error:', error);
      
      // Replace generating message with error message
      const errorMessage = {
        type: 'doctor',
        content: '❌ Failed to analyze input. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      
      setConversation(prev => {
        const newConversation = [...prev];
        newConversation[newConversation.length - 1] = errorMessage;
        return newConversation;
      });
      
      message.error('Failed to analyze input. Please try again.');
    } finally {
      setIsLoading(false);
      // Clear inputs
      setTextInput('');
      setImageFile(null);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="ai-doctor-chatbot"
      ref={chatboxRef}
      style={{
        width: `${chatboxSize.width}px`,
        height: `${chatboxSize.height}px`,
        minWidth: '300px',
        maxWidth: '800px',
        minHeight: '400px',
        maxHeight: '800px'
      }}
    >
      <Card 
        className="chatbot-card"
        title={
          <div className="chatbot-header">
            <Space>
              <RobotOutlined className="ai-icon" />
              <Title level={5} style={{ margin: 0, color: '#262626' }}>
                AI Doctor
              </Title>
            </Space>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={handleClose}
              className="close-btn"
            />
          </div>
        }
        extra={
          <Space>
            <Button 
              type="link" 
              onClick={testSpeechRecognition}
              size="small"
              className="test-btn"
            >
              Test Speech
            </Button>
            <Button 
              type="link" 
              onClick={clearConversation}
              size="small"
              className="clear-btn"
            >
              Clear Chat
            </Button>
          </Space>
        }
      >
        {/* Conversation Area */}
        <div className="conversation-area">
          {/* Emergency Disclaimer - Always visible */}
          <div className="emergency-disclaimer">
            <Text className="disclaimer-text">
              ⚠️ <strong>EMERGENCY USE ONLY</strong> - AI can make mistakes. Always cross-check with real doctors!
            </Text>
          </div>
          
          {conversation.length === 0 ? (
            <div className="welcome-message">
              <Text type="secondary">
                👋 Hi! I'm your AI Doctor. You can ask me questions by typing, 
                speaking, or uploading an image. How can I help you today?
              </Text>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-header">
                  <Text strong>{msg.type === 'user' ? 'You' : 'AI Doctor'}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {msg.timestamp}
                  </Text>
                </div>
                <div className={`message-content ${msg.isGenerating ? 'is-generating' : ''} ${msg.isError ? 'is-error' : ''}`}>
                  {msg.speechToText && (
                    <div className="speech-to-text">
                      <Text type="secondary" italic>
                        "Heard: {msg.speechToText}"
                      </Text>
                    </div>
                  )}
                  <Text>
                    {msg.content}
                    {msg.isGenerating && <span className="generating-dots"></span>}
                  </Text>
                  {msg.hasAudio && msg.audioBlob && (
                    <div className="audio-controls">
                      <Button
                        type="text"
                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => isPlaying ? stopAudio() : playAudio(msg.audioBlob)}
                        size="small"
                      >
                        {isPlaying ? 'Pause' : 'Play'} Audio Response
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Divider />

        {/* Input Area */}
        <div className="input-area">
          <div className="text-input-section">
            <TextArea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your medical question here..."
              rows={3}
              disabled={isLoading}
              className="medical-textarea"
            />
          </div>
          
          <div className="input-controls">
            <div className="upload-buttons-row">
              <Button 
                className={`upload-btn audio-btn ${(isListening || isRecording) ? 'recording' : ''}`}
                disabled={isLoading}
                onClick={handleAudioButtonClick}
              >
                <AudioOutlined />
                {(isListening || isRecording) ? 'Stop' : 'Voice'}
              </Button>
              
              <Upload
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button 
                  icon={<CameraOutlined />} 
                  className={`upload-btn image-btn ${imageFile ? 'active' : ''}`}
                  disabled={isLoading}
                >
                  {imageFile ? 'Image Ready' : 'Image'}
                </Button>
              </Upload>
              
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={isLoading}
                className="send-btn"
                size="large"
              >
                Send
              </Button>
            </div>
          </div>
          
          {/* File Status */}
          {imageFile && (
            <div className="file-status">
              <Space wrap>
                {imageFile && (
                  <div className="file-item">
                    <CameraOutlined className="file-icon" />
                    <Text type="success">{imageFile.name}</Text>
                  </div>
                )}
              </Space>
            </div>
          )}
        </div>
      </Card>
      
      {/* Resize Handles - All Four Corners */}
      
      {/* Top Left */}
      <div 
        className="resize-handle resize-nw"
        onMouseDown={(e) => handleResizeStart(e, 'nw')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          cursor: 'nw-resize',
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          borderRadius: '12px 0 0 0',
          zIndex: 1001
        }}
      >
        <div className="resize-arrow-nw" />
      </div>

      {/* Top Right */}
      <div 
        className="resize-handle resize-ne"
        onMouseDown={(e) => handleResizeStart(e, 'ne')}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'ne-resize',
          background: 'linear-gradient(225deg, #52c41a 0%, #73d13d 100%)',
          borderRadius: '0 12px 0 0',
          zIndex: 1001
        }}
      >
        <div className="resize-arrow-ne" />
      </div>

      {/* Bottom Left */}
      <div 
        className="resize-handle resize-sw"
        onMouseDown={(e) => handleResizeStart(e, 'sw')}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '20px',
          height: '20px',
          cursor: 'sw-resize',
          background: 'linear-gradient(45deg, #52c41a 0%, #73d13d 100%)',
          borderRadius: '0 0 0 12px',
          zIndex: 1001
        }}
      >
        <div className="resize-arrow-sw" />
      </div>

      {/* Bottom Right */}
      <div 
        className="resize-handle resize-se"
        onMouseDown={(e) => handleResizeStart(e, 'se')}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'se-resize',
          background: 'linear-gradient(315deg, #52c41a 0%, #73d13d 100%)',
          borderRadius: '0 0 12px 0',
          zIndex: 1001
        }}
      >
        <div className="resize-arrow-se" />
      </div>
    </div>
  );
};

export default AIDoctorChatbot;
