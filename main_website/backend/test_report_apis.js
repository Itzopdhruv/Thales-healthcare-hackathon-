import axios from 'axios';

// Test the report APIs
async function testReportAPIs() {
  const baseURL = 'http://localhost:5001/api';
  
  // First, let's try to get reports for the patient
  try {
    console.log('Testing get patient reports...');
    const response = await axios.get(`${baseURL}/reports/patient/34-68-64-07`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but we'll see the error
      }
    });
    console.log('Reports response:', response.data);
  } catch (error) {
    console.log('Get reports error:', error.response?.data || error.message);
  }

  // Let's try to test with a specific report ID (we'll use a fake one first)
  const testReportId = '507f1f77bcf86cd799439011'; // Fake ObjectId
  
  try {
    console.log('\nTesting view report...');
    const response = await axios.get(`${baseURL}/reports/${testReportId}/view`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('View response:', response.data);
  } catch (error) {
    console.log('View report error:', error.response?.data || error.message);
  }

  try {
    console.log('\nTesting download report...');
    const response = await axios.get(`${baseURL}/reports/${testReportId}/download`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Download response:', response.data);
  } catch (error) {
    console.log('Download report error:', error.response?.data || error.message);
  }

  try {
    console.log('\nTesting delete report...');
    const response = await axios.delete(`${baseURL}/reports/${testReportId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Delete response:', response.data);
  } catch (error) {
    console.log('Delete report error:', error.response?.data || error.message);
  }
}

testReportAPIs();
