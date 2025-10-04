import React from 'react';
import { Layout, Button, Typography, Card, Row, Col, Avatar, Space } from 'antd';
import { LogoutOutlined, UserOutlined, HeartOutlined, FileTextOutlined, MessageOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const features = [
    {
      title: 'View Full History',
      description: 'Access complete patient health records',
      icon: <HistoryOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      onClick: () => console.log('View History clicked')
    },
    {
      title: 'Get AI Summary',
      description: 'AI-powered health record summaries',
      icon: <HeartOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      onClick: () => console.log('AI Summary clicked')
    },
    {
      title: 'Chat with AI',
      description: 'Conversational AI assistant',
      icon: <MessageOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      onClick: () => console.log('Chat with AI clicked')
    },
    {
      title: 'E-Prescription',
      description: 'Digital prescription generation',
      icon: <FileTextOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      onClick: () => console.log('E-Prescription clicked')
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            AayuLink
          </Title>
        </div>
        
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{user?.name}</Text>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>Welcome, {user?.name}!</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Your AI-powered health record platform dashboard
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                onClick={feature.onClick}
                style={{
                  height: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                bodyStyle={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <Title level={4} style={{ margin: '0 0 8px 0' }}>
                  {feature.title}
                </Title>
                <Text type="secondary">
                  {feature.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: '24px', borderRadius: '12px' }}>
          <Title level={3}>Quick Actions</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Button 
                type="primary" 
                size="large" 
                block
                style={{ height: '50px' }}
              >
                Enter Patient ABHA ID
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button 
                size="large" 
                block
                style={{ height: '50px' }}
              >
                Scan QR Code
              </Button>
            </Col>
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default Dashboard;
