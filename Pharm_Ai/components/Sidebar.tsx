'use client'

import { 
  LayoutDashboard, 
  FileText, 
  Pill, 
  Settings, 
  LogOut,
  User
} from 'lucide-react'
import { motion } from 'framer-motion'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onLogout: () => void
}

const Sidebar = ({ activeTab, setActiveTab, onLogout }: SidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ]

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-64 bg-white shadow-lg h-full flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PharmaAI</h1>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Dr. Sarah Johnson</p>
            <p className="text-sm text-gray-500">Pharmacy Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item w-full ${
                activeTab === item.id ? 'active' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="sidebar-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Sidebar
