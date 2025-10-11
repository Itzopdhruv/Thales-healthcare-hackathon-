import axios from 'axios';
import jwt from 'jsonwebtoken';

// Debug ABHA ID access
async function debugAbhaIdAccess() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔍 Debugging ABHA ID Access...\n');
  
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
      
      // Get reports to see the ABHA ID
      const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (reportsResponse.data.data?.reports?.length > 0) {
        const report = reportsResponse.data.data.reports[0];
        console.log('\n📄 Report data:');
        console.log('  - Report ABHA ID:', report.abhaId);
        console.log('  - Token patientId:', decoded?.patientId);
        console.log('  - Requested ABHA ID:', '34-68-64-07');
        
        // Check ABHA ID match
        console.log('\n🔐 ABHA ID Access check:');
        console.log('  - Report ABHA ID === Requested ABHA ID:', report.abhaId === '34-68-64-07');
        
        // Test the canAccessByAbhaId method directly
        console.log('\n🧪 Testing canAccessByAbhaId method:');
        console.log('  - Would allow access:', report.abhaId === '34-68-64-07');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

debugAbhaIdAccess();
