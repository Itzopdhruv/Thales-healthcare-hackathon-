'use client'

import { motion } from 'framer-motion'
import { 
  FileText, 
  Calendar, 
  Pill, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package
} from 'lucide-react'
import { useOverview } from '@/lib/hooks/useOverview'

interface OverviewProps {
  setActiveTab: (tab: string) => void
}

const Overview = ({ setActiveTab }: OverviewProps) => {
  const { data, loading, error, refetch } = useOverview()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={refetch} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  const stats = [
    { label: 'Total Medicines', value: data.stats.totalMedicines.toLocaleString(), icon: Pill, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'In Stock', value: data.stats.inStock.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Low Stock Items', value: data.stats.lowStock.toLocaleString(), icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { label: 'Out of Stock', value: data.stats.outOfStock.toLocaleString(), icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { label: 'Total Prescriptions', value: data.stats.totalPrescriptions?.toLocaleString() || '0', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: 'Today\'s Prescriptions', value: data.stats.prescriptionsToday?.toLocaleString() || '0', icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  ]

  const healthMetrics = data.healthMetrics

  const recentActivity = data.recentActivity

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'danger': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'danger': return AlertTriangle
      case 'info': return TrendingUp
      default: return FileText
    }
  }

  const getActivityIconColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'danger': return 'text-red-500'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Dr. Johnson</h1>
        <p className="text-gray-600">Here's what's happening at your pharmacy today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card card-hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <div className="space-y-4">
            {healthMetrics.map((metric, index) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.progress}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    className={`h-2 rounded-full ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = getActivityIcon(activity.status)
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className={`p-2 rounded-full ${getActivityIconColor(activity.status)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('prescriptions')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
          >
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Process Prescription</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('inventory')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
          >
            <Pill className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Add Medicine</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('analytics')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
          >
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">View Analytics</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Overview
