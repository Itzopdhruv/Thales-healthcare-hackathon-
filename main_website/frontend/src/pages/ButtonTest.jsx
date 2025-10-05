import React, { useState } from 'react';
import { Button, Modal, Form, Input } from 'antd';

const ButtonTest = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Button Test</h1>
      <Button 
        type="primary" 
        onClick={() => {
          console.log('Button clicked!');
          setModalVisible(true);
        }}
      >
        Test Button
      </Button>
      
      <Modal
        title="Test Modal"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <p>Modal is working!</p>
      </Modal>
    </div>
  );
};

export default ButtonTest;
