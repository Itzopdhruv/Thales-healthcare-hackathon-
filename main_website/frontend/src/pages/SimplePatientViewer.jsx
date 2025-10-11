import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Button, 
  Modal, 
  Input, 
  Form, 
  message, 
  Typography, 
  Select,
  Space,
  Row,
  Col,
  Tag,
  Spin,
  Checkbox,
  Upload,
  Progress,
  Input as AntInput,
  Avatar,
  List,
  Empty,
  Tooltip
} from 'antd';
import { 
  LockOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  MessageOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Collapse } from 'antd';
import api from '../services/api';
import NationalHealthPulse from './NationalHealthPulse';
import AIAssistant from './AIAssistant';
import HealthMetricsForm from '../components/HealthMetricsForm';
import './MedicalHistoryModal.css';

const { Title, Text } = Typography;
const { Option } = Select;

const SimplePatientViewer = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  
  // Modal states
  const [durationModalVisible, setDurationModalVisible] = useState(true);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [addEntryModalVisible, setAddEntryModalVisible] = useState(false);
  const [addPrescriptionModalVisible, setAddPrescriptionModalVisible] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatToggleVisible, setChatToggleVisible] = useState(false);
  const [selectedReportForChat, setSelectedReportForChat] = useState(null);
  
  
  // Form states
  const [duration, setDuration] = useState(24);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Medication form states
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', nextRefill: '' }
  ]);
  
  // Data states
  const [patient, setPatient] = useState({ age: 'N/A', gender: 'N/A', bloodType: 'N/A' });
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'prescriptions', or 'reports'
  
  // Form instances
  const [addEntryForm] = Form.useForm();
  const [addPrescriptionForm] = Form.useForm();
  const [uploadReportForm] = Form.useForm();

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('Please log in to access patient records');
    navigate('/login');
    return null;
  }

  // Medication management functions
  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', nextRefill: '' }]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };

  const handleDurationSubmit = () => {
    console.log('Duration selected:', duration);
    setDurationModalVisible(false);
    setOtpModalVisible(true);
  };

  const handleOtpSubmit = () => {
    if (otp === '081106') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOtpModalVisible(false);
        setAccessGranted(true);
        message.success('Access granted!');
        fetchPatientData();
      }, 1000);
    } else {
      message.error('Invalid OTP. Please enter 081106');
    }
  };

  const fetchPatientData = async () => {
    try {
      setDataLoading(true);
      console.log('Fetching data for patient:', patientId);
      
      // Fetch patient details
      try {
        const patientResponse = await api.get(`/patient/lookup/${patientId}`);
        console.log('Patient response:', patientResponse.data);
        if (patientResponse.data.success) {
          const p = patientResponse.data.data.patient || {};
          // Normalize fields so Emergency Mode can read consistent keys
          const mappedPatient = {
            ...p,
            name: p.name || p.fullName || p.profile?.fullName,
            bloodType: p.bloodType || p.profile?.bloodType,
            allergies: p.allergies || p.profile?.allergies || [],
            existingMedicalConditions:
              p.existingMedicalConditions ||
              p.profile?.medicalConditions ||
              p.chronicConditions || [],
            emergencyContact:
              p.emergencyContact ||
              p.profile?.emergencyContact ||
              null,
          };
          setPatient(mappedPatient);
        } else {
          console.log('Patient not found, using fallback data');
          // Use fallback data if patient not found
          setPatient({
            name: 'Tanish Kumar',
            abhaId: patientId,
            profile: {
              age: 20,
              gender: 'male',
              bloodType: 'AB+'
            }
          });
        }
      } catch {
        console.log('Patient lookup failed, using fallback data');
        setPatient({
          name: 'Tanish Kumar',
          abhaId: patientId,
          profile: {
            age: 20,
            gender: 'male',
            bloodType: 'AB+'
          }
        });
      }

      // Fetch medical history
      try {
        const historyResponse = await api.get(`/medical-history/${patientId}`);
        console.log('Medical history response:', historyResponse.data);
        if (historyResponse.data.success) {
          setMedicalHistory(historyResponse.data.data.entries);
        }
      } catch (historyError) {
        console.log('Medical history fetch failed:', historyError);
        // Set some sample data for demonstration
        setMedicalHistory([
          {
            entryType: 'consultation',
            date: '2025-09-21T00:00:00.000Z',
            summary: 'Patient visited for routine checkup and was diagnosed with mild fever',
            consultingDoctor: 'Dr. Aarogya',
            hospitalClinicName: 'AayuLink Digital Clinic',
            diagnosis: { primary: 'Viral Fever' },
            medications: []
          }
        ]);
      }

      // Fetch prescriptions
      try {
        const prescriptionResponse = await api.get(`/prescription/${patientId}`);
        console.log('Prescription response:', prescriptionResponse.data);
        if (prescriptionResponse.data.success) {
          setPrescriptions(prescriptionResponse.data.data.prescriptions);
        }
      } catch (prescriptionError) {
        console.log('Prescription fetch failed:', prescriptionError);
        // Set some sample data for demonstration
        setPrescriptions([
          {
            prescriptionId: '1E614E',
            issuedDate: '2025-09-21T00:00:00.000Z',
            doctor: { name: 'Dr. Aarogya' },
            hospitalClinic: { name: 'AayuLink Digital Clinic' },
            diagnosis: { primary: 'Viral Fever' },
            medications: [
              { name: 'Ilabxo', dosage: '200mg', frequency: 'Twice daily' }
            ],
            status: 'pending'
          }
        ]);
      }

      // Fetch reports
      try {
        const reportsResponse = await api.get(`/reports/patient/${patientId}`);
        console.log('Reports response:', reportsResponse.data);
        if (reportsResponse.data.success) {
          setReports(reportsResponse.data.data.reports);
        }
      } catch (reportsError) {
        console.log('Reports fetch failed:', reportsError);
        // Set some sample data for demonstration
        setReports([
          {
            _id: '1',
            title: 'Blood Test Report',
            documentType: 'lab_report',
            uploadedAt: '2025-09-21T00:00:00.000Z',
            ocrData: {
              processingStatus: 'completed',
              confidence: 0.95
            },
            originalFileName: 'blood_test_2025.pdf',
            fileSize: 245760
          }
        ]);
      }

    } catch (error) {
      console.error('Error fetching patient data:', error);
      message.error('Failed to fetch patient data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddEntry = async (values) => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please log in to add medical history entries');
        navigate('/login');
        return;
      }
      
      const entryData = {
        abhaId: patientId,
        entryType: values.entryType,
        date: values.date.toISOString(),
        summary: values.summary,
        consultingDoctor: values.consultingDoctor,
        hospitalClinicName: values.hospitalClinicName,
        diagnosis: {
          primary: values.diagnosis || ''
        },
        medications: values.medications || []
      };

      const response = await api.post('/medical-history/create', entryData);
      
      if (response.data.success) {
        message.success('Medical history entry added successfully!');
        setAddEntryModalVisible(false);
        addEntryForm.resetFields();
        fetchPatientData(); // Refresh data
      } else {
        message.error(response.data.message || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding medical history entry:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('Please log in again');
        navigate('/login');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        message.error(`Validation Error: ${errorMessage}`);
      } else {
        message.error('Failed to add medical history entry');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = async (values) => {
    try {
      setLoading(true);
      
      // Filter out empty medications and prepare structured data
      const medicationsArray = medications
        .filter(med => med.name.trim() !== '')
        .map(med => ({
          name: med.name.trim(),
          dosage: med.dosage.trim() || 'As directed',
          frequency: med.frequency.trim() || 'As directed',
          nextRefill: med.nextRefill.trim() || null
        }));
      
      const prescriptionData = {
        abhaId: patientId,
        issuedDate: values.issuedDate.toISOString(),
        doctor: {
          name: values.doctorName,
          specialization: values.specialization || 'General Medicine',
          licenseNumber: values.licenseNumber || ''
        },
        hospitalClinic: {
          name: values.hospitalName,
          address: values.hospitalAddress || ''
        },
        diagnosis: {
          primary: values.primaryDiagnosis,
          secondary: values.secondaryDiagnosis ? [values.secondaryDiagnosis] : []
        },
        medications: medicationsArray,
        instructions: {
          general: values.instructions || ''
        },
        totalAmount: parseFloat(values.totalAmount) || 0,
        insuranceCovered: values.insuranceCovered || false,
        status: values.status || 'pending'
      };

      const response = await api.post('/prescription/create', prescriptionData);
      
      if (response.data.success) {
        message.success('Prescription created successfully!');
        setAddPrescriptionModalVisible(false);
        addPrescriptionForm.resetFields();
        setMedications([{ name: '', dosage: '', frequency: '', nextRefill: '' }]); // Reset medications
        fetchPatientData(); // Refresh data
        // Broadcast event so patient dashboard can reload meds without full refresh
        window.dispatchEvent(new CustomEvent('prescriptionCreated', { detail: { abhaId: patientId } }));
      } else {
        message.error(response.data.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('Please log in again');
        navigate('/login');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        const errors = error.response?.data?.errors;
        if (errors && errors.length > 0) {
          message.error(`Validation Error: ${errors[0].msg}`);
        } else {
          message.error(`Validation Error: ${errorMessage}`);
        }
      } else {
        message.error('Failed to create prescription');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (values) => {
    try {
      console.log('Upload report form submitted with values:', values);
      setLoading(true);
      
      // Check if file is selected
      if (!values.file || !Array.isArray(values.file) || values.file.length === 0) {
        console.log('No file selected');
        message.error('Please select a file to upload');
        setLoading(false);
        return;
      }
      
      const file = values.file[0].originFileObj || values.file[0];
      console.log('File selected:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('abhaId', patientId);
      formData.append('documentType', values.documentType);
      formData.append('title', values.title);
      formData.append('description', values.description || '');

      const response = await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        message.success('Report uploaded successfully! Processing OCR...');
        setShowUploadInterface(false);
        uploadReportForm.resetFields();
        fetchPatientData(); // Refresh data to show new report
        
        // Show chat toggle and open chat modal after successful upload
        setChatToggleVisible(true);
        setTimeout(() => {
          setChatModalVisible(true);
          setChatMessages([{
            id: 1,
            type: 'ai',
            content: `Hello! I've analyzed your uploaded ${values.documentType.replace('_', ' ')} report. I can help you understand the medical information, answer questions about the findings, or explain any terms you're not familiar with. What would you like to know?`,
            timestamp: new Date()
          }]);
        }, 1000);
      } else {
        message.error(response.data.message || 'Failed to upload report');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('Please log in again');
        navigate('/login');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        message.error(`Upload Error: ${errorMessage}`);
      } else {
        message.error('Failed to upload report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please log in to view reports');
        navigate('/login');
        return;
      }
      
      console.log('🔍 Viewing report:', reportId);
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      // Use the proxy URL instead of direct backend URL
      const viewUrl = `/api/reports/${reportId}/view`;
      
      // Create a form to submit with token
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = viewUrl;
      form.target = '_blank';
      
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = token;
      form.appendChild(tokenInput);
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      message.success('Opening report in new tab...');
    } catch (error) {
      console.error('Error viewing report:', error);
      message.error('Failed to view report. Please check your login status.');
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please log in to download reports');
        navigate('/login');
        return;
      }
      
      console.log('📥 Downloading report:', reportId);
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      console.log('📥 Download response:', response.status, response.headers);
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `report_${reportId}.pdf`;
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('Report downloaded successfully!');
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('Please log in again to download reports');
        navigate('/login');
      } else if (error.response?.status === 404) {
        message.error('Report not found or file missing');
      } else if (error.response?.status === 403) {
        message.error('You do not have permission to download this report');
      } else {
        message.error('Failed to download report. Please try again.');
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please log in to delete reports');
        navigate('/login');
        return;
      }
      
      console.log('🗑️ Deleting report:', reportId);
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this report? This action cannot be undone.');
      if (!confirmed) {
        return;
      }
      
      const response = await api.delete(`/reports/${reportId}`);
      
      console.log('🗑️ Delete response:', response.data);
      
      if (response.data.success) {
        message.success('Report deleted successfully!');
        fetchPatientData(); // Refresh data
      } else {
        message.error(response.data.message || 'Failed to delete report');
      }
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        message.error('Please log in again to delete reports');
        navigate('/login');
      } else if (error.response?.status === 404) {
        message.error('Report not found');
      } else if (error.response?.status === 403) {
        message.error('You do not have permission to delete this report');
      } else {
        message.error('Failed to delete report. Please try again.');
      }
    }
  };

  const handleAskAIAboutReport = async (report) => {
    if (chatLoading) return; // prevent double click
    try {
      // Set the selected report
      setSelectedReportForChat(report);
      
      // Open chat modal
      setChatModalVisible(true);
      
      // Generate initial AI summary message
      setChatLoading(true);
      console.log('[AskAI] starting for report', report?._id);
      message.loading({ content: 'Generating AI summary...', key: 'askai', duration: 0 });
      
      // Ask backend to summarize with Gemini
      const resp = await api.post('/reports/chat', {
        message: 'Summarize this report in simple terms.',
        patientId: patientId,
        reportContext: '',
        chatHistory: [],
        reportId: report._id,
      }, { timeout: 120000 });

      // Debug: print full AI payload and message
      console.log('[AskAI] raw response.data =', resp?.data);
      console.log('[AskAI] message =', resp?.data?.message);

      const aiMessage = {
        id: 1,
        type: 'ai',
        content: resp?.data?.message || 'AI summary unavailable.',
        timestamp: new Date()
      };

      setChatMessages([aiMessage]);
      setChatLoading(false);
      message.success({ content: 'AI summary ready', key: 'askai' });
      console.log('[AskAI] success');
      
    } catch (error) {
      console.error('Error initializing AI chat:', error);
      message.error({ content: `AI chat failed: ${error?.message || 'Unknown error'}`, key: 'askai' });
      console.log('[AskAI] failed', error);
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      // Use selected report for context, or fall back to latest report
      const contextReport = selectedReportForChat || reports[reports.length - 1];
      const reportContext = contextReport ? `
        Patient: ${patient?.name || 'Unknown'}
        Report Title: ${contextReport.title}
        Document Type: ${contextReport.documentType}
        Uploaded: ${new Date(contextReport.uploadedAt).toLocaleDateString()}
        OCR Status: ${contextReport.ocrData?.processingStatus || 'Unknown'}
        File Name: ${contextReport.originalFileName}
        ${contextReport.ocrData?.structuredData ? `Extracted Data: ${JSON.stringify(contextReport.ocrData.structuredData, null, 2)}` : ''}
        ${contextReport.description ? `Description: ${contextReport.description}` : ''}
      ` : '';
      
      const response = await api.post('/reports/chat', {
        message: chatInput,
        patientId: patientId,
        reportContext: reportContext,
        chatHistory: chatMessages.slice(-5) // Last 5 messages for context
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.message,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again. Please make sure you\'re asking health-related questions about the uploaded report.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  if (accessGranted) {
    return (
      <>
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {/* Header */}
        <Layout.Header style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', 
          padding: '0 24px', 
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          borderBottom: '1px solid #e8f4fd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>AL</span>
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: 'white', fontWeight: '600' }}>AayuLink</Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                  Viewing Records For <span style={{ color: 'white', fontWeight: '500' }}>{patient?.name || 'Patient'}</span>
                </Text>
              </div>
            </div>
            <Space>
              <Button 
                onClick={() => navigate('/admin-dashboard')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: '500',
                  position: 'relative',
                  top: '-20px'
                }}
                hoverStyle={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: 'white'
                }}
              >
                Back to Dashboard
              </Button>
            </Space>
          </div>
        </Layout.Header>

        <Layout>
          {/* Sidebar */}
          <Layout.Sider width={280} style={{ 
            background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)', 
            padding: '24px',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            borderRight: '1px solid #e8e8e8'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <Title level={4} style={{ 
                color: '#667eea', 
                marginBottom: '16px', 
                fontSize: '16px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Navigation</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  style={{ 
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    border: activeTab === 'history' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    boxShadow: activeTab === 'history' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'history' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'history' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => {
                    setActiveTab('history');
                    message.success('Switched to Medical History view');
                  }}
                >
                  <Text strong style={{ 
                    color: '#ffffff', 
                    fontSize: '15px',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>📋 Patient History</Text>
                </div>
                <div
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: activeTab === 'emergency' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === 'emergency' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'emergency' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'emergency' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => setActiveTab('emergency')}
                >
                  <Text style={{ 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>🚨 Emergency Mode</Text>
                </div>
                <div 
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: activeTab === 'ai-assistant' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === 'ai-assistant' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'ai-assistant' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'ai-assistant' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => setActiveTab('ai-assistant')}
                >
                  <Text style={{ 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>🧠 AI Assistant</Text>
                </div>
                <div 
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: activeTab === 'health-metrics' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === 'health-metrics' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'health-metrics' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'health-metrics' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => {
                    setActiveTab('health-metrics');
                    message.success('Switched to Health Metrics view');
                  }}
                >
                  <Text strong style={{ 
                    color: '#ffffff', 
                    fontSize: '15px',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>❤️ Health Metrics</Text>
                </div>
                {/* Removed duplicate 'Reports & Scans' button to avoid two tabs */}
                {/* <div 
                  style={{ 
                    padding: '14px 16px', 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.transform = 'translateX(0)';
                  }}
                  onClick={() => message.info('Reports & Scans - Feature coming soon!')}
                >
                  <Text style={{ fontSize: '14px' }}>📄 Reports & Scans</Text>
                </div> */}
                <div 
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: activeTab === 'prescriptions' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === 'prescriptions' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'prescriptions' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'prescriptions' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => {
                    setActiveTab('prescriptions');
                    message.success('Switched to Prescriptions view');
                  }}
                >
                  <Text style={{ 
                    fontSize: '15px',
                    color: '#ffffff',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>💊 e-Prescriptions</Text>
                </div>

                <div 
                  style={{ 
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: activeTab === 'reports' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === 'reports' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateX(6px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = activeTab === 'reports' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(102, 126, 234, 0.2)';
                    e.target.style.border = activeTab === 'reports' 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={() => {
                    setActiveTab('reports');
                    message.success('Switched to Reports view');
                  }}
                >
                  <Text style={{ 
                    fontSize: '15px',
                    color: '#ffffff',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>📄 Reports & Scans</Text>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Title level={5} style={{ 
                color: '#667eea', 
                fontSize: '12px', 
                marginBottom: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>SYSTEM TOOLS</Title>
              <div 
                style={{ 
                  padding: '16px 20px', 
                  cursor: 'pointer',
                  borderRadius: '16px',
                  transition: 'all 0.4s ease',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: activeTab === 'nhp' 
                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: activeTab === 'nhp' 
                    ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                    : '0 4px 15px rgba(102, 126, 234, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateX(0) scale(1)';
                  e.target.style.boxShadow = activeTab === 'nhp' 
                    ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                    : '0 4px 15px rgba(102, 126, 234, 0.2)';
                  e.target.style.border = activeTab === 'nhp' 
                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                    : '2px solid rgba(255, 255, 255, 0.2)';
                }}
                onClick={() => setActiveTab('nhp')}
              >
                <Text style={{ 
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>🌐 National Health Pulse</Text>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div 
                style={{ 
                  padding: '16px 20px', 
                  cursor: 'pointer',
                  borderRadius: '16px',
                  transition: 'all 0.4s ease',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateX(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
                  e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                }}
                onClick={() => message.info('Switch Patient - Feature coming soon!')}
              >
                <Text style={{ 
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>👥 Switch Patient</Text>
              </div>
              <div 
                style={{ 
                  padding: '16px 20px', 
                  cursor: 'pointer',
                  borderRadius: '16px',
                  transition: 'all 0.4s ease',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateX(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
                  e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                }}
                onClick={() => {
                  message.success('Logging out...');
                  navigate('/admin-dashboard');
                }}
              >
                <Text style={{ 
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>🚪 Logout</Text>
              </div>
            </div>
          </Layout.Sider>

          {/* Main Content */}
          <Layout.Content style={{ padding: '24px', background: '#f0f2f5' }}>
            {/* Patient Details - Hidden for National Health Pulse and AI Assistant tabs */}
            {activeTab !== 'nhp' && activeTab !== 'ai-assistant' && (<Card style={{ 
              marginBottom: 24,
              borderRadius: 20,
              boxShadow: '0 10px 30px rgba(82,196,26,0.15)',
              border: '1px solid #d9f7be',
              background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}>
                  <Text style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    {patient?.name?.charAt(0) || 'P'}
                  </Text>
                </div>
                <div>
                  <Title level={2} style={{ color: '#52c41a', margin: 0, fontSize: '28px' }}>
                    {patient?.name || 'Loading...'}
                  </Title>
                  <Text style={{ color: '#666', fontSize: '16px' }}>
                    Patient ID: {patient?.abhaId || patientId}
                  </Text>
                </div>
              </div>
              
              <Row gutter={[24, 16]}>
                <Col span={6}>
                  <div style={{ 
                    background: 'linear-gradient(180deg, #ffffff 0%, #f6ffed 100%)', 
                    padding: '16px', 
                    borderRadius: 16,
                    border: '1px solid #d9f7be',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#389e0d', fontSize: 12, display: 'block', marginBottom: 4 }}>AGE</Text>
                    <Text strong style={{ color: '#52c41a', fontSize: 20 }}>{patient?.age ?? 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: 'linear-gradient(180deg, #ffffff 0%, #f6ffed 100%)', 
                    padding: '16px', 
                    borderRadius: 16,
                    border: '1px solid #d9f7be',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#389e0d', fontSize: 12, display: 'block', marginBottom: 4 }}>GENDER</Text>
                    <Text strong style={{ color: '#52c41a', fontSize: 20 }}>{patient?.gender ?? 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: 'linear-gradient(180deg, #ffffff 0%, #f6ffed 100%)', 
                    padding: '16px', 
                    borderRadius: 16,
                    border: '1px solid #d9f7be',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#389e0d', fontSize: 12, display: 'block', marginBottom: 4 }}>BLOOD TYPE</Text>
                    <Text strong style={{ color: '#52c41a', fontSize: 20 }}>{patient?.bloodType ?? 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: 'linear-gradient(180deg, #ffffff 0%, #f6ffed 100%)', 
                    padding: '16px', 
                    borderRadius: 16,
                    border: '1px solid #d9f7be',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#389e0d', fontSize: 12, display: 'block', marginBottom: 4 }}>ABHA ID</Text>
                    <Text strong style={{ color: '#52c41a', fontSize: 16 }}>{patient?.abhaId || patientId}</Text>
                  </div>
                </Col>
              </Row>
            </Card>)}

            {/* AI-Powered Health Visualizer - Hidden for National Health Pulse, Emergency, and AI Assistant tabs */}
            {activeTab !== 'emergency' && activeTab !== 'nhp' && activeTab !== 'ai-assistant' && (<Card style={{ 
              marginBottom: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e8f4fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <Text style={{ color: 'white', fontSize: '18px' }}>🤖</Text>
                </div>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>AI-Powered Health Visualizer</Title>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(82, 196, 26, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.3)';
                  }}
                  onClick={() => message.info('Cardio Health - Feature coming soon!')}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>❤️</div>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>Cardio</Text>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Heart Health</div>
                </div>
                
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(250, 173, 20, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(250, 173, 20, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(250, 173, 20, 0.3)';
                  }}
                  onClick={() => message.info('Respiratory Health - Feature coming soon!')}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>Respiratory</Text>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Lung Function</div>
                </div>
                
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(24, 144, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                  }}
                  onClick={() => message.info('Mental Health - Feature coming soon!')}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧠</div>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>Mental</Text>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Cognitive Health</div>
                </div>
                
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(235, 47, 150, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(235, 47, 150, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(235, 47, 150, 0.3)';
                  }}
                  onClick={() => message.info('Lifestyle Health - Feature coming soon!')}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>👤</div>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>Lifestyle</Text>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Daily Habits</div>
                </div>
              </div>
            </Card>)}


            {/* Medical Records Section */}
            <Card style={{ 
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e8f4fd'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: activeTab === 'history' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 
                                activeTab === 'prescriptions' ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                                activeTab === 'nhp' ? 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)' :
                                activeTab === 'ai-assistant' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' :
                                activeTab === 'health-metrics' ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' :
                                'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <Text style={{ color: 'white', fontSize: '18px' }}>
                      {activeTab === 'history' ? '📋' : activeTab === 'prescriptions' ? '💊' : activeTab === 'nhp' ? '🌐' : activeTab === 'ai-assistant' ? '🤖' : activeTab === 'health-metrics' ? '❤️' : '📄'}
                    </Text>
                  </div>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {activeTab === 'history' ? 'Complete Medical History' : 
                     activeTab === 'prescriptions' ? 'e-Prescriptions' : 
                     activeTab === 'reports' ? 'Reports & Scans' : 
                     activeTab === 'nhp' ? 'National Health Pulse' : 
                     activeTab === 'ai-assistant' ? 'AI Assistant Chat' : 
                     activeTab === 'health-metrics' ? 'Health Metrics Management' : 'Emergency Mode'}
                  </Title>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {activeTab === 'reports' && reports.length > 0 && (
                    <button 
                      onClick={() => {
                        // Prefer the most recent report for quick Ask AI
                        const target = reports[0] || reports[reports.length - 1];
                        if (target) {
                          handleAskAIAboutReport(target);
                        } else {
                          setChatModalVisible(true);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageOutlined />
                      Ask AI About Reports
                    </button>
                  )}
                  {activeTab !== 'emergency' && activeTab !== 'ai-assistant' && (<button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (activeTab === 'history') {
                        setAddEntryModalVisible(true);
                      } else if (activeTab === 'prescriptions') {
                        setAddPrescriptionModalVisible(true);
                      } else if (activeTab === 'reports') {
                        setShowUploadInterface(true);
                      }
                    }}
                  style={{
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                    <PlusOutlined />
                    {activeTab === 'history' ? 'Add New Entry' : 
                     activeTab === 'prescriptions' ? 'Create New' : 
                     activeTab === 'reports' ? 'Upload Report' : ''}
                  </button>)}
                </div>
              </div>
              
              {dataLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>
                    <Text>Loading {activeTab === 'history' ? 'medical history' : 
                                 activeTab === 'prescriptions' ? 'prescriptions' : 
                                 'reports'}...</Text>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeTab === 'history' && (
                    // Medical History Content
                    medicalHistory.length > 0 ? (
                      medicalHistory.map((entry, index) => (
                      <div key={index} style={{ 
                        background: 'linear-gradient(135deg, #fff 0%, #f8fbff 100%)',
                        padding: '20px', 
                        borderRadius: '16px',
                        border: '1px solid #e8f4fd',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: entry.entryType === 'prescription' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' :
                                       entry.entryType === 'consultation' ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                                       entry.entryType === 'lab_test' ? 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' :
                                       'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}>
                            <Text style={{ color: 'white', fontSize: '18px' }}>
                              {entry.entryType === 'prescription' ? '💊' : 
                               entry.entryType === 'consultation' ? '🩺' :
                               entry.entryType === 'lab_test' ? '🧪' : '📋'}
                            </Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                              {entry.entryType === 'prescription' ? 'e-Prescription Issued' :
                               entry.entryType === 'consultation' ? 'Consultation' :
                               entry.entryType === 'lab_test' ? 'Lab Test' : 'Medical Entry'}
                            </Text>
                            <div style={{ marginTop: '4px' }}>
                              <Text type="secondary" style={{ fontSize: '14px' }}>
                                {new Date(entry.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Text>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <Text style={{ fontSize: '15px', lineHeight: '1.6' }}>{entry.summary}</Text>
                        </div>
                        
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '1px solid #e6f7ff'
                        }}>
                          <Text style={{ fontSize: '14px', color: '#666' }}>
                            <strong>At:</strong> {entry.hospitalClinicName} | <strong>Doctor:</strong> {entry.consultingDoctor}
                          </Text>
                        </div>
                        
                        {entry.medications && entry.medications.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <Text strong style={{ fontSize: '14px', color: '#52c41a' }}>Medications: </Text>
                            <div style={{ marginTop: '4px' }}>
                              {entry.medications.map((med, medIndex) => (
                                <Tag key={medIndex} color="green" style={{ margin: '2px' }}>
                                  {med.name} ({med.dosage})
                                </Tag>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {entry.diagnosis?.primary && (
                          <div style={{ marginTop: '12px' }}>
                            <Text strong style={{ fontSize: '14px', color: '#fa8c16' }}>Diagnosis: </Text>
                            <Tag color="orange" style={{ marginLeft: '8px' }}>
                              {entry.diagnosis.primary}
                            </Tag>
                          </div>
                        )}
                      </div>
                    ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 40px', 
                        background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                        borderRadius: '16px',
                        border: '2px dashed #d9d9d9'
                      }}>
                        <MedicineBoxOutlined style={{ fontSize: '64px', marginBottom: '20px', color: '#1890ff' }} />
                        <Title level={4} style={{ color: '#666', marginBottom: '8px' }}>No medical history entries found</Title>
                        <Text style={{ color: '#999', fontSize: '16px', marginBottom: '20px' }}>
                          Start building the patient's medical record by adding their first entry
                        </Text>
                        <Button 
                          type="primary" 
                          size="large"
                          style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                            borderColor: '#52c41a',
                            borderRadius: '12px',
                            height: '48px',
                            padding: '0 32px',
                            boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                            fontWeight: '600'
                          }}
                          icon={<PlusOutlined />}
                          onClick={() => setAddEntryModalVisible(true)}
                        >
                          Add the first entry
                        </Button>
                      </div>
                    )
                  )}
                  {activeTab === 'nhp' && (
                    <div>
                      <NationalHealthPulse />
                    </div>
                  )}

                  {activeTab === 'ai-assistant' && (
                    <div>
                      {console.log("SimplePatientViewer: Passing patientId (abhaId) to AIAssistant:", patientId)}
                      <AIAssistant patientId={patientId} />
                    </div>
                  )}

                  {activeTab === 'health-metrics' && (
                    <div>
                      <HealthMetricsForm 
                        abhaId={patientId}
                        onMetricsUpdated={(metrics) => {
                          console.log('Health metrics updated:', metrics);
                          message.success('Health metrics updated successfully!');
                        }}
                      />
                    </div>
                  )}

                  {activeTab === 'emergency' && (
                    <div style={{
                      border: '2px solid #ff4d4f',
                      borderRadius: '12px',
                      padding: '16px',
                      background: 'linear-gradient(180deg,#fff5f5 0,#fff 100%)'
                    }}>
                      <div style={{
                        background: '#cf1322',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        marginBottom: '16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        letterSpacing: 1
                      }}>EMERGENCY MODE</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ border: '1px solid #ffd6d6', borderRadius: 10, padding: 12 }}>
                          <Text type="secondary" style={{ fontWeight: 600 }}>PATIENT NAME</Text>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{patient?.name || 'Unknown'}</div>
                        </div>
                        <div style={{ border: '1px solid #ffd6d6', borderRadius: 10, padding: 12 }}>
                          <Text type="secondary" style={{ fontWeight: 600 }}>BLOOD TYPE</Text>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#cf1322' }}>{patient?.bloodType || 'N/A'}</div>
                        </div>
                        <div style={{ gridColumn: '1/3', border: '1px solid #ffd6d6', borderRadius: 10, padding: 12 }}>
                          <Text type="secondary" style={{ fontWeight: 600 }}>KNOWN ALLERGIES</Text>
                          <div style={{ fontSize: 16 }}>{patient?.allergies?.join(', ') || 'None on record'}</div>
                        </div>
                        <div style={{ gridColumn: '1/3', border: '1px solid #ffd6d6', borderRadius: 10, padding: 12 }}>
                          <Text type="secondary" style={{ fontWeight: 600 }}>EXISTING MEDICAL CONDITIONS</Text>
                          <div style={{ fontSize: 16 }}>{
                            (patient?.existingMedicalConditions && patient.existingMedicalConditions.length > 0)
                              ? patient.existingMedicalConditions.join(', ')
                              : (patient?.chronicConditions && patient.chronicConditions.length > 0)
                                  ? patient.chronicConditions.join(', ')
                                  : (patient?.profile?.medicalConditions && patient.profile.medicalConditions.length > 0)
                                      ? patient.profile.medicalConditions.join(', ')
                                      : 'None on record'
                          }</div>
                        </div>
                        <div style={{ gridColumn: '1/3', border: '1px solid #ffd6d6', borderRadius: 10, padding: 12 }}>
                          <Text type="secondary" style={{ fontWeight: 600 }}>EMERGENCY CONTACT</Text>
                          <div style={{ fontSize: 16 }}>{patient?.emergencyContact?.name ? `${patient.emergencyContact.name} (${patient.emergencyContact.relationship}) - ${patient.emergencyContact.phone}` : 'Not provided'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'prescriptions' && (
                    // Prescriptions Content
                    <div>
                      <div style={{ 
                        marginBottom: '24px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e6f7ff'
                      }}>
                        <Title level={3} style={{ 
                          margin: 0, 
                          color: '#1890ff',
                          fontSize: '24px',
                          fontWeight: '700'
                        }}>
                          Prescription History
                        </Title>
                        <Text style={{ 
                          fontSize: '16px', 
                          color: '#666',
                          marginTop: '8px'
                        }}>
                          Manage digital prescriptions for {patient?.name || 'Patient'}
                        </Text>
                      </div>
                      
                      {prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {prescriptions.map((prescription, index) => (
                            <div key={index} style={{ 
                              background: '#fff',
                              padding: '24px', 
                              borderRadius: '12px',
                              border: '1px solid #e8f4fd',
                              boxShadow: 'none',
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: '8px' }}>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#666',
                                      fontWeight: '500'
                                    }}>
                                      Prescription ID:
                                    </Text>
                                    <Text style={{ 
                                      fontSize: '16px', 
                                      color: '#1890ff',
                                      fontWeight: '600',
                                      marginLeft: '8px',
                                      fontFamily: 'monospace'
                                    }}>
                                      {prescription.prescriptionId}
                                    </Text>
                                  </div>
                                  
                                  <div>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#666',
                                      fontWeight: '500'
                                    }}>
                                      Issued on:
                                    </Text>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#333',
                                      marginLeft: '8px'
                                    }}>
                                      {new Date(prescription.issuedDate).toLocaleDateString('en-GB', { 
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </Text>
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Button 
                                    type="text" 
                                    icon={<span style={{ fontSize: '16px' }}>📤</span>}
                                    style={{ 
                                      color: '#1890ff',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => {
                                      message.success('Prescription shared successfully!');
                                    }}
                                  >
                                    Share
                                  </Button>
                                  
                                  <Button 
                                    type="text" 
                                    icon={<span style={{ fontSize: '16px' }}>📋</span>}
                                    style={{ 
                                      color: '#52c41a',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(prescription.prescriptionId);
                                      message.success('Prescription ID copied to clipboard!');
                                    }}
                                  >
                                    Copy
                                  </Button>
                                  
                                  <div style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background: prescription.status === 'pending' ? '#fff2e8' : '#f6ffed',
                                    color: prescription.status === 'pending' ? '#d46b08' : '#52c41a',
                                    border: prescription.status === 'pending' ? '1px solid #ffd591' : '1px solid #b7eb8f'
                                  }}>
                                    {prescription.status === 'pending' ? 'Pending' : 'Fulfilled'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '60px 40px', 
                          background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                          borderRadius: '16px',
                          border: '2px dashed #d9d9d9'
                        }}>
                          <MedicineBoxOutlined style={{ fontSize: '64px', marginBottom: '20px', color: '#1890ff' }} />
                          <Title level={4} style={{ color: '#666', marginBottom: '8px' }}>No prescriptions found</Title>
                          <Text style={{ color: '#999', fontSize: '16px', marginBottom: '20px' }}>
                            Start creating prescriptions for this patient
                          </Text>
                          <Button 
                            type="primary" 
                            size="large"
                            style={{ 
                              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                              borderColor: '#1890ff',
                              borderRadius: '12px',
                              height: '48px',
                              padding: '0 32px',
                              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                              fontWeight: '600'
                            }}
                            icon={<PlusOutlined />}
                            onClick={() => setAddPrescriptionModalVisible(true)}
                          >
                            Add the first prescription
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    // Reports Content
                    <div>
                      <div style={{ 
                        marginBottom: '24px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e6f7ff'
                      }}>
                        <Title level={3} style={{ 
                          margin: 0, 
                          color: '#722ed1',
                          fontSize: '24px',
                          fontWeight: '700'
                        }}>
                          Medical Reports & Scans
                        </Title>
                        <Text style={{ 
                          fontSize: '16px', 
                          color: '#666',
                          marginTop: '8px'
                        }}>
                          Upload and manage medical documents with AI-powered scanning
                        </Text>
                      </div>

                      {/* Upload Interface */}
                      {showUploadInterface && (
                        <div style={{
                          marginBottom: '24px',
                          padding: '24px',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '2px solid #722ed1',
                          boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)',
                          position: 'relative',
                          zIndex: 1,
                          overflow: 'visible'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                              Upload Medical Report
                            </Title>
                            <Button 
                              type="text" 
                              onClick={() => {
                                setShowUploadInterface(false);
                                uploadReportForm.resetFields();
                              }}
                              style={{ color: '#999' }}
                            >
                              Cancel
                            </Button>
                          </div>

                          <Form
                            form={uploadReportForm}
                            layout="vertical"
                            onFinish={handleUploadReport}
                          >
                            <Form.Item
                              name="file"
                              label="Upload Document"
                              rules={[{ required: true, message: 'Please upload a file' }]}
                              valuePropName="fileList"
                              getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                  return e;
                                }
                                return e && e.fileList;
                              }}
                            >
                              <Upload.Dragger
                                name="file"
                                multiple={false}
                                accept="image/*,.pdf"
                                beforeUpload={() => false}
                                showUploadList={{
                                  showPreviewIcon: false,
                                  showRemoveIcon: true,
                                }}
                              >
                                <p className="ant-upload-drag-icon">
                                  <UploadOutlined style={{ fontSize: '48px', color: '#722ed1' }} />
                                </p>
                                <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: '600' }}>
                                  Click or drag file to this area to upload
                                </p>
                                <p className="ant-upload-hint" style={{ color: '#666' }}>
                                  Support for single file upload. Images (JPG, PNG, GIF, WebP) and PDF files are supported.
                                  Maximum file size: 10MB
                                </p>
                              </Upload.Dragger>
                            </Form.Item>

                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item
                                  name="documentType"
                                  label="Document Type"
                                  rules={[{ required: true, message: 'Please select document type' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <select 
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      backgroundColor: '#fff',
                                      cursor: 'pointer'
                                    }}
                                    onChange={(e) => {
                                      uploadReportForm.setFieldsValue({ documentType: e.target.value });
                                    }}
                                  >
                                    <option value="">Select document type</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="lab_report">Lab Report</option>
                                    <option value="scan_report">Scan Report</option>
                                    <option value="discharge_summary">Discharge Summary</option>
                                    <option value="mri_report">MRI Report</option>
                                    <option value="ct_scan">CT Scan</option>
                                    <option value="x_ray">X-Ray</option>
                                    <option value="ultrasound">Ultrasound</option>
                                    <option value="other">Other</option>
                                  </select>
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  name="title"
                                  label="Report Title"
                                  rules={[{ required: true, message: 'Please enter report title' }]}
                                >
                                  <Input placeholder="e.g., Blood Test Report - Jan 2025" />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Form.Item
                              name="description"
                              label="Description (Optional)"
                            >
                              <Input.TextArea
                                rows={3}
                                placeholder="Brief description of the report or any additional notes..."
                              />
                            </Form.Item>


                            <div style={{
                              padding: '16px',
                              background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                              borderRadius: '8px',
                              border: '1px solid #e6f7ff',
                              marginBottom: '16px'
                            }}>
                              <Text style={{ fontSize: '14px', color: '#1890ff', fontWeight: '500' }}>
                                🤖 AI-Powered Processing
                              </Text>
                              <div style={{ marginTop: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>
                                  Your document will be automatically processed using Gemini AI to extract:
                                </Text>
                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                                  <li>Patient information and medical data</li>
                                  <li>Diagnosis and treatment details</li>
                                  <li>Lab values and vital signs</li>
                                  <li>Medication information</li>
                                </ul>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                              <Button
                                onClick={() => {
                                  setShowUploadInterface(false);
                                  uploadReportForm.resetFields();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<UploadOutlined />}
                                style={{
                                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                                  borderColor: '#722ed1'
                                }}
                              >
                                Upload & Process
                              </Button>
                            </div>
                          </Form>
                        </div>
                      )}
                      
                      {reports.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {reports.map((report, index) => (
                            <div key={index} style={{ 
                              background: '#fff',
                              padding: '24px', 
                              borderRadius: '12px',
                              border: '1px solid #e8f4fd',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              transition: 'all 0.3s ease',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                            }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: '8px' }}>
                                    <Text style={{ 
                                      fontSize: '18px', 
                                      color: '#722ed1',
                                      fontWeight: '600',
                                      marginRight: '12px'
                                    }}>
                                      {report.title}
                                    </Text>
                                    <Tag color="purple" style={{ borderRadius: '4px', padding: '4px 8px' }}>
                                      {report.documentType.replace('_', ' ').toUpperCase()}
                                    </Tag>
                                  </div>
                                  
                                  <div style={{ marginBottom: '8px' }}>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#666',
                                      fontWeight: '500'
                                    }}>
                                      File:
                                    </Text>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#333',
                                      marginLeft: '8px'
                                    }}>
                                      {report.originalFileName}
                                    </Text>
                                  </div>

                                  <div style={{ marginBottom: '8px' }}>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#666',
                                      fontWeight: '500'
                                    }}>
                                      Uploaded:
                                    </Text>
                                    <Text style={{ 
                                      fontSize: '14px', 
                                      color: '#333',
                                      marginLeft: '8px'
                                    }}>
                                      {new Date(report.uploadedAt).toLocaleDateString('en-GB', { 
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </Text>
                                  </div>

                                  {report.ocrData && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <Text style={{ 
                                        fontSize: '14px', 
                                        color: '#666',
                                        fontWeight: '500'
                                      }}>
                                        OCR Status:
                                      </Text>
                                      <Tag 
                                        color={report.ocrData.processingStatus === 'completed' ? 'green' : 
                                              report.ocrData.processingStatus === 'failed' ? 'red' : 'orange'}
                                        style={{ marginLeft: '8px' }}
                                      >
                                        {report.ocrData.processingStatus.toUpperCase()}
                                      </Tag>
                                      {report.ocrData.confidence && (
                                        <Text style={{ 
                                          fontSize: '12px', 
                                          color: '#999',
                                          marginLeft: '8px'
                                        }}>
                                          ({Math.round(report.ocrData.confidence * 100)}% confidence)
                                        </Text>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <Button 
                                    type="text" 
                                    icon={<EyeOutlined />}
                                    style={{ 
                                      color: '#722ed1',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => handleViewReport(report._id)}
                                  >
                                    View
                                  </Button>
                                  
                                  <Button 
                                    type="text" 
                                    icon={<DownloadOutlined />}
                                    style={{ 
                                      color: '#52c41a',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => handleDownloadReport(report._id)}
                                  >
                                    Download
                                  </Button>
                                  
                                  <Button 
                                    type="text" 
                                    icon={<RobotOutlined />}
                                    style={{ 
                                      color: '#1890ff',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => handleAskAIAboutReport(report)}
                                  >
                                    Ask AI
                                  </Button>
                                  
                                  <Button 
                                    type="text" 
                                    icon={<DeleteOutlined />}
                                    style={{ 
                                      color: '#ff4d4f',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      height: '32px',
                                      padding: '0 12px'
                                    }}
                                    onClick={() => handleDeleteReport(report._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              {/* Collapsible AI Summary / Insights */}
                              <div style={{ marginTop: '12px' }}>
                                <Card
                                  style={{
                                    borderRadius: 14,
                                    border: '1px solid #e6eaff',
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                                    boxShadow: '0 8px 24px rgba(47, 84, 235, 0.08)'
                                  }}
                                  bodyStyle={{ padding: 0 }}
                                >
                                  <Collapse
                                    bordered={false}
                                    defaultActiveKey={[]}
                                    style={{ borderRadius: 14 }}
                                    items={[{
                                      key: `summary-${report._id}`,
                                      label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                          <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: 'linear-gradient(135deg, #2f54eb 0%, #9254de 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 6px 16px rgba(46, 84, 235, 0.25)'
                                          }}>
                                            <RobotOutlined style={{ color: '#fff' }} />
                                          </div>
                                          <div>
                                            <div style={{ fontWeight: 700, color: '#1d39c4' }}>AI Summary / Insights</div>
                                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Auto-generated overview with highlights and next steps</div>
                                          </div>
                                        </div>
                                      ),
                                      children: (
                                        <div style={{ padding: '16px 20px 20px 20px' }}>
                                          <div
                                            id={`ai-summary-${report._id}`}
                                            style={{
                                              maxHeight: 260,
                                              overflowY: 'auto',
                                              whiteSpace: 'pre-wrap',
                                              color: '#334155',
                                              background: '#fafcff',
                                              border: '1px dashed #d6e4ff',
                                              borderRadius: 12,
                                              padding: 16
                                            }}
                                          >
                                            {(selectedReportForChat && selectedReportForChat._id === report._id && chatMessages.length > 0)
                                              ? chatMessages[chatMessages.length - 1]?.content
                                              : 'Click Ask AI to generate a summary for this report.'}
                                          </div>
                                        </div>
                                      )
                                    }]}
                                  />
                                </Card>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '60px 40px', 
                          background: 'linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%)',
                          borderRadius: '16px',
                          border: '2px dashed #d9d9d9'
                        }}>
                          <FileTextOutlined style={{ fontSize: '64px', marginBottom: '20px', color: '#722ed1' }} />
                          <Title level={4} style={{ color: '#666', marginBottom: '8px' }}>No reports found</Title>
                          <Text style={{ color: '#999', fontSize: '16px', marginBottom: '20px' }}>
                            Upload medical documents and reports for AI-powered scanning
                          </Text>
                          <Button 
                            type="primary" 
                            size="large"
                            style={{ 
                              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                              borderColor: '#722ed1',
                              borderRadius: '12px',
                              height: '48px',
                              padding: '0 32px',
                              boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)',
                              fontWeight: '600'
                            }}
                            icon={<UploadOutlined />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Upload first report button clicked');
                              setShowUploadInterface(true);
                            }}
                          >
                            Upload first report
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Layout.Content>
        </Layout>
      </Layout>

      {/* Add New Entry Modal */}
      <Modal
        title="Add New Medical History Entry"
        open={addEntryModalVisible}
        onCancel={() => {
          setAddEntryModalVisible(false);
          addEntryForm.resetFields();
        }}
        footer={null}
        centered
        width={650}
      >
        <Form
          form={addEntryForm}
          layout="vertical"
          onFinish={handleAddEntry}
        >
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
            getValueFromEvent={(e) => e.target.value ? new Date(e.target.value) : null}
            getValueProps={(value) => ({
              value: value ? new Date(value).toISOString().split('T')[0] : ''
            })}
          >
            <Input 
              type="date" 
              style={{ width: '100%' }}
              max={new Date().toISOString().split('T')[0]}
            />
          </Form.Item>
          
          <Form.Item
            name="entryType"
            label="Entry Type"
            rules={[{ required: true, message: 'Please select an entry type' }]}
          >
            <select 
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
              defaultValue=""
            >
              <option value="" disabled>Select entry type</option>
              <option value="consultation">Consultation</option>
              <option value="prescription">Prescription</option>
              <option value="lab_test">Lab Test</option>
              <option value="scan">Scan</option>
              <option value="surgery">Surgery</option>
              <option value="vaccination">Vaccination</option>
              <option value="other">Other</option>
            </select>
          </Form.Item>

          <Form.Item
            name="summary"
            label="Summary / Notes"
            rules={[{ required: true, message: 'Please enter a summary' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g., Diagnosed with viral fever..." />
          </Form.Item>

          <Form.Item
            name="consultingDoctor"
            label="Consulting Doctor"
            rules={[{ required: true, message: 'Please enter doctor name' }]}
          >
            <Input placeholder="e.g., Dr. Priya Sharma" />
          </Form.Item>

          <Form.Item
            name="hospitalClinicName"
            label="Hospital / Clinic Name"
            rules={[{ required: true, message: 'Please enter hospital/clinic name' }]}
          >
            <Input placeholder="e.g., AayuLink Digital Clinic" />
          </Form.Item>

          <Form.Item
            name="diagnosis"
            label="Primary Diagnosis (Optional)"
          >
            <Input placeholder="e.g., Viral Fever" />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button 
              onClick={() => {
                setAddEntryModalVisible(false);
                addEntryForm.resetFields();
              }}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              Add Entry
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add New Prescription Modal */}
      <Modal
        title="Add New Prescription"
        open={addPrescriptionModalVisible}
        onCancel={() => {
          setAddPrescriptionModalVisible(false);
          addPrescriptionForm.resetFields();
          setMedications([{ name: '', dosage: '', frequency: '', nextRefill: '' }]); // Reset medications
        }}
        footer={null}
        centered
        width={700}
        destroyOnClose={true}
        getContainer={false}
        style={{ zIndex: 1000 }}
      >
        <Form
          form={addPrescriptionForm}
          layout="vertical"
          onFinish={handleAddPrescription}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issuedDate"
                label="Issued Date"
                rules={[{ required: true, message: 'Please select a date' }]}
                getValueFromEvent={(e) => e.target.value ? new Date(e.target.value) : null}
                getValueProps={(value) => ({
                  value: value ? new Date(value).toISOString().split('T')[0] : ''
                })}
              >
                <Input 
                  type="date" 
                  style={{ width: '100%' }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="doctorName"
                label="Doctor Name"
                rules={[{ required: true, message: 'Please enter doctor name' }]}
              >
                <Input placeholder="e.g., Dr. Priya Sharma" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="specialization"
                label="Specialization"
              >
                <Input placeholder="e.g., General Medicine" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="licenseNumber"
                label="License Number"
              >
                <Input placeholder="e.g., MED123456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hospitalName"
                label="Hospital/Clinic Name"
                rules={[{ required: true, message: 'Please enter hospital/clinic name' }]}
              >
                <Input placeholder="e.g., AayuLink Digital Clinic" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hospitalAddress"
                label="Hospital Address"
              >
                <Input placeholder="e.g., 123 Health Street, Mumbai" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="primaryDiagnosis"
            label="Primary Diagnosis"
            rules={[{ required: true, message: 'Please enter primary diagnosis' }]}
          >
            <Input placeholder="e.g., Hypertension" />
          </Form.Item>

          <Form.Item
            name="secondaryDiagnosis"
            label="Secondary Diagnosis (Optional)"
          >
            <Input placeholder="e.g., Diabetes Type 2" />
          </Form.Item>

          {/* Structured Medications Form */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
              <MedicineBoxOutlined style={{ marginRight: '8px' }} />
              Medications *
            </Title>
            {medications.map((medication, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ 
                  marginBottom: '16px', 
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
                title={`Medication ${index + 1}`}
                extra={
                  medications.length > 1 && (
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeMedication(index)}
                    >
                      Remove
                    </Button>
                  )
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Medicine Name"
                      required
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        placeholder="e.g., Paracetamol"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Dosage"
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        placeholder="e.g., 500mg"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Frequency"
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        placeholder="e.g., Twice daily"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Next Refill Date"
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        type="date"
                        style={{ width: '100%' }}
                        placeholder="Select refill date"
                        value={medication.nextRefill || ''}
                        onChange={(e) => updateMedication(index, 'nextRefill', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            <Button 
              type="dashed" 
              onClick={addMedication}
              icon={<PlusOutlined />}
              style={{ 
                width: '100%', 
                height: '40px',
                border: '2px dashed #1890ff',
                color: '#1890ff'
              }}
            >
              Add Another Medication
            </Button>
          </div>

          <Form.Item
            name="instructions"
            label="General Instructions"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="e.g., Take with food, avoid alcohol, complete full course" 
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="totalAmount"
                label="Total Amount (₹)"
              >
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="insuranceCovered"
                label="Insurance Covered"
                valuePropName="checked"
              >
                <Checkbox>Yes</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
              >
                <Select defaultValue="pending">
                  <Option value="pending">Pending</Option>
                  <Option value="fulfilled">Fulfilled</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button 
                onClick={() => {
                  setAddPrescriptionModalVisible(false);
                  addPrescriptionForm.resetFields();
                  setMedications([{ name: '', dosage: '', frequency: '', nextRefill: '' }]); // Reset medications
                }}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Add Prescription
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
      </>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Layout.Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '50px'
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={3}>Patient Access Required</Title>
          <Text type="secondary">
            You need to request access to view this patient's records.
          </Text>
          <br /><br />
          <Button 
            type="primary" 
            size="large"
            onClick={() => setDurationModalVisible(true)}
          >
            Request Access
          </Button>
        </Card>
      </Layout.Content>

      {/* Duration Selection Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
            Set Access Duration
          </div>
        }
        open={durationModalVisible}
        onCancel={() => setDurationModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text>Select the duration for which you want to access patient records.</Text>
        </div>
        
        <Form layout="vertical">
          <Form.Item label="Access Duration">
            <Select
              value={duration}
              onChange={setDuration}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value={1}>1 Hour</Option>
              <Option value={6}>6 Hours</Option>
              <Option value={12}>12 Hours</Option>
              <Option value={24}>24 Hours</Option>
              <Option value={48}>48 Hours</Option>
              <Option value={72}>72 Hours</Option>
            </Select>
          </Form.Item>
          
          <Button
            type="primary"
            size="large"
            onClick={handleDurationSubmit}
            style={{ width: '100%' }}
            icon={<ClockCircleOutlined />}
          >
            Continue to OTP
          </Button>
        </Form>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
            Enter OTP
          </div>
        }
        open={otpModalVisible}
        onCancel={() => setOtpModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text>Please enter the OTP to access patient records.</Text>
          <br />
          <Text strong style={{ color: '#1890ff' }}>Default OTP: 081106</Text>
        </div>
        
        <Form layout="vertical">
          <Form.Item>
            <Input
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              size="large"
              style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
            />
          </Form.Item>
          
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleOtpSubmit}
            style={{ width: '100%' }}
            icon={<CheckCircleOutlined />}
          >
            Verify & Access Records
          </Button>
        </Form>
      </Modal>

      {/* Add New Prescription Modal */}
      <Modal
        title="Add New Prescription"
        open={addPrescriptionModalVisible}
        onCancel={() => {
          setAddPrescriptionModalVisible(false);
          addPrescriptionForm.resetFields();
          setMedications([{ name: '', dosage: '', frequency: '', nextRefill: '' }]); // Reset medications
        }}
        footer={null}
        centered
        width={700}
        destroyOnClose={true}
        getContainer={false}
        style={{ zIndex: 1000 }}
      >
        <Form
          form={addPrescriptionForm}
          layout="vertical"
          onFinish={handleAddPrescription}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issuedDate"
                label="Issued Date"
                rules={[{ required: true, message: 'Please select a date' }]}
                getValueFromEvent={(e) => e.target.value ? new Date(e.target.value) : null}
                getValueProps={(value) => ({
                  value: value ? new Date(value).toISOString().split('T')[0] : ''
                })}
              >
                <Input 
                  type="date" 
                  style={{ width: '100%' }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="doctorName"
                label="Doctor Name"
                rules={[{ required: true, message: 'Please enter doctor name' }]}
              >
                <Input placeholder="e.g., Dr. Priya Sharma" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="specialization"
                label="Specialization"
              >
                <Input placeholder="e.g., General Medicine" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hospitalClinicName"
                label="Hospital / Clinic Name"
                rules={[{ required: true, message: 'Please enter hospital/clinic name' }]}
              >
                <Input placeholder="e.g., AayuLink Digital Clinic" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="diagnosis"
            label="Primary Diagnosis"
            rules={[{ required: true, message: 'Please enter diagnosis' }]}
          >
            <Input placeholder="e.g., Viral Fever" />
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Instructions"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="e.g., Take with food, avoid alcohol..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="Total Amount (₹)"
              >
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="insuranceCovered"
                label="Insurance Covered"
                valuePropName="checked"
              >
                <Select placeholder="Select">
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={() => {
                setAddPrescriptionModalVisible(false);
                addPrescriptionForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Add Prescription
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>


      {/* AI Chat Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <RobotOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
            <span>
              {selectedReportForChat 
                ? `AI Assistant - ${selectedReportForChat.title}` 
                : 'AI Health Assistant'}
            </span>
            <Tag color="purple" style={{ marginLeft: 'auto' }}>Health Domain Only</Tag>
          </div>
        }
        open={chatModalVisible}
        onCancel={() => {
          setChatModalVisible(false);
          setChatInput('');
        }}
        footer={null}
        centered
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px', 
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {chatMessages.length === 0 ? (
              <Empty
                description="Ask me anything about your uploaded medical reports!"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={chatMessages}
                renderItem={(msg) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px',
                      width: '100%'
                    }}>
                      <Avatar 
                        icon={msg.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{ 
                          backgroundColor: msg.type === 'user' ? '#1890ff' : '#722ed1',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ 
                        flex: 1,
                        background: msg.type === 'user' ? '#e6f7ff' : '#f0f0f0',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: msg.type === 'user' ? '1px solid #91d5ff' : '1px solid #d9d9d9'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999', 
                          marginTop: '8px',
                          textAlign: 'right'
                        }}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
            {chatLoading && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin size="small" />
                <Text style={{ marginLeft: '8px', color: '#666' }}>AI is thinking...</Text>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <AntInput
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your medical reports... (e.g., 'What does this lab result mean?')"
              onPressEnter={handleChatSubmit}
              disabled={chatLoading}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleChatSubmit}
              loading={chatLoading}
              disabled={!chatInput.trim()}
              style={{
                background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                borderColor: '#722ed1'
              }}
            >
              Send
            </Button>
          </div>

          {/* Health Domain Notice */}
          <div style={{ 
            marginTop: '12px',
            padding: '8px 12px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#52c41a'
          }}>
            <Text style={{ color: '#52c41a' }}>
              🤖 This AI assistant is specialized in health and medical topics only. 
              Please ask questions related to your uploaded medical reports and documents.
            </Text>
          </div>
        </div>
      </Modal>

      {/* Floating Chat Toggle Button */}
      {chatToggleVisible && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000
        }}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => {
              const target = reports[0] || reports[reports.length - 1];
              if (target) {
                handleAskAIAboutReport(target);
              } else {
                setChatModalVisible(true);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
              borderColor: '#722ed1',
              width: '60px',
              height: '60px',
              boxShadow: '0 4px 20px rgba(114, 46, 209, 0.4)',
              animation: 'pulse 2s infinite'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '70px',
            right: '0',
            background: '#722ed1',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            Ask AI About Reports
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SimplePatientViewer;
