import { useState } from 'react'
import { Medicine } from '@/lib/database'

interface CreateMedicineData {
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
  description?: string
  sideEffects?: string[]
  contraindications?: string[]
  dosage: string
  unit: string
  prescriptionRequired?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
  supplier: string
  barcode?: string
  imageUrl?: string
}

interface UpdateStockData {
  quantity: number
  reason: string
  userId: string
  notes?: string
}

export const useInventoryActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMedicine = async (data: CreateMedicineData): Promise<Medicine | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        const errorMessage = result.error || 'Failed to create medicine'
        setError(errorMessage)
        console.error('Create medicine error:', errorMessage)
        return null
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error creating medicine:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateMedicine = async (id: string, data: Partial<Medicine>): Promise<Medicine | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to update medicine')
        return null
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error updating medicine:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteMedicine = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medicines/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        return true
      } else {
        setError(result.error || 'Failed to delete medicine')
        return false
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error deleting medicine:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (id: string, data: UpdateStockData): Promise<Medicine | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medicines/${id}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to update stock')
        return null
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error updating stock:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createMedicine,
    updateMedicine,
    deleteMedicine,
    updateStock,
    loading,
    error
  }
}
