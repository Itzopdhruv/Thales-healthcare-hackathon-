import axios from 'axios';

const testRegister = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/register', {
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      hospitalName: 'Test Hospital',
      hospitalCode: 'TH001'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
};

testRegister();
