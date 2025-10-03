import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  MedicineBoxOutlined,
  ScanOutlined,
  RobotOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

// Import pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import OCRInvoice from './pages/OCRInvoice';
import Chatbot from './pages/Chatbot';
import SQLAgent from './pages/SQLAgent';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/inventory',
      icon: <MedicineBoxOutlined />,
      label: 'Medicine Management',
    },
    {
      key: '/ocr',
      icon: <ScanOutlined />,
      label: 'OCR & Invoice Generator',
    },
    {
      key: '/chatbot',
      icon: <RobotOutlined />,
      label: 'Health Advice Chatbot',
    },
    {
      key: '/sql-agent',
      icon: <DatabaseOutlined />,
      label: 'AI SQL Agent',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div className="app-container">
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={250}
          style={{
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ 
            padding: '24px 16px', 
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              💊 PharmaAssist
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none' }}
          />
        </Sider>
        
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Title level={4} style={{ margin: 0 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'Dashboard'}
            </Title>
          </Header>
          
          <Content className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/ocr" element={<OCRInvoice />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/sql-agent" element={<SQLAgent />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
