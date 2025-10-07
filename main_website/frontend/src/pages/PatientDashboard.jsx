import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI } from '../services/api';
import AIDoctorChatbot from '../components/AIDoctorChatbot';
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
  Upload,
  message
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined,
  BellOutlined,
  SettingOutlined,
  RobotOutlined
} from '@ant-design/icons';
import './PatientDashboard.css';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ records: 0, appts: 0, meds: 0, score: 0 });
  const [demographics, setDemographics] = useState({ age: 'N/A', gender: 'N/A', bloodType: 'N/A' });
  const [reloadTick, setReloadTick] = useState(0);
  const [showAIDoctor, setShowAIDoctor] = useState(false);
  const [aiDoctorReady, setAiDoctorReady] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Mock data
  const recentRecords = [
    {
      key: '1',
      date: '2025-01-15',
      hospital: 'Apollo Hospitals',
      doctor: 'Dr. Rajesh Kumar',
      specialty: 'Cardiology',
      status: 'Completed',
      type: 'Consultation'
    },
    {
      key: '2',
      date: '2025-01-10',
      hospital: 'Max Healthcare',
      doctor: 'Dr. Priya Sharma',
      specialty: 'Dermatology',
      status: 'Pending',
      type: 'Follow-up'
    },
    {
      key: '3',
      date: '2025-01-05',
      hospital: 'Fortis Healthcare',
      doctor: 'Dr. Amit Singh',
      specialty: 'Orthopedics',
      status: 'Completed',
      type: 'Surgery'
    }
  ];

  // Pull medications dynamically from latest prescriptions when available (fallback to sample)
  const [medications, setMedications] = useState([
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', nextRefill: '2025-02-15' },
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', nextRefill: '2025-02-20' },
    { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', nextRefill: '2025-02-25' }
  ]);

  const upcomingAppointments = [
    { date: '2025-01-20', time: '10:00 AM', doctor: 'Dr. Rajesh Kumar', specialty: 'Cardiology' },
    { date: '2025-01-25', time: '2:30 PM', doctor: 'Dr. Priya Sharma', specialty: 'Dermatology' }
  ];

  const healthMetrics = [
    { name: 'Blood Pressure', value: '120/80', status: 'Normal', color: '#52c41a' },
    { name: 'Heart Rate', value: '72 bpm', status: 'Normal', color: '#52c41a' },
    { name: 'Blood Sugar', value: '95 mg/dL', status: 'Normal', color: '#52c41a' },
    { name: 'Weight', value: '70 kg', status: 'Stable', color: '#1890ff' }
  ];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Hospital',
      dataIndex: 'hospital',
      key: 'hospital',
    },
    {
      title: 'Doctor',
      dataIndex: 'doctor',
      key: 'doctor',
    },
    {
      title: 'Specialty',
      dataIndex: 'specialty',
      key: 'specialty',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return '#52c41a';
      case 'Stable': return '#1890ff';
      case 'Warning': return '#faad14';
      case 'Critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully!');
    navigate('/login');
  };

  // Animate stats counters on mount
  useEffect(() => {
    const target = { records: 12, appts: 2, meds: 3, score: 85 };
    const duration = 800;
    const startTime = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setStats({
        records: Math.floor(ease * target.records),
        appts: Math.floor(ease * target.appts),
        meds: Math.floor(ease * target.meds),
        score: Math.floor(ease * target.score)
      });
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fetch medications from patient.currentMedications and recent prescriptions
  useEffect(() => {
    const loadMeds = async () => {
      try {
        if (!user?.abhaId) return;
        const combined = [];
        const seen = new Set();

        // Patient current medications
        const pRes = await patientAPI.lookupPatient(user.abhaId);
        const cm = pRes?.data?.patient?.currentMedications || [];
        cm.forEach(m => {
          const key = `${m.name}|${m.dosage}|${m.frequency}`;
          if (m.name && !seen.has(key)) {
            seen.add(key);
            combined.push({ name: m.name, dosage: m.dosage, frequency: m.frequency, nextRefill: m.nextRefill || '—' });
          }
        });

        // Recent prescriptions (last 5)
        const res = await patientAPI.getPrescriptions(user.abhaId, { page: 1, limit: 5 });
        const rx = res?.data?.prescriptions || [];
        rx.forEach(pr => {
          (pr.medications || []).forEach(m => {
            const key = `${m.name}|${m.dosage}|${m.frequency}`;
            if (m.name && !seen.has(key)) {
              seen.add(key);
              combined.push({ name: m.name, dosage: m.dosage, frequency: m.frequency, nextRefill: '—' });
            }
          });
        });

        if (combined.length) setMedications(combined);
      } catch (e) {
        // keep fallback meds on error
      }
    };
    loadMeds();
  }, [user?.abhaId, reloadTick]);

  // Listen for cross-page updates (e.g., when a new prescription is created elsewhere)
  useEffect(() => {
    const onPrescriptionCreated = (e) => {
      if (!e?.detail?.abhaId || e.detail.abhaId === user?.abhaId) {
        setReloadTick((x) => x + 1);
      }
    };
    const onReportUploaded = (e) => {
      if (!e?.detail?.abhaId || e.detail.abhaId === user?.abhaId) {
        setReloadTick((x) => x + 1);
      }
    };
    window.addEventListener('prescriptionCreated', onPrescriptionCreated);
    window.addEventListener('reportUploaded', onReportUploaded);
    return () => {
      window.removeEventListener('prescriptionCreated', onPrescriptionCreated);
      window.removeEventListener('reportUploaded', onReportUploaded);
    };
  }, [user?.abhaId]);

  // Fetch demographics for header cards
  useEffect(() => {
    const loadDemo = async () => {
      try {
        if (!user?.abhaId) return;
        const res = await patientAPI.lookupPatient(user.abhaId);
        const p = res?.data?.patient;
        if (p) {
          setDemographics({
            age: p.age ?? 'N/A',
            gender: p.gender ?? 'N/A',
            bloodType: p.bloodType ?? 'N/A'
          });
        }
      } catch {}
    };
    loadDemo();
  }, [user?.abhaId]);

  // Check AI Doctor service availability
  useEffect(() => {
    const checkAIDoctor = async () => {
      try {
        const response = await fetch('/api/ai-doctor/health');
        if (response.ok) {
          setAiDoctorReady(true);
        }
      } catch (error) {
        console.log('AI Doctor service not available');
      }
    };
    checkAIDoctor();
  }, []);

  return (
    <Layout className="patient-dashboard">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-aayu">आ</span>
              <span className="logo-link">yulink</span>
            </div>
            <Title level={4} className="welcome-text">
              Welcome back, {user?.name || 'Patient'}
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
              <Title level={5}>{user?.name || 'Patient'}</Title>
              <Text type="secondary">ABHA ID: {user?.abhaId || 'N/A'}</Text>
            </div>
            
            <div className="sider-menu">
              <Button 
                type={activeTab === 'overview' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('overview')}
              >
                <FileTextOutlined /> Overview
              </Button>
              <Button 
                type={activeTab === 'records' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('records')}
              >
                <FileTextOutlined /> Health Records
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
                type={activeTab === 'medications' ? 'primary' : 'text'}
                block
                className="menu-item"
                onClick={() => setActiveTab('medications')}
              >
                <MedicineBoxOutlined /> Medications
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
            {activeTab === 'overview' && (
              <>
                {/* Demographics header cards - colorful */}
                <Row gutter={[24, 24]} className="stats-row fade-in" style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)',
                      border: '1px solid #d9f7be',
                      boxShadow: '0 10px 30px rgba(82,196,26,0.12)'
                    }}>
                      <Typography.Text style={{ color: '#389e0d' }}>AGE</Typography.Text>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: '#52c41a' }}>{String(demographics.age || 'N/A')}</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)',
                      border: '1px solid #d9f7be',
                      boxShadow: '0 10px 30px rgba(82,196,26,0.12)'
                    }}>
                      <Typography.Text style={{ color: '#389e0d' }}>GENDER</Typography.Text>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: '#52c41a' }}>{String(demographics.gender || 'N/A').toUpperCase()}</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)',
                      border: '1px solid #d9f7be',
                      boxShadow: '0 10px 30px rgba(82,196,26,0.12)'
                    }}>
                      <Typography.Text style={{ color: '#389e0d' }}>BLOOD TYPE</Typography.Text>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: '#52c41a' }}>{String(demographics.bloodType || 'N/A').toUpperCase()}</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)',
                      border: '1px solid #d9f7be',
                      boxShadow: '0 10px 30px rgba(82,196,26,0.12)'
                    }}>
                      <Typography.Text style={{ color: '#389e0d' }}>ABHA ID</Typography.Text>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8, color: '#52c41a' }}>{user?.abhaId || 'N/A'}</div>
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[24, 24]} className="stats-row fade-in">
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glow">
                      <Statistic
                        title="Total Records"
                        value={stats.records}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glow delay-1">
                      <Statistic
                        title="Upcoming Appointments"
                        value={stats.appts}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glow delay-2">
                      <Statistic
                        title="Active Medications"
                        value={stats.meds}
                        prefix={<MedicineBoxOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glow delay-3">
                      <Statistic
                        title="Health Score"
                        value={stats.score}
                        suffix="%"
                        prefix={<HeartOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[24, 24]} className="slide-up">
                  <Col xs={24} lg={12}>
                    <Card title="Health Metrics" className="metrics-card">
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {healthMetrics.map((metric, index) => (
                          <div key={index} className="metric-item">
                            <div className="metric-header">
                              <Text strong>{metric.name}</Text>
                              <Tag color={getStatusColor(metric.status)}>
                                {metric.status}
                              </Tag>
                            </div>
                            <div className="metric-value">
                              <Text style={{ fontSize: '18px', color: metric.color }}>
                                {metric.value}
                              </Text>
                            </div>
                            <Progress 
                              percent={85} 
                              showInfo={false} 
                              strokeColor={metric.color}
                              size="small"
                            />
                          </div>
                        ))}
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Recent Activity" className="activity-card">
                      <Timeline>
                        <Timeline.Item color="green">
                          <Text strong>Health checkup completed</Text>
                          <br />
                          <Text type="secondary">Apollo Hospitals - 2 days ago</Text>
                        </Timeline.Item>
                        <Timeline.Item color="blue">
                          <Text strong>New prescription added</Text>
                          <br />
                          <Text type="secondary">Dr. Rajesh Kumar - 1 week ago</Text>
                        </Timeline.Item>
                        <Timeline.Item color="orange">
                          <Text strong>Appointment scheduled</Text>
                          <br />
                          <Text type="secondary">Max Healthcare - 2 weeks ago</Text>
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {activeTab === 'records' && (
              <Card title="Health Records" className="records-card">
                <div className="card-actions">
                  <Space>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Add Record
                    </Button>
                    <Button icon={<DownloadOutlined />}>
                      Export Records
                    </Button>
                    <Upload>
                      <Button icon={<EyeOutlined />}>
                        Upload Document
                      </Button>
                    </Upload>
                  </Space>
                </div>
                <Table 
                  columns={columns} 
                  dataSource={recentRecords}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )}

            {activeTab === 'appointments' && (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="Upcoming Appointments" className="appointments-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {upcomingAppointments.map((appointment, index) => (
                        <div key={index} className="appointment-item">
                          <div className="appointment-date">
                            <Text strong>{appointment.date}</Text>
                            <Text type="secondary"> at {appointment.time}</Text>
                          </div>
                          <div className="appointment-details">
                            <Text strong>{appointment.doctor}</Text>
                            <br />
                            <Text type="secondary">{appointment.specialty}</Text>
                          </div>
                          <Button type="primary" size="small">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Book New Appointment" className="book-appointment-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Button type="primary" size="large" block>
                        Book with Cardiologist
                      </Button>
                      <Button type="default" size="large" block>
                        Book with Dermatologist
                      </Button>
                      <Button type="default" size="large" block>
                        Book with General Physician
                      </Button>
                      <Button type="default" size="large" block>
                        Emergency Consultation
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === 'medications' && (
              <Card title="Current Medications" className="medications-card">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {medications.map((med, index) => (
                    <div key={index} className="medication-item">
                      <div className="medication-info">
                        <Text strong style={{ fontSize: '16px' }}>{med.name}</Text>
                        <br />
                        <Text type="secondary">{med.dosage} - {med.frequency}</Text>
                      </div>
                      <div className="medication-refill">
                        <Text type="secondary">Next refill: {med.nextRefill}</Text>
                        <Button type="link" size="small">
                          Request Refill
                        </Button>
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {activeTab === 'emergency' && (
              <Card title="Emergency Services" className="emergency-card">
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12}>
                    <Card className="emergency-option" type="inner">
                      <div className="emergency-content">
                        <HeartOutlined className="emergency-icon" />
                        <Title level={4}>Emergency Contact</Title>
                        <Paragraph>Contact nearest emergency services</Paragraph>
                        <Button type="primary" danger size="large" block>
                          Call Emergency (108)
                        </Button>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card className="emergency-option" type="inner">
                      <div className="emergency-content">
                        <FileTextOutlined className="emergency-icon" />
                        <Title level={4}>Share Health Records</Title>
                        <Paragraph>Share your health records with emergency responders</Paragraph>
                        <Button type="primary" size="large" block>
                          Share Records
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
      
      {/* Floating AI Doctor Button */}
      <div className="floating-ai-button">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<RobotOutlined />}
          onClick={() => setShowAIDoctor(!showAIDoctor)}
          className={`ai-float-btn ${showAIDoctor ? 'active' : ''} ${aiDoctorReady ? 'ready' : 'loading'}`}
          title={aiDoctorReady ? "AI Doctor Assistant - Ready" : "AI Doctor Assistant - Loading..."}
        />
        {aiDoctorReady && !showAIDoctor && (
          <div className="ai-status-indicator">
            <div className="status-dot"></div>
          </div>
        )}
      </div>

      {/* AI Doctor Chatbot */}
      <AIDoctorChatbot 
        isVisible={showAIDoctor} 
        onClose={() => setShowAIDoctor(false)} 
      />
    </Layout>
  );
};

export default PatientDashboard;
