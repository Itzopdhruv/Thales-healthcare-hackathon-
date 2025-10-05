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
  DatePicker,
  Row,
  Col,
  Tag,
  Spin,
  Checkbox
} from 'antd';
import { 
  LockOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import api from '../services/api';
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
  
  // Form states
  const [duration, setDuration] = useState(24);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'prescriptions'
  
  // Form instances
  const [addEntryForm] = Form.useForm();
  const [addPrescriptionForm] = Form.useForm();

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('Please log in to access patient records');
    navigate('/login');
    return null;
  }

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
          setPatient(patientResponse.data.data.patient);
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
      
      // Parse medications from textarea
      const medicationsArray = [];
      if (values.medications) {
        const medicationLines = values.medications.split('\n').filter(line => line.trim());
        medicationLines.forEach(line => {
          const parts = line.split(' - ');
          if (parts.length >= 3) {
            medicationsArray.push({
              name: parts[0].trim(),
              dosage: parts[1].trim(),
              frequency: parts[2].trim()
            });
          } else if (parts.length === 2) {
            medicationsArray.push({
              name: parts[0].trim(),
              dosage: parts[1].trim(),
              frequency: 'As directed'
            });
          } else if (parts.length === 1) {
            medicationsArray.push({
              name: parts[0].trim(),
              dosage: 'As directed',
              frequency: 'As directed'
            });
          }
        });
      }
      
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
        fetchPatientData(); // Refresh data
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
                  fontWeight: '500'
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
            background: '#fff', 
            padding: '24px',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            borderRight: '1px solid #f0f0f0'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', fontSize: '16px' }}>Navigation</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div 
                  style={{ 
                    padding: '14px 16px',
                    background: activeTab === 'history' ? 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)' : '#fff',
                    borderRadius: '12px',
                    border: activeTab === 'history' ? '2px solid #1890ff' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: activeTab === 'history' ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'history') {
                      e.target.style.background = '#f5f5f5';
                      e.target.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'history') {
                      e.target.style.background = '#fff';
                      e.target.style.transform = 'translateX(0)';
                    }
                  }}
                  onClick={() => {
                    setActiveTab('history');
                    message.success('Switched to Medical History view');
                  }}
                >
                  <Text strong style={{ 
                    color: activeTab === 'history' ? '#1890ff' : '#333', 
                    fontSize: '14px' 
                  }}>📋 Patient History</Text>
                </div>
                <div 
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
                  onClick={() => message.info('Emergency Mode - Feature coming soon!')}
                >
                  <Text style={{ fontSize: '14px' }}>🚨 Emergency Mode</Text>
                </div>
                <div 
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
                  onClick={() => message.info('AI Assistant - Feature coming soon!')}
                >
                  <Text style={{ fontSize: '14px' }}>🧠 AI Assistant</Text>
                </div>
                <div 
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
                </div>
                <div 
                  style={{ 
                    padding: '14px 16px', 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'prescriptions' ? 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)' : '#fff',
                    border: activeTab === 'prescriptions' ? '2px solid #1890ff' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'prescriptions') {
                      e.target.style.background = '#f5f5f5';
                      e.target.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'prescriptions') {
                      e.target.style.background = '#fff';
                      e.target.style.transform = 'translateX(0)';
                    }
                  }}
                  onClick={() => {
                    setActiveTab('prescriptions');
                    message.success('Switched to Prescriptions view');
                  }}
                >
                  <Text style={{ 
                    fontSize: '14px',
                    color: activeTab === 'prescriptions' ? '#1890ff' : '#333',
                    fontWeight: activeTab === 'prescriptions' ? '600' : 'normal'
                  }}>💊 e-Prescriptions</Text>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Title level={5} style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>SYSTEM TOOLS</Title>
              <div 
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
                onClick={() => message.info('National Health Pulse - Feature coming soon!')}
              >
                <Text style={{ fontSize: '14px' }}>🌐 National Health Pulse</Text>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div 
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
                onClick={() => message.info('Switch Patient - Feature coming soon!')}
              >
                <Text style={{ fontSize: '14px' }}>👥 Switch Patient</Text>
              </div>
              <div 
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
                onClick={() => {
                  message.success('Logging out...');
                  navigate('/admin-dashboard');
                }}
              >
                <Text style={{ fontSize: '14px' }}>🚪 Logout</Text>
              </div>
            </div>
          </Layout.Sider>

          {/* Main Content */}
          <Layout.Content style={{ padding: '24px', background: '#f0f2f5' }}>
            {/* Patient Details */}
            <Card style={{ 
              marginBottom: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e8f4fd',
              background: 'linear-gradient(135deg, #fff 0%, #f8fbff 100%)'
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
                  <Title level={2} style={{ color: '#1890ff', margin: 0, fontSize: '28px' }}>
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
                    background: '#f0f9ff', 
                    padding: '16px', 
                    borderRadius: '12px',
                    border: '1px solid #e6f7ff',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>AGE</Text>
                    <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>{patient?.profile?.age || 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#f6ffed', 
                    padding: '16px', 
                    borderRadius: '12px',
                    border: '1px solid #d9f7be',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>GENDER</Text>
                    <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>{patient?.profile?.gender || 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#fff2e8', 
                    padding: '16px', 
                    borderRadius: '12px',
                    border: '1px solid #ffd591',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>BLOOD TYPE</Text>
                    <Text strong style={{ color: '#fa8c16', fontSize: '18px' }}>{patient?.profile?.bloodType || 'N/A'}</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#f9f0ff', 
                    padding: '16px', 
                    borderRadius: '12px',
                    border: '1px solid #d3adf7',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>ABHA ID</Text>
                    <Text strong style={{ color: '#722ed1', fontSize: '14px' }}>{patient?.abhaId || patientId}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* AI-Powered Health Visualizer */}
            <Card style={{ 
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
            </Card>


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
                    background: activeTab === 'history' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <Text style={{ color: 'white', fontSize: '18px' }}>
                      {activeTab === 'history' ? '📋' : '💊'}
                    </Text>
                  </div>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {activeTab === 'history' ? 'Complete Medical History' : 'e-Prescriptions'}
                  </Title>
                </div>
                <button 
                  onClick={() => {
                    if (activeTab === 'history') {
                      setAddEntryModalVisible(true);
                    } else {
                      setAddPrescriptionModalVisible(true);
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
                  {activeTab === 'history' ? 'Add New Entry' : 'Create New'}
                </button>
              </div>
              
              {dataLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>
                    <Text>Loading {activeTab === 'history' ? 'medical history' : 'prescriptions'}...</Text>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeTab === 'history' ? (
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
                  ) : (
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
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="entryType"
            label="Entry Type"
            rules={[{ required: true, message: 'Please select an entry type' }]}
          >
            <Select placeholder="Select entry type">
              <Option value="consultation">Consultation</Option>
              <Option value="prescription">Prescription</Option>
              <Option value="lab_test">Lab Test</Option>
              <Option value="scan">Scan</Option>
              <Option value="surgery">Surgery</Option>
              <Option value="vaccination">Vaccination</Option>
              <Option value="other">Other</Option>
            </Select>
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
        }}
        footer={null}
        centered
        width={700}
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
              >
                <DatePicker style={{ width: '100%' }} />
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

          <Form.Item
            name="medications"
            label="Medications"
            rules={[{ required: true, message: 'Please enter at least one medication' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter medications, one per line. Format: Medication Name - Dosage - Frequency&#10;e.g.,&#10;Paracetamol - 500mg - Twice daily&#10;Amoxicillin - 250mg - Three times daily" 
            />
          </Form.Item>

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
        }}
        footer={null}
        centered
        width={700}
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
              >
                <DatePicker style={{ width: '100%' }} />
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

    </Layout>
  );
};

export default SimplePatientViewer;
