import axios from 'axios';
import jwt from 'jsonwebtoken';

// Debug token and user ID
async function debugTokenAndUserId() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔍 Debugging Token and User ID...\n');
  
  // Get token
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/patient-auth/verify-otp`, {
      name: 'Test Patient',
      phone: '1234567890',
      abhaId: '34-68-64-07',
      otp: '081106'
    });
    
    if (loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Token obtained');
      
      // Decode token to see what's inside
      const decoded = jwt.decode(token);
      console.log('🔑 Decoded token:', decoded);
      
      // Get reports to see the patientId
      const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (reportsResponse.data.data?.reports?.length > 0) {
        const report = reportsResponse.data.data.reports[0];
        console.log('\n📄 Report data:');
        console.log('  - Report patientId:', report.patientId);
        console.log('  - Token userId:', decoded?.userId);
        console.log('  - Token patientId:', decoded?.patientId);
        console.log('  - Token type:', decoded?.type);
        
        // Check if they match
        console.log('\n🔐 Access check:');
        console.log('  - Token userId === Report patientId:', decoded?.userId === report.patientId);
        console.log('  - Token patientId === Report patientId:', decoded?.patientId === report.patientId);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

debugTokenAndUserId();
