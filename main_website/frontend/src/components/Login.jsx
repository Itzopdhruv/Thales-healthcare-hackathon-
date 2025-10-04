import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs, Divider, Select, Radio, Modal, DatePicker, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, CreditCardOutlined, MedicineBoxOutlined, CalendarOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('individual');
  const [isPatientLookupVisible, setIsPatientLookupVisible] = useState(false);
  const [isCreatePatientVisible, setIsCreatePatientVisible] = useState(false);
  const [isConsentVisible, setIsConsentVisible] = useState(false);
  const [patientFound, setPatientFound] = useState(null);
  const [consentCode, setConsentCode] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const onLogin = async (values) => {
    setLoading(true);
    const loginData = {
      email: values.email || values.username + '@example.com', // Use email if provided, otherwise generate from username
      password: values.password
    };
    const result = await login(loginData);
    setLoading(false);
    
    if (result.success) {
      message.success('Login successful!');
      // Redirect based on active tab for now, will be improved with user role
      if (activeTab === 'admin') {
        navigate('/admin-dashboard');
      } else if (activeTab === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } else {
      message.error(result.error);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    const registrationData = { 
      username: values.username, // Use username as unique identifier
      name: values.fullName || values.username, // Use fullName if provided, otherwise username
      email: values.email || values.username + '@example.com', // Use email if provided, otherwise generate
      password: values.password,
      role: (activeTab === 'admin' || activeTab === 'register-admin') ? 'admin' : 'patient'
    };
    
    // Add admin-specific fields if registering as admin
    if (activeTab === 'admin' || activeTab === 'register-admin') {
      registrationData.hospitalName = values.hospitalName;
      registrationData.hospitalCode = values.hospitalCode;
    }
    
    const result = await register(registrationData);
    setLoading(false);
    
    if (result.success) {
      message.success('Registration successful!');
      if (activeTab === 'admin' || activeTab === 'register-admin') {
        navigate('/admin-dashboard');
      } else if (activeTab === 'doctor' || activeTab === 'register-doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } else {
      message.error(result.error);
    }
  };

  const handlePatientLookup = (values) => {
    // Mock patient lookup
    if (values.abhaNumber === '12-3456-7890-0001') {
      setPatientFound({
        name: 'Tanish Kumar',
        abhaId: '12-3456-7890-0001',
        age: 20,
        gender: 'Male',
        bloodType: 'AB+'
      });
      setIsPatientLookupVisible(false);
      setIsConsentVisible(true);
    } else {
      message.error('Patient not found with this ABHA number');
    }
  };

  const handleConsentVerification = () => {
    if (consentCode === '081106') {
      message.success('Consent verified! Accessing patient records...');
      setIsConsentVisible(false);
      // Navigate to patient records view
      navigate('/admin-patient-view');
    } else {
      message.error('Invalid consent code');
    }
  };

  const handleCreatePatient = (values) => {
    message.success('Patient record created successfully!');
    setIsCreatePatientVisible(false);
  };

  const tabItems = [
    {
      key: 'individual',
      label: 'Individual',
      children: (
        <div>
          <Form
            name="login"
            onFinish={onLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                Login
              </Button>
            </Form.Item>
          </Form>

          <div className="register-link">
            <Text>Don't have an account? </Text>
            <Button type="link" onClick={() => setActiveTab('register-individual')}>
              Sign Up
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'admin',
      label: 'Admin',
      children: (
        <div>
          <Form
            name="admin-login"
            onFinish={onLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                Login
              </Button>
            </Form.Item>
          </Form>

          <div className="register-link">
            <Text>Don't have an account? </Text>
            <Button type="link" onClick={() => setActiveTab('register-admin')}>
              Sign Up
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'register-individual',
      label: 'Individual',
      children: (
        <div>
          <Form
            name="register-individual"
            onFinish={onRegister}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your username!' },
                { min: 3, message: 'Username must be at least 3 characters!' },
                { max: 30, message: 'Username cannot exceed 30 characters!' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your full name"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Re-enter your password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="signup-button"
              >
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div className="login-link">
            <Text>Already have an account? </Text>
            <Button type="link" onClick={() => setActiveTab('individual')}>
              Login
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'register-admin',
      label: 'Admin',
      children: (
        <div>
          <Form
            name="register-admin"
            onFinish={onRegister}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your username!' },
                { min: 3, message: 'Username must be at least 3 characters!' },
                { max: 30, message: 'Username cannot exceed 30 characters!' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your full name"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Re-enter your password"
              />
            </Form.Item>

            <Form.Item
              name="hospitalName"
              rules={[{ required: true, message: 'Please input hospital name!' }]}
            >
              <Input
                prefix={<MedicineBoxOutlined />}
                placeholder="e.g., Apollo Hospital, Mumbai"
              />
            </Form.Item>

            <Form.Item
              name="hospitalCode"
              rules={[{ required: true, message: 'Please input hospital code!' }]}
            >
              <Input
                prefix={<CalendarOutlined />}
                placeholder="e.g., APOLLO-MUM-01"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="signup-button"
              >
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div className="login-link">
            <Text>Already have an account? </Text>
            <Button type="link" onClick={() => setActiveTab('admin')}>
              Login
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2} className="login-title">
            AayuLink
          </Title>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="login-tabs"
        />

        <Divider className="login-divider">
          <Text type="secondary" className="divider-text">
            Aligned with ABDM (Ayushman Bharat Digital Mission)
          </Text>
        </Divider>
      </Card>

      {/* Patient Lookup Modal */}
      <Modal
        title="Patient Lookup"
        open={isPatientLookupVisible}
        onCancel={() => setIsPatientLookupVisible(false)}
        footer={null}
        className="patient-lookup-modal"
      >
        <div className="patient-lookup-content">
          <Text className="lookup-instruction">
            Enter an ABHA number to find a patient's record.
          </Text>
          
          <Form
            name="patient-lookup"
            onFinish={handlePatientLookup}
            layout="vertical"
            className="lookup-form"
          >
            <Form.Item
              name="abhaNumber"
              rules={[{ required: true, message: 'Please enter ABHA number!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="e.g., 12-3456-7890-0001"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                icon={<SearchOutlined />}
                className="find-patient-button"
              >
                Find Patient
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="link"
            block
            icon={<PlusOutlined />}
            onClick={() => {
              setIsPatientLookupVisible(false);
              setIsCreatePatientVisible(true);
            }}
            className="create-abha-link"
          >
            Create a new ABHA ID for a patient
          </Button>
        </div>
      </Modal>

      {/* Patient Found Modal */}
      <Modal
        title="Patient Found:"
        open={patientFound && !isConsentVisible}
        onCancel={() => setPatientFound(null)}
        footer={null}
        className="patient-found-modal"
      >
        <div className="patient-found-content">
          <div className="patient-info">
            <Title level={3} className="patient-name">{patientFound?.name}</Title>
            <Text className="patient-abha">ABHA ID: {patientFound?.abhaId}</Text>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              block
              icon={<CalendarOutlined />}
              className="medical-history-button"
            >
              Get Complete Medical History
            </Button>
            <Button
              type="primary"
              danger
              block
              icon={<MedicineBoxOutlined />}
              className="emergency-button"
            >
              Quick Details (Emergency Mode)
            </Button>
          </Space>

          <Button
            type="link"
            block
            onClick={() => {
              setPatientFound(null);
              setIsPatientLookupVisible(true);
            }}
            className="lookup-another-link"
          >
            Look up another patient
          </Button>
        </div>
      </Modal>

      {/* Consent Duration Modal */}
      <Modal
        title="Set Consent Duration"
        open={isConsentVisible}
        onCancel={() => setIsConsentVisible(false)}
        footer={null}
        className="consent-modal"
      >
        <div className="consent-content">
          <div className="consent-icon">
            <MedicineBoxOutlined />
          </div>
          <Text className="consent-description">
            Select the duration for which {patientFound?.name} grants access to their records.
          </Text>
          
          <Form layout="vertical">
            <Form.Item label="Consent Validity">
              <Select defaultValue="24" size="large">
                <Select.Option value="24">24 Hours</Select.Option>
                <Select.Option value="48">48 Hours</Select.Option>
                <Select.Option value="72">72 Hours</Select.Option>
                <Select.Option value="168">1 Week</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                block
                size="large"
                icon={<MailOutlined />}
                onClick={() => {
                  setIsConsentVisible(false);
                  // Show OTP modal
                  message.info('OTP sent! Please check your messages.');
                }}
                className="send-otp-button"
              >
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Create Patient Record Modal */}
      <Modal
        title="Create New Patient Record"
        open={isCreatePatientVisible}
        onCancel={() => setIsCreatePatientVisible(false)}
        footer={null}
        className="create-patient-modal"
        width={800}
      >
        <Form
          name="create-patient"
          onFinish={handleCreatePatient}
          layout="vertical"
          className="create-patient-form"
        >
          <div className="form-section">
            <Title level={4}>Authorization & Patient ID</Title>
            <Form.Item name="authorization" initialValue="sih">
              <Input placeholder="sih" />
            </Form.Item>
            <Form.Item name="abhaId" initialValue="49-3156-8796-5762">
              <Input 
                placeholder="49-3156-8796-5762"
                addonAfter={
                  <Space>
                    <Button size="small" icon={<CalendarOutlined />}>Generate</Button>
                    <Button size="small" icon={<CreditCardOutlined />}>Copy</Button>
                  </Space>
                }
              />
            </Form.Item>
          </div>

          <div className="form-section">
            <Title level={4}>Personal Information</Title>
            <Form.Item name="fullName" rules={[{ required: true }]}>
              <Input placeholder="Full Name" />
            </Form.Item>
            
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="age" rules={[{ required: true }]} style={{ width: '50%' }}>
                <Input placeholder="Age" />
              </Form.Item>
              <Form.Item name="gender" rules={[{ required: true }]} style={{ width: '50%' }}>
                <Select placeholder="Gender">
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Space.Compact>

            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="dateOfBirth" rules={[{ required: true }]} style={{ width: '50%' }}>
                <DatePicker placeholder="dd/mm/yyyy" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="bloodType" style={{ width: '50%' }}>
                <Input placeholder="Blood Type (e.g., AB+)" />
              </Form.Item>
            </Space.Compact>

            <Form.Item name="phoneNumber" rules={[{ required: true }]}>
              <Input placeholder="Personal Phone Number" />
            </Form.Item>
            
            <Form.Item name="emergencyContact">
              <Input placeholder="Emergency Contact (Name & Number)" />
            </Form.Item>
          </div>

          <div className="form-section">
            <Title level={4}>Critical Health Info</Title>
            <Form.Item name="allergies">
              <Input.TextArea placeholder="Known Allergies" rows={3} />
            </Form.Item>
            <Form.Item name="medicalConditions">
              <Input.TextArea placeholder="Existing Medical Conditions" rows={3} />
            </Form.Item>
            <Form.Item name="medications">
              <Input.TextArea placeholder="Current Medications" rows={3} />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="create-patient-button"
            >
              Create Patient Record
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;