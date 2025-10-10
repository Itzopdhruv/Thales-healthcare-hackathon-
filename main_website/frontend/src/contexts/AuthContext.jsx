import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { patientAuthAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // No need to configure axios defaults as api service handles it

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const authType = localStorage.getItem('authType');
          if (authType === 'patient') {
            // For patient tokens, we don't call /auth/me (user-only). Restore cached user.
            const cachedUser = localStorage.getItem('user');
            if (cachedUser) {
              setUser(JSON.parse(cachedUser));
            }
          } else {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Don't clear tokens immediately, let user retry
          console.log('Authentication failed, but keeping user logged in for retry');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with credentials:', credentials);
      const response = await api.post('/auth/login', credentials);
      const { token: newToken, user: userData } = response.data;
      
      console.log('✅ Login successful, setting user data:', userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('authType', 'user');
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      console.log('💾 User data saved to localStorage and state');
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const patientLoginRequestOtp = async ({ name, phone, abhaId }) => {
    try {
      const data = await patientAuthAPI.requestOtp({ name, phone, abhaId });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to request OTP' };
    }
  };

  const patientLoginVerifyOtp = async ({ name, phone, abhaId, otp }) => {
    try {
      const data = await patientAuthAPI.verifyOtp({ name, phone, abhaId, otp });
      const { token: newToken, patient } = data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('authType', 'patient');
      const patientUser = {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        abhaId: patient.abhaId,
        role: 'patient'
      };
      localStorage.setItem('user', JSON.stringify(patientUser));
      setToken(newToken);
      // Normalize to user-like object for dashboards
      setUser(patientUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'OTP verification failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } 
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      // Even if backend call fails, we still want to logout locally
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('authType');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    patientLoginRequestOtp,
    patientLoginVerifyOtp,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
