import React from 'react';
import { 
  LockOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalendarOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const IconTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Icon Test</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <LockOutlined style={{ fontSize: '24px' }} />
        <UserOutlined style={{ fontSize: '24px' }} />
        <PhoneOutlined style={{ fontSize: '24px' }} />
        <MailOutlined style={{ fontSize: '24px' }} />
        <CalendarOutlined style={{ fontSize: '24px' }} />
        <HeartOutlined style={{ fontSize: '24px' }} />
        <MedicineBoxOutlined style={{ fontSize: '24px' }} />
        <ExclamationCircleOutlined style={{ fontSize: '24px' }} />
        <ClockCircleOutlined style={{ fontSize: '24px' }} />
        <CheckCircleOutlined style={{ fontSize: '24px' }} />
      </div>
    </div>
  );
};

export default IconTest;
