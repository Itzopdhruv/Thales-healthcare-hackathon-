import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Spin } from 'antd';
import { MedicineBoxOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { inventoryAPI } from '../services/api';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStockMedicines: 0,
    totalValue: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [allMedicinesResponse, lowStockResponse] = await Promise.all([
        inventoryAPI.getAllMedicines(),
        inventoryAPI.getLowStockMedicines(10)
      ]);

      const allMedicines = allMedicinesResponse.data;
      const lowStockMedicines = lowStockResponse.data;

      // Calculate total value
      const totalValue = allMedicines.reduce((sum, medicine) => {
        return sum + (medicine.price * medicine.quantity);
      }, 0);

      setStats({
        totalMedicines: allMedicines.length,
        lowStockMedicines: lowStockMedicines.length,
        totalValue: totalValue,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Connection Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '24px' }}
      />
    );
  }

  return (
    <div>
      <Title level={2}>📊 Inventory Insights</Title>
      <Paragraph type="secondary">
        Overview of your medicine inventory and key metrics
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={stats.totalMedicines}
              prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Low Stock Medicines"
              value={stats.lowStockMedicines}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Inventory Value"
              value={stats.totalValue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="📋 Quick Actions" extra={<CheckCircleOutlined />}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => window.location.href = '/inventory'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <MedicineBoxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div style={{ marginTop: '8px' }}>Manage Inventory</div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => window.location.href = '/ocr'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <div style={{ marginTop: '8px' }}>Process Prescription</div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => window.location.href = '/inventory'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                  <div style={{ marginTop: '8px' }}>Check Low Stock</div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => window.location.href = '/inventory'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <MedicineBoxOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                  <div style={{ marginTop: '8px' }}>Add Medicine</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {stats.lowStockMedicines > 0 && (
        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Alert
              message="Low Stock Alert"
              description={`You have ${stats.lowStockMedicines} medicines with low stock. Click "Manage Inventory" to restock.`}
              type="warning"
              showIcon
              action={
                <button 
                  onClick={() => window.location.href = '/inventory'}
                  style={{ 
                    background: '#faad14', 
                    color: 'white', 
                    border: 'none', 
                    padding: '4px 12px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Inventory
                </button>
              }
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
