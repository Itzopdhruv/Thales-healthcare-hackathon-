'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Package } from 'lucide-react'

interface AddMedicineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  loading?: boolean
}

const AddMedicineModal = ({ isOpen, onClose, onSave, loading = false }: AddMedicineModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    stock: 0,
    minStock: 0,
    maxStock: 0,
    price: 0,
    costPrice: 0,
    description: '',
    sideEffects: [] as string[],
    contraindications: [] as string[],
    dosage: '',
    unit: 'tablets',
    prescriptionRequired: false,
    status: 'active' as 'active' | 'inactive' | 'discontinued',
    supplier: '',
    barcode: '',
    imageUrl: ''
  })

  const [categories, setCategories] = useState<string[]>([])
  const [sideEffectInput, setSideEffectInput] = useState('')
  const [contraindicationInput, setContraindicationInput] = useState('')

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const addSideEffect = () => {
    if (sideEffectInput.trim()) {
      setFormData(prev => ({
        ...prev,
        sideEffects: [...prev.sideEffects, sideEffectInput.trim()]
      }))
      setSideEffectInput('')
    }
  }

  const removeSideEffect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.filter((_, i) => i !== index)
    }))
  }

  const addContraindication = () => {
    if (contraindicationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        contraindications: [...prev.contraindications, contraindicationInput.trim()]
      }))
      setContraindicationInput('')
    }
  }

  const removeContraindication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contraindications: prev.contraindications.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields before submitting
    const requiredFields = [
      'name', 'genericName', 'category', 'manufacturer', 'batchNumber',
      'expiryDate', 'stock', 'minStock', 'maxStock', 'price', 'costPrice',
      'dosage', 'unit', 'supplier'
    ]
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData] && formData[field as keyof typeof formData] !== 0)
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }
    
    console.log('Submitting medicine data:', formData)
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Medicine</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Paracetamol 500mg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name *</label>
                <input
                  type="text"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer *</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., ABC Pharmaceuticals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., BATCH001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock & Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock *</label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock *</label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage *</label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ML</option>
                    <option value="mg">MG</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., MedSupply Co."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 1234567890123"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Medicine description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={sideEffectInput}
                      onChange={(e) => setSideEffectInput(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add side effect..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSideEffect())}
                    />
                    <button
                      type="button"
                      onClick={addSideEffect}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sideEffects.map((effect, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {effect}
                        <button
                          type="button"
                          onClick={() => removeSideEffect(index)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraindications</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={contraindicationInput}
                      onChange={(e) => setContraindicationInput(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add contraindication..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContraindication())}
                    />
                    <button
                      type="button"
                      onClick={addContraindication}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.contraindications.map((contraindication, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {contraindication}
                        <button
                          type="button"
                          onClick={() => removeContraindication(index)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="prescriptionRequired"
                  checked={formData.prescriptionRequired}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Prescription Required</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Adding...' : 'Add Medicine'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default AddMedicineModal
