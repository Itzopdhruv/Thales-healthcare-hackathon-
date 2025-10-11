import axios from 'axios';

// Test specific report operations
async function testReportOperations() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔐 Testing Report Operations...\n');
  
  // First get a valid token
  let token = null;
  try {
    console.log('1️⃣ Getting patient token...');
    const loginResponse = await axios.post(`${baseURL}/patient-auth/verify-otp`, {
      name: 'Test Patient',
      phone: '1234567890',
      abhaId: '34-68-64-07',
      otp: '081106'
    });
    
    if (loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Patient login successful!');
      console.log('🔑 Token:', token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return;
  }
  
  // Get reports to find a report ID
  let reportId = null;
  try {
    console.log('\n2️⃣ Getting reports...');
    const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (reportsResponse.data.data?.reports?.length > 0) {
      reportId = reportsResponse.data.data.reports[0]._id;
      console.log('✅ Reports found!');
      console.log('📄 Report ID:', reportId);
      console.log('📄 Report title:', reportsResponse.data.data.reports[0].title);
      console.log('📄 Report file path:', reportsResponse.data.data.reports[0].filePath);
    } else {
      console.log('❌ No reports found');
      return;
    }
  } catch (error) {
    console.log('❌ Get reports failed:', error.response?.data || error.message);
    return;
  }
  
  // Test view report
  try {
    console.log('\n3️⃣ Testing view report...');
    const viewResponse = await axios.get(`${baseURL}/reports/${reportId}/view`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ View report successful!');
    console.log('📄 Status:', viewResponse.status);
    console.log('📄 Content-Type:', viewResponse.headers['content-type']);
    console.log('📄 Content-Length:', viewResponse.headers['content-length']);
    console.log('📄 Content-Disposition:', viewResponse.headers['content-disposition']);
  } catch (error) {
    console.log('❌ View report failed:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
  }
  
  // Test download report
  try {
    console.log('\n4️⃣ Testing download report...');
    const downloadResponse = await axios.get(`${baseURL}/reports/${reportId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });
    console.log('✅ Download report successful!');
    console.log('📄 Status:', downloadResponse.status);
    console.log('📄 Content-Type:', downloadResponse.headers['content-type']);
    console.log('📄 Content-Length:', downloadResponse.headers['content-length']);
    console.log('📄 Content-Disposition:', downloadResponse.headers['content-disposition']);
    console.log('📄 Blob size:', downloadResponse.data.size, 'bytes');
  } catch (error) {
    console.log('❌ Download report failed:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
  }
  
  // Test get report by ID
  try {
    console.log('\n5️⃣ Testing get report by ID...');
    const getResponse = await axios.get(`${baseURL}/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Get report by ID successful!');
    console.log('📄 Report data:', {
      id: getResponse.data.data._id,
      title: getResponse.data.data.title,
      documentType: getResponse.data.data.documentType,
      fileSize: getResponse.data.data.fileSize,
      mimeType: getResponse.data.data.mimeType
    });
  } catch (error) {
    console.log('❌ Get report by ID failed:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
  }
  
  console.log('\n🏁 Report operations test completed!');
}

testReportOperations();
