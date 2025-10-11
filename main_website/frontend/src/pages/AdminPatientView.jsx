import React, { useEffect, useState } from 'react';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Avatar,
  Tag,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message
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
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  GlobalOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import './AdminPatientView.css';
import { useSearchParams } from 'react-router-dom';
import { patientAPI } from '../services/api';
import HealthMetricsForm from '../components/HealthMetricsForm';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const AdminPatientView = () => {
  const [isAddEntryVisible, setIsAddEntryVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [patientData, setPatientData] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  // Load patient by ABHA ID from query param: ?abhaId=XX-XX-XX-XX
  useEffect(() => {
    const load = async () => {
      try {
        const abhaId = searchParams.get('abhaId');
        if (!abhaId) return;
        const res = await patientAPI.lookupPatient(abhaId);
        const p = res?.data?.patient;
        if (p) setPatientData(p);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load patient for admin view', e);
      }
    };
    load();
  }, [searchParams]);

  const medicalHistory = [
    {
      date: '21/09/2025',
      type: 'e-Prescription Issued',
      doctor: 'Dr. Aarogya',
      hospital: 'AayuLink Digital Clinic',
      medications: 'Ilabxo (200mg)',
      id: 1
    },
    {
      date: '21/09/2025',
      type: 'e-Prescription Issued',
      doctor: 'Dr. Aarogya',
      hospital: 'AayuLink Digital Clinic',
      medications: 'Paracetamol (200mg)',
      id: 2
    }
  ];

  const healthCategories = [
    { name: 'Cardio', color: '#52c41a', icon: <HeartOutlined /> },
    { name: 'Respiratory', color: '#faad14', icon: <BarChartOutlined /> },
    { name: 'Mental', color: '#52c41a', icon: <BarChartOutlined /> },
    { name: 'Lifestyle', color: '#faad14', icon: <UserOutlined /> }
  ];

  const handleAddEntry = (values) => {
    message.success('Medical entry added successfully!');
    setIsAddEntryVisible(false);
    form.resetFields();
  };

  return (
    <Layout className="admin-patient-view">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-aayu">आ</span>
              <span className="logo-link">yulink</span>
            </div>
            <Title level={4} className="welcome-text">
              Admin - Patient Records
            </Title>
          </div>
          <div className="header-right">
            <Space>
              <Button icon={<BellOutlined />} shape="circle" />
              <Button icon={<SettingOutlined />} shape="circle" />
              <Avatar icon={<UserOutlined />} />
            </Space>
          </div>
        </div>
      </Header>

      <Layout>
        <Sider width={250} className="dashboard-sider">
          <div className="sider-content">
            <div className="patient-context">
              <Text type="secondary">Viewing Records For</Text>
              <Title level={5} className="patient-name">{patientData?.name || 'Patient'}</Title>
            </div>
            
            <div className="sider-menu">
              <Button 
                type={activeTab === 'history' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'history' ? 'active' : ''}`}
                icon={<ClockCircleOutlined />}
                onClick={() => setActiveTab('history')}
              >
                Patient History
              </Button>
              <Button 
                type={activeTab === 'emergency' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'emergency' ? 'active' : ''}`}
                icon={<ExclamationCircleOutlined />}
                onClick={() => setActiveTab('emergency')}
              >
                Emergency Mode
              </Button>
              <Button 
                type={activeTab === 'ai-assistant' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'ai-assistant' ? 'active' : ''}`}
                icon={<RobotOutlined />}
                onClick={() => setActiveTab('ai-assistant')}
              >
                AI Assistant
              </Button>
              <Button 
                type={activeTab === 'health-metrics' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'health-metrics' ? 'active' : ''}`}
                icon={<HeartOutlined />}
                onClick={() => setActiveTab('health-metrics')}
              >
                Health Metrics
              </Button>
              <Button 
                type={activeTab === 'reports' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
                icon={<FileTextOutlined />}
                onClick={() => setActiveTab('reports')}
              >
                Reports & Scans
              </Button>
              <Button 
                type={activeTab === 'prescriptions' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
                icon={<MedicineBoxOutlined />}
                onClick={() => setActiveTab('prescriptions')}
              >
                e-Prescriptions
              </Button>
              <Button 
                type={activeTab === 'health-pulse' ? 'primary' : 'text'}
                block
                className={`menu-item ${activeTab === 'health-pulse' ? 'active' : ''}`}
                icon={<GlobalOutlined />}
                onClick={() => setActiveTab('health-pulse')}
              >
                National Health Pulse
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<TeamOutlined />}
              >
                Switch Patient
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<LogoutOutlined />}
              >
                Logout
              </Button>
            </div>
          </div>
        </Sider>

        <Content className="dashboard-content">
          <div className="content-wrapper">
            {/* Patient Demographics */}
            <Card className="patient-demo-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <div className="patient-info">
                    <Title level={2} className="patient-name">{patientData?.name || 'Patient'}</Title>
                    <div className="patient-details">
                      <div className="detail-item">
                        <Text strong>Age:</Text> <Text>{patientData?.age ?? 'N/A'}</Text>
                      </div>
                      <div className="detail-item">
                        <Text strong>Gender:</Text> <Text>{patientData?.gender ?? 'N/A'}</Text>
                      </div>
                      <div className="detail-item">
                        <Text strong>Blood Type:</Text> <Tag color="red">{patientData?.bloodType ?? 'N/A'}</Tag>
                      </div>
                      <div className="detail-item">
                        <Text strong>ABHA ID:</Text> <Text code>{patientData?.abhaId ?? 'N/A'}</Text>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} lg={12}>
                  <div className="contact-info">
                    <Title level={4}>Contact Information</Title>
                    <div className="contact-details">
                      <div className="contact-item">
                        <Text strong>Phone:</Text> <Text>{patientData?.phone ?? 'N/A'}</Text>
                      </div>
                      <div className="contact-item">
                        <Text strong>Emergency:</Text> <Text>{patientData?.emergencyContact ?? 'N/A'}</Text>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* AI-Powered Health Visualizer */}
            <Card title="AI-Powered Health Visualizer" className="health-visualizer-card">
              <Row gutter={[16, 16]}>
                {healthCategories.map((category, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <Button
                      className="health-category-btn"
                      style={{ 
                        backgroundColor: category.color,
                        borderColor: category.color,
                        color: 'white',
                        height: '60px',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                      icon={category.icon}
                    >
                      {category.name}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Complete Medical History */}
            <Card 
              title="Complete Medical History" 
              className="medical-history-card"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddEntryVisible(true)}
                >
                  Add New Entry
                </Button>
              }
            >
              <Timeline>
                {medicalHistory.map((entry) => (
                  <Timeline.Item key={entry.id} color="blue">
                    <div className="medical-entry">
                      <div className="entry-header">
                        <Text strong>{entry.type}</Text>
                        <Tag color="blue">{entry.date}</Tag>
                      </div>
                      <div className="entry-details">
                        <Text>At {entry.hospital} with {entry.doctor}</Text>
                        <br />
                        <Text>Issued medications: {entry.medications}</Text>
                      </div>
                      <div className="entry-actions">
                        <Button type="link" size="small" icon={<FileTextOutlined />}>
                          Translate & Simplify
                        </Button>
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>

          {/* Tab Content Rendering */}
          {activeTab === 'health-metrics' && patientData?.abhaId && (
            <div style={{ marginTop: '24px' }}>
              <HealthMetricsForm 
                abhaId={patientData.abhaId}
                onMetricsUpdated={(metrics) => {
                  console.log('Health metrics updated:', metrics);
                  message.success('Health metrics updated successfully!');
                }}
              />
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div style={{ marginTop: '24px' }}>
              <Card title="AI Assistant" className="ai-assistant-card">
                <Text>AI Assistant functionality will be implemented here.</Text>
              </Card>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div style={{ marginTop: '24px' }}>
              <Card title="Emergency Mode" className="emergency-card">
                <Text>Emergency mode functionality will be implemented here.</Text>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ marginTop: '24px' }}>
              <Card title="Reports & Scans" className="reports-card">
                <Text>Reports & Scans functionality will be implemented here.</Text>
              </Card>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div style={{ marginTop: '24px' }}>
              <Card title="e-Prescriptions" className="prescriptions-card">
                <Text>e-Prescriptions functionality will be implemented here.</Text>
              </Card>
            </div>
          )}

          {activeTab === 'health-pulse' && (
            <div style={{ marginTop: '24px' }}>
              <Card title="National Health Pulse" className="health-pulse-card">
                <Text>National Health Pulse functionality will be implemented here.</Text>
              </Card>
            </div>
          )}
        </Content>
      </Layout>

      {/* Add New Entry Modal */}
      <Modal
        title="Add New Medical Entry"
        open={isAddEntryVisible}
        onCancel={() => setIsAddEntryVisible(false)}
        footer={null}
        width={600}
        className="add-entry-modal"
      >
        <Form
          form={form}
          name="add-entry"
          onFinish={handleAddEntry}
          layout="vertical"
        >
          <Form.Item
            name="entryType"
            label="Entry Type"
            rules={[{ required: true, message: 'Please select entry type!' }]}
          >
            <Select placeholder="Select entry type">
              <Select.Option value="prescription">e-Prescription</Select.Option>
              <Select.Option value="consultation">Consultation</Select.Option>
              <Select.Option value="test">Test Result</Select.Option>
              <Select.Option value="procedure">Procedure</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date!' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              getPopupContainer={(trigger) => trigger.parentElement}
              placement="bottomLeft"
            />
          </Form.Item>

          <Form.Item
            name="doctor"
            label="Doctor Name"
            rules={[{ required: true, message: 'Please enter doctor name!' }]}
          >
            <Input placeholder="Enter doctor name" />
          </Form.Item>

          <Form.Item
            name="hospital"
            label="Hospital/Clinic"
            rules={[{ required: true, message: 'Please enter hospital name!' }]}
          >
            <Input placeholder="Enter hospital or clinic name" />
          </Form.Item>

          <Form.Item
            name="medications"
            label="Medications/Treatment"
          >
            <Input.TextArea 
              placeholder="Enter medications or treatment details"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <Input.TextArea 
              placeholder="Enter any additional notes"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="add-entry-button"
            >
              Add Medical Entry
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminPatientView;
