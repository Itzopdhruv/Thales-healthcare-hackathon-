import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api', // This will use the Vite proxy
  timeout: 120000, // Allow up to 120s for AI/report requests
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
  },

  // AI Assistant API
  chatWithAIAssistant: async (data) => {
    try {
      const response = await api.post('/ai-assistant/chat', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to chat with AI Assistant' };
    }
  },

  getPatientContext: async (patientId) => {
    try {
      const response = await api.get(`/ai-assistant/patient-context/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to get patient context' };
    }
  },

  // Fetch prescriptions for a given ABHA ID
  getPrescriptions: async (abhaId, params = {}) => {
    const response = await api.get(`/prescription/${abhaId}`, { params });
    return response.data;
  }
};

// Patient OTP Auth API
export const patientAuthAPI = {
  requestOtp: async ({ name, phone, abhaId }) => {
    const response = await api.post('/patient-auth/request-otp', { name, phone, abhaId });
    return response.data;
  },
  verifyOtp: async ({ name, phone, abhaId, otp }) => {
    const response = await api.post('/patient-auth/verify-otp', { name, phone, abhaId, otp });
    return response.data;
  }
};

// AI Doctor API
export const aiDoctorAPI = {
  // Analyze medical input (audio, image, text)
  analyzeMedicalInput: async (data) => {
    const response = await api.post('/ai-doctor/analyze', data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000 // 2 minutes for AI processing
    });
    return response.data;
  },

  // Get audio response file
  getAudioResponse: async (filename) => {
    const response = await api.get(`/ai-doctor/audio/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Check AI Doctor service health
  checkHealth: async () => {
    const response = await api.get('/ai-doctor/health');
    return response.data;
  }
};

export default api;
