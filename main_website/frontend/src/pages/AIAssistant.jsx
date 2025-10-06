import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Input, Button, Space, Avatar, Spin, message, Divider } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import api, { patientAPI } from '../services/api';
import './AIAssistant.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AIAssistant({ patientId }) {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [reports, setReports] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const messagesEndRef = useRef(null);

  // Use patientId prop or fallback to location
  const currentPatientId = patientId || location.state?.patientId || location.pathname.split('/').pop();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load patient data and reports
  useEffect(() => {
    loadPatientContext();
  }, [currentPatientId]);

  const loadPatientContext = async () => {
    try {
      setLoading(true);
      console.log('AIAssistant: Loading patient context for abhaId:', currentPatientId);
      
      if (!currentPatientId) {
        throw new Error('No patient ID (abhaId) provided');
      }
      
      // Use the correct AI Assistant endpoint
      const response = await patientAPI.getPatientContext(currentPatientId);
      console.log('AIAssistant: Patient context response:', response);
      
      if (response.success) {
        const { patientData, medicalHistory, prescriptions, reports } = response.data;
        
        setPatientData(patientData);
        setMedicalHistory(medicalHistory || []);
        setPrescriptions(prescriptions || []);
        setReports(reports || []);

        // Initialize chat with welcome message
        setMessages([{
          id: 1,
          type: 'ai',
          content: `Hello! I'm your AI Assistant for ${patientData?.name || 'the patient'}. I have access to ${reports?.length || 0} reports, ${medicalHistory?.length || 0} medical history entries, and ${prescriptions?.length || 0} prescriptions. How can I help you today?`,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(response.error || 'Failed to load patient context');
      }

    } catch (error) {
      console.error('Error loading patient context:', error);
      message.error('Failed to load patient data');
      setMessages([{
        id: 1,
        type: 'ai',
        content: 'Hello! I\'m your AI Assistant. I\'m having trouble loading the patient data, but I can still help with general questions.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Prepare patient context for AI
      const patientContext = {
        patientId: currentPatientId,
        patientData,
        medicalHistory,
        prescriptions,
        reports
      };

      const response = await patientAPI.chatWithAIAssistant({
        message: inputValue.trim(),
        patientContext,
        chatHistory: messages.slice(-10) // Last 10 messages for context
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response || 'I apologize, but I couldn\'t process your request at the moment.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
  };

  const handleNewChat = () => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: `Hello! I'm your AI Assistant for ${patientData?.name || 'the patient'}. I can help you analyze their medical records, reports, and health data. What would you like to know?`,
      timestamp: new Date()
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Summarize the patient's cardiac health.",
    "Are there any potential drug interactions?",
    "What was the outcome of the last MRI?",
    "What are the patient's current medications?",
    "Are there any concerning trends in recent lab results?",
    "What lifestyle recommendations would you suggest?"
  ];

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <div className="ai-assistant-title-section">
          <div className="ai-assistant-title">
            <RobotOutlined className="ai-assistant-icon" />
            <Title level={2} className="ai-assistant-title-text">AI Assistant Chat</Title>
          </div>
          <Text className="ai-assistant-subtitle">
            Ask about {patientData?.name || 'the patient'}'s complete record.
          </Text>
        </div>
        <Button 
          className="ai-assistant-new-chat-btn"
          icon={<DeleteOutlined />}
          onClick={handleNewChat}
        >
          New chat
        </Button>
      </div>

      <Card className="ai-assistant-chat-card">
        <div className="ai-assistant-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.type}`}>
              <div className="ai-message-avatar">
                {msg.type === 'ai' ? (
                  <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                ) : (
                  <Avatar icon={<UserOutlined />} className="user-avatar" />
                )}
              </div>
              <div className="ai-message-content">
                <div className="ai-message-bubble">
                  <Text>{msg.content}</Text>
                </div>
                <div className="ai-message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="ai-message ai">
              <div className="ai-message-avatar">
                <Avatar icon={<RobotOutlined />} className="ai-avatar" />
              </div>
              <div className="ai-message-content">
                <div className="ai-message-bubble ai-thinking">
                  <Spin size="small" />
                  <Text style={{ marginLeft: 8 }}>AI is analyzing patient data...</Text>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <Divider className="ai-assistant-divider" />

        <div className="ai-assistant-suggestions">
          <Text className="ai-assistant-suggestions-title">Suggested Questions:</Text>
          <div className="ai-assistant-suggestion-buttons">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                className="ai-assistant-suggestion-btn"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={loading}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        <div className="ai-assistant-input-section">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the patient's history... (AI analyzes uploaded reports and medical records)"
            className="ai-assistant-input"
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={loading}
            className="ai-assistant-send-btn"
            disabled={!inputValue.trim()}
          >
            Send
          </Button>
        </div>
      </Card>

      <Button className="ai-assistant-export-btn" icon={<DownloadOutlined />} />
    </div>
  );
}
