import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Tag, 
  Divider,
  Spin,
  message,
  Input,
  Form,
  Modal,
  Select,
  DatePicker,
  InputNumber
} from 'antd';
import { 
  HeartOutlined, 
  ThunderboltOutlined, 
  BulbOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  FileTextOutlined,
  FileOutlined,
  GlobalOutlined,
  TeamOutlined,
  PlusOutlined,
  MedicineBoxOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import { patientAPI } from '../services/api';
import './PatientRecordViewer.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search, TextArea } = Input;

const PatientRecordViewer = () => {
  const location = useLocation();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchABHA, setSearchABHA] = useState('');
  const [form] = Form.useForm();
  const [addEntryForm] = Form.useForm();
  const [isAddEntryVisible, setIsAddEntryVisible] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [activeHealthCard, setActiveHealthCard] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load patient data from navigation state
  useEffect(() => {
    if (location.state?.patientData) {
      setPatientData(location.state.patientData);
      setSearchABHA(location.state.abhaId || '');
    }
  }, [location.state]);

  const handleSearch = async (abhaId) => {
    if (!abhaId) {
      message.error('Please enter an ABHA ID');
      return;
    }

    setLoading(true);
    try {
      const result = await patientAPI.lookupPatient(abhaId);
      if (result.success) {
        setPatientData(result.data);
        message.success('Patient record found successfully!');
      } else {
        message.error(result.error || 'Patient not found');
        setPatientData(null);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      message.error('Failed to search patient');
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'A+': '#ff4d4f',
      'A-': '#ff7875',
      'B+': '#1890ff',
      'B-': '#40a9ff',
      'AB+': '#722ed1',
      'AB-': '#9254de',
      'O+': '#52c41a',
      'O-': '#73d13d'
    };
    return colors[bloodType] || '#52c41a';
  };

  const handleAddNewEntry = () => {
    setIsAddEntryVisible(true);
  };

  const handleAddEntrySubmit = async (values) => {
    setIsAddingEntry(true);
    try {
      // Simulate API call to add new medical entry
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newEntry = {
        id: Date.now(),
        type: 'e-Prescription Issued',
        date: new Date().toISOString(),
        location: 'At AayuLink Digital Clinic with Dr. Aarogya',
        medications: values.medications ? [{ name: values.medications, dosage: values.dosage || 'N/A' }] : [],
        description: values.description || '',
        doctor: values.doctor || 'Dr. Aarogya'
      };

      // Update patient data with new entry
      setPatientData(prev => ({
        ...prev,
        healthRecords: [newEntry, ...(prev.healthRecords || [])]
      }));

      message.success('New medical entry added successfully!');
      setIsAddEntryVisible(false);
      addEntryForm.resetFields();
    } catch (error) {
      message.error('Failed to add medical entry');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleHealthCardClick = (cardType) => {
    setActiveHealthCard(activeHealthCard === cardType ? null : cardType);
    message.info(`${cardType} health analysis activated!`);
  };

  return (
    <Layout className="patient-record-viewer">
      <Sider 
        width={280} 
        className={`patient-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        collapsed={sidebarCollapsed}
      >
        <div className="sidebar-header">
          <div className="aayulink-logo">
            <div className="logo-grid">
              <div className="logo-square"></div>
              <div className="logo-square"></div>
              <div className="logo-square"></div>
              <div className="logo-square"></div>
            </div>
            <Text className="logo-text">AayuLink</Text>
          </div>
          <Button 
            type="text" 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </Button>
        </div>

        <div className="viewing-records">
          <Text className="viewing-label">Viewing Records For</Text>
          {patientData ? (
            <Text className="patient-name">{patientData.name}</Text>
          ) : (
            <Text className="patient-name-placeholder">No Patient Selected</Text>
          )}
        </div>

        <div className="sidebar-menu">
          <div className="menu-item active">
            <ClockCircleOutlined className="menu-icon" />
            <Text>Patient History</Text>
          </div>
          <div className="menu-item">
            <ExclamationCircleOutlined className="menu-icon" />
            <Text>Emergency Mode</Text>
          </div>
          <div className="menu-item">
            <RobotOutlined className="menu-icon" />
            <Text>AI Assistant</Text>
          </div>
          <div className="menu-item">
            <FileTextOutlined className="menu-icon" />
            <Text>Reports & Scans</Text>
          </div>
          <div className="menu-item">
            <FileOutlined className="menu-icon" />
            <Text>e-Prescriptions</Text>
          </div>
        </div>

        <div className="system-tools">
          <Text className="section-title">SYSTEM TOOLS</Text>
          <div className="menu-item">
            <GlobalOutlined className="menu-icon" />
            <Text>National Health Pulse</Text>
          </div>
        </div>

        <div className="switch-patient">
          <div className="menu-item">
            <TeamOutlined className="menu-icon" />
            <Text>Switch Patient</Text>
          </div>
        </div>
      </Sider>

      <Layout className="main-content">
        <Header className="content-header">
          <div className="search-section">
            <Search
              placeholder="Enter ABHA ID (XX-XX-XX-XX)"
              value={searchABHA}
              onChange={(e) => setSearchABHA(e.target.value)}
              onSearch={handleSearch}
              enterButton="Search Patient"
              size="large"
              className="abha-search"
            />
          </div>
        </Header>

        <Content className="patient-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <Text>Searching patient records...</Text>
            </div>
          ) : patientData ? (
            <>
              {/* Patient Demographics */}
              <Card className="demographics-card">
                <div className="patient-header">
                  <Title level={2} className="patient-name-title">{patientData.name}</Title>
                  <div className="patient-info">
                    <div className="info-item">
                      <Text className="info-label">Age:</Text>
                      <Text className="info-value">{patientData.age || 'N/A'}</Text>
                    </div>
                    <div className="info-item">
                      <Text className="info-label">Gender:</Text>
                      <Text className="info-value">{patientData.gender || 'N/A'}</Text>
                    </div>
                    <div className="info-item">
                      <Text className="info-label">Blood Type:</Text>
                      <Text 
                        className="info-value blood-type" 
                        style={{ color: getBloodTypeColor(patientData.bloodType) }}
                      >
                        {patientData.bloodType || 'N/A'}
                      </Text>
                    </div>
                    <div className="info-item">
                      <Text className="info-label">ABHA ID:</Text>
                      <Text className="info-value abha-id">{patientData.abhaId || 'N/A'}</Text>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI-Powered Health Visualizer */}
              <Card className="health-visualizer-card">
                <div className="section-header">
                  <Title level={4} className="section-title">
                    <span className="title-icon">🤖</span>
                    AI-Powered Health Visualizer
                  </Title>
                  <div className="ai-status">
                    <div className="status-indicator"></div>
                    <Text className="status-text">AI Active</Text>
                  </div>
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <div 
                      className={`health-card cardio ${activeHealthCard === 'cardio' ? 'active' : ''}`}
                      onClick={() => handleHealthCardClick('cardio')}
                    >
                      <div className="card-glow"></div>
                      <HeartOutlined className="health-icon" />
                      <Text className="health-label">Cardio</Text>
                      <div className="card-progress">
                        <div className="progress-bar" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      className={`health-card respiratory ${activeHealthCard === 'respiratory' ? 'active' : ''}`}
                      onClick={() => handleHealthCardClick('respiratory')}
                    >
                      <div className="card-glow"></div>
                      <ThunderboltOutlined className="health-icon" />
                      <Text className="health-label">Respiratory</Text>
                      <div className="card-progress">
                        <div className="progress-bar" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      className={`health-card mental ${activeHealthCard === 'mental' ? 'active' : ''}`}
                      onClick={() => handleHealthCardClick('mental')}
                    >
                      <div className="card-glow"></div>
                      <BulbOutlined className="health-icon" />
                      <Text className="health-label">Mental</Text>
                      <div className="card-progress">
                        <div className="progress-bar" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      className={`health-card lifestyle ${activeHealthCard === 'lifestyle' ? 'active' : ''}`}
                      onClick={() => handleHealthCardClick('lifestyle')}
                    >
                      <div className="card-glow"></div>
                      <UserOutlined className="health-icon" />
                      <Text className="health-label">Lifestyle</Text>
                      <div className="card-progress">
                        <div className="progress-bar" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Complete Medical History */}
              <Card className="medical-history-card">
                <div className="history-header">
                  <Title level={4} className="section-title">
                    <span className="title-icon">📋</span>
                    Complete Medical History
                  </Title>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    className="add-entry-btn"
                    onClick={handleAddNewEntry}
                  >
                    <span className="btn-text">+ Add New Entry</span>
                    <div className="btn-glow"></div>
                  </Button>
                </div>
                
                <div className="medical-entries">
                  {patientData.healthRecords && patientData.healthRecords.length > 0 ? (
                    patientData.healthRecords.map((record, index) => (
                      <div key={index} className="medical-entry">
                        <div className="entry-header">
                          <div className="entry-type">
                            <MedicineBoxOutlined className="entry-icon" />
                            <Text className="entry-title">e-Prescription Issued</Text>
                          </div>
                          <Text className="entry-date">{formatDate(record.date)}</Text>
                        </div>
                        <div className="entry-details">
                          <Text className="entry-location">At AayuLink Digital Clinic with Dr. Aarogya</Text>
                          {record.medications && record.medications.length > 0 && (
                            <div className="medication-details">
                              <Text className="medication-text">
                                Issued medications: {record.medications.map(med => `${med.name} (${med.dosage})`).join(', ')}.
                              </Text>
                              <Button type="link" className="translate-btn">
                                <TranslationOutlined /> Translate & Simplify
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-records">
                      <Text>No medical records found for this patient.</Text>
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <div className="no-patient-selected">
              <Text className="placeholder-text">Search for a patient using their ABHA ID to view their complete medical records</Text>
            </div>
          )}
        </Content>
      </Layout>

      {/* Add New Entry Modal */}
      <Modal
        title={
          <div className="modal-title">
            <span className="modal-icon">➕</span>
            Add New Medical Entry
          </div>
        }
        open={isAddEntryVisible}
        onCancel={() => setIsAddEntryVisible(false)}
        footer={null}
        className="add-entry-modal"
        width={600}
      >
        <Form
          form={addEntryForm}
          layout="vertical"
          onFinish={handleAddEntrySubmit}
          className="add-entry-form"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Entry Type"
                rules={[{ required: true, message: 'Please select entry type' }]}
              >
                <Select placeholder="Select entry type">
                  <Select.Option value="e-Prescription Issued">e-Prescription Issued</Select.Option>
                  <Select.Option value="Diagnosis">Diagnosis</Select.Option>
                  <Select.Option value="Lab Results">Lab Results</Select.Option>
                  <Select.Option value="Treatment">Treatment</Select.Option>
                  <Select.Option value="Follow-up">Follow-up</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  getPopupContainer={(trigger) => trigger.parentElement}
                  placement="bottomLeft"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="doctor"
                label="Doctor"
                rules={[{ required: true, message: 'Please enter doctor name' }]}
              >
                <Input placeholder="Enter doctor name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter location" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="medications"
            label="Medications"
          >
            <Input placeholder="Enter medication name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dosage"
                label="Dosage"
              >
                <Input placeholder="Enter dosage" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Duration"
              >
                <Input placeholder="Enter duration" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={4} 
              placeholder="Enter detailed description of the medical entry"
            />
          </Form.Item>

          <div className="modal-actions">
            <Button 
              onClick={() => setIsAddEntryVisible(false)}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isAddingEntry}
              className="submit-btn"
            >
              {isAddingEntry ? 'Adding Entry...' : 'Add Entry'}
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PatientRecordViewer;
