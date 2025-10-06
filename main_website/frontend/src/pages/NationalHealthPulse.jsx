import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, Typography, Segmented, Row, Col, Slider, Tag, Space, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { GlobalOutlined, LineChartOutlined, ThunderboltOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import './NationalHealthPulse.css';

const { Title, Text } = Typography;

// NOTE: This is a lightweight placeholder map without external deps.
// We render a static image of India with translucent overlays to simulate a heatmap.
// You can later replace this with Leaflet or Google Maps heatmap.

const diseases = ['Dengue Fever', 'Influenza', 'COVID-19', 'Malaria'];

// Local India image from public folder
const indiaImg = '/in.png';

const fakeHotspots = {
  'Dengue Fever': [
    { x: 45, y: 35, r: 90 }, // Delhi area
    { x: 40, y: 60, r: 70 }, // Mumbai area
  ],
  'Influenza': [
    { x: 60, y: 40, r: 80 }, // Kolkata area
    { x: 48, y: 70, r: 65 }, // Bengaluru area
  ],
  'COVID-19': [
    { x: 52, y: 45, r: 85 },
    { x: 35, y: 55, r: 60 },
  ],
  'Malaria': [
    { x: 55, y: 65, r: 75 },
    { x: 42, y: 72, r: 55 },
  ],
};

function HeatOverlay({ data, radius, blur }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {data.map((p, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.r + radius,
            height: p.r + radius,
            marginLeft: -(p.r + radius) / 2,
            marginTop: -(p.r + radius) / 2,
            background: 'radial-gradient(circle, rgba(74,0,224,0.45) 0%, rgba(74,0,224,0.25) 35%, rgba(74,0,224,0.05) 100%)',
            filter: `blur(${blur}px)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function NationalHealthPulse() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [disease, setDisease] = useState('Influenza');
  const [radius, setRadius] = useState(20);
  const [blur, setBlur] = useState(10);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const overlayData = useMemo(() => fakeHotspots[disease] || [], [disease]);

  // AI forecast state
  const [loadingAI, setLoadingAI] = useState(false);
  const [cards, setCards] = useState([]);
  const [lastGenerated, setLastGenerated] = useState(null);

  // Generate AI forecasts using Gemini
  const generateAIForecasts = async () => {
    setLoadingAI(true);
    try {
      const prompt = `Generate exactly 3 realistic outbreak forecast cards for ${disease} in India. Each card should have:
      - city: A different major Indian city (use different cities for each card)
      - risk: "Low Risk", "Medium Risk", or "High Risk" 
      - pct: Risk percentage (10-90)
      - reasoning: 1-2 sentence explanation based on factors like population density, weather, healthcare infrastructure, recent trends
      
      Format as JSON array with exactly 3 cards. Use different cities like Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad, Jaipur, Kochi, Indore, Bhopal. Each card must have a different city.`;
      
      const response = await fetch('/api/health/gemini-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: prompt,
          model: 'gemini-2.5-flash'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.response) {
        try {
          // Try to parse the AI response as JSON
          const aiCards = JSON.parse(data.response);
          if (Array.isArray(aiCards) && aiCards.length > 0) {
            setCards(aiCards);
            setLastGenerated(new Date().toISOString());
          } else {
            throw new Error('Invalid format');
          }
        } catch (parseError) {
          // Fallback: generate cards from text response
          const fallbackCards = generateFallbackCards(data.response, disease);
          setCards(fallbackCards);
          setLastGenerated(new Date().toISOString());
        }
      } else {
        // Fallback to static cards if API fails
        setCards(generateFallbackCards('', disease));
      }
    } catch (error) {
      console.error('AI forecast generation failed:', error);
      setCards(generateFallbackCards('', disease));
    } finally {
      setLoadingAI(false);
    }
  };

  // Generate fallback cards when AI fails
  const generateFallbackCards = (aiResponse, diseaseType) => {
    const cities = [
      { name: 'Mumbai, IN', baseRisk: 70 },
      { name: 'New Delhi, IN', baseRisk: 60 },
      { name: 'Bangalore, IN', baseRisk: 55 },
      { name: 'Chennai, IN', baseRisk: 65 },
      { name: 'Kolkata, IN', baseRisk: 50 },
      { name: 'Hyderabad, IN', baseRisk: 45 },
      { name: 'Pune, IN', baseRisk: 40 },
      { name: 'Ahmedabad, IN', baseRisk: 35 },
      { name: 'Jaipur, IN', baseRisk: 30 },
      { name: 'Kochi, IN', baseRisk: 25 }
    ];
    
    const riskLevels = ['Low Risk', 'Medium Risk', 'High Risk'];
    const reasonings = [
      'High population density and urban mobility increase transmission risk.',
      'Weather conditions and seasonal patterns favor disease spread.',
      'Strong healthcare infrastructure helps contain outbreaks effectively.',
      'Recent surveillance data shows concerning upward trends.',
      'Rural-urban migration patterns create vulnerability hotspots.',
      'Monsoon season creates ideal conditions for vector-borne diseases.',
      'Coastal climate and humidity levels affect disease transmission.',
      'Industrial pollution and air quality impact respiratory diseases.',
      'Tourist influx and international connectivity increase exposure risk.',
      'Agricultural practices and water management influence vector breeding.'
    ];
    
    // Shuffle cities to get different combinations each time
    const shuffledCities = [...cities].sort(() => Math.random() - 0.5);
    
    return shuffledCities.slice(0, 3).map((city, idx) => {
      const riskPct = Math.max(10, Math.min(90, city.baseRisk + (Math.random() - 0.5) * 20));
      const riskLevel = riskPct < 40 ? 'Low Risk' : riskPct < 70 ? 'Medium Risk' : 'High Risk';
      
      return {
        city: city.name,
        risk: riskLevel,
        pct: Math.round(riskPct),
        reasoning: reasonings[idx % reasonings.length]
      };
    });
  };

  // Load forecasts on component mount and when disease changes
  useEffect(() => {
    generateAIForecasts();
  }, [disease]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="nhp-container">
      <div className="nhp-header">
        <div className="nhp-title-section">
          <Title level={2} className="nhp-main-title">National Health Pulse</Title>
          <Text className="nhp-subtitle">Live infectious disease tracking and AI-powered outbreak forecasting across India.</Text>
        </div>
        <Button className="nhp-back-btn" onClick={() => navigate(-1)}>
          Back to Records
        </Button>
      </div>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card className="nhp-control-card" title={<div className="nhp-card-title"><GlobalOutlined /> <span>Disease Selector</span></div>}>
            <Segmented
              block
              options={diseases}
              value={disease}
              onChange={(val) => setDisease(val)}
              className="nhp-disease-selector"
            />

            <div className="nhp-slider-section">
              <Text className="nhp-slider-label">Heatmap Radius: {radius}</Text>
              <Slider 
                min={0} 
                max={60} 
                value={radius} 
                onChange={setRadius}
                className="nhp-slider"
                trackStyle={{ background: 'linear-gradient(90deg, #1890ff, #40a9ff)' }}
                handleStyle={{ borderColor: '#1890ff', boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)' }}
                tooltip={{ formatter: null }}
              />
            </div>

            <div className="nhp-slider-section">
              <Text className="nhp-slider-label">Heatmap Blur: {blur}</Text>
              <Slider 
                min={0} 
                max={30} 
                value={blur} 
                onChange={setBlur}
                className="nhp-slider"
                trackStyle={{ background: 'linear-gradient(90deg, #722ed1, #9254de)' }}
                handleStyle={{ borderColor: '#722ed1', boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.2)' }}
                tooltip={{ formatter: null }}
              />
            </div>

            <div className="nhp-insights-section">
              <Text className="nhp-insights-title">Live Data Insights</Text>
              <div className="nhp-outbreak-info">
                <Tag className="nhp-outbreak-tag">Selected Outbreak</Tag> 
                <Text className="nhp-outbreak-name">{disease}</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card className="nhp-map-card" bodyStyle={{ padding: 0 }}>
            <div className="nhp-map-container">
              {/* Zoom Controls */}
              <div className="nhp-zoom-controls">
                <Button 
                  className="nhp-zoom-btn nhp-zoom-in"
                  icon={<ZoomInOutlined />} 
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                />
                <Button 
                  className="nhp-zoom-btn nhp-zoom-out"
                  icon={<ZoomOutOutlined />} 
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                />
                <Button 
                  className="nhp-zoom-btn nhp-reset"
                  icon={<ReloadOutlined />} 
                  onClick={handleReset}
                />
                <div className="nhp-zoom-indicator">
                  {Math.round(zoom * 100)}%
                </div>
              </div>
              
              {/* Map Container */}
              <div 
                ref={mapRef}
                className={`nhp-map-wrapper ${zoom > 1 ? (isDragging ? 'nhp-dragging' : 'nhp-draggable') : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div 
                  className="nhp-map-inner"
                  style={{
                    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${zoom})`
                  }}
                >
                  <img 
                    src={indiaImg} 
                    alt="India map" 
                    className="nhp-map-image"
                  />
                  <HeatOverlay 
                    data={overlayData} 
                    radius={radius} 
                    blur={blur} 
                  />
                </div>
              </div>
              
              <Tag className="nhp-demo-tag">Live Demonstration</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="nhp-forecast-card" title={
        <div className="nhp-card-title">
          <LineChartOutlined /> 
          <span>AI-Powered Future Outbreak Forecasts</span>
          <div className="nhp-forecast-actions">
            <Button 
              size="small" 
              onClick={generateAIForecasts}
              loading={loadingAI}
              className="nhp-regenerate-btn"
            >
              {loadingAI ? 'Generating...' : 'Regenerate'}
            </Button>
            {lastGenerated && (
              <Text type="secondary" className="nhp-last-updated">
                Last updated: {new Date(lastGenerated).toLocaleTimeString()}
              </Text>
            )}
          </div>
        </div>
      }>
        {loadingAI ? (
          <div className="nhp-loading">
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>AI is analyzing disease patterns and generating forecasts...</Text>
            </div>
          </div>
        ) : (
          <Row gutter={16} align="stretch">
            {cards.map((c, idx) => {
              const isLowRisk = c.risk === 'Low Risk';
              const isHighRisk = c.risk === 'High Risk';
              return (
                <Col xs={24} md={8} key={`${c.city}-${idx}`} style={{ display: 'flex' }}>
                  <Card
                    className={`nhp-forecast-item ${isLowRisk ? 'nhp-low-risk' : isHighRisk ? 'nhp-high-risk' : 'nhp-medium-risk'}`}
                    headStyle={{ borderBottom: 'none' }}
                    title={
                      <div className="nhp-forecast-title">
                        <ThunderboltOutlined className={isLowRisk ? 'nhp-icon-blue' : isHighRisk ? 'nhp-icon-red' : 'nhp-icon-orange'} /> 
                        <strong>{disease}</strong>
                      </div>
                    }
                    extra={<Tag className={isLowRisk ? 'nhp-tag-blue' : isHighRisk ? 'nhp-tag-red' : 'nhp-tag-orange'}>{c.risk}</Tag>}
                  >
                    <div className="nhp-city-name">
                      <Text type="secondary">{c.city}</Text>
                    </div>
                    <div className="nhp-prediction-section">
                      <div className={`nhp-percentage-circle ${isLowRisk ? 'nhp-circle-blue' : isHighRisk ? 'nhp-circle-red' : 'nhp-circle-orange'}`}>
                        <Text strong>{c.pct}%</Text>
                      </div>
                      <div className="nhp-prediction-text">
                        <Text type="secondary">Predicted Risk Level:</Text>
                        <div><Text strong>{c.pct}%</Text></div>
                      </div>
                    </div>
                    <div className="nhp-reasoning-section">
                      <Text strong>AI Analysis:</Text>
                      <div className="nhp-reasoning-text">
                        <Text>{c.reasoning}</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
}
