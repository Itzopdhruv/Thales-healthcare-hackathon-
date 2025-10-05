import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Space,
  Alert,
  Spin,
  Row,
  Col,
  Statistic,
  Tag,
  Divider
} from 'antd';
import {
  SearchOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { searchAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

const SearchPage = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (value) => {
    if (!value.trim()) {
      setError('Please enter a medicine name to search');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchQuery(value);

    try {
      const response = await searchAPI.searchSimilarMedicines(value, 10);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to search for similar medicines');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score > 0.8) return 'green';
    if (score > 0.6) return 'blue';
    if (score > 0.4) return 'orange';
    return 'red';
  };

  const getScoreText = (score) => {
    if (score > 0.8) return 'Very Similar';
    if (score > 0.6) return 'Similar';
    if (score > 0.4) return 'Somewhat Similar';
    return 'Less Similar';
  };

  return (
    <div>
      <Title level={2}>
        <ExperimentOutlined /> AI-Powered Medicine Search
      </Title>
      
      <Text type="secondary">
        Find similar medicines using advanced vector search technology. 
        Enter a medicine name to discover alternatives and similar medications.
      </Text>

      <Divider />

      {/* Search Section */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <Space.Compact style={{ width: '100%' }}>
              <Search
                placeholder="Enter medicine name (e.g., Paracetamol, Aspirin)"
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />}>
                    Search
                  </Button>
                }
                size="large"
                onSearch={handleSearch}
                loading={loading}
              />
            </Space.Compact>
          </Col>
        </Row>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert
          message="Search Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Loading State */}
      {loading && (
        <Card style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Searching for similar medicines...</Text>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !loading && (
        <>
          {/* Results Summary */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Search Query"
                  value={searchQuery}
                  prefix={<SearchOutlined />}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Results Found"
                  value={searchResults.length}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Best Match"
                  value={searchResults[0]?.score ? (searchResults[0].score * 100).toFixed(1) : 0}
                  suffix="%"
                  prefix={<BulbOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Results List */}
          <Card title="🔍 Similar Medicines Found">
            <List
              dataSource={searchResults}
              renderItem={(item, index) => (
                <List.Item>
                  <Card
                    size="small"
                    style={{ width: '100%' }}
                    title={
                      <Space>
                        <MedicineBoxOutlined />
                        <Text strong>{item.name}</Text>
                        <Tag color={getScoreColor(item.score)}>
                          {getScoreText(item.score)}
                        </Tag>
                      </Space>
                    }
                    extra={
                      <Text type="secondary">
                        Similarity: {(item.score * 100).toFixed(1)}%
                      </Text>
                    }
                  >
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text type="secondary">
                          Rank #{index + 1} • Score: {item.score.toFixed(4)}
                        </Text>
                      </Col>
                      <Col>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => setSearchQuery(item.name)}
                        >
                          Search for this medicine
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !loading && searchQuery && !error && (
        <Card style={{ textAlign: 'center' }}>
          <Title level={4} type="secondary">
            No similar medicines found
          </Title>
          <Text type="secondary">
            Try searching with a different medicine name or check the spelling.
          </Text>
        </Card>
      )}

      {/* Instructions */}
      {searchResults.length === 0 && !loading && !searchQuery && (
        <Card title="💡 How to Use AI Search">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small">
                <Title level={5}>1. Enter Medicine Name</Title>
                <Text type="secondary">
                  Type the name of any medicine you want to find alternatives for.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Title level={5}>2. AI Analysis</Title>
                <Text type="secondary">
                  Our AI analyzes the medicine and finds similar medications using vector search.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Title level={5}>3. View Results</Title>
                <Text type="secondary">
                  See ranked results with similarity scores and detailed information.
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;
