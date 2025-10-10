import { useState, useEffect } from 'react'
import { Medicine } from '@/lib/database'
import { useInventoryActions } from './useInventory'

interface UseMedicinesOptions {
  search?: string
  category?: string
  status?: string
  lowStock?: boolean
}

interface UseMedicinesReturn {
  medicines: Medicine[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useMedicines = (options: UseMedicinesOptions = {}): UseMedicinesReturn => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.search) params.append('search', options.search)
      if (options.category) params.append('category', options.category)
      if (options.status) params.append('status', options.status)
      if (options.lowStock) params.append('lowStock', 'true')

      const response = await fetch(`/api/medicines?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setMedicines(data.data)
      } else {
        setError(data.error || 'Failed to fetch medicines')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching medicines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicines()
  }, [options.search, options.category, options.status, options.lowStock])

  return {
    medicines,
    loading,
    error,
    refetch: fetchMedicines
  }
}

export const useMedicine = (id: string) => {
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicine = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/medicines/${id}`)
      const data = await response.json()

      if (data.success) {
        setMedicine(data.data)
      } else {
        setError(data.error || 'Failed to fetch medicine')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching medicine:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchMedicine()
    }
  }, [id])

  return {
    medicine,
    loading,
    error,
    refetch: fetchMedicine
  }
}

// Re-export useInventoryActions for convenience
export { useInventoryActions }
