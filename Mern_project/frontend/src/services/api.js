import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Inventory API
export const inventoryAPI = {
  // Get all medicines
  getAllMedicines: () => api.get('/inventory/all'),
  
  // Get medicine by ID
  getMedicineById: (id) => api.get(`/inventory/${id}`),
  
  // Add new medicine
  addMedicine: (medicineData) => api.post('/inventory/add', medicineData),
  
  // Update medicine
  updateMedicine: (id, medicineData) => api.put(`/inventory/update/${id}`, medicineData),
  
  // Delete medicine
  deleteMedicine: (id) => api.delete(`/inventory/delete/${id}`),
  
  // Get low stock medicines
  getLowStockMedicines: (threshold = 10) => api.get(`/inventory/low-stock?threshold=${threshold}`),
  
  // Sell medicines
  sellMedicines: (medicines) => api.post('/inventory/sell', { medicines }),
};

// Search API
export const searchAPI = {
  // Search similar medicines
  searchSimilarMedicines: (medicineName, topK = 5) => 
    api.post('/search/similar', { medicine_name: medicineName, top_k: topK }),
};

// OCR API
export const ocrAPI = {
  // Extract text from image
  extractTextFromImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ocr/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Health check
export const healthCheck = () => api.get('/');

export default api;
