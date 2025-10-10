import { useState, useEffect } from 'react'

interface KPIData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: string
  color: string
  bgColor: string
}

interface SalesDataPoint {
  date: string
  revenue: number
  prescriptions: number
  day: number
  month: string
}

interface CategoryData {
  name: string
  value: number
  count: number
  color: string
}

interface TopMedicine {
  name: string
  sales: number
  revenue: number
  growth: number
}

interface MonthlyTrend {
  month: string
  revenue: number
  prescriptions: number
}

interface StockAlert {
  type: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  medicine: string
}

interface PerformanceMetrics {
  inventoryValue: number
  potentialRevenue: number
  profitMargin: number
  averagePrice: number
  totalTransactions: number
  prescriptionsToday: number
}

interface AnalyticsData {
  kpis: KPIData[]
  salesData: SalesDataPoint[]
  categoryData: CategoryData[]
  topMedicines: TopMedicine[]
  monthlyTrends: MonthlyTrend[]
  stockAlerts: StockAlert[]
  performanceMetrics: PerformanceMetrics
  period: string
}

interface UseAnalyticsOptions {
  period?: '7d' | '30d' | '90d' | '1y'
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useAnalytics = (options: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.period) {
        params.append('period', options.period)
      }

      const response = await fetch(`/api/analytics?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [options.period])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalyticsData
  }
}
