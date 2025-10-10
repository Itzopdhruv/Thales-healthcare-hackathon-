'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const { data, loading, error, refetch } = useAnalytics({ period: selectedPeriod })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
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
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  const { kpis, salesData, categoryData, topMedicines, monthlyTrends, stockAlerts, performanceMetrics } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your pharmacy performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field min-w-[120px]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const getIcon = (iconName: string) => {
            switch (iconName) {
              case 'DollarSign': return DollarSign
              case 'Package': return Package
              case 'Users': return Users
              case 'Activity': return Activity
              default: return BarChart3
            }
          }
          const Icon = getIcon(kpi.icon)
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <div className="flex items-center space-x-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {selectedPeriod === '7d' ? 'Daily' : 
                 selectedPeriod === '30d' ? 'Daily' : 
                 selectedPeriod === '90d' ? 'Daily' : 'Monthly'}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {salesData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sales data available</p>
            ) : (
              salesData.map((data, index) => {
                const maxRevenue = Math.max(...salesData.map(d => d.revenue))
                const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                
                return (
                  <div key={data.date} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedPeriod === '7d' ? `Day ${data.day}` : 
                         selectedPeriod === '30d' ? `Day ${data.day}` : 
                         selectedPeriod === '90d' ? `Day ${data.day}` : data.month}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">${data.revenue.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-2">({data.prescriptions} prescriptions)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.8 }}
                        className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">By Count</span>
            </div>
          </div>
          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            ) : (
              categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{category.value}%</span>
                        <span className="text-xs text-gray-400 ml-2">({category.count} items)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.value}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                        className={`h-2 rounded-full ${category.color}`}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Medicines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Medicines</h3>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">By Sales Volume</span>
          </div>
        </div>
        <div className="space-y-4">
          {topMedicines.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sales data available</p>
          ) : (
            topMedicines.map((medicine, index) => (
              <motion.div
                key={medicine.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-sm text-gray-500">
                      {medicine.sales} units sold • ${medicine.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {medicine.growth > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    medicine.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {medicine.growth > 0 ? '+' : ''}{medicine.growth.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Additional Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Active Alerts</span>
            </div>
          </div>
          <div className="space-y-3">
            {stockAlerts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active alerts</p>
            ) : (
              stockAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.priority === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.priority === 'high' ? 'border-yellow-500 bg-yellow-50' :
                  alert.priority === 'medium' ? 'border-blue-500 bg-blue-50' :
                  'border-gray-500 bg-gray-50'
                }`}>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.medicine}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Key Metrics</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Inventory Value</span>
              <span className="text-sm font-bold text-gray-900">${performanceMetrics.inventoryValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Potential Revenue</span>
              <span className="text-sm font-bold text-gray-900">${performanceMetrics.potentialRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Profit Margin</span>
              <span className="text-sm font-bold text-gray-900">{performanceMetrics.profitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Average Price</span>
              <span className="text-sm font-bold text-gray-900">${performanceMetrics.averagePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Transactions</span>
              <span className="text-sm font-bold text-gray-900">{performanceMetrics.totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Prescriptions Today</span>
              <span className="text-sm font-bold text-gray-900">{performanceMetrics.prescriptionsToday}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Analytics
