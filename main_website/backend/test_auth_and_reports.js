import axios from 'axios';

// Test authentication and report APIs
async function testAuthenticationAndReports() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🔐 Testing Authentication and Report APIs...\n');
  
  // Test 1: Try to login as admin
  try {
    console.log('1️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Admin login successful!');
      const token = loginResponse.data.token;
      console.log('🔑 Token:', token.substring(0, 20) + '...');
      
      // Test 2: Get reports with valid token
      console.log('\n2️⃣ Testing get reports with valid token...');
      try {
        const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Reports retrieved successfully!');
        console.log('📊 Reports count:', reportsResponse.data.data?.reports?.length || 0);
        
        if (reportsResponse.data.data?.reports?.length > 0) {
          const firstReport = reportsResponse.data.data.reports[0];
          console.log('📄 First report ID:', firstReport._id);
          console.log('📄 First report title:', firstReport.title);
          
          // Test 3: Test view report
          console.log('\n3️⃣ Testing view report...');
          try {
            const viewResponse = await axios.get(`${baseURL}/reports/${firstReport._id}/view`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('✅ View report successful!');
            console.log('📄 Content-Type:', viewResponse.headers['content-type']);
            console.log('📄 Content-Length:', viewResponse.headers['content-length']);
          } catch (viewError) {
            console.log('❌ View report failed:', viewError.response?.data || viewError.message);
          }
          
          // Test 4: Test download report
          console.log('\n4️⃣ Testing download report...');
          try {
            const downloadResponse = await axios.get(`${baseURL}/reports/${firstReport._id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              responseType: 'blob'
            });
            console.log('✅ Download report successful!');
            console.log('📄 Content-Type:', downloadResponse.headers['content-type']);
            console.log('📄 Content-Length:', downloadResponse.headers['content-length']);
            console.log('📄 Blob size:', downloadResponse.data.size, 'bytes');
          } catch (downloadError) {
            console.log('❌ Download report failed:', downloadError.response?.data || downloadError.message);
          }
        }
        
      } catch (reportsError) {
        console.log('❌ Get reports failed:', reportsError.response?.data || reportsError.message);
      }
      
    } else {
      console.log('❌ Admin login failed - no token received');
    }
    
  } catch (loginError) {
    console.log('❌ Admin login failed:', loginError.response?.data || loginError.message);
    
    // Try patient login as fallback
    console.log('\n🔄 Trying patient login as fallback...');
    try {
      const patientLoginResponse = await axios.post(`${baseURL}/patient-auth/verify-otp`, {
        name: 'Test Patient',
        phone: '1234567890',
        abhaId: '34-68-64-07',
        otp: '081106'
      });
      
      if (patientLoginResponse.data.token) {
        console.log('✅ Patient login successful!');
        const token = patientLoginResponse.data.token;
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        
        // Test reports with patient token
        console.log('\n2️⃣ Testing get reports with patient token...');
        try {
          const reportsResponse = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Reports retrieved successfully!');
          console.log('📊 Reports count:', reportsResponse.data.data?.reports?.length || 0);
        } catch (reportsError) {
          console.log('❌ Get reports failed:', reportsError.response?.data || reportsError.message);
        }
      }
      
    } catch (patientLoginError) {
      console.log('❌ Patient login failed:', patientLoginError.response?.data || patientLoginError.message);
    }
  }
  
  console.log('\n🏁 Test completed!');
}

testAuthenticationAndReports();
