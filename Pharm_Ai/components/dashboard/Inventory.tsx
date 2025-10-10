'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  X
} from 'lucide-react'
import { useMedicines, useInventoryActions } from '@/lib/hooks/useMedicines'
import { Medicine } from '@/lib/database'
import toast from 'react-hot-toast'
import AddMedicineModal from '@/components/modals/AddMedicineModal'

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  const { medicines, loading, error, refetch } = useMedicines({
    search: searchTerm,
    category: filterCategory !== 'all' ? filterCategory : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    lowStock: filterStatus === 'low-stock'
  })

  const { createMedicine, updateMedicine, deleteMedicine, updateStock, loading: actionLoading } = useInventoryActions()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusColor = (medicine: Medicine) => {
    if (medicine.stock === 0) return 'text-red-600 bg-red-100'
    if (medicine.stock <= medicine.minStock) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusText = (medicine: Medicine) => {
    if (medicine.stock === 0) return 'Out of Stock'
    if (medicine.stock <= medicine.minStock) return 'Low Stock'
    return 'In Stock'
  }

  const handleAddMedicine = async (medicineData: any) => {
    const result = await createMedicine(medicineData)
    if (result) {
      toast.success('Medicine added successfully!')
      setShowAddModal(false)
      refetch()
    } else {
      toast.error('Failed to add medicine')
    }
  }

  const handleEditMedicine = async (id: string, medicineData: any) => {
    const result = await updateMedicine(id, medicineData)
    if (result) {
      toast.success('Medicine updated successfully!')
      setShowEditModal(false)
      setSelectedMedicine(null)
      refetch()
    } else {
      toast.error('Failed to update medicine')
    }
  }

  const handleDeleteMedicine = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      const result = await deleteMedicine(id)
      if (result) {
        toast.success('Medicine deleted successfully!')
        refetch()
      } else {
        toast.error('Failed to delete medicine')
      }
    }
  }

  const handleUpdateStock = async (id: string, quantity: number, reason: string, notes?: string) => {
    const result = await updateStock(id, {
      quantity,
      reason,
      userId: 'current-user', // In real app, get from auth context
      notes
    })
    if (result) {
      toast.success('Stock updated successfully!')
      setShowStockModal(false)
      setSelectedMedicine(null)
      refetch()
    } else {
      toast.error('Failed to update stock')
    }
  }

  const openEditModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setShowEditModal(true)
  }

  const openStockModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setShowStockModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medicines...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your pharmacy stock and track medicine availability</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(() => {
          const totalMedicines = medicines.length
          const inStock = medicines.filter(m => m.stock > m.minStock).length
          const lowStock = medicines.filter(m => m.stock > 0 && m.stock <= m.minStock).length
          const outOfStock = medicines.filter(m => m.stock === 0).length

          return [
            { label: 'Total Medicines', value: totalMedicines.toLocaleString(), icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            { label: 'In Stock', value: inStock.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
            { label: 'Low Stock', value: lowStock.toLocaleString(), icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            { label: 'Out of Stock', value: outOfStock.toLocaleString(), icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' }
          ].map((stat, index) => {
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
          })
        })()}
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="active">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="inactive">Out of Stock</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Medicine</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Last Updated</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No medicines found
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((medicine, index) => (
                  <motion.tr
                    key={medicine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-500">{medicine.genericName}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{medicine.category}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{medicine.stock}</span>
                        <span className="text-sm text-gray-500">/ {medicine.minStock} min</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">${medicine.price.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(medicine)}`}>
                        {getStatusText(medicine)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-500">
                        {new Date(medicine.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEditModal(medicine)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openStockModal(medicine)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Update Stock"
                        >
                          <Package className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMedicine(medicine.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddMedicineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddMedicine}
        loading={actionLoading}
      />
    </div>
  )
}

export default Inventory
