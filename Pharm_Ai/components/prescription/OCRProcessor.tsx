'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Camera, 
  X, 
  Edit, 
  Check, 
  AlertTriangle,
  Loader2,
  FileText,
  User,
  Stethoscope
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ExtractedMedicine {
  name: string
  dosage: string
  quantity: number
  instructions: string
  frequency: string
  duration: string
  confidence: 'high' | 'medium' | 'low'
}

interface PatientInfo {
  name?: string
  age?: string
  doctor?: string
}

interface OCRProcessorProps {
  onMedicinesExtracted: (medicines: ExtractedMedicine[], patientInfo: PatientInfo) => void
  onClose: () => void
}

const OCRProcessor = ({ onMedicinesExtracted, onClose }: OCRProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    rawText: string
    medicines: ExtractedMedicine[]
    patientInfo: PatientInfo
  } | null>(null)
  const [editingMedicine, setEditingMedicine] = useState<number | null>(null)
  const [editedMedicines, setEditedMedicines] = useState<ExtractedMedicine[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    console.log('File selected:', file.name, file.type, file.size)
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      console.log('Sending OCR request...')

      const response = await fetch('/api/prescriptions/ocr', {
        method: 'POST',
        body: formData,
      })

      console.log('OCR response status:', response.status)
      const result = await response.json()
      console.log('OCR result:', result)

      if (result.success) {
        setExtractedData(result.data)
        setEditedMedicines(result.data.medicines)
        toast.success('Prescription processed successfully!')
      } else {
        toast.error(result.error || 'Failed to process prescription')
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      toast.error('Failed to process prescription image')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed')
    const file = e.target.files?.[0]
    console.log('Selected file:', file)
    if (file) {
      handleImageUpload(file)
    } else {
      console.log('No file selected')
    }
  }

  const handleCameraCapture = () => {
    // This would integrate with device camera
    // For now, we'll trigger file input
    fileInputRef.current?.click()
  }

  const handleEditMedicine = (index: number) => {
    setEditingMedicine(index)
  }

  const handleSaveEdit = (index: number, updatedMedicine: ExtractedMedicine) => {
    const newMedicines = [...editedMedicines]
    newMedicines[index] = updatedMedicine
    setEditedMedicines(newMedicines)
    setEditingMedicine(null)
    toast.success('Medicine updated successfully!')
  }

  const handleRemoveMedicine = (index: number) => {
    const newMedicines = editedMedicines.filter((_, i) => i !== index)
    setEditedMedicines(newMedicines)
    toast.success('Medicine removed!')
  }

  const handleConfirmMedicines = () => {
    if (editedMedicines.length === 0) {
      toast.error('Please add at least one medicine')
      return
    }

    onMedicinesExtracted(editedMedicines, extractedData?.patientInfo || {})
    toast.success('Medicines confirmed!')
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Prescription OCR Scanner</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!extractedData ? (
            /* Upload Section */
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Prescription Image
                </h3>
                <p className="text-gray-600 mb-6">
                  Take a photo or upload an image of the prescription to extract medicine information
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary flex items-center space-x-2 px-6 py-3"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Prescription</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setExtractedData({
                      rawText: 'Manual prescription entry',
                      medicines: [],
                      patientInfo: { name: '', doctor: '' }
                    })
                    setEditedMedicines([])
                    toast.success('Ready for manual entry')
                  }}
                  className="btn-secondary flex items-center space-x-2 px-6 py-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>Create Manually</span>
                </motion.button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isProcessing && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-gray-600">Processing prescription...</span>
                </div>
              )}
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-6">
              {/* Patient Info */}
              {extractedData.patientInfo && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Patient Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {extractedData.patientInfo.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Patient Name</p>
                        <p className="text-gray-900">{extractedData.patientInfo.name}</p>
                      </div>
                    )}
                    {extractedData.patientInfo.age && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Age</p>
                        <p className="text-gray-900">{extractedData.patientInfo.age}</p>
                      </div>
                    )}
                    {extractedData.patientInfo.doctor && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Doctor</p>
                        <p className="text-gray-900">{extractedData.patientInfo.doctor}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Medicines */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Extracted Medicines ({editedMedicines.length})</span>
                </h3>

                <div className="space-y-4">
                  {editedMedicines.map((medicine, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      {editingMedicine === index ? (
                        <EditMedicineForm
                          medicine={medicine}
                          onSave={(updated) => handleSaveEdit(index, updated)}
                          onCancel={() => setEditingMedicine(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(medicine.confidence)}`}>
                                {medicine.confidence} confidence
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Dosage</p>
                                <p className="font-medium">{medicine.dosage}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Quantity</p>
                                <p className="font-medium">{medicine.quantity}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Frequency</p>
                                <p className="font-medium">{medicine.frequency}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Duration</p>
                                <p className="font-medium">{medicine.duration}</p>
                              </div>
                            </div>
                            {medicine.instructions && (
                              <div className="mt-2">
                                <p className="text-gray-600 text-sm">Instructions</p>
                                <p className="text-sm">{medicine.instructions}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditMedicine(index)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMedicine(index)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {editedMedicines.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">OCR Processing Failed</h3>
                      <p className="text-gray-600 mb-2">Unable to extract medicines from the image</p>
                      <p className="text-sm text-gray-500">This could be due to:</p>
                      <ul className="text-sm text-gray-500 mt-2 space-y-1">
                        <li>• Poor image quality or resolution</li>
                        <li>• Handwritten text (OCR works better with printed text)</li>
                        <li>• API limitations or connectivity issues</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const newMedicine: ExtractedMedicine = {
                            name: '',
                            dosage: '',
                            quantity: 1,
                            instructions: '',
                            frequency: '',
                            duration: '',
                            confidence: 'low'
                          }
                          setEditedMedicines([newMedicine])
                          setEditingMedicine(0)
                        }}
                        className="btn-primary flex items-center space-x-2 mx-auto"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Add Medicine Manually</span>
                      </motion.button>
                      <p className="text-xs text-gray-400">You can add multiple medicines and edit all details</p>
                    </div>
                  </div>
                )}

                {editedMedicines.length > 0 && (
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const newMedicine: ExtractedMedicine = {
                          name: '',
                          dosage: '',
                          quantity: 1,
                          instructions: '',
                          frequency: '',
                          duration: '',
                          confidence: 'low'
                        }
                        setEditedMedicines([...editedMedicines, newMedicine])
                        setEditingMedicine(editedMedicines.length)
                      }}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Add Another Medicine</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setExtractedData(null)}
                  className="btn-secondary"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleConfirmMedicines}
                  disabled={editedMedicines.length === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Medicines</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Edit Medicine Form Component
interface EditMedicineFormProps {
  medicine: ExtractedMedicine
  onSave: (medicine: ExtractedMedicine) => void
  onCancel: () => void
}

const EditMedicineForm = ({ medicine, onSave, onCancel }: EditMedicineFormProps) => {
  const [editedMedicine, setEditedMedicine] = useState(medicine)

  const handleSave = () => {
    onSave(editedMedicine)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
          <input
            type="text"
            value={editedMedicine.name}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, name: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
          <input
            type="text"
            value={editedMedicine.dosage}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, dosage: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            value={editedMedicine.quantity}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, quantity: parseInt(e.target.value) || 0 })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
          <input
            type="text"
            value={editedMedicine.frequency}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, frequency: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            type="text"
            value={editedMedicine.duration}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, duration: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
          <select
            value={editedMedicine.confidence}
            onChange={(e) => setEditedMedicine({ ...editedMedicine, confidence: e.target.value as 'high' | 'medium' | 'low' })}
            className="input-field"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
        <textarea
          value={editedMedicine.instructions}
          onChange={(e) => setEditedMedicine({ ...editedMedicine, instructions: e.target.value })}
          rows={2}
          className="input-field"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button onClick={handleSave} className="btn-primary">
          Save
        </button>
      </div>
    </div>
  )
}

export default OCRProcessor
