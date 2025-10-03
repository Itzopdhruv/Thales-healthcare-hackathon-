import React from 'react';
import { Card, Alert, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Chatbot = () => {
  return (
    <div>
      <Title level={2}>🤖 Health Advice Chatbot</Title>
      
      <Card>
        <Alert
          message="Coming Soon"
          description={
            <div>
              <Paragraph>
                This module is currently under development. The Health Advice Chatbot will provide:
              </Paragraph>
              <ul>
                <li>AI-powered health advice and recommendations</li>
                <li>Medicine interaction checking</li>
                <li>Symptom analysis and suggestions</li>
                <li>Integration with the medicine database</li>
                <li>Natural language processing for patient queries</li>
              </ul>
              <Paragraph type="secondary">
                Stay tuned for updates!
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          icon={<RobotOutlined />}
        />
      </Card>
    </div>
  );
};

export default Chatbot;
