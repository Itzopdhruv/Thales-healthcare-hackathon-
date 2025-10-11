import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Avatar,
  Progress,
  Timeline,
  Tabs,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Form,
  Switch,
  Badge
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI } from '../services/api';
import AdminAppointmentManagement from '../components/AdminAppointmentManagement';
import {
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  SearchOutlined,
  PlusOutlined,
  BellOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  CreditCardOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import './AdminDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPatientLookupVisible, setIsPatientLookupVisible] = useState(false);
  const [isCreatePatientVisible, setIsCreatePatientVisible] = useState(false);
  const [isConsentVisible, setIsConsentVisible] = useState(false);
  const [patientFound, setPatientFound] = useState(null);
  const [consentCode, setConsentCode] = useState('');
  const [generatedABHAId, setGeneratedABHAId] = useState('');
  const [isGeneratingABHA, setIsGeneratingABHA] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Mock data
  const hospitals = [
    {
      key: '1',
      name: 'Apollo Hospitals',
      location: 'Mumbai',
      status: 'Active',
      patients: 15420,
      doctors: 156,
      lastSync: '2025-01-15 10:30'
    },
    {
      key: '2',
      name: 'Max Healthcare',
      location: 'Delhi',
      status: 'Active',
      patients: 12350,
      doctors: 98,
      lastSync: '2025-01-15 09:45'
    },
    {
      key: '3',
      name: 'Fortis Healthcare',
      location: 'Bangalore',
      status: 'Maintenance',
      patients: 8750,
      doctors: 67,
      lastSync: '2025-01-14 16:20'
    }
  ];

  const users = [
    {
      key: '1',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@apollo.com',
      role: 'Doctor',
      hospital: 'Apollo Hospitals',
      status: 'Active',
      lastLogin: '2025-01-15 08:30'
    },
    {
      key: '2',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Patient',
      hospital: 'N/A',
      status: 'Active',
      lastLogin: '2025-01-15 07:45'
    },
    {
      key: '3',
      name: 'Dr. Priya Sharma',
      email: 'priya@max.com',
      role: 'Doctor',
      hospital: 'Max Healthcare',
      status: 'Inactive',
      lastLogin: '2025-01-10 14:20'
    }
  ];

  const systemAlerts = [
    { type: 'warning', message: 'High server load detected', time: '2 minutes ago' },
    { type: 'info', message: 'Database backup completed', time: '1 hour ago' },
    { type: 'error', message: 'Hospital sync failed - Fortis Healthcare', time: '3 hours ago' },
    { type: 'success', message: 'New hospital onboarded - Manipal', time: '1 day ago' }
  ];

  const hospitalColumns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Patients',
      dataIndex: 'patients',
      key: 'patients',
      render: (patients) => patients.toLocaleString()
    },
    {
      title: 'Doctors',
      dataIndex: 'doctors',
      key: 'doctors',
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">View</Button>
          <Button type="link" size="small">Sync</Button>
          <Button type="link" size="small">Settings</Button>
        </Space>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Doctor' ? 'blue' : role === 'Patient' ? 'green' : 'purple'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Hospital',
      dataIndex: 'hospital',
      key: 'hospital',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">Edit</Button>
          <Button type="link" size="small" danger>Suspend</Button>
        </Space>
      ),
    },
  ];

  const handleAddHospital = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      console.log('New hospital:', values);
      message.success('Hospital added successfully');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handlePatientLookup = async (values) => {
    try {
      const result = await patientAPI.lookupPatient(values.abhaNumber);
      
      if (result.success) {
        const patientData = {
          name: result.data.patient.name,
          abhaId: result.data.patient.abhaId,
          age: result.data.patient.profile?.dateOfBirth ? 
            new Date().getFullYear() - new Date(result.data.patient.profile.dateOfBirth).getFullYear() : 'N/A',
          gender: result.data.patient.profile?.gender || 'N/A',
          bloodType: result.data.patient.profile?.bloodType || 'N/A',
          email: result.data.patient.email,
          phone: result.data.patient.phone,
          healthRecords: result.data.healthRecords
        };
        
        setPatientFound(patientData);
        setIsPatientLookupVisible(false);
        
        // Don't navigate away - stay on admin dashboard to show health metrics button
        message.success('Patient found! You can now manage health metrics or view complete history.');
      } else {
        message.error(result.error || 'Patient not found with this ABHA number');
      }
    } catch (error) {
      console.error('Error looking up patient:', error);
      message.error(error.error || 'Failed to lookup patient');
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

  const handleGenerateABHA = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsGeneratingABHA(true);
      const result = await patientAPI.generateABHAId();
      
      if (result.success) {
        const abhaId = result.data.abhaId;
        setGeneratedABHAId(abhaId);
        // Update the form field value
        form.setFieldsValue({ abhaId: abhaId });
        message.success(`ABHA ID generated successfully: ${abhaId}`);
      } else {
        message.error(result.error || 'Failed to generate ABHA ID');
      }
    } catch (error) {
      console.error('Error generating ABHA ID:', error);
      message.error(error.error || 'Failed to generate ABHA ID');
    } finally {
      setIsGeneratingABHA(false);
    }
  };

  const handleCopyABHA = () => {
    const abhaId = form.getFieldValue('abhaId') || generatedABHAId;
    if (abhaId) {
      navigator.clipboard.writeText(abhaId).then(() => {
        message.success('ABHA ID copied to clipboard!');
      }).catch(() => {
        message.error('Failed to copy ABHA ID');
      });
    } else {
      message.warning('No ABHA ID to copy. Please generate one first.');
    }
  };

  const handleAutoFillTestData = () => {
    // Completely different approach - no event handling
    const timestamp = Date.now();
    const testData = {
      fullName: "John Doe",
      age: 30,
      gender: "male",
      dateOfBirth: dayjs("1994-01-15"), // Use dayjs object for DatePicker
      bloodType: "O+",
      phoneNumber: `987654${timestamp.toString().slice(-4)}`, // Make phone unique
      email: `john.doe.${timestamp}@example.com`, // Make email unique
      emergencyContact: "Jane Doe 9876543211",
      street: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      allergies: "None",
      medicalConditions: "None",
      medications: "None"
    };

    // Use a different method to set form values
    try {
      if (form) {
        // Set values using a different approach
        form.setFieldsValue(testData);
        message.success('Test data filled successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to fill test data');
    }
  };

  const handleCreatePatient = async (values) => {
    try {
      console.log('Form values received:', values);
      
      // Validate required fields
      if (!values.fullName || !values.age || !values.gender || !values.dateOfBirth || !values.phoneNumber) {
        message.error('Please fill in all required fields');
        return;
      }

      // Validate ABHA ID
      if (!values.abhaId && !generatedABHAId) {
        message.error('Please generate an ABHA ID before creating the patient');
        return;
      }

      // Prepare patient data for API
      const patientData = {
        fullName: values.fullName,
        age: parseInt(values.age),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth?.format ? values.dateOfBirth.format('YYYY-MM-DD') : values.dateOfBirth,
        bloodType: values.bloodType || '',
        phoneNumber: values.phoneNumber,
        emergencyContact: values.emergencyContact || '',
        allergies: values.allergies || '',
        medicalConditions: values.medicalConditions || '',
        medications: values.medications || '',
        email: values.email || '',
        abhaId: values.abhaId || generatedABHAId, // Include the ABHA ID from form or generated state
        address: {
          street: values.street || '',
          city: values.city || '',
          state: values.state || '',
          pincode: values.pincode || '',
          country: 'India'
        }
      };

      console.log('Creating patient with data:', patientData);
      message.loading('Creating patient record...', 0);

      // Call the API to create patient with ABHA ID
      const result = await patientAPI.createPatientWithABHA(patientData);
      
      message.destroy(); // Clear loading message
      
      if (result.success) {
        message.success(`Patient record created successfully! ABHA ID: ${result.data.abhaId}`);
        setIsCreatePatientVisible(false);
        
        // Reset form and clear generated ABHA ID
        form.resetFields();
        setGeneratedABHAId('');
      } else {
        message.error(result.error || 'Failed to create patient record');
      }
    } catch (error) {
      message.destroy(); // Clear loading message
      console.error('Error creating patient:', error);
      message.error(error.error || 'Failed to create patient record');
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <Layout className="admin-dashboard">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-aayu">आ</span>
              <span className="logo-link">yulink</span>
            </div>
            <Title level={4} className="welcome-text">
              Admin Dashboard - System Overview
            </Title>
          </div>
          <div className="header-right">
            <Space>
              <Badge count={3}>
                <Button icon={<BellOutlined />} shape="circle" />
              </Badge>
              <Button icon={<SettingOutlined />} shape="circle" />
              <Button 
                type="primary" 
                danger 
                onClick={handleLogout}
                icon={<UserOutlined />}
              >
                Logout
              </Button>
            </Space>
          </div>
        </div>
      </Header>

      <Layout>
        <Sider width={250} className="dashboard-sider">
          <div className="sider-content">
            <div className="user-profile">
              <Avatar size={80} icon={<UserOutlined />} />
              <Title level={5}>System Administrator</Title>
              <Text type="secondary">Admin Panel</Text>
              <Text type="secondary">Access Level: Full</Text>
            </div>
            
            <div className="sider-menu">
              <Button 
                type={activeTab === 'overview' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('overview')}
              >
                <BarChartOutlined /> Overview
              </Button>
              <Button 
                type={activeTab === 'hospitals' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('hospitals')}
              >
                <MedicineBoxOutlined /> Hospitals
              </Button>
              <Button 
                type={activeTab === 'users' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('users')}
              >
                <TeamOutlined /> Users
              </Button>
              <Button 
                type={activeTab === 'analytics' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('analytics')}
              >
                <BarChartOutlined /> Analytics
              </Button>
              <Button 
                type={activeTab === 'system' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('system')}
              >
                <DatabaseOutlined /> System
              </Button>
              <Button 
                type={activeTab === 'security' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('security')}
              >
                <SafetyOutlined /> Security
              </Button>
              <Button 
                type={activeTab === 'appointments' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('appointments')}
              >
                <ScheduleOutlined /> Appointments
              </Button>
            </div>
          </div>
        </Sider>

        <Content className="dashboard-content">
          <div className="content-wrapper">
            {activeTab === 'overview' && (
              <>
                <Row gutter={[24, 24]} className="stats-row">
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Total Hospitals"
                        value={247}
                        prefix={<MedicineBoxOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Active Users"
                        value={15420}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Health Records"
                        value={125000}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="System Uptime"
                        value={99.9}
                        suffix="%"
                        prefix={<GlobalOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card title="System Alerts" className="alerts-card">
                      <Timeline>
                        {systemAlerts.map((alert, index) => (
                          <Timeline.Item 
                            key={index} 
                            color={alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'orange' : alert.type === 'success' ? 'green' : 'blue'}
                          >
                            <Text strong>{alert.message}</Text>
                            <br />
                            <Text type="secondary">{alert.time}</Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="System Health" className="health-card">
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div className="health-metric">
                          <Text strong>Server Performance</Text>
                          <Progress percent={85} status="active" />
                        </div>
                        <div className="health-metric">
                          <Text strong>Database Usage</Text>
                          <Progress percent={67} status="active" />
                        </div>
                        <div className="health-metric">
                          <Text strong>Network Latency</Text>
                          <Progress percent={92} status="active" />
                        </div>
                        <div className="health-metric">
                          <Text strong>Storage Capacity</Text>
                          <Progress percent={45} status="active" />
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                  <Col xs={24}>
                    <Card 
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MedicineBoxOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                          <span>Admin Functions</span>
                        </div>
                      } 
                      className="admin-functions-card"
                      style={{ border: '2px solid #1890ff', borderRadius: '12px' }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={8}>
                          <Card 
                            hoverable
                            className="function-card"
                            onClick={() => setIsPatientLookupVisible(true)}
                            style={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <div className="function-icon" style={{ color: 'white' }}>
                              <SearchOutlined />
                            </div>
                            <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>Patient Lookup</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Search patients using ABHA number</Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                          <Card 
                            hoverable
                            className="function-card"
                            onClick={() => setIsCreatePatientVisible(true)}
                            style={{ 
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <div className="function-icon" style={{ color: 'white' }}>
                              <PlusOutlined />
                            </div>
                            <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>Create Patient Record</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Add new patient to the system</Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                          <Card 
                            hoverable
                            className="function-card"
                            onClick={() => message.info('Emergency access functionality coming soon')}
                            style={{ 
                              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <div className="function-icon" style={{ color: 'white' }}>
                              <ExclamationCircleOutlined />
                            </div>
                            <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>Emergency Access</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Quick access for emergency cases</Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {activeTab === 'hospitals' && (
              <Card title="Hospital Management" className="hospitals-card">
                <div className="card-actions">
                  <Space>
                    <Search
                      placeholder="Search hospitals..."
                      style={{ width: 300 }}
                      prefix={<SearchOutlined />}
                    />
                    <Select placeholder="Filter by status" style={{ width: 200 }}>
                      <Option value="active">Active</Option>
                      <Option value="maintenance">Maintenance</Option>
                      <Option value="inactive">Inactive</Option>
                    </Select>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddHospital}>
                      Add Hospital
                    </Button>
                  </Space>
                </div>
                <Table 
                  columns={hospitalColumns} 
                  dataSource={hospitals}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )}

            {activeTab === 'users' && (
              <Card title="User Management" className="users-card">
                <div className="card-actions">
                  <Space>
                    <Search
                      placeholder="Search users..."
                      style={{ width: 300 }}
                      prefix={<SearchOutlined />}
                    />
                    <Select placeholder="Filter by role" style={{ width: 200 }}>
                      <Option value="doctor">Doctor</Option>
                      <Option value="patient">Patient</Option>
                      <Option value="admin">Admin</Option>
                    </Select>
                    <Button type="primary" icon={<UserAddOutlined />}>
                      Add User
                    </Button>
                  </Space>
                </div>
                <Table 
                  columns={userColumns} 
                  dataSource={users}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="User Growth" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      <Text>Monthly User Registration</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Hospital Distribution" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                      <Text>Hospitals by State</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="System Performance" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />
                      <Text>Response Time Trends</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Data Usage" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#722ed1' }} />
                      <Text>Storage Usage by Hospital</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === 'system' && (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="System Configuration" className="system-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div className="config-item">
                        <Text strong>Auto Backup</Text>
                        <Switch defaultChecked />
                      </div>
                      <div className="config-item">
                        <Text strong>Email Notifications</Text>
                        <Switch defaultChecked />
                      </div>
                      <div className="config-item">
                        <Text strong>API Rate Limiting</Text>
                        <Switch defaultChecked />
                      </div>
                      <div className="config-item">
                        <Text strong>Maintenance Mode</Text>
                        <Switch />
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Database Status" className="database-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div className="db-metric">
                        <Text strong>Connection Pool</Text>
                        <Progress percent={75} status="active" />
                      </div>
                      <div className="db-metric">
                        <Text strong>Query Performance</Text>
                        <Progress percent={88} status="active" />
                      </div>
                      <div className="db-metric">
                        <Text strong>Index Usage</Text>
                        <Progress percent={92} status="active" />
                      </div>
                      <div className="db-metric">
                        <Text strong>Cache Hit Rate</Text>
                        <Progress percent={95} status="active" />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === 'security' && (
              <Card title="Security Dashboard" className="security-card">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card title="Access Logs" type="inner">
                      <Timeline>
                        <Timeline.Item color="green">
                          <Text strong>Admin login - 2025-01-15 08:30</Text>
                          <br />
                          <Text type="secondary">IP: 192.168.1.100</Text>
                        </Timeline.Item>
                        <Timeline.Item color="blue">
                          <Text strong>Doctor access - 2025-01-15 07:45</Text>
                          <br />
                          <Text type="secondary">IP: 192.168.1.101</Text>
                        </Timeline.Item>
                        <Timeline.Item color="orange">
                          <Text strong>Failed login attempt - 2025-01-15 06:20</Text>
                          <br />
                          <Text type="secondary">IP: 192.168.1.102</Text>
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="Security Settings" type="inner">
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div className="security-item">
                          <Text strong>Two-Factor Authentication</Text>
                          <Switch defaultChecked />
                        </div>
                        <div className="security-item">
                          <Text strong>Session Timeout</Text>
                          <Select defaultValue="30" style={{ width: 100 }}>
                            <Option value="15">15 min</Option>
                            <Option value="30">30 min</Option>
                            <Option value="60">1 hour</Option>
                          </Select>
                        </div>
                        <div className="security-item">
                          <Text strong>Password Policy</Text>
                          <Button type="link" size="small">Configure</Button>
                        </div>
                        <div className="security-item">
                          <Text strong>API Security</Text>
                          <Button type="link" size="small">Review</Button>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {activeTab === 'appointments' && (
              <AdminAppointmentManagement />
            )}
          </div>
        </Content>
      </Layout>

      <Modal
        title="Add New Hospital"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Hospital Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Hospital Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="public">Public</Option>
                  <Option value="private">Private</Option>
                  <Option value="charity">Charity</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contact" label="Contact Information">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

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
                placeholder="e.g., 12-34-56-78"
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
        onCancel={() => {
          setPatientFound(null);
        }}
        footer={null}
        className="patient-found-modal"
        width={800}
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
              onClick={() => {
                navigate(`/patient/${patientFound?.abhaId}`);
              }}
            >
              View Complete Medical History
            </Button>
            
            
            
            <Button
              type="primary"
              danger
              block
              icon={<MedicineBoxOutlined />}
              className="emergency-button"
              onClick={() => {
                navigate(`/patient/${patientFound?.abhaId}`);
              }}
            >
              Emergency Mode
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
            
            <Button
              type="default"
              block
              onClick={() => {
                setPatientFound(null);
              }}
              style={{ marginTop: '8px' }}
            >
              Close Modal
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
          form={form}
          key="create-patient-form"
        >
          <div className="form-section">
            <Title level={4}>Authorization & Patient ID</Title>
            <Form.Item 
              name="authorization" 
              label="Authorization"
              initialValue="sih"
            >
              <Input placeholder="Enter authorization code" />
            </Form.Item>
            <Form.Item 
              name="abhaId" 
              label="ABHA ID"
              initialValue=""
            >
              <Input 
                placeholder="Click Generate to create ABHA ID (XX-XX-XX-XX)"
                addonAfter={
                  <Space>
                    <Button 
                      size="small" 
                      icon={<CalendarOutlined />}
                      onClick={handleGenerateABHA}
                      loading={isGeneratingABHA}
                      htmlType="button"
                    >
                      Generate
                    </Button>
                    <Button 
                      size="small" 
                      icon={<CreditCardOutlined />}
                      onClick={handleCopyABHA}
                      htmlType="button"
                    >
                      Copy
                    </Button>
                  </Space>
                }
              />
            </Form.Item>
          </div>

          <div className="form-section">
            <div className="section-header">
              <Title level={4}>Personal Information</Title>
              <div 
                onClick={handleAutoFillTestData}
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: '1px solid #52c41a',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#73d13d';
                  e.target.style.borderColor = '#73d13d';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#52c41a';
                  e.target.style.borderColor = '#52c41a';
                }}
              >
                <UserAddOutlined style={{ marginRight: '6px' }} />
                Auto Fill Test Data
              </div>
            </div>
            <Form.Item 
              name="fullName" 
              label="Full Name"
              rules={[{ required: true, message: 'Please enter full name' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
            
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item 
                name="age" 
                label="Age"
                rules={[{ required: true, message: 'Please enter age' }]} 
                style={{ width: '50%' }}
              >
                <Input placeholder="Enter age" type="number" />
              </Form.Item>
              <Form.Item 
                name="gender" 
                label="Gender"
                rules={[{ required: true, message: 'Please select gender' }]} 
                style={{ width: '50%' }}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Space.Compact>

            <Space.Compact style={{ width: '100%' }}>
              <Form.Item 
                name="dateOfBirth" 
                label="Date of Birth"
                rules={[{ required: true, message: 'Please select date of birth' }]} 
                style={{ width: '50%' }}
              >
                <DatePicker 
                  placeholder="Select date" 
                  style={{ width: '100%' }} 
                  getPopupContainer={(trigger) => trigger.parentElement}
                  placement="bottomLeft"
                />
              </Form.Item>
              <Form.Item 
                name="bloodType" 
                label="Blood Type"
                style={{ width: '50%' }}
              >
                <Input placeholder="e.g., AB+" />
              </Form.Item>
            </Space.Compact>

            <Form.Item 
              name="phoneNumber" 
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter 10-digit phone number" />
            </Form.Item>
            
            <Form.Item 
              name="email" 
              label="Email Address"
            >
              <Input placeholder="Enter email address (optional)" />
            </Form.Item>
            
            <Form.Item 
              name="emergencyContact" 
              label="Emergency Contact"
            >
              <Input placeholder="Name & Phone Number" />
            </Form.Item>
          </div>

          <div className="form-section">
            <Title level={4}>Address Information</Title>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item 
                name="street" 
                label="Street Address"
                style={{ width: '70%' }}
              >
                <Input placeholder="Enter street address" />
              </Form.Item>
              <Form.Item 
                name="pincode" 
                label="Pincode"
                style={{ width: '30%' }}
              >
                <Input placeholder="Enter pincode" />
              </Form.Item>
            </Space.Compact>
            
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item 
                name="city" 
                label="City"
                style={{ width: '50%' }}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
              <Form.Item 
                name="state" 
                label="State"
                style={{ width: '50%' }}
              >
                <Input placeholder="Enter state" />
              </Form.Item>
            </Space.Compact>
          </div>

          <div className="form-section">
            <Title level={4}>Critical Health Info</Title>
            <Form.Item 
              name="allergies" 
              label="Known Allergies"
            >
              <Input.TextArea placeholder="Enter any known allergies" rows={3} />
            </Form.Item>
            <Form.Item 
              name="medicalConditions" 
              label="Existing Medical Conditions"
            >
              <Input.TextArea placeholder="Enter any existing medical conditions" rows={3} />
            </Form.Item>
            <Form.Item 
              name="medications" 
              label="Current Medications"
            >
              <Input.TextArea placeholder="Enter current medications" rows={3} />
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
    </Layout>
  );
};

export default AdminDashboard;
