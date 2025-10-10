// In-memory database for demo purposes
// In production, this would be replaced with a real database like PostgreSQL, MongoDB, etc.

export interface Medicine {
  id: string
  name: string
  genericName: string
  category: string
  manufacturer: string
  batchNumber: string
  expiryDate: string
  stock: number
  minStock: number
  maxStock: number
  price: number
  costPrice: number
  description: string
  sideEffects: string[]
  contraindications: string[]
  dosage: string
  unit: string
  prescriptionRequired: boolean
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
  lastRestocked: string
  supplier: string
  barcode?: string
  imageUrl?: string
}

export interface InventoryTransaction {
  id: string
  medicineId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  userId: string
  timestamp: string
  notes?: string
}

export interface StockAlert {
  id: string
  medicineId: string
  type: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'expired'
  message: string
  isRead: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface SalesRecord {
  id: string
  prescriptionId: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  doctorName: string
  medicines: Array<{
    medicineId: string
    medicineName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    isAlternative: boolean
    originalMedicine?: string
  }>
  totalAmount: number
  discount?: number
  tax?: number
  paymentMethod: 'cash' | 'card' | 'insurance' | 'other'
  status: 'completed' | 'refunded' | 'partial_refund'
  soldBy: string
  soldAt: string
  notes?: string
}

export interface SalesSummary {
  totalSales: number
  totalTransactions: number
  totalMedicinesSold: number
  averageTransactionValue: number
  topSellingMedicines: Array<{
    medicineName: string
    quantitySold: number
    revenue: number
  }>
  dailySales: Array<{
    date: string
    sales: number
    transactions: number
  }>
}

// In-memory storage
export let medicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Pain Relief',
    manufacturer: 'ABC Pharmaceuticals',
    batchNumber: 'BATCH001',
    expiryDate: '2025-12-31',
    stock: 45,
    minStock: 20,
    maxStock: 100,
    price: 2.50,
    costPrice: 1.80,
    description: 'Pain reliever and fever reducer',
    sideEffects: ['Nausea', 'Stomach upset'],
    contraindications: ['Liver disease', 'Alcoholism'],
    dosage: '500mg',
    unit: 'tablets',
    prescriptionRequired: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-10T00:00:00Z',
    supplier: 'MedSupply Co.',
    barcode: '1234567890123'
  },
  {
    id: '2',
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    category: 'Anti-inflammatory',
    manufacturer: 'XYZ Pharma',
    batchNumber: 'BATCH002',
    expiryDate: '2025-06-30',
    stock: 8,
    minStock: 15,
    maxStock: 80,
    price: 3.75,
    costPrice: 2.50,
    description: 'Anti-inflammatory and pain reliever',
    sideEffects: ['Stomach irritation', 'Dizziness'],
    contraindications: ['Stomach ulcers', 'Heart disease'],
    dosage: '400mg',
    unit: 'tablets',
    prescriptionRequired: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-05T00:00:00Z',
    supplier: 'HealthCorp Ltd.',
    barcode: '1234567890124'
  },
  {
    id: '3',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    manufacturer: 'MedLife Inc.',
    batchNumber: 'BATCH003',
    expiryDate: '2024-08-15',
    stock: 32,
    minStock: 10,
    maxStock: 50,
    price: 8.90,
    costPrice: 6.20,
    description: 'Broad-spectrum antibiotic',
    sideEffects: ['Diarrhea', 'Nausea', 'Rash'],
    contraindications: ['Penicillin allergy'],
    dosage: '250mg',
    unit: 'capsules',
    prescriptionRequired: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-12T00:00:00Z',
    supplier: 'PharmaDirect',
    barcode: '1234567890125'
  },
  {
    id: '4',
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    category: 'Diabetes',
    manufacturer: 'DiabCare Pharma',
    batchNumber: 'BATCH004',
    expiryDate: '2025-03-20',
    stock: 0,
    minStock: 5,
    maxStock: 30,
    price: 12.50,
    costPrice: 8.75,
    description: 'Type 2 diabetes medication',
    sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
    contraindications: ['Kidney disease', 'Liver disease'],
    dosage: '500mg',
    unit: 'tablets',
    prescriptionRequired: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-08T00:00:00Z',
    supplier: 'MedSupply Co.',
    barcode: '1234567890126'
  },
  {
    id: '5',
    name: 'Aspirin 100mg',
    genericName: 'Acetylsalicylic Acid',
    category: 'Pain Relief',
    manufacturer: 'PainFree Pharma',
    batchNumber: 'BATCH005',
    expiryDate: '2025-09-30',
    stock: 25,
    minStock: 10,
    maxStock: 50,
    price: 1.25,
    costPrice: 0.85,
    description: 'Pain reliever and anti-inflammatory',
    sideEffects: ['Stomach irritation', 'Bleeding risk'],
    contraindications: ['Stomach ulcers', 'Bleeding disorders'],
    dosage: '100mg',
    unit: 'tablets',
    prescriptionRequired: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-14T00:00:00Z',
    supplier: 'HealthCorp Ltd.',
    barcode: '1234567890127'
  },
  {
    id: '6',
    name: 'Naproxen 220mg',
    genericName: 'Naproxen',
    category: 'Pain Relief',
    manufacturer: 'ReliefMax Inc.',
    batchNumber: 'BATCH006',
    expiryDate: '2025-11-15',
    stock: 18,
    minStock: 8,
    maxStock: 40,
    price: 4.20,
    costPrice: 2.80,
    description: 'Non-steroidal anti-inflammatory drug',
    sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
    contraindications: ['Heart disease', 'Kidney problems'],
    dosage: '220mg',
    unit: 'tablets',
    prescriptionRequired: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-13T00:00:00Z',
    supplier: 'MedSupply Co.',
    barcode: '1234567890128'
  },
  {
    id: '7',
    name: 'Tramadol 50mg',
    genericName: 'Tramadol',
    category: 'Pain Relief',
    manufacturer: 'PainCare Solutions',
    batchNumber: 'BATCH007',
    expiryDate: '2025-07-20',
    stock: 12,
    minStock: 5,
    maxStock: 25,
    price: 15.75,
    costPrice: 10.50,
    description: 'Opioid pain medication',
    sideEffects: ['Nausea', 'Dizziness', 'Constipation'],
    contraindications: ['Respiratory depression', 'Drug addiction'],
    dosage: '50mg',
    unit: 'tablets',
    prescriptionRequired: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-11T00:00:00Z',
    supplier: 'PharmaDirect',
    barcode: '1234567890129'
  }
]

let transactions: InventoryTransaction[] = []
let stockAlerts: StockAlert[] = []
let salesRecords: SalesRecord[] = []

// Helper functions
export const generateId = () => Math.random().toString(36).substr(2, 9)

export const getCurrentTimestamp = () => new Date().toISOString()

// Medicine CRUD operations
export const medicineService = {
  // Get all medicines
  getAll: async (filters?: {
    search?: string
    category?: string
    status?: string
    lowStock?: boolean
  }): Promise<Medicine[]> => {
    let filteredMedicines = [...medicines]

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredMedicines = filteredMedicines.filter(med => 
        med.name.toLowerCase().includes(searchLower) ||
        med.genericName.toLowerCase().includes(searchLower) ||
        med.category.toLowerCase().includes(searchLower) ||
        med.manufacturer.toLowerCase().includes(searchLower)
      )
    }

    if (filters?.category) {
      filteredMedicines = filteredMedicines.filter(med => med.category === filters.category)
    }

    if (filters?.status) {
      filteredMedicines = filteredMedicines.filter(med => med.status === filters.status)
    }

    if (filters?.lowStock) {
      filteredMedicines = filteredMedicines.filter(med => med.stock <= med.minStock)
    }

    return filteredMedicines
  },

  // Get medicine by ID
  getById: async (id: string): Promise<Medicine | null> => {
    return medicines.find(med => med.id === id) || null
  },

  // Create new medicine
  create: async (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> => {
    const newMedicine: Medicine = {
      ...medicineData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    }
    
    medicines.push(newMedicine)
    
    // Create initial transaction
    const transaction: InventoryTransaction = {
      id: generateId(),
      medicineId: newMedicine.id,
      type: 'in',
      quantity: newMedicine.stock,
      reason: 'Initial stock',
      userId: 'system',
      timestamp: getCurrentTimestamp(),
      notes: 'Initial stock entry'
    }
    transactions.push(transaction)

    // Check for stock alerts
    checkStockAlerts(newMedicine)

    return newMedicine
  },

  // Update medicine
  update: async (id: string, updateData: Partial<Medicine>): Promise<Medicine | null> => {
    const index = medicines.findIndex(med => med.id === id)
    if (index === -1) return null

    const oldMedicine = medicines[index]
    const updatedMedicine = {
      ...oldMedicine,
      ...updateData,
      id, // Ensure ID doesn't change
      updatedAt: getCurrentTimestamp()
    }

    medicines[index] = updatedMedicine

    // Check for stock alerts
    checkStockAlerts(updatedMedicine)

    return updatedMedicine
  },

  // Delete medicine
  delete: async (id: string): Promise<boolean> => {
    const index = medicines.findIndex(med => med.id === id)
    if (index === -1) return false

    medicines.splice(index, 1)
    
    // Remove related transactions and alerts
    transactions = transactions.filter(t => t.medicineId !== id)
    stockAlerts = stockAlerts.filter(a => a.medicineId !== id)

    return true
  },

  // Update stock
  updateStock: async (id: string, quantity: number, reason: string, userId: string, notes?: string): Promise<Medicine | null> => {
    const medicine = medicines.find(med => med.id === id)
    if (!medicine) return null

    const oldStock = medicine.stock
    const newStock = Math.max(0, oldStock + quantity) // Prevent negative stock

    // Update medicine stock
    medicine.stock = newStock
    medicine.updatedAt = getCurrentTimestamp()
    if (quantity > 0) {
      medicine.lastRestocked = getCurrentTimestamp()
    }

    // Create transaction record
    const transaction: InventoryTransaction = {
      id: generateId(),
      medicineId: id,
      type: quantity > 0 ? 'in' : 'out',
      quantity: Math.abs(quantity),
      reason,
      userId,
      timestamp: getCurrentTimestamp(),
      notes
    }
    transactions.push(transaction)

    // Check for stock alerts
    checkStockAlerts(medicine)

    return medicine
  }
}

// Transaction operations
export const transactionService = {
  getAll: async (medicineId?: string): Promise<InventoryTransaction[]> => {
    if (medicineId) {
      return transactions.filter(t => t.medicineId === medicineId)
    }
    return [...transactions]
  },

  getById: async (id: string): Promise<InventoryTransaction | null> => {
    return transactions.find(t => t.id === id) || null
  }
}

// Stock alert operations
export const alertService = {
  getAll: async (): Promise<StockAlert[]> => {
    return [...stockAlerts]
  },

  markAsRead: async (id: string): Promise<boolean> => {
    const alert = stockAlerts.find(a => a.id === id)
    if (!alert) return false

    alert.isRead = true
    return true
  },

  markAllAsRead: async (): Promise<void> => {
    stockAlerts.forEach(alert => {
      alert.isRead = true
    })
  }
}

// Sales tracking service
export const salesService = {
  // Record a new sale
  recordSale: async (saleData: Omit<SalesRecord, 'id' | 'soldAt'>): Promise<SalesRecord> => {
    const newSale: SalesRecord = {
      ...saleData,
      id: generateId(),
      soldAt: getCurrentTimestamp()
    }
    
    salesRecords.push(newSale)
    
    // Update medicine stock
    saleData.medicines.forEach(medicineSale => {
      const medicine = medicines.find(med => med.id === medicineSale.medicineId)
      if (medicine) {
        medicine.stock -= medicineSale.quantity
        medicine.updatedAt = getCurrentTimestamp()
        
        // Create inventory transaction
        const transaction: InventoryTransaction = {
          id: generateId(),
          medicineId: medicine.id,
          type: 'out',
          quantity: medicineSale.quantity,
          reason: 'Sale',
          reference: newSale.prescriptionId,
          userId: newSale.soldBy,
          timestamp: getCurrentTimestamp(),
          notes: `Sold to ${saleData.customerName}`
        }
        transactions.push(transaction)
        
        // Check for stock alerts
        checkStockAlerts(medicine)
      }
    })
    
    return newSale
  },

  // Get all sales records
  getAllSales: async (filters?: {
    startDate?: string
    endDate?: string
    customerName?: string
    status?: string
  }): Promise<SalesRecord[]> => {
    let filteredSales = [...salesRecords]

    if (filters?.startDate) {
      filteredSales = filteredSales.filter(sale => sale.soldAt >= filters.startDate!)
    }

    if (filters?.endDate) {
      filteredSales = filteredSales.filter(sale => sale.soldAt <= filters.endDate!)
    }

    if (filters?.customerName) {
      const searchLower = filters.customerName.toLowerCase()
      filteredSales = filteredSales.filter(sale => 
        sale.customerName.toLowerCase().includes(searchLower)
      )
    }

    if (filters?.status) {
      filteredSales = filteredSales.filter(sale => sale.status === filters.status)
    }

    return filteredSales.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
  },

  // Get sales summary
  getSalesSummary: async (startDate?: string, endDate?: string): Promise<SalesSummary> => {
    let filteredSales = salesRecords

    if (startDate) {
      filteredSales = filteredSales.filter(sale => sale.soldAt >= startDate)
    }

    if (endDate) {
      filteredSales = filteredSales.filter(sale => sale.soldAt <= endDate)
    }

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalTransactions = filteredSales.length
    const totalMedicinesSold = filteredSales.reduce((sum, sale) => 
      sum + sale.medicines.reduce((medSum, med) => medSum + med.quantity, 0), 0
    )

    // Calculate top selling medicines
    const medicineSales: Record<string, { quantitySold: number; revenue: number }> = {}
    filteredSales.forEach(sale => {
      sale.medicines.forEach(med => {
        if (!medicineSales[med.medicineName]) {
          medicineSales[med.medicineName] = { quantitySold: 0, revenue: 0 }
        }
        medicineSales[med.medicineName].quantitySold += med.quantity
        medicineSales[med.medicineName].revenue += med.totalPrice
      })
    })

    const topSellingMedicines = Object.entries(medicineSales)
      .map(([name, data]) => ({ medicineName: name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate daily sales
    const dailySalesMap: Record<string, { sales: number; transactions: number }> = {}
    filteredSales.forEach(sale => {
      const date = sale.soldAt.split('T')[0]
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = { sales: 0, transactions: 0 }
      }
      dailySalesMap[date].sales += sale.totalAmount
      dailySalesMap[date].transactions += 1
    })

    const dailySales = Object.entries(dailySalesMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalSales,
      totalTransactions,
      totalMedicinesSold,
      averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      topSellingMedicines,
      dailySales
    }
  },

  // Get sales by customer
  getCustomerSales: async (customerName: string): Promise<SalesRecord[]> => {
    return salesRecords
      .filter(sale => sale.customerName.toLowerCase().includes(customerName.toLowerCase()))
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
  },

  // Update sale status (for refunds)
  updateSaleStatus: async (saleId: string, status: 'completed' | 'refunded' | 'partial_refund'): Promise<boolean> => {
    const saleIndex = salesRecords.findIndex(sale => sale.id === saleId)
    if (saleIndex === -1) return false

    salesRecords[saleIndex].status = status
    return true
  }
}

// Helper function to check and create stock alerts
const checkStockAlerts = (medicine: Medicine) => {
  const now = new Date()
  const expiryDate = new Date(medicine.expiryDate)
  const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Remove existing alerts for this medicine
  stockAlerts = stockAlerts.filter(a => a.medicineId !== medicine.id)

  // Check for stock alerts
  if (medicine.stock === 0) {
    stockAlerts.push({
      id: generateId(),
      medicineId: medicine.id,
      type: 'out_of_stock',
      message: `${medicine.name} is out of stock`,
      isRead: false,
      createdAt: getCurrentTimestamp(),
      priority: 'critical'
    })
  } else if (medicine.stock <= medicine.minStock) {
    stockAlerts.push({
      id: generateId(),
      medicineId: medicine.id,
      type: 'low_stock',
      message: `${medicine.name} is running low (${medicine.stock} remaining)`,
      isRead: false,
      createdAt: getCurrentTimestamp(),
      priority: 'high'
    })
  }

  // Check for expiry alerts
  if (daysToExpiry <= 0) {
    stockAlerts.push({
      id: generateId(),
      medicineId: medicine.id,
      type: 'expired',
      message: `${medicine.name} has expired on ${medicine.expiryDate}`,
      isRead: false,
      createdAt: getCurrentTimestamp(),
      priority: 'critical'
    })
  } else if (daysToExpiry <= 30) {
    stockAlerts.push({
      id: generateId(),
      medicineId: medicine.id,
      type: 'expiry_warning',
      message: `${medicine.name} expires in ${daysToExpiry} days`,
      isRead: false,
      createdAt: getCurrentTimestamp(),
      priority: 'medium'
    })
  }
}

// Get categories
export const getCategories = (): string[] => {
  const categories = new Set(medicines.map(med => med.category))
  return Array.from(categories).sort()
}

// Get suppliers
export const getSuppliers = (): string[] => {
  const suppliers = new Set(medicines.map(med => med.supplier))
  return Array.from(suppliers).sort()
}
