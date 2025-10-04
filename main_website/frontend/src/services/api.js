import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api', // This will use the Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Patient API functions
export const patientAPI = {
  // Create patient with ABHA ID
  createPatientWithABHA: async (patientData) => {
    try {
      console.log('Sending patient data to API:', patientData);
      const response = await api.post('/patient/create-with-abha', patientData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || { success: false, error: 'Failed to create patient' };
    }
  },

  // Generate ABHA ID only
  generateABHAId: async () => {
    try {
      const response = await api.get('/patient/generate-abha');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to generate ABHA ID' };
    }
  },

  // Lookup patient by ABHA ID
  lookupPatient: async (abhaId) => {
    try {
      const response = await api.get(`/patient/lookup/${abhaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to lookup patient' };
    }
  },

  // Update patient record
  updatePatient: async (abhaId, updateData) => {
    try {
      const response = await api.put(`/patient/update/${abhaId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to update patient' };
    }
  }
};

export default api;
