'use client'

import { motion } from 'framer-motion'
import Overview from '@/components/dashboard/Overview'
import Inventory from '@/components/dashboard/Inventory'
import Prescriptions from '@/components/dashboard/Prescriptions'
import Analytics from '@/components/dashboard/Analytics'

interface DashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Dashboard = ({ activeTab, setActiveTab }: DashboardProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />
      case 'inventory':
        return <Inventory />
      case 'prescriptions':
        return <Prescriptions />
      case 'analytics':
        return <Analytics />
      default:
        return <Overview setActiveTab={setActiveTab} />
    }
  }

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      {renderContent()}
    </motion.div>
  )
}

export default Dashboard
