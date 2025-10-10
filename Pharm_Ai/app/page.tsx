'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import AIDoctor from '@/components/AIDoctor'
import { motion } from 'framer-motion'

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAIDoctor, setShowAIDoctor] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        setIsAuthenticated(true)
      } else {
        window.location.href = '/auth/login'
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('authToken')
    
    // Update authentication state
    setIsAuthenticated(false)
    
    // Redirect to login page
    window.location.href = '/auth/login'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading PharmaAI...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>
      </div>
      
      {/* AI Doctor Panel */}
      {showAIDoctor && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50"
        >
          <AIDoctor onClose={() => setShowAIDoctor(false)} onLogout={handleLogout} />
        </motion.div>
      )}
      
      {/* AI Doctor Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAIDoctor(!showAIDoctor)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </motion.button>
    </div>
  )
}
