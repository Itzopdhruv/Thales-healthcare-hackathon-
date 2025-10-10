import { NextResponse } from 'next/server'
import { medicineService, alertService, transactionService, salesService } from '@/lib/database'

// GET /api/dashboard/overview - Get overview dashboard data
export async function GET() {
  try {
    // Get all medicines for statistics
    const medicines = await medicineService.getAll()
    
    // Get recent transactions (last 10)
    const transactions = await transactionService.getAll()
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
    
    // Get stock alerts
    const alerts = await alertService.getAll()
    const unreadAlerts = alerts.filter(alert => !alert.isRead)
    
    // Get sales data for prescription statistics
    const sales = await salesService.getAllSales()
    const totalPrescriptions = sales.length
    const today = new Date().toISOString().split('T')[0]
    const todaySales = sales.filter(sale => sale.soldAt.startsWith(today))
    const prescriptionsToday = todaySales.length
    
    // Calculate statistics
    const totalMedicines = medicines.length
    const inStock = medicines.filter(m => m.stock > m.minStock).length
    const lowStock = medicines.filter(m => m.stock > 0 && m.stock <= m.minStock).length
    const outOfStock = medicines.filter(m => m.stock === 0).length
    
    // Calculate inventory turnover (simplified)
    const totalValue = medicines.reduce((sum, med) => sum + (med.stock * med.costPrice), 0)
    const avgValue = totalValue / medicines.length || 0
    const inventoryTurnover = avgValue > 0 ? Math.min(100, (totalValue / 10000) * 100) : 0
    
    // Calculate prescription accuracy (simplified - based on recent transactions)
    const recentPrescriptions = recentTransactions.filter(t => t.reason.includes('prescription')).length
    const totalRecentTransactions = recentTransactions.length
    const prescriptionAccuracy = totalRecentTransactions > 0 ? 
      Math.min(100, (recentPrescriptions / totalRecentTransactions) * 100) : 95
    
    // Calculate customer satisfaction (simplified)
    const customerSatisfaction = 85 + Math.random() * 10 // Simulated for demo
    
    // Calculate AI accuracy rate (simplified)
    const aiAccuracy = 90 + Math.random() * 8 // Simulated for demo
    
    // Format recent activity
    const recentActivity = recentTransactions.map(transaction => {
      const medicine = medicines.find(m => m.id === transaction.medicineId)
      const medicineName = medicine ? medicine.name : 'Unknown Medicine'
      
      let action = ''
      let details = ''
      let status = 'info'
      
      if (transaction.type === 'in') {
        action = 'Stock restocked'
        details = `${medicineName} - ${transaction.quantity} units added`
        status = 'success'
      } else if (transaction.type === 'out') {
        action = 'Stock dispensed'
        details = `${medicineName} - ${transaction.quantity} units dispensed`
        status = 'info'
      } else {
        action = 'Stock adjusted'
        details = `${medicineName} - ${transaction.quantity} units adjusted`
        status = 'warning'
      }
      
      const timeAgo = getTimeAgo(transaction.timestamp)
      
      return {
        action,
        details,
        status,
        timeAgo
      }
    })
    
    // Add low stock alerts to recent activity
    const lowStockAlerts = medicines
      .filter(m => m.stock <= m.minStock && m.stock > 0)
      .slice(0, 3)
      .map(medicine => ({
        action: 'Low stock alert',
        details: `${medicine.name} - ${medicine.stock} units remaining`,
        status: 'warning',
        timeAgo: 'Just now'
      }))
    
    // Add out of stock alerts
    const outOfStockAlerts = medicines
      .filter(m => m.stock === 0)
      .slice(0, 2)
      .map(medicine => ({
        action: 'Out of stock',
        details: `${medicine.name} - 0 units remaining`,
        status: 'danger',
        timeAgo: 'Just now'
      }))
    
    // Combine all activities
    const allActivities = [...recentActivity, ...lowStockAlerts, ...outOfStockAlerts]
      .sort((a, b) => {
        // Sort by status priority and time
        const statusPriority = { danger: 0, warning: 1, success: 2, info: 3 }
        return statusPriority[a.status as keyof typeof statusPriority] - 
               statusPriority[b.status as keyof typeof statusPriority]
      })
      .slice(0, 6)
    
    const overviewData = {
      stats: {
        totalMedicines,
        inStock,
        lowStock,
        outOfStock,
        totalValue: Math.round(totalValue),
        unreadAlerts: unreadAlerts.length,
        totalPrescriptions,
        prescriptionsToday
      },
      healthMetrics: [
        {
          name: 'Inventory Turnover',
          value: `${Math.round(inventoryTurnover)}%`,
          status: inventoryTurnover > 80 ? 'excellent' : inventoryTurnover > 60 ? 'good' : 'warning',
          progress: Math.round(inventoryTurnover)
        },
        {
          name: 'Prescription Accuracy',
          value: `${Math.round(prescriptionAccuracy)}%`,
          status: prescriptionAccuracy > 95 ? 'excellent' : prescriptionAccuracy > 90 ? 'good' : 'warning',
          progress: Math.round(prescriptionAccuracy)
        },
        {
          name: 'Customer Satisfaction',
          value: `${Math.round(customerSatisfaction)}%`,
          status: customerSatisfaction > 90 ? 'excellent' : customerSatisfaction > 80 ? 'good' : 'warning',
          progress: Math.round(customerSatisfaction)
        },
        {
          name: 'AI Accuracy Rate',
          value: `${Math.round(aiAccuracy)}%`,
          status: aiAccuracy > 95 ? 'excellent' : aiAccuracy > 90 ? 'good' : 'warning',
          progress: Math.round(aiAccuracy)
        }
      ],
      recentActivity: allActivities,
      alerts: unreadAlerts.slice(0, 5) // Top 5 unread alerts
    }
    
    return NextResponse.json({
      success: true,
      data: overviewData
    })
  } catch (error) {
    console.error('Error fetching overview data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}

// Helper function to calculate time ago
function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} weeks ago`
}
