import React, { useState } from 'react';
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

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const AdminPatientView = () => {
  const [isAddEntryVisible, setIsAddEntryVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock patient data
  const patientData = {
    name: 'Tanish Kumar',
    abhaId: '12-3456-7890-0001',
    age: 20,
    gender: 'Male',
    bloodType: 'AB+',
    phone: '+91 98765 43210',
    emergencyContact: 'Mrs. Kumar - +91 98765 43211'
  };

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
              <Title level={5} className="patient-name">{patientData.name}</Title>
            </div>
            
            <div className="sider-menu">
              <Button 
                type="primary"
                block
                className="menu-item active"
                icon={<ClockCircleOutlined />}
              >
                Patient History
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<ExclamationCircleOutlined />}
              >
                Emergency Mode
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<RobotOutlined />}
              >
                AI Assistant
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<FileTextOutlined />}
              >
                Reports & Scans
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<MedicineBoxOutlined />}
              >
                e-Prescriptions
              </Button>
              <Button 
                type="text"
                block
                className="menu-item"
                icon={<GlobalOutlined />}
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
                    <Title level={2} className="patient-name">{patientData.name}</Title>
                    <div className="patient-details">
                      <div className="detail-item">
                        <Text strong>Age:</Text> <Text>{patientData.age}</Text>
                      </div>
                      <div className="detail-item">
                        <Text strong>Gender:</Text> <Text>{patientData.gender}</Text>
                      </div>
                      <div className="detail-item">
                        <Text strong>Blood Type:</Text> <Tag color="red">{patientData.bloodType}</Tag>
                      </div>
                      <div className="detail-item">
                        <Text strong>ABHA ID:</Text> <Text code>{patientData.abhaId}</Text>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} lg={12}>
                  <div className="contact-info">
                    <Title level={4}>Contact Information</Title>
                    <div className="contact-details">
                      <div className="contact-item">
                        <Text strong>Phone:</Text> <Text>{patientData.phone}</Text>
                      </div>
                      <div className="contact-item">
                        <Text strong>Emergency:</Text> <Text>{patientData.emergencyContact}</Text>
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
