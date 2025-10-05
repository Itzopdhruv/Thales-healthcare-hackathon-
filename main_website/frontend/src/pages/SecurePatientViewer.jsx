import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Button, 
  Modal, 
  Input, 
  Form, 
  message, 
  Spin, 
  Typography, 
  Space, 
  Divider,
  Tag,
  Timeline,
  Descriptions,
  Alert,
  Select,
  Row,
  Col
} from 'antd';
import { 
  LockOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalendarOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './SecurePatientViewer.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const SecurePatientViewer = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [accessInfo, setAccessInfo] = useState(null);
  
  // OTP Modal States
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Consent Modal States
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [consentDuration, setConsentDuration] = useState(24);
  const [requestingAccess, setRequestingAccess] = useState(false);
  
  // Access States
  const [hasAccess, setHasAccess] = useState(false);
  const [accessExpired, setAccessExpired] = useState(false);
  const [accessId, setAccessId] = useState(null);
  const [error, setError] = useState(null);

  const lookupPatientByABHA = async () => {
    try {
      console.log('Looking up patient with ABHA ID:', patientId);
      setLoading(true);
      setError(null);
      
      // Use the patient lookup API to get patient details by ABHA ID
      const response = await api.get(`/patient/lookup/${patientId}`);
      
      console.log('Patient lookup response:', response.data);
      
      if (response.data.success) {
        const patientData = response.data.data.patient;
        setPatient(patientData);
        setHealthRecords(response.data.data.healthRecords || []);
        
        // Now try to check if we have existing access for this patient
        await checkExistingAccess(patientData._id);
      } else {
        setError('Patient not found with this ABHA ID: ' + patientId);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error looking up patient:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      if (error.response?.status === 404) {
        setError('Patient not found with this ABHA ID: ' + patientId);
      } else {
        setError('Failed to lookup patient: ' + (error.response?.data?.error || error.message));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('SecurePatientViewer mounted with patientId:', patientId);
    if (patientId) {
      // First, try to get patient by ABHA ID to get the actual patient ID
      lookupPatientByABHA();
      
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (loading) {
          console.log('Request timeout triggered');
          setError('Request timeout. Please try again.');
          setLoading(false);
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [patientId]);

  const checkExistingAccess = async (actualPatientId = null) => {
    try {
      const patientIdToUse = actualPatientId || patientId;
      const response = await api.get(`/patient-access/patient/${patientIdToUse}`);
      
      if (response.data.success) {
        setAccessInfo(response.data.data.accessInfo);
        setHasAccess(true);
        
        // Check if access is still valid
        const remainingTime = response.data.data.accessInfo.remainingTime;
        if (remainingTime <= 0) {
          setAccessExpired(true);
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.log('No existing access or access expired');
      setHasAccess(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      console.log('Requesting access for ABHA ID:', patientId, 'Duration:', consentDuration);
      setRequestingAccess(true);
      const response = await api.post('/patient-access/request-access', {
        abhaId: patientId, // patientId is the ABHA ID from the URL
        consentDuration: consentDuration
      });

      console.log('Access request response:', response.data);

      if (response.data.success) {
        message.success('OTP sent to patient mobile number');
        setAccessId(response.data.data.accessId);
        setConsentModalVisible(false);
        setOtpModalVisible(true);
        // Show the OTP in the modal (for demo purposes)
        setOtp('081106'); // Default OTP as requested
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      message.error(error.response?.data?.error || 'Failed to request access');
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setOtpLoading(true);
      const response = await api.post('/patient-access/verify-otp', {
        accessId: accessId,
        otp: otp
      });

      if (response.data.success) {
        message.success('Access granted successfully!');
        setOtpModalVisible(false);
        setHasAccess(true);
        // Refresh patient data
        await lookupPatientByABHA();
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    console.log('Rendering loading state for patientId:', patientId);
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Text>Loading patient data for ABHA ID: {patientId}</Text>
          <br />
          <Text type="secondary">Please wait...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: 400, textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <Title level={3}>Error</Title>
            <Text type="danger">{error}</Text>
            <br /><br />
            <Button onClick={() => navigate('/admin-dashboard')}>
              Back to Dashboard
            </Button>
            <br /><br />
            <Button onClick={() => navigate('/patient/12-3456-7890-0001')}>
              Test with Valid ABHA ID
            </Button>
          </Card>
        </Content>
      </Layout>
    );
  }

  if (!hasAccess && !accessExpired) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card className="access-required-card" style={{ width: 400 }}>
            <LockOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={3}>Patient Access Required</Title>
            <Text type="secondary">
              You need to request access to view this patient's records. 
              An OTP will be sent to the patient's mobile number for consent.
            </Text>
            <br /><br />
            <Button 
              className="request-access-button"
              size="large"
              onClick={() => {
                console.log('Request access clicked');
                setConsentModalVisible(true);
              }}
            >
              Request Access
            </Button>
          </Card>
        </Content>
        
        {/* Consent Duration Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center' }}>
              <LockOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
              Set Consent Duration
            </div>
          }
          open={consentModalVisible}
          onCancel={() => setConsentModalVisible(false)}
          footer={null}
          centered
          className="consent-modal"
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Text>Select the duration for which the patient grants access to their records.</Text>
          </div>
          
          <Form layout="vertical">
            <Form.Item label="Consent Validity">
              <Select
                value={consentDuration}
                onChange={setConsentDuration}
                style={{ width: '100%' }}
                className="consent-duration-select"
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
              loading={requestingAccess}
              onClick={handleRequestAccess}
              style={{ width: '100%' }}
              icon={<LockOutlined />}
              className="send-otp-button"
            >
              Send OTP
            </Button>
          </Form>
        </Modal>

        {/* OTP Verification Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center' }}>
              <LockOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
              Patient Consent Required
            </div>
          }
          open={otpModalVisible}
          onCancel={() => setOtpModalVisible(false)}
          footer={null}
          centered
          className="otp-modal"
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Text>Please enter <strong>081106</strong> as 6-digit code to proceed.</Text>
          </div>
          
          <Form layout="vertical">
            <Form.Item>
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="otp-input"
              />
            </Form.Item>
            
            <Button
              type="primary"
              size="large"
              loading={otpLoading}
              onClick={handleVerifyOTP}
              style={{ width: '100%' }}
              icon={<CheckCircleOutlined />}
              className="verify-button"
            >
              Verify & Access Records
            </Button>
          </Form>
        </Modal>
      </Layout>
    );
  }

  if (accessExpired) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card className="access-expired-card" style={{ width: 400 }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <Title level={3}>Access Expired</Title>
            <Text type="secondary">
              Your access to this patient's records has expired. 
              Please request new access.
            </Text>
            <br /><br />
            <Button 
              className="request-access-button"
              size="large"
              onClick={() => setConsentModalVisible(true)}
            >
              Request New Access
            </Button>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="secure-patient-viewer" style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="header-actions">
          <Title level={3} className="patient-name-header" style={{ margin: 0 }}>
            <UserOutlined /> Patient Records - {patient?.name}
          </Title>
          <Space>
            {accessInfo && (
              <Tag color="green" icon={<ClockCircleOutlined />} className="access-info-tag">
                Access expires in: {formatTimeRemaining(accessInfo.remainingTime)}
              </Tag>
            )}
            <Button className="back-button" onClick={() => navigate('/admin-dashboard')}>
              Back to Dashboard
            </Button>
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
          <Card title="Patient Profile" size="small" className="patient-profile-card">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{patient?.name}</Descriptions.Item>
              <Descriptions.Item label="Age">{patient?.profile?.age}</Descriptions.Item>
              <Descriptions.Item label="Gender">{patient?.profile?.gender}</Descriptions.Item>
              <Descriptions.Item label="Blood Type">
                <Tag color="red">{patient?.profile?.bloodType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ABHA ID">{patient?.abhaId}</Descriptions.Item>
              <Descriptions.Item label="Phone">
                <PhoneOutlined /> {patient?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <MailOutlined /> {patient?.email}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Critical Health Info</Title>
            {patient?.profile?.allergies?.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Allergies:</Text>
                <br />
                {patient.profile.allergies.map((allergy, index) => (
                  <Tag key={index} color="orange">{allergy}</Tag>
                ))}
              </div>
            )}

            {patient?.profile?.medicalConditions?.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Medical Conditions:</Text>
                <br />
                {patient.profile.medicalConditions.map((condition, index) => (
                  <Tag key={index} color="blue">{condition}</Tag>
                ))}
              </div>
            )}

            {patient?.profile?.currentMedications?.length > 0 && (
              <div>
                <Text strong>Current Medications:</Text>
                <br />
                {patient.profile.currentMedications.map((med, index) => (
                  <Tag key={index} color="green">{med.name}</Tag>
                ))}
              </div>
            )}
          </Card>
        </Sider>

        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Card title="Complete Medical History" style={{ marginBottom: '24px' }} className="medical-history-card">
            <Timeline>
              {healthRecords.map((record, index) => (
                <Timeline.Item
                  key={index}
                  dot={<MedicineBoxOutlined />}
                  color="blue"
                >
                  <Card size="small" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={5} style={{ margin: 0 }}>{record.title}</Title>
                      <Text type="secondary">
                        <CalendarOutlined /> {new Date(record.date).toLocaleDateString()}
                      </Text>
                    </div>
                    <Text>{record.description}</Text>
                    
                    {record.diagnosis?.primary && (
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Diagnosis: </Text>
                        <Tag color="red">{record.diagnosis.primary}</Tag>
                      </div>
                    )}

                    {record.medications?.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Medications: </Text>
                        {record.medications.map((med, medIndex) => (
                          <Tag key={medIndex} color="green">{med.name}</Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SecurePatientViewer;
