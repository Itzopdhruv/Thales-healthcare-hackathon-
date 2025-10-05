import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Typography, message } from 'antd';
import api from '../services/api';

const { Title, Text } = Typography;

const TestPatientViewer = () => {
  const { id: patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      testPatientLookup();
    }
  }, [patientId]);

  const testPatientLookup = async () => {
    try {
      setLoading(true);
      console.log('Testing patient lookup for ABHA ID:', patientId);
      
      const response = await api.get(`/patient/lookup/${patientId}`);
      console.log('API Response:', response);
      
      if (response.data.success) {
        setPatient(response.data.data.patient);
        message.success('Patient found successfully!');
      } else {
        setError('Patient not found');
      }
    } catch (error) {
      console.error('API Error:', error);
      setError('API Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Title level={3}>Error</Title>
        <Text type="danger">{error}</Text>
        <br />
        <Text>Patient ID: {patientId}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Test Patient Viewer</Title>
      <Text>Patient ID from URL: {patientId}</Text>
      <br />
      <Button onClick={testPatientLookup}>Test API Call</Button>
      
      {patient && (
        <Card style={{ marginTop: '20px' }}>
          <Title level={4}>Patient Found:</Title>
          <Text>Name: {patient.name}</Text>
          <br />
          <Text>ABHA ID: {patient.abhaId}</Text>
          <br />
          <Text>Email: {patient.email}</Text>
        </Card>
      )}
    </div>
  );
};

export default TestPatientViewer;
