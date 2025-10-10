'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Edit, 
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Camera
} from 'lucide-react'
import OCRProcessor from '@/components/prescription/OCRProcessor'
import PrescriptionProcessor from '@/components/prescription/PrescriptionProcessor'
import toast, { Toaster } from 'react-hot-toast'

interface ExtractedMedicine {
  name: string
  dosage: string
  quantity: number
  instructions: string
  frequency: string
  duration: string
  confidence: 'high' | 'medium' | 'low'
}

interface Prescription {
  id: string
  patientName: string
  doctorName: string
  date: string
  status: 'processed' | 'pending' | 'ready'
  medicines: string[]
  totalAmount: number
  notes: string
}

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showOCRProcessor, setShowOCRProcessor] = useState(false)
  const [showPrescriptionProcessor, setShowPrescriptionProcessor] = useState(false)
  const [extractedMedicines, setExtractedMedicines] = useState<ExtractedMedicine[]>([])
  const [patientInfo, setPatientInfo] = useState<any>({})
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: 'RX-001',
      patientName: 'John Smith',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      status: 'processed',
      medicines: ['Paracetamol 500mg', 'Ibuprofen 400mg'],
      totalAmount: 15.50,
      notes: 'Take with food'
    },
    {
      id: 'RX-002',
      patientName: 'Emily Davis',
      doctorName: 'Dr. Michael Brown',
      date: '2024-01-14',
      status: 'pending',
      medicines: ['Amoxicillin 250mg', 'Metformin 500mg'],
      totalAmount: 25.75,
      notes: 'Complete the full course'
    },
    {
      id: 'RX-003',
      patientName: 'Robert Wilson',
      doctorName: 'Dr. Lisa Garcia',
      date: '2024-01-13',
      status: 'ready',
      medicines: ['Lisinopril 10mg'],
      totalAmount: 8.90,
      notes: 'Take once daily'
    }
  ])

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || prescription.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'ready': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed': return 'Processed'
      case 'pending': return 'Pending'
      case 'ready': return 'Ready for Pickup'
      default: return 'Unknown'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return CheckCircle
      case 'pending': return Clock
      case 'ready': return AlertCircle
      default: return FileText
    }
  }

  const handleMedicinesExtracted = async (medicines: ExtractedMedicine[], patientInfo: any) => {
    console.log('Processing extracted medicines:', medicines)
    console.log('Patient info:', patientInfo)
    
    setExtractedMedicines(medicines)
    setPatientInfo(patientInfo)
    setShowOCRProcessor(false)
    setShowPrescriptionProcessor(true)
  }

  const handlePrescriptionProcessed = (prescriptionId: string, processedData?: any) => {
    // Create new prescription from processed data
    const newPrescription: Prescription = {
      id: prescriptionId,
      patientName: patientInfo.name || 'Unknown Patient',
      doctorName: patientInfo.doctor || 'Unknown Doctor',
      date: new Date().toISOString().split('T')[0],
      status: 'processed',
      medicines: extractedMedicines.map(med => `${med.name} ${med.dosage}`),
      totalAmount: processedData?.totalAmount || 0,
      notes: 'Prescription processed via OCR'
    }

    setPrescriptions(prev => [newPrescription, ...prev])
    setShowPrescriptionProcessor(false)
    setExtractedMedicines([])
    setPatientInfo({})
    toast.success('Prescription processed successfully!')
  }

  const handleScanPrescription = () => {
    console.log('Scan prescription button clicked')
    setShowOCRProcessor(true)
  }

  const handleViewPrescription = (prescription: Prescription) => {
    console.log('View prescription:', prescription.id)
    // TODO: Implement view prescription modal
    toast('View prescription feature coming soon!', {
      icon: 'ℹ️',
      duration: 3000,
    })
  }

  const handleEditPrescription = (prescription: Prescription) => {
    console.log('Edit prescription:', prescription.id)
    // TODO: Implement edit prescription modal
    toast('Edit prescription feature coming soon!', {
      icon: 'ℹ️',
      duration: 3000,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600">Process and manage prescription orders with AI assistance</p>
        </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleScanPrescription}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Prescription</span>
              </motion.button>
            </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(() => {
          const totalPrescriptions = prescriptions.length
          const pendingCount = prescriptions.filter(p => p.status === 'pending').length
          const processedCount = prescriptions.filter(p => p.status === 'processed').length
          const readyCount = prescriptions.filter(p => p.status === 'ready').length
          const today = new Date().toISOString().split('T')[0]
          const processedToday = prescriptions.filter(p => p.date === today && p.status === 'processed').length

          return [
            { label: 'Total Prescriptions', value: totalPrescriptions.toString(), icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            { label: 'Processed Today', value: processedToday.toString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
            { label: 'Pending Review', value: pendingCount.toString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            { label: 'Ready for Pickup', value: readyCount.toString(), icon: AlertCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' }
          ]
        })().map((stat, index) => {
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
        })}
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
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPrescriptions.map((prescription, index) => {
          const StatusIcon = getStatusIcon(prescription.status)
          return (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card card-hover"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{prescription.id}</h3>
                  <p className="text-sm text-gray-500">{prescription.date}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(prescription.status)}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{getStatusText(prescription.status)}</span>
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Patient</p>
                  <p className="text-gray-900">{prescription.patientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Doctor</p>
                  <p className="text-gray-900">{prescription.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Medicines</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prescription.medicines.map((medicine, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {medicine}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">${prescription.totalAmount}</p>
                </div>
                {prescription.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600">{prescription.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewPrescription(prescription)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="View Prescription"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEditPrescription(prescription)}
                  className="p-2 text-gray-400 hover:text-green-600"
                  title="Edit Prescription"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </div>

          {/* OCR Processor Modal */}
          {showOCRProcessor && (
            <OCRProcessor
              onMedicinesExtracted={handleMedicinesExtracted}
              onClose={() => setShowOCRProcessor(false)}
            />
          )}

          {/* Prescription Processor Modal */}
          {showPrescriptionProcessor && (
            <PrescriptionProcessor
              medicines={extractedMedicines}
              patientInfo={patientInfo}
              onClose={() => setShowPrescriptionProcessor(false)}
              onPrescriptionProcessed={handlePrescriptionProcessed}
            />
          )}

          {/* Toast Notifications */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
    </div>
  )
}

export default Prescriptions
