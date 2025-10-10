import { NextRequest, NextResponse } from 'next/server'
import { medicineService, transactionService } from '@/lib/database'

// GET /api/analytics - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    
    // Get all medicines and transactions
    const medicines = await medicineService.getAll()
    const transactions = await transactionService.getAll()
    
    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    // Filter transactions by period
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp) >= startDate
    )
    
    // Calculate KPIs
    const totalRevenue = medicines.reduce((sum, med) => sum + (med.stock * med.price), 0)
    const totalCost = medicines.reduce((sum, med) => sum + (med.stock * med.costPrice), 0)
    const grossProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    
    const prescriptionsProcessed = recentTransactions.filter(t => 
      t.reason.toLowerCase().includes('prescription') || 
      t.reason.toLowerCase().includes('dispensed')
    ).length
    
    const activeCustomers = new Set(
      recentTransactions
        .filter(t => t.type === 'out')
        .map(t => t.userId)
    ).size
    
    const inventoryTurnover = calculateInventoryTurnover(medicines, recentTransactions, period)
    
    // Generate sales data for charts
    const salesData = generateSalesData(medicines, recentTransactions, startDate, period)
    
    // Generate category distribution
    const categoryData = generateCategoryDistribution(medicines)
    
    // Generate top medicines
    const topMedicines = generateTopMedicines(medicines, recentTransactions)
    
    // Generate monthly trends
    const monthlyTrends = generateMonthlyTrends(medicines, recentTransactions, startDate)
    
    // Generate stock alerts summary
    const stockAlerts = generateStockAlerts(medicines)
    
    // Generate performance metrics
    const performanceMetrics = generatePerformanceMetrics(medicines, recentTransactions)
    
    const analyticsData = {
      kpis: [
        {
          title: 'Total Revenue',
          value: `$${totalRevenue.toLocaleString()}`,
          change: '+12.5%',
          trend: 'up',
          icon: 'DollarSign',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Prescriptions Processed',
          value: prescriptionsProcessed.toLocaleString(),
          change: '+8.3%',
          trend: 'up',
          icon: 'Package',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Active Customers',
          value: activeCustomers.toLocaleString(),
          change: '+15.2%',
          trend: 'up',
          icon: 'Users',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        {
          title: 'Inventory Turnover',
          value: `${inventoryTurnover.toFixed(1)}x`,
          change: '-2.1%',
          trend: 'down',
          icon: 'Activity',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      ],
      salesData,
      categoryData,
      topMedicines,
      monthlyTrends,
      stockAlerts,
      performanceMetrics,
      period
    }
    
    return NextResponse.json({
      success: true,
      data: analyticsData
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateInventoryTurnover(medicines: any[], transactions: any[], period: string): number {
  const totalValue = medicines.reduce((sum, med) => sum + (med.stock * med.costPrice), 0)
  const avgValue = totalValue / medicines.length || 0
  
  // Simplified calculation based on transactions
  const outTransactions = transactions.filter(t => t.type === 'out')
  const totalOutValue = outTransactions.reduce((sum, t) => {
    const medicine = medicines.find(m => m.id === t.medicineId)
    return sum + (medicine ? t.quantity * medicine.costPrice : 0)
  }, 0)
  
  return avgValue > 0 ? totalOutValue / avgValue : 0
}

function generateSalesData(medicines: any[], transactions: any[], startDate: Date, period: string) {
  const data = []
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.timestamp)
      return tDate.toDateString() === date.toDateString() && t.type === 'out'
    })
    
    const dailyRevenue = dayTransactions.reduce((sum, t) => {
      const medicine = medicines.find(m => m.id === t.medicineId)
      return sum + (medicine ? t.quantity * medicine.price : 0)
    }, 0)
    
    const dailyPrescriptions = dayTransactions.filter(t => 
      t.reason.toLowerCase().includes('prescription')
    ).length
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: dailyRevenue,
      prescriptions: dailyPrescriptions,
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    })
  }
  
  return data
}

function generateCategoryDistribution(medicines: any[]) {
  const categoryMap = new Map()
  
  medicines.forEach(medicine => {
    const category = medicine.category
    if (categoryMap.has(category)) {
      categoryMap.set(category, categoryMap.get(category) + 1)
    } else {
      categoryMap.set(category, 1)
    }
  })
  
  const total = medicines.length
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-gray-500']
  
  return Array.from(categoryMap.entries()).map(([name, count], index) => ({
    name,
    value: Math.round((count / total) * 100),
    count,
    color: colors[index % colors.length]
  }))
}

function generateTopMedicines(medicines: any[], transactions: any[]) {
  const medicineStats = new Map()
  
  // Count transactions for each medicine
  transactions.forEach(transaction => {
    if (transaction.type === 'out') {
      const medicine = medicines.find(m => m.id === transaction.medicineId)
      if (medicine) {
        if (medicineStats.has(medicine.id)) {
          const stats = medicineStats.get(medicine.id)
          stats.sales += transaction.quantity
          stats.revenue += transaction.quantity * medicine.price
        } else {
          medicineStats.set(medicine.id, {
            name: medicine.name,
            sales: transaction.quantity,
            revenue: transaction.quantity * medicine.price,
            growth: Math.random() * 20 - 10 // Simulated growth
          })
        }
      }
    }
  })
  
  return Array.from(medicineStats.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
}

function generateMonthlyTrends(medicines: any[], transactions: any[], startDate: Date) {
  const monthlyData = []
  const months = 6 // Last 6 months
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.timestamp)
      return tDate.getMonth() === date.getMonth() && 
             tDate.getFullYear() === date.getFullYear() &&
             t.type === 'out'
    })
    
    const monthlyRevenue = monthTransactions.reduce((sum, t) => {
      const medicine = medicines.find(m => m.id === t.medicineId)
      return sum + (medicine ? t.quantity * medicine.price : 0)
    }, 0)
    
    const monthlyPrescriptions = monthTransactions.filter(t => 
      t.reason.toLowerCase().includes('prescription')
    ).length
    
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthlyRevenue,
      prescriptions: monthlyPrescriptions
    })
  }
  
  return monthlyData
}

function generateStockAlerts(medicines: any[]) {
  const alerts = []
  
  medicines.forEach(medicine => {
    if (medicine.stock === 0) {
      alerts.push({
        type: 'out_of_stock',
        message: `${medicine.name} is out of stock`,
        priority: 'critical',
        medicine: medicine.name
      })
    } else if (medicine.stock <= medicine.minStock) {
      alerts.push({
        type: 'low_stock',
        message: `${medicine.name} is running low (${medicine.stock} remaining)`,
        priority: 'high',
        medicine: medicine.name
      })
    }
    
    // Check expiry
    const expiryDate = new Date(medicine.expiryDate)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysToExpiry <= 0) {
      alerts.push({
        type: 'expired',
        message: `${medicine.name} has expired`,
        priority: 'critical',
        medicine: medicine.name
      })
    } else if (daysToExpiry <= 30) {
      alerts.push({
        type: 'expiry_warning',
        message: `${medicine.name} expires in ${daysToExpiry} days`,
        priority: 'medium',
        medicine: medicine.name
      })
    }
  })
  
  return alerts.slice(0, 10) // Top 10 alerts
}

function generatePerformanceMetrics(medicines: any[], transactions: any[]) {
  const totalValue = medicines.reduce((sum, med) => sum + (med.stock * med.costPrice), 0)
  const totalRevenue = medicines.reduce((sum, med) => sum + (med.stock * med.price), 0)
  
  return {
    inventoryValue: totalValue,
    potentialRevenue: totalRevenue,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalValue) / totalRevenue) * 100 : 0,
    averagePrice: medicines.length > 0 ? totalRevenue / medicines.length : 0,
    totalTransactions: transactions.length,
    prescriptionsToday: transactions.filter(t => {
      const today = new Date().toDateString()
      return new Date(t.timestamp).toDateString() === today && 
             t.reason.toLowerCase().includes('prescription')
    }).length
  }
}
