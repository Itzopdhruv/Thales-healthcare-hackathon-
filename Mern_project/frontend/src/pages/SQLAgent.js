import React from 'react';
import { Card, Alert, Typography } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const SQLAgent = () => {
  return (
    <div>
      <Title level={2}>🧠 AI SQL Query Assistant</Title>
      
      <Card>
        <Alert
          message="Coming Soon"
          description={
            <div>
              <Paragraph>
                This module is currently under development. The AI SQL Agent will provide:
              </Paragraph>
              <ul>
                <li>Natural language to SQL query conversion</li>
                <li>Intelligent database querying capabilities</li>
                <li>Data analysis and reporting features</li>
                <li>Custom dashboard generation</li>
                <li>Advanced analytics for inventory management</li>
                <li>Predictive analytics for stock management</li>
              </ul>
              <Paragraph type="secondary">
                This feature will help you generate complex queries and reports using simple English commands.
              </Paragraph>
              <Paragraph type="secondary">
                Stay tuned for updates!
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          icon={<DatabaseOutlined />}
        />
      </Card>
    </div>
  );
};

export default SQLAgent;
