import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Statistic, Typography, Space, Carousel, Badge, Progress, Avatar, Tag, Divider } from 'antd';
import { 
  UserOutlined, 
  CreditCardOutlined, 
  MedicineBoxOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  PhoneOutlined,
  LockOutlined,
  TeamOutlined,
  StarOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CloudOutlined,
  SyncOutlined,
  RocketOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    hospitals: 0,
    patients: 0,
    records: 0,
    uptime: 0
  });

  // Animated counter effect
  useEffect(() => {
    const animateValue = (key, start, end, duration) => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        setStats(prev => ({ ...prev, [key]: current }));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    // Start animations after component mounts
    setTimeout(() => {
      animateValue('hospitals', 0, 5247, 2000);
      animateValue('patients', 0, 1500000, 2500);
      animateValue('records', 0, 5000000, 3000);
      animateValue('uptime', 0, 99.9, 1500);
    }, 500);
  }, []);

  const features = [
    {
      icon: <UserOutlined className="feature-icon" />,
      title: "Aadhaar Integration",
      subtitle: "Your Digital Identity",
      description: "Seamlessly integrated with Aadhaar for instant identity verification. Your health records are linked to your unique digital identity, ensuring secure and instant access across all healthcare providers.",
      color: "#1890ff",
      gradient: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
      stats: "1.3B+ Users"
    },
    {
      icon: <CreditCardOutlined className="feature-icon" />,
      title: "ABHA Number",
      subtitle: "Your Health Identity", 
      description: "Your unique 14-digit ABHA (Ayushman Bharat Health Account) number serves as your health identity. Access your medical records anywhere in India with this single identifier.",
      color: "#fa8c16",
      gradient: "linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)",
      stats: "500M+ Records"
    },
    {
      icon: <MedicineBoxOutlined className="feature-icon" />,
      title: "Health Records",
      subtitle: "Your Medical Journey",
      description: "Comprehensive digital health records including prescriptions, lab reports, medical history, and treatment plans. All your health data in one secure, accessible place.",
      color: "#52c41a",
      gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
      stats: "24/7 Access"
    }
  ];

  const advancedFeatures = [
    {
      icon: <LockOutlined />,
      title: "End-to-End Encryption",
      description: "Military-grade security protecting your most sensitive health data",
      color: "#722ed1"
    },
    {
      icon: <SyncOutlined />,
      title: "Instant Access",
      description: "Real-time synchronization across all connected healthcare providers",
      color: "#fa541c"
    },
    {
      icon: <TeamOutlined />,
      title: "Multi-Provider Support",
      description: "Seamlessly works with hospitals, clinics, labs, and pharmacies",
      color: "#13c2c2"
    },
    {
      icon: <CloudOutlined />,
      title: "Cloud-Based",
      description: "Access your records from anywhere, anytime, on any device",
      color: "#1890ff"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      role: "Chief Medical Officer, Apollo Hospitals",
      content: "AayuLink has revolutionized how we access patient records. The seamless integration saves us hours every day and improves patient care quality.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      role: "Patient, Mumbai",
      content: "I can now carry my entire medical history in my pocket. No more carrying physical reports or explaining my medical history repeatedly.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Anjali Patel",
      role: "Lab Director, SRL Diagnostics",
      content: "The real-time lab report integration has made our workflow incredibly efficient. Results are instantly available to patients and doctors.",
      avatar: "https://images.unsplash.com/photo-1594824474751-843b1b0b0b8b?w=100&h=100&fit=crop&crop=face",
      rating: 5
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
      {/* Enhanced Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-aayu">आ</span>
            <span className="logo-link">yulink</span>
            <Tag color="green" className="beta-tag">BETA</Tag>
          </div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#network">Network</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#about">About Us</a>
            <a href="#pharmacist">Provider Portal</a>
          </nav>
          <Space>
            <Button 
              type="primary" 
              danger 
              className="emergency-btn"
              icon={<PhoneOutlined />}
              size="large"
            >
              Emergency
            </Button>
            <Button 
              type="primary" 
              className="login-btn"
              onClick={() => navigate('/login')}
              size="large"
            >
              Login
            </Button>
          </Space>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-particles"></div>
          <div className="hero-grid"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <Badge count="NEW" color="#52c41a" />
            <Text>Powered by ABDM</Text>
          </div>
          <div className="hero-logo">
            <span className="logo-aayu">आ</span>
            <span className="logo-link">yulink</span>
          </div>
          <Title level={1} className="hero-title">
            The <span className="highlight-orange">Aadhaar</span> for your <span className="highlight-blue">Health</span>
          </Title>
          <Paragraph className="hero-description">
            Revolutionizing healthcare with unified digital health records. Your complete medical journey, securely accessible across India's healthcare ecosystem.
          </Paragraph>
          
          {/* Live Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">{stats.hospitals.toLocaleString()}+</div>
              <div className="stat-label">Hospitals</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{(stats.patients / 1000000).toFixed(1)}M+</div>
              <div className="stat-label">Patients</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{(stats.records / 1000000).toFixed(1)}M+</div>
              <div className="stat-label">Records</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.uptime}%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>

          <Space size="large" className="hero-actions">
            <Button 
              type="primary" 
              size="large" 
              className="cta-button"
              onClick={() => navigate('/login')}
              icon={<RocketOutlined />}
            >
              Get Started Free
            </Button>
            <Button 
              size="large" 
              className="learn-more-btn"
              icon={<PlayCircleOutlined />}
            >
              Watch Demo
            </Button>
            <Button 
              size="large" 
              className="download-btn"
              icon={<DownloadOutlined />}
            >
              Download App
            </Button>
          </Space>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <Text type="secondary">Trusted by leading healthcare providers</Text>
            <div className="trust-logos">
              <div className="trust-logo">Apollo</div>
              <div className="trust-logo">Fortis</div>
              <div className="trust-logo">Max</div>
              <div className="trust-logo">Manipal</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <Title level={2} className="section-title">Core Features</Title>
            <Paragraph className="section-subtitle">
              Powerful tools to manage, track, and validate health records seamlessly across India's healthcare ecosystem
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]} className="features-grid">
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="feature-card" hoverable>
                  <div className="feature-image-container">
                    <div className="feature-image-placeholder" style={{ background: feature.gradient }}>
                      <div className="feature-image-content">
                        {feature.icon}
                        <div className="feature-stats">{feature.stats}</div>
                      </div>
                    </div>
                  </div>
                  <div className="feature-content">
                    <Title level={3} className="feature-title">{feature.title}</Title>
                    <Text className="feature-subtitle">{feature.subtitle}</Text>
                    <Paragraph className="feature-description">
                      {feature.description}
                    </Paragraph>
                    <Button type="link" className="feature-link">
                      Learn More <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Advanced Features */}
          <div className="advanced-features">
            <Title level={3} className="advanced-title">Advanced Capabilities</Title>
            <Row gutter={[24, 24]}>
              {advancedFeatures.map((feature, index) => (
                <Col xs={12} md={6} key={index}>
                  <div className="advanced-feature-item">
                    <div className="advanced-icon" style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                    <Title level={5}>{feature.title}</Title>
                    <Text type="secondary">{feature.description}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <Title level={2} className="section-title">What Our Users Say</Title>
            <Paragraph className="section-subtitle">
              Real stories from healthcare providers and patients across India
            </Paragraph>
          </div>
          
          <Carousel 
            autoplay 
            autoplaySpeed={5000}
            dots={{ className: "custom-dots" }}
            className="testimonials-carousel"
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-slide">
                <Card className="testimonial-card">
                  <div className="testimonial-content">
                    <div className="testimonial-avatar">
                      <Avatar 
                        size={80} 
                        src={testimonial.avatar}
                        icon={<UserOutlined />}
                      />
                    </div>
                    <div className="testimonial-text">
                      <div className="testimonial-rating">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <StarOutlined key={i} style={{ color: '#faad14' }} />
                        ))}
                      </div>
                      <Paragraph className="testimonial-quote">
                        "{testimonial.content}"
                      </Paragraph>
                      <div className="testimonial-author">
                        <Title level={5} className="author-name">{testimonial.name}</Title>
                        <Text type="secondary" className="author-role">{testimonial.role}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Dramatically Enhanced Network Section */}
      <section id="network" className="network-section">
        <div className="container">
          <div className="section-header">
            <Title level={2} className="section-title">
              Our <span className="highlight-blue">Healthcare Network</span>
            </Title>
            <Paragraph className="network-description">
              AayuLink connects over 5,000 hospitals across India, ensuring your health data is accessible wherever you need medical care.
            </Paragraph>
            <div className="network-stats-banner">
              <div className="stat-banner-item">
                <div className="stat-banner-number">{stats.hospitals.toLocaleString()}+</div>
                <div className="stat-banner-label">Hospitals</div>
              </div>
              <div className="stat-banner-item">
                <div className="stat-banner-number">{(stats.patients / 1000000).toFixed(1)}M+</div>
                <div className="stat-banner-label">Patients</div>
              </div>
              <div className="stat-banner-item">
                <div className="stat-banner-number">{stats.uptime}%</div>
                <div className="stat-banner-label">Uptime</div>
              </div>
              <div className="stat-banner-item">
                <div className="stat-banner-number">24/7</div>
                <div className="stat-banner-label">Support</div>
              </div>
            </div>
          </div>
          
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={14}>
              <Card className="enhanced-map-card">
                <div className="map-container">
                  <div className="map-header">
                    <div className="map-title-section">
                      <Title level={4} className="map-title">Live Network Map</Title>
                      <div className="live-status">
                        <div className="live-dot"></div>
                        <span>Live Updates</span>
                      </div>
                    </div>
                    <div className="map-controls">
                      <Button size="small" icon={<SyncOutlined />}>Refresh</Button>
                      <Button size="small" icon={<EyeOutlined />}>Full View</Button>
                    </div>
                  </div>
                  
                  <div className="map-visual">
                    <div className="india-map-container">
                      <div className="map-image-placeholder">
                        <div className="map-image-content">
                          <div className="map-icon-large">
                            <GlobalOutlined />
                          </div>
                          <Title level={4} className="map-placeholder-title">Interactive India Map</Title>
                          <Text className="map-placeholder-subtitle">Real-time hospital locations and coverage</Text>
                          <Button type="primary" className="map-explore-btn">
                            Explore Regions
                          </Button>
                        </div>
                      </div>
                      
                      <div className="map-points-container">
                        {[...Array(25)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`map-point ${i % 4 === 0 ? 'active' : i % 4 === 1 ? 'medium' : 'inactive'}`}
                            style={{
                              left: `${Math.random() * 85 + 7.5}%`,
                              top: `${Math.random() * 70 + 15}%`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          >
                            <div className="point-pulse"></div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="map-legend">
                        <div className="legend-item">
                          <div className="legend-dot active"></div>
                          <span>Major Cities</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-dot medium"></div>
                          <span>Regional Centers</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-dot inactive"></div>
                          <span>Rural Areas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="map-footer">
                    <div className="uptime-display">
                      <div className="uptime-value">{stats.uptime}%</div>
                      <div className="uptime-label">System Uptime</div>
                      <Progress 
                        percent={stats.uptime} 
                        showInfo={false} 
                        strokeColor="#52c41a"
                        className="uptime-progress"
                      />
                    </div>
                    <div className="last-updated">
                      <SyncOutlined className="sync-icon" />
                      <span>Last updated: Just now</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={10}>
              <Card className="enhanced-hospitals-card">
                <div className="hospitals-header">
                  <div className="hospitals-title-section">
                    <Title level={4} className="hospitals-title">Connected Hospitals</Title>
                    <Badge count={hospitalStats.length} color="#52c41a" />
                  </div>
                  <div className="filter-section">
                    <Text strong>Filter by City:</Text>
                    <select className="city-filter">
                      <option>All Cities</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Bangalore</option>
                      <option>Chennai</option>
                      <option>Hyderabad</option>
                    </select>
                  </div>
                </div>
                
                <div className="hospitals-list">
                  {hospitalStats.map((hospital, index) => (
                    <div key={index} className="enhanced-hospital-item">
                      <div className="hospital-image-container">
                        <div className="hospital-image-placeholder">
                          <div className="hospital-image-content">
                            <MedicineBoxOutlined className="hospital-icon" />
                            <Text className="hospital-image-label">Hospital Logo</Text>
                          </div>
                          <div className="hospital-badge">
                            <CheckCircleOutlined />
                          </div>
                        </div>
                      </div>
                      <div className="hospital-info">
                        <div className="hospital-name-section">
                          <Title level={5} className="hospital-name">{hospital.name}</Title>
                          <Tag color="blue" className="hospital-type">Verified</Tag>
                        </div>
                        <div className="hospital-details">
                          <div className="detail-item">
                            <Text className="detail-label">Location:</Text>
                            <Text className="detail-value">{hospital.location}</Text>
                          </div>
                          <div className="detail-item">
                            <Text className="detail-label">Specialty:</Text>
                            <Text className="detail-value">{hospital.specialty}</Text>
                          </div>
                          <div className="detail-item">
                            <Text className="detail-label">Patients:</Text>
                            <Text className="detail-value">{hospital.patients} served</Text>
                          </div>
                        </div>
                      </div>
                      <div className="hospital-status">
                        <div className="status-container">
                          <div className={`status-dot ${hospital.status}`} />
                          <Text className="status-text">Online</Text>
                        </div>
                        <Button type="link" size="small" className="view-details-btn">
                          View Details
                        </Button>
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
