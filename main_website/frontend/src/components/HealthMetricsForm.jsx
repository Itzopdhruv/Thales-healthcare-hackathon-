import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  message,
  Space,
  Typography,
  Divider,
  Tag,
  Spin
} from 'antd';
import {
  HeartOutlined,
  ThunderboltOutlined,
  DropboxOutlined,
  UserOutlined,
  SaveOutlined,
  ReloadOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import api from '../services/api';
import './HealthMetricsForm.css';

const { Title, Text } = Typography;

const HealthMetricsForm = ({ abhaId, onMetricsUpdated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Load current health metrics
  const loadCurrentMetrics = async () => {
    if (!abhaId) return;
    
    setLoadingMetrics(true);
    try {
      const response = await api.get(`/health-metrics/latest/${abhaId}`);
      if (response.data.success) {
        const metrics = response.data.data.healthMetrics;
        setCurrentMetrics(metrics);
        
        // Pre-fill form with current values
        form.setFieldsValue({
          systolic: metrics.bloodPressure.systolic,
          diastolic: metrics.bloodPressure.diastolic,
          heartRate: metrics.heartRate.bpm,
          bloodSugar: metrics.bloodSugar.mgdL,
          weight: metrics.weight.kg,
          notes: metrics.notes || ''
        });
      }
    } catch (error) {
      console.log('No existing health metrics found');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadCurrentMetrics();
  }, [abhaId]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const healthMetricsData = {
        abhaId: abhaId,
        bloodPressure: {
          systolic: parseInt(values.systolic),
          diastolic: parseInt(values.diastolic)
        },
        heartRate: {
          value: parseInt(values.heartRate),
          unit: 'bpm'
        },
        bloodSugar: {
          value: parseInt(values.bloodSugar),
          unit: 'mg/dL'
        },
        weight: {
          value: parseInt(values.weight),
          unit: 'kg'
        },
        notes: values.notes || ''
      };

      const response = await api.post('/health-metrics/add', healthMetricsData);
      
      if (response.data.success) {
        message.success('Health metrics updated successfully!');
        setCurrentMetrics(response.data.data.healthMetrics);
        if (onMetricsUpdated) {
          onMetricsUpdated(response.data.data.healthMetrics);
        }
        form.resetFields();
      } else {
        message.error(response.data.message || 'Failed to update health metrics');
      }
    } catch (error) {
      console.error('Error updating health metrics:', error);
      message.error(error.response?.data?.message || 'Failed to update health metrics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal':
      case 'Stable':
        return 'green';
      case 'High':
      case 'Pre-High':
      case 'Tachycardia':
      case 'Pre-Diabetic':
      case 'Overweight':
        return 'orange';
      case 'Low':
      case 'Bradycardia':
      case 'Underweight':
        return 'blue';
      case 'Diabetic':
      case 'Obese':
        return 'red';
      default:
        return 'default';
    }
  };

  if (loadingMetrics) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading current health metrics...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="health-metrics-container">
      {/* Header with Gradient Background */}
      <div className="health-metrics-header">
        <div className="header-content">
          <div className="header-icon">
            <HeartOutlined />
          </div>
          <div className="header-text">
            <Title level={3} className="header-title">Health Metrics Management</Title>
            <Text className="header-subtitle">Monitor and update patient vital signs</Text>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={loadCurrentMetrics}
          className="refresh-button"
        >
          Refresh
        </Button>
      </div>

      {/* Current Metrics Display with Beautiful Cards */}
      {currentMetrics && (
        <div className="current-metrics-section">
          <Title level={4} className="section-title">Current Health Metrics</Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="metric-card blood-pressure-card">
                <div className="metric-icon">
                  <HeartOutlined />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Blood Pressure</div>
                  <div className="metric-value">
                    {currentMetrics.bloodPressure?.systolic && currentMetrics.bloodPressure?.diastolic 
                      ? `${currentMetrics.bloodPressure.systolic}/${currentMetrics.bloodPressure.diastolic}`
                      : currentMetrics.bloodPressure?.value || '—'
                    }
                  </div>
                  <div className="metric-unit">mmHg</div>
                  <Tag 
                    color={getStatusColor(currentMetrics.bloodPressure?.status)} 
                    className="status-tag"
                  >
                    {currentMetrics.bloodPressure?.status || 'Normal'}
                  </Tag>
                </div>
                <div className="metric-glow"></div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="metric-card heart-rate-card">
                <div className="metric-icon">
                  <ThunderboltOutlined />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Heart Rate</div>
                  <div className="metric-value">
                    {currentMetrics.heartRate?.value || currentMetrics.heartRate?.bpm || '—'}
                  </div>
                  <div className="metric-unit">bpm</div>
                  <Tag 
                    color={getStatusColor(currentMetrics.heartRate?.status)} 
                    className="status-tag"
                  >
                    {currentMetrics.heartRate?.status || 'Normal'}
                  </Tag>
                </div>
                <div className="metric-glow"></div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="metric-card blood-sugar-card">
                <div className="metric-icon">
                  <DropboxOutlined />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Blood Sugar</div>
                  <div className="metric-value">
                    {currentMetrics.bloodSugar?.value || currentMetrics.bloodSugar?.mgdL || '—'}
                  </div>
                  <div className="metric-unit">mg/dL</div>
                  <Tag 
                    color={getStatusColor(currentMetrics.bloodSugar?.status)} 
                    className="status-tag"
                  >
                    {currentMetrics.bloodSugar?.status || 'Normal'}
                  </Tag>
                </div>
                <div className="metric-glow"></div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="metric-card weight-card">
                <div className="metric-icon">
                  <DashboardOutlined />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Weight</div>
                  <div className="metric-value">
                    {currentMetrics.weight?.value || currentMetrics.weight?.kg || '—'}
                  </div>
                  <div className="metric-unit">kg</div>
                  <Tag 
                    color={getStatusColor(currentMetrics.weight?.status)} 
                    className="status-tag"
                  >
                    {currentMetrics.weight?.status || 'Normal'}
                  </Tag>
                </div>
                <div className="metric-glow"></div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Health Metrics Form with Gradient Background */}
      <div className="health-metrics-form-section">
        <Card className="form-card">
          <Title level={4} className="form-title">Update Health Metrics</Title>
          <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          systolic: '',
          diastolic: '',
          heartRate: '',
          bloodSugar: '',
          weight: '',
          notes: ''
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Blood Pressure (Systolic)"
              name="systolic"
              rules={[
                { required: true, message: 'Please enter systolic pressure!' },
                { pattern: /^[0-9]+$/, message: 'Please enter a valid number!' },
                { 
                  validator: (_, value) => {
                    const num = parseInt(value);
                    if (isNaN(num)) return Promise.resolve();
                    if (num < 50 || num > 300) {
                      return Promise.reject(new Error('Systolic pressure must be between 50-300!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                prefix={<HeartOutlined />}
                placeholder="e.g., 120"
                suffix="mmHg"
                type="number"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Blood Pressure (Diastolic)"
              name="diastolic"
              rules={[
                { required: true, message: 'Please enter diastolic pressure!' },
                { pattern: /^[0-9]+$/, message: 'Please enter a valid number!' },
                { 
                  validator: (_, value) => {
                    const num = parseInt(value);
                    if (isNaN(num)) return Promise.resolve();
                    if (num < 30 || num > 200) {
                      return Promise.reject(new Error('Diastolic pressure must be between 30-200!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                prefix={<HeartOutlined />}
                placeholder="e.g., 80"
                suffix="mmHg"
                type="number"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Heart Rate"
              name="heartRate"
              rules={[
                { required: true, message: 'Please enter heart rate!' },
                { pattern: /^[0-9]+$/, message: 'Please enter a valid number!' },
                { 
                  validator: (_, value) => {
                    const num = parseInt(value);
                    if (isNaN(num)) return Promise.resolve();
                    if (num < 30 || num > 250) {
                      return Promise.reject(new Error('Heart rate must be between 30-250!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                prefix={<ThunderboltOutlined />}
                placeholder="e.g., 72"
                suffix="bpm"
                type="number"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Blood Sugar"
              name="bloodSugar"
              rules={[
                { required: true, message: 'Please enter blood sugar level!' },
                { pattern: /^[0-9]+$/, message: 'Please enter a valid number!' },
                { 
                  validator: (_, value) => {
                    const num = parseInt(value);
                    if (isNaN(num)) return Promise.resolve();
                    if (num < 50 || num > 500) {
                      return Promise.reject(new Error('Blood sugar must be between 50-500!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                prefix={<DropboxOutlined />}
                placeholder="e.g., 95"
                suffix="mg/dL"
                type="number"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Weight"
              name="weight"
              rules={[
                { required: true, message: 'Please enter weight!' },
                { pattern: /^[0-9]+$/, message: 'Please enter a valid number!' },
                { 
                  validator: (_, value) => {
                    const num = parseInt(value);
                    if (isNaN(num)) return Promise.resolve();
                    if (num < 20 || num > 300) {
                      return Promise.reject(new Error('Weight must be between 20-300!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                prefix={<DashboardOutlined />}
                placeholder="e.g., 70"
                suffix="kg"
                type="number"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Notes (Optional)"
              name="notes"
            >
              <Input.TextArea
                placeholder="Additional notes about the health metrics..."
                rows={2}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Update Health Metrics
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadCurrentMetrics}
              size="large"
            >
              Refresh Current
            </Button>
          </Space>
        </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default HealthMetricsForm;
