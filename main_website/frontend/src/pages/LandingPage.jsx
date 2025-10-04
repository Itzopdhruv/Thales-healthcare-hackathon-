import React from 'react';
import { Button, Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  CreditCardOutlined, 
  MedicineBoxOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <UserOutlined className="feature-icon" />,
      title: "Aadhaar",
      subtitle: "Your Digital Identity",
      description: "We have an Aadhaar card for our identification. It's the foundational identity for every citizen, unlocking services and benefits nationwide.",
      color: "#1890ff"
    },
    {
      icon: <CreditCardOutlined className="feature-icon" />,
      title: "PAN",
      subtitle: "Your Financial Identity", 
      description: "A PAN card for our finances. The key to our financial lives, from taxes to investments, unified under one digital roof.",
      color: "#fa8c16"
    },
    {
      icon: <MedicineBoxOutlined className="feature-icon" />,
      title: "Health Records",
      subtitle: "Your Medical Identity",
      description: "Comprehensive health records for your medical journey. Track, manage, and share your health data securely across India.",
      color: "#52c41a"
    }
  ];

  const hospitalStats = [
    { name: "Kokilaben Hospital", location: "Mumbai", specialty: "Multi-specialty", patients: "15,000+", status: "online" },
    { name: "Apollo Hospitals", location: "Delhi", specialty: "Cardiology", patients: "35,000+", status: "online" },
    { name: "Max Healthcare", location: "Delhi", specialty: "Neurology", patients: "30,000+", status: "online" },
    { name: "Fortis Healthcare", location: "Bangalore", specialty: "Oncology", patients: "25,000+", status: "online" },
    { name: "Manipal Hospitals", location: "Chennai", specialty: "Orthopedics", patients: "20,000+", status: "online" }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-aayu">आ</span>
            <span className="logo-link">yulink</span>
          </div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#network">Network</a>
            <a href="#about">About Us</a>
            <a href="#pharmacist">Pharmacist / Lab Portal</a>
          </nav>
          <Button 
            type="primary" 
            danger 
            className="emergency-btn"
            icon={<PhoneOutlined />}
          >
            Emergency Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <span className="logo-aayu">आ</span>
            <span className="logo-link">yulink</span>
          </div>
          <Title level={1} className="hero-title">
            The <span className="highlight-orange">Aadhaar</span> for your <span className="highlight-blue">Health</span>
          </Title>
          <Paragraph className="hero-description">
            A unified digital front door for citizens, providers, and administrators—securely connecting hospitals, health IDs, and services across India.
          </Paragraph>
          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              className="cta-button"
              onClick={() => navigate('/login')}
            >
              Get Started
            </Button>
            <Button size="large" className="learn-more-btn">
              Learn More
            </Button>
          </Space>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <Title level={2} className="section-title">Features</Title>
          <Paragraph className="section-subtitle">
            Tools to manage, track, and validate health records seamlessly
          </Paragraph>
          
          <Row gutter={[32, 32]} className="features-grid">
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="feature-card" hoverable>
                  <div className="feature-icon-container" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                  <Title level={3} className="feature-title">{feature.title}</Title>
                  <Text className="feature-subtitle">{feature.subtitle}</Text>
                  <Paragraph className="feature-description">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Network Section */}
      <section id="network" className="network-section">
        <div className="container">
          <Title level={2} className="section-title">Our Network</Title>
          <Paragraph className="network-description">
            AayuLink connects over 5,000 hospitals across India, ensuring your health data is accessible wherever you need medical care.
          </Paragraph>
          
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card className="map-card">
                <div className="map-container">
                  <div className="map-header">
                    <div className="hospital-count">
                      <CheckCircleOutlined className="status-icon" />
                      <span>5,247 Hospitals Connected</span>
                    </div>
                  </div>
                  <div className="map-visual">
                    <div className="india-map">
                      <div className="map-points">
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`map-point ${i % 3 === 0 ? 'active' : 'inactive'}`}
                            style={{
                              left: `${Math.random() * 80 + 10}%`,
                              top: `${Math.random() * 60 + 20}%`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="uptime-stats">
                    <div className="uptime-box">
                      <div className="uptime-value">99.9%</div>
                      <div className="uptime-label">Uptime</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card className="hospitals-card">
                <div className="hospitals-header">
                  <Title level={4}>Connected Hospitals</Title>
                  <div className="filter-section">
                    <Text>Filter by City: </Text>
                    <select className="city-filter">
                      <option>All</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Bangalore</option>
                      <option>Chennai</option>
                    </select>
                  </div>
                </div>
                
                <div className="hospitals-list">
                  {hospitalStats.map((hospital, index) => (
                    <div key={index} className="hospital-item">
                      <div className="hospital-info">
                        <Title level={5} className="hospital-name">{hospital.name}</Title>
                        <Text className="hospital-location">{hospital.location}</Text>
                        <Text className="hospital-specialty">{hospital.specialty}</Text>
                        <Text className="hospital-patients">{hospital.patients} patients served</Text>
                      </div>
                      <div className="hospital-status">
                        <div className={`status-dot ${hospital.status}`} />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="stats-summary">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card className="stat-card">
                        <Statistic 
                          value="24/7" 
                          valueStyle={{ color: '#52c41a' }}
                          suffix="Emergency Access"
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card className="stat-card">
                        <Statistic 
                          value="5,247" 
                          valueStyle={{ color: '#1890ff' }}
                          suffix="Connected Hospitals"
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <Title level={2} className="cta-title">
              One Nation, <span className="highlight-green">One Health</span>
            </Title>
            <Paragraph className="cta-description">
              A unified digital front door for citizens, providers, and administrators.
            </Paragraph>
            <Space size="large">
              <Button 
                type="primary" 
                size="large" 
                className="cta-button"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
              <Button size="large" className="learn-more-btn">
                Learn More
              </Button>
            </Space>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-aayu">आ</span>
              <span className="logo-link">yulink</span>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#network">Network</a>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-text">
              <Text type="secondary">
                © 2025 AayuLink. All rights reserved. Aligned with ABDM (Ayushman Bharat Digital Mission)
              </Text>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
