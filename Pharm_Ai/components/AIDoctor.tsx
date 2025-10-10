'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mic, 
  Camera, 
  Send, 
  Settings, 
  Bell,
  LogOut,
  Volume2,
  Trash2
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  isImage?: boolean
}

interface AIDoctorProps {
  onClose: () => void
  onLogout: () => void
}

const AIDoctor = ({ onClose, onLogout }: AIDoctorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI Doctor assistant. I can help you with medical questions, analyze prescription images, suggest medicine alternatives, and provide home remedies. How can I assist you today?',
      timestamp: '1:45:48 AM'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I understand your question. Let me analyze that for you and provide a comprehensive response based on medical best practices and available data.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    // Voice input logic would go here
  }

  const handleImageUpload = () => {
    // Image upload logic would go here
    console.log('Image upload triggered')
  }

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI Doctor assistant. I can help you with medical questions, analyze prescription images, suggest medicine alternatives, and provide home remedies. How can I assist you today?',
      timestamp: '1:45:48 AM'
    }])
  }

  const testSpeech = () => {
    // Speech synthesis logic would go here
    console.log('Testing speech synthesis')
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">AI Doctor</h2>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-white/20 rounded">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-white/20 rounded">
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <button 
            onClick={testSpeech}
            className="hover:underline flex items-center space-x-1"
          >
            <Volume2 className="w-3 h-3" />
            <span>Test Speech</span>
          </button>
          <button 
            onClick={clearChat}
            className="hover:underline flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your medical question here..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isListening 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImageUpload}
                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>
            
            <button 
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors duration-200"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDoctor
