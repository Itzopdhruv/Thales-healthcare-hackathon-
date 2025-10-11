import axios from 'axios';

// Debug report data structure
async function debugReportData() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔍 Debugging Report Data Structure...\n');
  
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
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return;
  }
  
  // Get reports and examine structure
  try {
    const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (reportsResponse.data.data?.reports?.length > 0) {
      const report = reportsResponse.data.data.reports[0];
      console.log('📄 Report data structure:');
      console.log('  - _id:', report._id);
      console.log('  - title:', report.title);
      console.log('  - abhaId:', report.abhaId);
      console.log('  - patientId:', report.patientId);
      console.log('  - uploadedBy:', report.uploadedBy);
      console.log('  - filePath:', report.filePath);
      console.log('  - originalFileName:', report.originalFileName);
      console.log('  - mimeType:', report.mimeType);
      console.log('  - fileSize:', report.fileSize);
      console.log('  - visibility:', report.visibility);
      console.log('  - sharedWith:', report.sharedWith);
      
      // Check if we can access this report
      console.log('\n🔐 Access check:');
      console.log('  - Token user ID:', token ? 'Present' : 'Missing');
      console.log('  - Report uploadedBy:', report.uploadedBy);
      console.log('  - Report patientId:', report.patientId);
      console.log('  - Report visibility:', report.visibility);
    }
    
  } catch (error) {
    console.log('❌ Get reports failed:', error.response?.data || error.message);
  }
}

debugReportData();
