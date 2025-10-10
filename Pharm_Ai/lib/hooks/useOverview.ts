import { useState, useEffect } from 'react'

interface OverviewStats {
  totalMedicines: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  unreadAlerts: number
  totalPrescriptions?: number
  prescriptionsToday?: number
}

interface HealthMetric {
  name: string
  value: string
  status: 'excellent' | 'good' | 'warning' | 'danger'
  progress: number
}

interface RecentActivity {
  action: string
  details: string
  status: 'success' | 'warning' | 'danger' | 'info'
  timeAgo: string
}

interface StockAlert {
  id: string
  medicineId: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface OverviewData {
  stats: OverviewStats
  healthMetrics: HealthMetric[]
  recentActivity: RecentActivity[]
  alerts: StockAlert[]
}

interface UseOverviewReturn {
  data: OverviewData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useOverview = (): UseOverviewReturn => {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/overview')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch overview data')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverviewData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchOverviewData
  }
}
