'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  User,
  Stethoscope,
  ArrowRight,
  RefreshCw,
  X
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

interface InventoryCheck {
  medicineName: string
  requestedQuantity: number
  availableQuantity: number
  isAvailable: boolean
  shortage: number
  price: number
  category: string
}

interface AlternativeMedicine {
  name: string
  dosage: string
  category: string
  availableQuantity: number
  price: number
  similarity: number
  reason: string
}

interface PrescriptionProcessorProps {
  medicines: ExtractedMedicine[]
  patientInfo: {
    name?: string
    doctor?: string
  }
  onClose: () => void
  onPrescriptionProcessed: (prescriptionId: string) => void
}

const PrescriptionProcessor: React.FC<PrescriptionProcessorProps> = ({
  medicines,
  patientInfo,
  onClose,
  onPrescriptionProcessed
}) => {
  const [currentStep, setCurrentStep] = useState<'checking' | 'alternatives' | 'billing' | 'processing'>('checking')
  const [inventoryCheck, setInventoryCheck] = useState<InventoryCheck[]>([])
  const [alternatives, setAlternatives] = useState<any[]>([])
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, AlternativeMedicine>>({})
  const [partialFulfillment, setPartialFulfillment] = useState<Record<string, { enabled: boolean; quantity: number }>>({})
  const [totalCost, setTotalCost] = useState(0)
  const [canProcess, setCanProcess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Process prescription when component mounts
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Processing timeout - moving to alternatives step')
      setCurrentStep('alternatives')
    }, 5000) // 5 second timeout

    processPrescription().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => clearTimeout(timeoutId)
  }, [])

  const processPrescription = async () => {
    try {
      console.log('Starting prescription processing...')
      setCurrentStep('checking')
      
      // First, do fast inventory check
      console.log('Sending request to /api/prescriptions/process')
      const response = await fetch('/api/prescriptions/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicines: medicines.map(med => ({
            name: med.name,
            dosage: med.dosage,
            quantity: med.quantity,
            instructions: med.instructions,
            frequency: med.frequency,
            duration: med.duration
          })),
          patientName: patientInfo.name || 'Unknown Patient',
          doctorName: patientInfo.doctor || 'Unknown Doctor',
          notes: 'Prescription processed via OCR'
        }),
      })

      console.log('Response received:', response.status)
      const result = await response.json()
      console.log('Result:', result)

      if (result.success) {
        console.log('Setting inventory check:', result.data.inventoryCheck)
        setInventoryCheck(result.data.inventoryCheck)
        setAlternatives(result.data.alternatives)
        setTotalCost(result.data.totalCost)
        setCanProcess(result.data.canProcess)
        
        // If there are missing medicines, try to get advanced alternatives
        if (!result.data.canProcess && result.data.missingMedicines.length > 0) {
          try {
            const advancedResponse = await fetch('/api/prescriptions/advanced-alternatives', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                medicines: result.data.inventoryCheck
                  .filter(check => !check.isAvailable)
                  .map(check => ({
                    name: check.medicineName,
                    category: check.category,
                    requestedQuantity: check.requestedQuantity
                  }))
              }),
            })

            const advancedResult = await advancedResponse.json()
            if (advancedResult.success && advancedResult.data.alternatives.length > 0) {
              setAlternatives(advancedResult.data.alternatives)
            }
          } catch (error) {
            console.log('Advanced alternatives not available, using basic alternatives')
          }
        }
        
        console.log('Can process:', result.data.canProcess)
        if (result.data.canProcess) {
          console.log('Moving to billing step')
          setCurrentStep('billing')
        } else {
          console.log('Moving to alternatives step')
          setCurrentStep('alternatives')
        }
      } else {
        console.error('API error:', result.error)
        toast.error(result.error || 'Failed to process prescription')
      }
    } catch (error) {
      console.error('Error processing prescription:', error)
      toast.error('Failed to process prescription')
    }
  }

  const handleAlternativeSelect = (originalMedicine: string, alternative: AlternativeMedicine) => {
    setSelectedAlternatives(prev => ({
      ...prev,
      [originalMedicine]: alternative
    }))
    
    // Initialize partial fulfillment for this medicine
    setPartialFulfillment(prev => ({
      ...prev,
      [originalMedicine]: {
        enabled: alternative.availableQuantity < (inventoryCheck.find(c => c.medicineName === originalMedicine)?.requestedQuantity || 0),
        quantity: Math.min(alternative.availableQuantity, inventoryCheck.find(c => c.medicineName === originalMedicine)?.requestedQuantity || 0)
      }
    }))
  }

  const handlePartialFulfillmentToggle = (originalMedicine: string, enabled: boolean) => {
    const selectedAlt = selectedAlternatives[originalMedicine]
    const requestedQty = inventoryCheck.find(c => c.medicineName === originalMedicine)?.requestedQuantity || 0
    
    setPartialFulfillment(prev => ({
      ...prev,
      [originalMedicine]: {
        enabled,
        quantity: enabled ? Math.min(selectedAlt?.availableQuantity || 0, requestedQty) : requestedQty
      }
    }))
  }

  const handlePartialQuantityChange = (originalMedicine: string, quantity: number) => {
    const selectedAlt = selectedAlternatives[originalMedicine]
    const maxQuantity = selectedAlt?.availableQuantity || 0
    
    setPartialFulfillment(prev => ({
      ...prev,
      [originalMedicine]: {
        ...prev[originalMedicine],
        quantity: Math.min(Math.max(1, quantity), maxQuantity)
      }
    }))
  }

  const canProceedToBilling = () => {
    // Check if all unavailable medicines have selected alternatives
    const unavailableMedicines = inventoryCheck.filter(check => !check.isAvailable)
    
    if (unavailableMedicines.length === 0) {
      return true // All medicines are available
    }

    // Check if all unavailable medicines have selected alternatives
    for (const medicine of unavailableMedicines) {
      const selectedAlternative = selectedAlternatives[medicine.medicineName]
      if (!selectedAlternative) {
        return false // No alternative selected for this medicine
      }
      
      // Check if partial fulfillment is enabled for this medicine
      const partial = partialFulfillment[medicine.medicineName]
      if (partial?.enabled) {
        // Partial fulfillment enabled - check if requested quantity is valid
        if (partial.quantity <= 0 || partial.quantity > selectedAlternative.availableQuantity) {
          return false // Invalid partial quantity
        }
      } else {
        // Full fulfillment required - check if the selected alternative has enough stock
        if (selectedAlternative.availableQuantity < medicine.requestedQuantity) {
          return false // Selected alternative doesn't have enough stock for full fulfillment
        }
      }
    }

    return true
  }

  const handleFinalizePrescription = async () => {
    try {
      setIsProcessing(true)
      setCurrentStep('processing')

      const finalMedicines = medicines.map(med => {
        const selectedAlt = selectedAlternatives[med.name]
        const partial = partialFulfillment[med.name]
        const finalQuantity = partial?.enabled ? partial.quantity : med.quantity
        
        return {
          name: selectedAlt ? selectedAlt.name : med.name,
          quantity: finalQuantity,
          price: selectedAlt ? selectedAlt.price : inventoryCheck.find(check => check.medicineName === med.name)?.price || 0,
          isAlternative: !!selectedAlt,
          originalMedicine: selectedAlt ? med.name : undefined,
          alternativeName: selectedAlt?.name
        }
      })

      const response = await fetch('/api/prescriptions/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId: `RX-${Date.now().toString().slice(-6)}`,
          medicines: finalMedicines,
          patientName: patientInfo.name || 'Unknown Patient',
          doctorName: patientInfo.doctor || 'Unknown Doctor',
          totalAmount: totalCost,
          paymentMethod: 'cash',
          notes: 'Prescription processed via OCR'
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Prescription processed successfully!')
        onPrescriptionProcessed(result.data.prescriptionId, {
          totalAmount: result.data.totalAmount,
          processedMedicines: result.data.processedMedicines
        })
        onClose()
      } else {
        toast.error(result.error || 'Failed to finalize prescription')
        setCurrentStep('billing')
      }
    } catch (error) {
      console.error('Error finalizing prescription:', error)
      toast.error('Failed to finalize prescription')
      setCurrentStep('billing')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'checking': return <RefreshCw className="w-5 h-5 animate-spin" />
      case 'alternatives': return <Package className="w-5 h-5" />
      case 'billing': return <DollarSign className="w-5 h-5" />
      case 'processing': return <RefreshCw className="w-5 h-5 animate-spin" />
      default: return <CheckCircle className="w-5 h-5" />
    }
  }

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'checking': return 'Checking Inventory'
      case 'alternatives': return 'Alternative Medicines'
      case 'billing': return 'Billing & Confirmation'
      case 'processing': return 'Processing Prescription'
      default: return 'Complete'
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
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Prescription Processor</h2>
                <p className="text-white/80">Processing prescription for {patientInfo.name || 'Unknown Patient'}</p>
              </div>
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
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {['checking', 'alternatives', 'billing', 'processing'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === step ? 'bg-primary-600 text-white' :
                    ['checking', 'alternatives', 'billing'].indexOf(currentStep) > index ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {getStepIcon(step)}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step ? 'text-primary-600' :
                    ['checking', 'alternatives', 'billing'].indexOf(currentStep) > index ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {getStepTitle(step)}
                  </span>
                  {index < 3 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 'checking' && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Checking Inventory</h3>
              <p className="text-gray-600">Verifying medicine availability and stock levels...</p>
            </div>
          )}

          {currentStep === 'alternatives' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Some Medicines Unavailable</h3>
                <p className="text-gray-600">We found alternative medicines that are in stock</p>
              </div>

              {alternatives.map((altGroup, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{altGroup.originalMedicine}</h4>
                      <p className="text-sm text-gray-600">Requested: {altGroup.requestedQuantity} units</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Out of Stock
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">Suggested Alternatives:</h5>
                    {altGroup.alternatives.map((alt: AlternativeMedicine, altIndex: number) => (
                      <motion.div
                        key={altIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: altIndex * 0.1 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAlternatives[altGroup.originalMedicine]?.name === alt.name
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAlternativeSelect(altGroup.originalMedicine, alt)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900">{alt.name}</h6>
                            <p className="text-sm text-gray-600">{alt.dosage} • {alt.category}</p>
                            <p className="text-xs text-gray-500 mt-1">{alt.reason}</p>
                            {alt.availableQuantity < (inventoryCheck.find(c => c.medicineName === altGroup.originalMedicine)?.requestedQuantity || 0) && (
                              <div className="mt-2 space-y-2">
                                <p className="text-xs text-red-600 font-medium">
                                  ⚠️ Insufficient stock (need {inventoryCheck.find(c => c.medicineName === altGroup.originalMedicine)?.requestedQuantity || 0}, have {alt.availableQuantity})
                                </p>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`partial-${altGroup.originalMedicine}`}
                                    checked={partialFulfillment[altGroup.originalMedicine]?.enabled || false}
                                    onChange={(e) => handlePartialFulfillmentToggle(altGroup.originalMedicine, e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <label htmlFor={`partial-${altGroup.originalMedicine}`} className="text-xs text-blue-600">
                                    Enable partial fulfillment
                                  </label>
                                </div>
                                {partialFulfillment[altGroup.originalMedicine]?.enabled && (
                                  <div className="flex items-center space-x-2">
                                    <label className="text-xs text-gray-600">Quantity:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={alt.availableQuantity}
                                      value={partialFulfillment[altGroup.originalMedicine]?.quantity || 1}
                                      onChange={(e) => handlePartialQuantityChange(altGroup.originalMedicine, parseInt(e.target.value) || 1)}
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <span className="text-xs text-gray-500">/ {alt.availableQuantity} available</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${alt.price.toFixed(2)}</p>
                            <p className={`text-sm ${alt.availableQuantity >= (inventoryCheck.find(c => c.medicineName === altGroup.originalMedicine)?.requestedQuantity || 0) ? 'text-green-600' : 'text-red-600'}`}>
                              {alt.availableQuantity} in stock
                            </p>
                            <p className="text-xs text-gray-500">{Math.round(alt.similarity * 100)}% match</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Warning message for insufficient stock */}
              {!canProceedToBilling() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-red-800">Cannot Proceed to Billing</h4>
                      <p className="text-sm text-red-700">
                        Selected alternatives do not have sufficient stock to fulfill the prescription. 
                        Please select alternatives with adequate stock or consider partial fulfillment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCurrentStep('billing')}
                  disabled={!canProceedToBilling()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Billing
                </button>
              </div>
            </div>
          )}

          {currentStep === 'billing' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Prescription Ready</h3>
                <p className="text-gray-600">Review the details and confirm processing</p>
              </div>

              {/* Patient Info */}
              <div className="card">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Patient Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Patient Name</p>
                    <p className="text-gray-900">{patientInfo.name || 'Unknown Patient'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Doctor</p>
                    <p className="text-gray-900">{patientInfo.doctor || 'Unknown Doctor'}</p>
                  </div>
                </div>
              </div>

              {/* Medicines Summary */}
              <div className="card">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Medicines ({medicines.length})</span>
                </h4>
                <div className="space-y-3">
                  {medicines.map((med, index) => {
                    const check = inventoryCheck.find(c => c.medicineName === med.name)
                    const selectedAlt = selectedAlternatives[med.name]
                    const partial = partialFulfillment[med.name]
                    const finalMedicine = selectedAlt || check
                    const finalQuantity = partial?.enabled ? partial.quantity : med.quantity
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {selectedAlt ? selectedAlt.name : med.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {finalQuantity} units • {med.dosage}
                            {partial?.enabled && (
                              <span className="text-orange-600 ml-2">(Partial fulfillment)</span>
                            )}
                          </p>
                          {selectedAlt && (
                            <p className="text-xs text-blue-600">Alternative selected</p>
                          )}
                          {partial?.enabled && (
                            <p className="text-xs text-orange-600">
                              Original request: {med.quantity} units
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${((finalMedicine?.price || 0) * finalQuantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${finalMedicine?.price?.toFixed(2) || '0.00'} each
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total Cost */}
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Total Amount</span>
                  </h4>
                  <p className="text-2xl font-bold text-primary-900">${totalCost.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizePrescription}
                  className="btn-primary"
                >
                  Process Prescription
                </button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Prescription</h3>
              <p className="text-gray-600">Updating inventory and generating invoice...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default PrescriptionProcessor
