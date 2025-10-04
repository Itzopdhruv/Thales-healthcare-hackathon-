import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPatientView from './pages/AdminPatientView';
import PatientRecordViewer from './pages/PatientRecordViewer';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <Router>
                  <div className="App">
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<Login />} />
                      <Route 
                        path="/patient-dashboard" 
                        element={
                          <ProtectedRoute>
                            <PatientDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/doctor-dashboard" 
                        element={
                          <ProtectedRoute>
                            <DoctorDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin-dashboard" 
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin-patient-view" 
                        element={
                          <ProtectedRoute>
                            <AdminPatientView />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/patient-viewer" 
                        element={
                          <ProtectedRoute>
                            <PatientRecordViewer />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/dashboard" element={<Navigate to="/patient-dashboard" replace />} />
                    </Routes>
                  </div>
          </Router>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;