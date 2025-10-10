'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const appointments = [
    {
      id: 'APT-001',
      patientName: 'Alice Johnson',
      doctorName: 'Dr. Sarah Wilson',
      date: '2024-01-16',
      time: '10:00 AM',
      status: 'scheduled',
      type: 'Consultation',
      phone: '+1 (555) 123-4567',
      location: 'Main Clinic',
      notes: 'Follow-up appointment'
    },
    {
      id: 'APT-002',
      patientName: 'Bob Smith',
      doctorName: 'Dr. Michael Brown',
      date: '2024-01-16',
      time: '2:30 PM',
      status: 'confirmed',
      type: 'Prescription Review',
      phone: '+1 (555) 987-6543',
      location: 'Main Clinic',
      notes: 'Medication adjustment needed'
    },
    {
      id: 'APT-003',
      patientName: 'Carol Davis',
      doctorName: 'Dr. Lisa Garcia',
      date: '2024-01-17',
      time: '9:15 AM',
      status: 'completed',
      type: 'Initial Consultation',
      phone: '+1 (555) 456-7890',
      location: 'Main Clinic',
      notes: 'New patient registration'
    }
  ]

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled'
      case 'confirmed': return 'Confirmed'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock
      case 'confirmed': return CheckCircle
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      default: return AlertCircle
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Schedule and manage patient appointments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Today\'s Appointments', value: '12', icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { label: 'Confirmed', value: '8', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
          { label: 'Pending', value: '3', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
          { label: 'Completed', value: '1', icon: CheckCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
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
              placeholder="Search appointments..."
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
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.map((appointment, index) => {
          const StatusIcon = getStatusIcon(appointment.status)
          return (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
                      <p className="text-sm text-gray-600">{appointment.doctorName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{appointment.date}</p>
                      <p className="text-sm text-gray-600">{appointment.time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(appointment.status)}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{getStatusText(appointment.status)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type</p>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-600">{appointment.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">{appointment.location}</p>
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    View Details
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Edit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Appointments
