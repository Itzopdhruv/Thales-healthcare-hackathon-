import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Form
} from 'antd';
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
  ClockCircleOutlined
} from '@ant-design/icons';
import './DoctorDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data
  const patients = [
    {
      key: '1',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      lastVisit: '2025-01-15',
      condition: 'Hypertension',
      status: 'Active',
      nextAppointment: '2025-01-25'
    },
    {
      key: '2',
      name: 'Jane Smith',
      age: 32,
      gender: 'Female',
      lastVisit: '2025-01-14',
      condition: 'Diabetes',
      status: 'Active',
      nextAppointment: '2025-01-22'
    },
    {
      key: '3',
      name: 'Mike Johnson',
      age: 58,
      gender: 'Male',
      lastVisit: '2025-01-10',
      condition: 'Cardiac',
      status: 'Follow-up',
      nextAppointment: '2025-01-20'
    }
  ];

  const todayAppointments = [
    { time: '09:00 AM', patient: 'John Doe', type: 'Consultation', status: 'Confirmed' },
    { time: '10:30 AM', patient: 'Jane Smith', type: 'Follow-up', status: 'Confirmed' },
    { time: '02:00 PM', patient: 'Mike Johnson', type: 'Check-up', status: 'Pending' },
    { time: '03:30 PM', patient: 'Sarah Wilson', type: 'Consultation', status: 'Confirmed' }
  ];

  const recentDiagnoses = [
    { patient: 'John Doe', diagnosis: 'Hypertension Stage 1', date: '2025-01-15', severity: 'Moderate' },
    { patient: 'Jane Smith', diagnosis: 'Type 2 Diabetes', date: '2025-01-14', severity: 'Mild' },
    { patient: 'Mike Johnson', diagnosis: 'Atrial Fibrillation', date: '2025-01-10', severity: 'Severe' }
  ];

  const patientColumns = [
    {
      title: 'Patient Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Age/Gender',
      key: 'ageGender',
      render: (_, record) => `${record.age} / ${record.gender}`
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
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
      title: 'Next Appointment',
      dataIndex: 'nextAppointment',
      key: 'nextAppointment',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">View</Button>
          <Button type="link" size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  const handleAddPatient = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      console.log('New patient:', values);
      message.success('Patient added successfully');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <Layout className="doctor-dashboard">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-aayu">आ</span>
              <span className="logo-link">yulink</span>
            </div>
            <Title level={4} className="welcome-text">
              Dr. Rajesh Kumar - Cardiologist
            </Title>
          </div>
          <div className="header-right">
            <Space>
              <Button icon={<BellOutlined />} shape="circle" />
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
              <Title level={5}>Dr. Rajesh Kumar</Title>
              <Text type="secondary">Cardiologist</Text>
              <Text type="secondary">License: MD12345</Text>
            </div>
            
            <div className="sider-menu">
              <Button 
                type={activeTab === 'patients' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('patients')}
              >
                <TeamOutlined /> My Patients
              </Button>
              <Button 
                type={activeTab === 'appointments' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('appointments')}
              >
                <CalendarOutlined /> Appointments
              </Button>
              <Button 
                type={activeTab === 'diagnoses' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('diagnoses')}
              >
                <FileTextOutlined /> Diagnoses
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
                type={activeTab === 'emergency' ? 'primary' : 'text'}
                block
                className="menu-item emergency-btn"
                onClick={() => setActiveTab('emergency')}
              >
                <HeartOutlined /> Emergency
              </Button>
            </div>
          </div>
        </Sider>

        <Content className="dashboard-content">
          <div className="content-wrapper">
            {activeTab === 'patients' && (
              <>
                <Row gutter={[24, 24]} className="stats-row">
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Total Patients"
                        value={156}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Active Cases"
                        value={23}
                        prefix={<HeartOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Today's Appointments"
                        value={8}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                      <Statistic
                        title="Success Rate"
                        value={94}
                        suffix="%"
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Patient Management" className="patients-card">
                  <div className="card-actions">
                    <Space>
                      <Search
                        placeholder="Search patients..."
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                      />
                      <Select placeholder="Filter by condition" style={{ width: 200 }}>
                        <Option value="hypertension">Hypertension</Option>
                        <Option value="diabetes">Diabetes</Option>
                        <Option value="cardiac">Cardiac</Option>
                      </Select>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPatient}>
                        Add Patient
                      </Button>
                    </Space>
                  </div>
                  <Table 
                    columns={patientColumns} 
                    dataSource={patients}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </>
            )}

            {activeTab === 'appointments' && (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="Today's Schedule" className="schedule-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {todayAppointments.map((appointment, index) => (
                        <div key={index} className="appointment-item">
                          <div className="appointment-time">
                            <ClockCircleOutlined />
                            <Text strong>{appointment.time}</Text>
                          </div>
                          <div className="appointment-details">
                            <Text strong>{appointment.patient}</Text>
                            <br />
                            <Text type="secondary">{appointment.type}</Text>
                          </div>
                          <div className="appointment-status">
                            <Tag color={appointment.status === 'Confirmed' ? 'green' : 'orange'}>
                              {appointment.status}
                            </Tag>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Quick Actions" className="quick-actions-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Button type="primary" size="large" block>
                        Add New Appointment
                      </Button>
                      <Button type="default" size="large" block>
                        View Weekly Schedule
                      </Button>
                      <Button type="default" size="large" block>
                        Emergency Consultation
                      </Button>
                      <Button type="default" size="large" block>
                        Generate Report
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === 'diagnoses' && (
              <Card title="Recent Diagnoses" className="diagnoses-card">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {recentDiagnoses.map((diagnosis, index) => (
                    <div key={index} className="diagnosis-item">
                      <div className="diagnosis-header">
                        <Text strong style={{ fontSize: '16px' }}>{diagnosis.patient}</Text>
                        <Tag color={diagnosis.severity === 'Severe' ? 'red' : diagnosis.severity === 'Moderate' ? 'orange' : 'green'}>
                          {diagnosis.severity}
                        </Tag>
                      </div>
                      <div className="diagnosis-details">
                        <Text>{diagnosis.diagnosis}</Text>
                        <br />
                        <Text type="secondary">Diagnosed on {diagnosis.date}</Text>
                      </div>
                      <div className="diagnosis-actions">
                        <Button type="link" size="small">View Details</Button>
                        <Button type="link" size="small">Edit</Button>
                        <Button type="link" size="small">Share</Button>
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="Patient Demographics" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      <Text>Patient Age Distribution</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Treatment Success Rate" className="analytics-card">
                    <div className="chart-placeholder">
                      <BarChartOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                      <Text>Monthly Success Rate</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === 'emergency' && (
              <Card title="Emergency Services" className="emergency-card">
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12}>
                    <Card className="emergency-option" type="inner">
                      <div className="emergency-content">
                        <HeartOutlined className="emergency-icon" />
                        <Title level={4}>Emergency Consultation</Title>
                        <Paragraph>Provide emergency medical consultation</Paragraph>
                        <Button type="primary" danger size="large" block>
                          Start Emergency Call
                        </Button>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card className="emergency-option" type="inner">
                      <div className="emergency-content">
                        <FileTextOutlined className="emergency-icon" />
                        <Title level={4}>Emergency Records</Title>
                        <Paragraph>Access patient emergency health records</Paragraph>
                        <Button type="primary" size="large" block>
                          Access Records
                        </Button>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        </Content>
      </Layout>

      <Modal
        title="Add New Patient"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="age" label="Age" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="condition" label="Primary Condition">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DoctorDashboard;
