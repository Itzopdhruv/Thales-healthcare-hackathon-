import React, { useState, useEffect } from 'react';
import './AdminAppointmentManagement.css';
import VideoCallButton from './VideoCallButton';

const AdminAppointmentManagement = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorData, setSelectedDoctorData] = useState(null);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddSlotForm, setShowAddSlotForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Form states
  const [newSlot, setNewSlot] = useState({
    startTime: '09:00',
    endTime: '17:00',
    durationMinutes: 15
  });

  const [newSpecialty, setNewSpecialty] = useState({
    name: '',
    description: ''
  });
  const [selectedSpecialtyForDropdown, setSelectedSpecialtyForDropdown] = useState('');

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    consultationFee: 0
  });

  const [bulkSlots, setBulkSlots] = useState([]);
  const [showSpecialtyDialog, setShowSpecialtyDialog] = useState(false);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [isCreatingBulkSlots, setIsCreatingBulkSlots] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [deletingSpecialty, setDeletingSpecialty] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  // State for doctor edit/delete dialogs
  const [showDoctorEditDialog, setShowDoctorEditDialog] = useState(false);
  const [showDoctorDeleteDialog, setShowDoctorDeleteDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [deletingDoctor, setDeletingDoctor] = useState(null);
  const [editDoctorFormData, setEditDoctorFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    specialty: '', 
    licenseNumber: '', 
    consultationFee: 0 
  });

  // Validation alert state
  const [showTimeValidationAlert, setShowTimeValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSlots(selectedDoctor, selectedDate);
      // Auto-populate specialty from selected doctor
      const doctor = doctors.find(d => d._id === selectedDoctor);
      if (doctor && doctor.specialty) {
        setSelectedDoctorData(doctor);
        setSelectedSpecialty(doctor.specialty._id);
      } else {
        setSelectedDoctorData(null);
        setSelectedSpecialty('');
      }
    } else {
      setSelectedDoctorData(null);
      setSelectedSpecialty('');
    }
  }, [selectedDoctor, selectedDate, doctors]);

  const loadAppointments = async () => {
    try {
      const appointmentsRes = await fetch('/api/admin/appointments/appointments');
      if (!appointmentsRes.ok) {
        throw new Error(`Appointments API failed: ${appointmentsRes.status}`);
      }
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData.data || []);
      console.log('✅ Appointments refreshed:', appointmentsData.data?.length || 0);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await fetch(`/api/admin/appointments/update-status/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        console.log(`✅ Appointment ${appointmentId} status updated to ${status}`);
        // Refresh appointments to show updated status
        loadAppointments();
      } else {
        console.error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      const [specialtiesRes, doctorsRes, appointmentsRes] = await Promise.all([
        fetch('/api/admin/appointments/specialties'),
        fetch('/api/admin/appointments/doctors'),
        fetch('/api/admin/appointments/appointments')
      ]);

      if (!specialtiesRes.ok) {
        throw new Error(`Specialties API failed: ${specialtiesRes.status}`);
      }
      if (!doctorsRes.ok) {
        throw new Error(`Doctors API failed: ${doctorsRes.status}`);
      }
      if (!appointmentsRes.ok) {
        throw new Error(`Appointments API failed: ${appointmentsRes.status}`);
      }

      const [specialtiesData, doctorsData, appointmentsData] = await Promise.all([
        specialtiesRes.json(),
        doctorsRes.json(),
        appointmentsRes.json()
      ]);

      setSpecialties(specialtiesData.data || []);
      setDoctors(doctorsData.data || []);
      setAppointments(appointmentsData.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set empty arrays to prevent undefined errors
      setSpecialties([]);
      setDoctors([]);
      setAppointments([]);
    }
  };

  const loadDoctorSlots = async (doctorId, date) => {
    try {
      const response = await fetch(`/api/admin/appointments/doctors/${doctorId}/slots?date=${date}`);
      const data = await response.json();
      setAvailabilitySlots(data.data);
    } catch (error) {
      console.error('Error loading doctor slots:', error);
    }
  };

  const handleCreateSpecialty = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/appointments/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpecialty)
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialties([...specialties, data.data]);
        setNewSpecialty({ name: '', description: '' });
        setShowSpecialtyDialog(false);
        alert('✅ Specialty created successfully!');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Failed to create specialty'}`);
      }
    } catch (error) {
      console.error('Error creating specialty:', error);
      alert('❌ Failed to create specialty. Please try again.');
    }
  };

  const handleEditSpecialty = (specialtyId) => {
    console.log('Edit button clicked for specialty ID:', specialtyId);
    const specialty = specialties.find(s => s._id === specialtyId);
    if (!specialty) {
      console.log('Specialty not found');
      return;
    }

    setEditingSpecialty(specialty);
    setEditFormData({
      name: specialty.name,
      description: specialty.description || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateSpecialty = async (e) => {
    e.preventDefault();
    if (!editingSpecialty) return;

    try {
      console.log('Sending PUT request to:', `/api/admin/appointments/specialties/${editingSpecialty._id}`);
      const response = await fetch(`/api/admin/appointments/specialties/${editingSpecialty._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description.trim()
        })
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Update successful:', data);
        setSpecialties(specialties.map(s => 
          s._id === editingSpecialty._id ? data.data : s
        ));
        setShowEditDialog(false);
        setEditingSpecialty(null);
        setEditFormData({ name: '', description: '' });
        alert('✅ Specialty updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to update specialty'}`);
      }
    } catch (error) {
      console.error('Error updating specialty:', error);
      alert('❌ Failed to update specialty. Please try again.');
    }
  };

  const handleDeleteSpecialty = (specialtyId) => {
    console.log('Delete button clicked for specialty ID:', specialtyId);
    const specialty = specialties.find(s => s._id === specialtyId);
    if (!specialty) {
      console.log('Specialty not found');
      return;
    }

    setDeletingSpecialty(specialty);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSpecialty) return;

    try {
      console.log('Sending DELETE request to:', `/api/admin/appointments/specialties/${deletingSpecialty._id}`);
      const response = await fetch(`/api/admin/appointments/specialties/${deletingSpecialty._id}`, {
        method: 'DELETE'
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Delete successful:', data);
        setSpecialties(specialties.filter(s => s._id !== deletingSpecialty._id));
        setSelectedSpecialtyForDropdown(''); // Clear dropdown selection if deleted
        setShowDeleteDialog(false);
        setDeletingSpecialty(null);
        alert('✅ Specialty deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        
        // Handle doctors using this specialty
        if (errorData.doctors && errorData.doctors.length > 0) {
          const doctorNames = errorData.doctors.map(d => d.name).join(', ');
          alert(`❌ Cannot delete specialty!\n\n${errorData.message}\n\nDoctors using this specialty: ${doctorNames}\n\nPlease reassign or delete those doctors first.`);
        } else {
          alert(`❌ Error: ${errorData.message || 'Failed to delete specialty'}`);
        }
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
      alert('❌ Failed to delete specialty. Please try again.');
    }
  };

  // Doctor edit and delete functions
  const handleEditDoctor = (doctorId) => {
    console.log('Edit button clicked for doctor ID:', doctorId);
    const doctor = doctors.find(d => d._id === doctorId);
    if (!doctor) {
      console.log('Doctor not found');
      return;
    }

    setEditingDoctor(doctor);
    setEditDoctorFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || '',
      specialty: doctor.specialty?._id || '',
      licenseNumber: doctor.licenseNumber || '',
      consultationFee: doctor.consultationFee || 0
    });
    setShowDoctorEditDialog(true);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      console.log('Sending PUT request to:', `/api/admin/appointments/doctors/${editingDoctor._id}`);
      const response = await fetch(`/api/admin/appointments/doctors/${editingDoctor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDoctorFormData.name.trim(),
          email: editDoctorFormData.email.trim(),
          phone: editDoctorFormData.phone.trim(),
          specialty: editDoctorFormData.specialty,
          licenseNumber: editDoctorFormData.licenseNumber.trim(),
          consultationFee: Number(editDoctorFormData.consultationFee)
        })
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Update successful:', data);
        setDoctors(doctors.map(d => 
          d._id === editingDoctor._id ? data.data : d
        ));
        setShowDoctorEditDialog(false);
        setEditingDoctor(null);
        setEditDoctorFormData({ 
          name: '', 
          email: '', 
          phone: '', 
          specialty: '', 
          licenseNumber: '', 
          consultationFee: 0 
        });
        alert('✅ Doctor updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to update doctor'}`);
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('❌ Failed to update doctor. Please try again.');
    }
  };

  const handleDeleteDoctor = (doctorId) => {
    console.log('Delete button clicked for doctor ID:', doctorId);
    const doctor = doctors.find(d => d._id === doctorId);
    if (!doctor) {
      console.log('Doctor not found');
      return;
    }

    setDeletingDoctor(doctor);
    setShowDoctorDeleteDialog(true);
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!deletingDoctor) return;

    try {
      console.log('Sending DELETE request to:', `/api/admin/appointments/doctors/${deletingDoctor._id}`);
      const response = await fetch(`/api/admin/appointments/doctors/${deletingDoctor._id}`, {
        method: 'DELETE'
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Delete successful:', data);
        setDoctors(doctors.filter(d => d._id !== deletingDoctor._id));
        setShowDoctorDeleteDialog(false);
        setDeletingDoctor(null);
        alert('✅ Doctor deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to delete doctor'}`);
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('❌ Failed to delete doctor. Please try again.');
    }
  };

  // Cleanup orphaned doctors
  const handleCleanupOrphanedDoctors = async () => {
    if (!confirm('This will delete all doctors without valid specialties. Are you sure?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/appointments/doctors/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Cleanup successful:', data);
        alert(`✅ ${data.message}\n\nDeleted ${data.deletedCount} orphaned doctors.`);
        // Reload doctors to reflect changes
        loadInitialData();
      } else {
        const errorData = await response.json();
        console.error('Cleanup failed:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to cleanup orphaned doctors'}`);
      }
    } catch (error) {
      console.error('Error cleaning up orphaned doctors:', error);
      alert('❌ Failed to cleanup orphaned doctors. Please try again.');
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/appointments/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors([...doctors, data.data]);
        setNewDoctor({
          name: '',
          email: '',
          phone: '',
          specialty: '',
          licenseNumber: '',
          consultationFee: 0
        });
        setShowDoctorDialog(false);
        alert('Doctor created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to create doctor'}`);
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      alert('Failed to create doctor. Please try again.');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }
    if (!selectedDoctorData || !selectedDoctorData.specialty) {
      alert('Selected doctor has no specialty assigned. Please assign a specialty to this doctor first.');
      return;
    }
    if (!newSlot.startTime || !newSlot.endTime) {
      alert('Please fill in both start and end times');
      return;
    }
    if (new Date(`2000-01-01 ${newSlot.startTime}`) >= new Date(`2000-01-01 ${newSlot.endTime}`)) {
      alert('End time must be after start time');
      return;
    }

    setIsCreatingSlot(true);

    try {
      console.log('Creating slot with data:', {
        ...newSlot,
        specialtyId: selectedSpecialty,
        date: selectedDate,
        doctorId: selectedDoctor
      });

      const response = await fetch(`/api/admin/appointments/doctors/${selectedDoctor}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSlot,
          specialtyId: selectedSpecialty,
          date: selectedDate
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Slot created successfully:', data);
        setAvailabilitySlots([...availabilitySlots, data.data]);
        setNewSlot({ startTime: '09:00', endTime: '17:00', durationMinutes: 15 });
        setShowAddSlotForm(false);
        alert('✅ Availability slot created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to create slot'}`);
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      alert('❌ Failed to create slot. Please try again.');
    } finally {
      setIsCreatingSlot(false);
    }
  };

  const handleBulkCreateSlots = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }
    if (!selectedDoctorData || !selectedDoctorData.specialty) {
      alert('Selected doctor has no specialty assigned. Please assign a specialty to this doctor first.');
      return;
    }
    if (bulkSlots.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    // Validate each slot
    for (let i = 0; i < bulkSlots.length; i++) {
      const slot = bulkSlots[i];
      if (!slot.startTime || !slot.endTime) {
        alert(`Please fill in both start and end times for slot ${i + 1}`);
        return;
      }
      if (new Date(`2000-01-01 ${slot.startTime}`) >= new Date(`2000-01-01 ${slot.endTime}`)) {
        alert(`End time must be after start time for slot ${i + 1}`);
        return;
      }
    }

    setIsCreatingBulkSlots(true);

    try {
      console.log('Creating bulk slots with data:', {
        specialtyId: selectedSpecialty,
        date: selectedDate,
        timeSlots: bulkSlots,
        doctorId: selectedDoctor
      });

      const response = await fetch(`/api/admin/appointments/doctors/${selectedDoctor}/slots/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialtyId: selectedSpecialty,
          date: selectedDate,
          timeSlots: bulkSlots
        })
      });

      console.log('Bulk response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Bulk slots created successfully:', data);
        loadDoctorSlots(selectedDoctor, selectedDate);
        setBulkSlots([]);
        setShowBulkAddForm(false);
        alert(`✅ ${bulkSlots.length} slots created successfully!`);
      } else {
        const errorData = await response.json();
        console.error('Bulk error response:', errorData);
        alert(`❌ Error: ${errorData.message || 'Failed to create bulk slots'}`);
      }
    } catch (error) {
      console.error('Error creating bulk slots:', error);
      alert('❌ Failed to create bulk slots. Please try again.');
    } finally {
      setIsCreatingBulkSlots(false);
    }
  };

  const handleUpdateSlotAvailability = async (slotId, isAvailable) => {
    try {
      const response = await fetch(`/api/admin/appointments/slots/${slotId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      });

      if (response.ok) {
        setAvailabilitySlots(prev =>
          prev.map(slot =>
            slot._id === slotId ? { ...slot, isAvailable } : slot
          )
        );
      }
    } catch (error) {
      console.error('Error updating slot availability:', error);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        const response = await fetch(`/api/admin/appointments/slots/${slotId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setAvailabilitySlots(prev => prev.filter(slot => slot._id !== slotId));
          alert('Slot deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting slot:', error);
      }
    }
  };

  const addBulkSlot = () => {
    setBulkSlots([...bulkSlots, { startTime: '09:00', endTime: '17:00', durationMinutes: 15 }]);
  };

  const removeBulkSlot = (index) => {
    setBulkSlots(bulkSlots.filter((_, i) => i !== index));
  };

  // Time picker functions
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Time validation function
  const validateTimeDifference = (startTime, endTime) => {
    if (!startTime || !endTime) return true; // Allow empty values
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffInMinutes = (end - start) / (1000 * 60);
    
    return diffInMinutes <= 15;
  };

  const showValidationAlert = (message) => {
    setValidationMessage(message);
    setShowTimeValidationAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowTimeValidationAlert(false);
    }, 5000);
  };

  const updateBulkSlot = (index, field, value) => {
    const updated = [...bulkSlots];
    updated[index][field] = value;
    setBulkSlots(updated);
    
    // Validate time difference for bulk slots
    if (field === 'startTime' || field === 'endTime') {
      const slot = updated[index];
      if (slot.startTime && slot.endTime) {
        if (!validateTimeDifference(slot.startTime, slot.endTime)) {
          showValidationAlert(`⚠️ Slot ${index + 1}: Time difference cannot exceed 15 minutes! Please select a valid time range.`);
        }
      }
    }
  };

  return (
    <div className="admin-appointment-management">
      <h2>Appointment Management</h2>

      {/* Specialties Management */}
      <div className="management-section specialties-section">
        <div className="section-header">
        <h3>Specialties Management</h3>
          <button 
            className="add-specialty-btn"
            onClick={() => setShowSpecialtyDialog(true)}
          >
            <span className="btn-icon">+</span>
            Add New Specialty
          </button>
            </div>
        
        <div className="specialties-grid">
          {specialties.length > 0 ? (
            specialties.map(specialty => (
              <div key={specialty._id} className="specialty-card">
                <div className="specialty-icon">
                  <span className="icon">🏥</span>
                </div>
                <div className="specialty-content">
                  <h4 className="specialty-name">{specialty.name}</h4>
                  <p className="specialty-description">{specialty.description || 'No description provided'}</p>
                </div>
                <div className="specialty-actions">
                  <button 
                    className="edit-btn" 
                    title="Edit Specialty"
                    onClick={() => handleEditSpecialty(specialty._id)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn" 
                    title="Delete Specialty"
                    onClick={() => handleDeleteSpecialty(specialty._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h4>No Specialties Added Yet</h4>
              <p>Click "Add New Specialty" to get started</p>
            </div>
          )}
        </div>
        
        {/* Specialty Selection Dropdown */}
        <div className="specialty-selection-section">
          <div className="selection-header">
            <h4>Quick Specialty Selection</h4>
            <p>Select a specialty to view details or perform actions</p>
          </div>
          <div className="selection-controls">
            <div className="dropdown-container">
              <select
                value={selectedSpecialtyForDropdown}
                onChange={(e) => setSelectedSpecialtyForDropdown(e.target.value)}
                className="specialty-dropdown"
              >
                <option value="">Choose a specialty...</option>
          {specialties.map(specialty => (
                  <option key={specialty._id} value={specialty._id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
            {selectedSpecialtyForDropdown && (
              <div className="selected-specialty-info">
                {(() => {
                  const selectedSpecialty = specialties.find(s => s._id === selectedSpecialtyForDropdown);
                  return selectedSpecialty ? (
                    <div className="specialty-preview">
                      <div className="preview-icon">🏥</div>
                      <div className="preview-content">
                        <h5>{selectedSpecialty.name}</h5>
                        <p>{selectedSpecialty.description || 'No description provided'}</p>
                      </div>
                      <div className="preview-actions">
                        <button 
                          className="action-btn edit-btn" 
                          title="Edit"
                          onClick={() => handleEditSpecialty(selectedSpecialty._id)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          title="Delete"
                          onClick={() => handleDeleteSpecialty(selectedSpecialty._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
        </div>
        
      {/* Specialty Dialog */}
      {showSpecialtyDialog && (
        <div className="dialog-overlay" onClick={() => setShowSpecialtyDialog(false)}>
          <div className="specialty-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Add New Specialty</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSpecialtyDialog(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSpecialty} className="dialog-form">
              <div className="form-group">
                <label htmlFor="specialtyName">Specialty Name *</label>
          <input
                  id="specialtyName"
            type="text"
                  placeholder="e.g., Cardiology, Neurology, Dermatology"
            value={newSpecialty.name}
            onChange={(e) => setNewSpecialty({...newSpecialty, name: e.target.value})}
            required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="specialtyDescription">Description</label>
                <textarea
                  id="specialtyDescription"
                  placeholder="Brief description of the specialty..."
            value={newSpecialty.description}
            onChange={(e) => setNewSpecialty({...newSpecialty, description: e.target.value})}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              <div className="dialog-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowSpecialtyDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <span className="btn-icon">+</span>
                  Add Specialty
                </button>
              </div>
        </form>
      </div>
        </div>
      )}

      {/* Doctors Management */}
      <div className="management-section doctors-section">
        <div className="section-header">
        <h3>Doctors Management</h3>
          <div className="header-actions">
            <button 
              className="cleanup-btn"
              onClick={handleCleanupOrphanedDoctors}
              title="Clean up doctors without specialties"
            >
              <span className="btn-icon">🧹</span>
              Cleanup
            </button>
            <button 
              className="add-doctor-btn"
              onClick={() => setShowDoctorDialog(true)}
            >
              <span className="btn-icon">👨‍⚕️</span>
              Add New Doctor
            </button>
            </div>
        </div>
        
        <div className="doctors-grid">
          {doctors.length > 0 ? (
            doctors.map(doctor => (
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-avatar">
                  <span className="avatar-icon">👨‍⚕️</span>
                </div>
                <div className="doctor-info">
                  <h4 className="doctor-name">{doctor.name}</h4>
                  <p className="doctor-specialty">{doctor.specialty?.name || 'No Specialty'}</p>
                  <p className="doctor-email">{doctor.email}</p>
                  <div className="doctor-fee">
                    <span className="fee-label">Consultation Fee:</span>
                    <span className="fee-amount">₹{doctor.consultationFee}</span>
                  </div>
                </div>
                <div className="doctor-actions">
                  <button 
                    className="doctor-edit-btn" 
                    title="Edit Doctor"
                    onClick={() => handleEditDoctor(doctor._id)}
                  >
                    <span>✏️</span>
                  </button>
                  <button 
                    className="doctor-delete-btn" 
                    title="Delete Doctor"
                    onClick={() => handleDeleteDoctor(doctor._id)}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👨‍⚕️</div>
              <h4>No Doctors Added Yet</h4>
              <p>Click "Add New Doctor" to get started</p>
            </div>
          )}
        </div>
        </div>
        
      {/* Doctor Dialog */}
      {showDoctorDialog && (
        <div className="dialog-overlay" onClick={() => setShowDoctorDialog(false)}>
          <div className="doctor-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Add New Doctor</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDoctorDialog(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateDoctor} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="doctorName">Doctor Name *</label>
          <input
                    id="doctorName"
            type="text"
                    placeholder="e.g., Dr. John Smith"
            value={newDoctor.name}
            onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
            required
                    className="form-input"
          />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorEmail">Email *</label>
          <input
                    id="doctorEmail"
            type="email"
                    placeholder="doctor@example.com"
            value={newDoctor.email}
            onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
            required
                    className="form-input"
          />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="doctorPhone">Phone *</label>
          <input
                    id="doctorPhone"
            type="tel"
                    placeholder="+91 98765 43210"
            value={newDoctor.phone}
            onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                    required
                    className="form-input"
          />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorSpecialty">Specialty *</label>
          <select
                    id="doctorSpecialty"
            value={newDoctor.specialty}
            onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
            required
                    className="form-select"
          >
            <option value="">Select Specialty</option>
            {specialties.map(specialty => (
              <option key={specialty._id} value={specialty._id}>
                {specialty.name}
              </option>
            ))}
          </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="licenseNumber">License Number *</label>
          <input
                    id="licenseNumber"
            type="text"
                    placeholder="e.g., MED123456"
            value={newDoctor.licenseNumber}
            onChange={(e) => setNewDoctor({...newDoctor, licenseNumber: e.target.value})}
            required
                    className="form-input"
          />
                </div>
                <div className="form-group">
                  <label htmlFor="consultationFee">Consultation Fee (₹) *</label>
          <input
                      id="consultationFee"
            type="number"
                      placeholder="500"
            value={newDoctor.consultationFee}
            onChange={(e) => setNewDoctor({...newDoctor, consultationFee: e.target.value})}
                      min="0"
                      step="0.01"
                      required
                      className="form-input"
                    />
                </div>
              </div>
              <div className="dialog-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowDoctorDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <span className="btn-icon">👨‍⚕️</span>
                  Add Doctor
                </button>
              </div>
        </form>
      </div>
        </div>
      )}

      {/* Doctor Availability Management */}
      <div className="management-section availability-section">
        <div className="section-header">
        <h3>Doctor Availability Management</h3>
          <div className="header-actions">
            <button 
              className="action-btn primary-btn"
              onClick={() => setShowAddSlotForm(!showAddSlotForm)}
            >
              <span className="btn-icon">⏰</span>
              Single
            </button>
            <button 
              className="action-btn secondary-btn"
              onClick={() => setShowBulkAddForm(!showBulkAddForm)}
            >
              <span className="btn-icon">📅</span>
              Multi
            </button>
          </div>
        </div>
        
        <div className="availability-controls">
          <div className="control-group">
            <label htmlFor="doctorSelect">Select Doctor</label>
          <select
              id="doctorSelect"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
              className="modern-select"
          >
              <option value="">Choose a doctor...</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                  {doctor.name} - {doctor.specialty?.name || 'No Specialty'}
              </option>
            ))}
          </select>
          </div>

          <div className="control-group">
            <label htmlFor="dateSelect">Select Date</label>
          <input
              id="dateSelect"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
              className="modern-input"
            />
          </div>
        </div>

        {showAddSlotForm && (
          <div className="slot-form-container">
            <div className="slot-form-header">
              <h4>Add Single Time Slot</h4>
              <button 
                className="close-form-btn"
                onClick={() => setShowAddSlotForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSlot} className="slot-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="slotSpecialty">Specialty *</label>
                  <div className="specialty-display">
                    <span className="specialty-name">
                      {selectedDoctorData?.specialty?.name || 'No Specialty Assigned'}
                    </span>
                    <span className={`specialty-badge ${selectedDoctorData?.specialty ? 'success' : 'warning'}`}>
                      {selectedDoctorData?.specialty ? '✓' : '⚠️'}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="slotDuration">Duration (minutes) *</label>
            <input
                    id="slotDuration"
              type="number"
                    placeholder="15"
              value={newSlot.durationMinutes}
              onChange={(e) => setNewSlot({...newSlot, durationMinutes: e.target.value})}
                    min="15"
                    max="15"
                    step="15"
                    required
                    disabled
                    className="modern-input duration-disabled"
          />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
            <select
                    id="startTime"
                    value={newSlot.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      setNewSlot({...newSlot, startTime: newStartTime});
                      
                      // Validate time difference
                      if (newStartTime && newSlot.endTime) {
                        if (!validateTimeDifference(newStartTime, newSlot.endTime)) {
                          showValidationAlert('⚠️ Time difference cannot exceed 15 minutes! Please select a valid time range.');
                        }
                      }
                    }}
              required
                    className="modern-select time-picker"
                  >
                    <option value="">Select Start Time</option>
                    {timeOptions.map(time => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                </option>
              ))}
            </select>
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <select
                    id="endTime"
              value={newSlot.endTime}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      setNewSlot({...newSlot, endTime: newEndTime});
                      
                      // Validate time difference
                      if (newSlot.startTime && newEndTime) {
                        if (!validateTimeDifference(newSlot.startTime, newEndTime)) {
                          showValidationAlert('⚠️ Time difference cannot exceed 15 minutes! Please select a valid time range.');
                        }
                      }
                    }}
              required
                    className="modern-select time-picker"
                  >
                    <option value="">Select End Time</option>
                    {timeOptions.map(time => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddSlotForm(false)}
                >
              Cancel
            </button>
                <button 
                  type="submit" 
                  className={`submit-btn ${isCreatingSlot ? 'loading' : ''}`}
                  disabled={isCreatingSlot}
                >
                  {isCreatingSlot ? (
                    <>
                      <span className="btn-icon">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">⏰</span>
                      Add Slot
                    </>
                  )}
                </button>
              </div>
          </form>
          </div>
        )}

        {showBulkAddForm && (
          <div className="slot-form-container">
            <div className="slot-form-header">
              <h4>Add Multiple Time Slots</h4>
              <button 
                className="close-form-btn"
                onClick={() => setShowBulkAddForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleBulkCreateSlots} className="slot-form">
              <div className="form-group">
                <label htmlFor="bulkSpecialty">Specialty *</label>
                <div className="specialty-display">
                  <span className="specialty-name">
                    {selectedDoctorData?.specialty?.name || 'No Specialty Assigned'}
                  </span>
                  <span className={`specialty-badge ${selectedDoctorData?.specialty ? 'success' : 'warning'}`}>
                    {selectedDoctorData?.specialty ? '✓' : '⚠️'}
                  </span>
                </div>
              </div>
              
              <div className="bulk-slots-container">
                <div className="bulk-slots-header">
                  <h5>Time Slots</h5>
                  <button 
                    type="button" 
                    className="add-slot-btn"
                    onClick={addBulkSlot}
                  >
                    <span className="btn-icon">+</span>
                    Add Slot
                  </button>
                </div>
            
            {bulkSlots.map((slot, index) => (
                  <div key={index} className="bulk-slot-item">
                    <div className="slot-inputs">
                      <div className="form-group">
                        <label>Start Time</label>
                        <select
                  value={slot.startTime}
                  onChange={(e) => updateBulkSlot(index, 'startTime', e.target.value)}
                  required
                          className="modern-select time-picker"
                        >
                          <option value="">Select Start Time</option>
                          {timeOptions.map(time => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>End Time</label>
                        <select
                  value={slot.endTime}
                  onChange={(e) => updateBulkSlot(index, 'endTime', e.target.value)}
                  required
                          className="modern-select time-picker"
                        >
                          <option value="">Select End Time</option>
                          {timeOptions.map(time => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                <input
                  type="number"
                          placeholder="15"
                  value={slot.durationMinutes}
                  onChange={(e) => updateBulkSlot(index, 'durationMinutes', e.target.value)}
                  min="15"
                  max="15"
                  step="15"
                  disabled
                          className="modern-input duration-disabled"
                />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-slot-btn"
                      onClick={() => removeBulkSlot(index)}
                    >
                      🗑️
                </button>
              </div>
            ))}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowBulkAddForm(false)}
                >
              Cancel
            </button>
                <button 
                  type="submit" 
                  className={`submit-btn ${isCreatingBulkSlots ? 'loading' : ''}`}
                  disabled={isCreatingBulkSlots}
                >
                  {isCreatingBulkSlots ? (
                    <>
                      <span className="btn-icon">⏳</span>
                      Creating {bulkSlots.length} Slots...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">📅</span>
                      Add All Slots
                    </>
                  )}
                </button>
              </div>
          </form>
          </div>
        )}

        <div className="slots-display">
          <div className="slots-header">
            <h4>Available Slots for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h4>
            <div className="slots-count">
              {availabilitySlots.length} slot{availabilitySlots.length !== 1 ? 's' : ''} available
            </div>
          </div>
          
          <div className="slots-grid">
            {availabilitySlots.length > 0 ? (
              availabilitySlots.map(slot => (
                <div key={slot._id} className={`slot-card ${!slot.isAvailable ? 'booked' : ''}`}>
                  <div className="slot-time">
                    <span className="time-range">{slot.startTime} - {slot.endTime}</span>
                    <span className="duration">{slot.durationMinutes} min</span>
                  </div>
                  
                  {/* Jitsi Meeting ID Display */}
                  {slot.jitsiMeetingId && (
                    <div className="slot-jitsi-id">
                      <span className="jitsi-label">🎥 Meeting ID:</span>
                      <span className="jitsi-id-text">{slot.jitsiMeetingId}</span>
                    </div>
                  )}
                  
                  <div className="slot-status">
                    <span className={`status-badge ${slot.isAvailable ? 'available' : 'booked'}`}>
                      {slot.isAvailable ? 'Available' : 'Booked'}
              </span>
                  </div>
              <div className="slot-actions">
                <button
                      className="action-btn toggle-btn"
                  onClick={() => handleUpdateSlotAvailability(slot._id, !slot.isAvailable)}
                      disabled={!slot.isAvailable}
                >
                      {slot.isAvailable ? 'Mark Booked' : 'Mark Available'}
                </button>
                <button
                      className="action-btn delete-btn"
                  onClick={() => handleDeleteSlot(slot._id)}
                >
                      🗑️
                </button>
              </div>
            </div>
              ))
            ) : (
              <div className="empty-slots">
                <div className="empty-icon">⏰</div>
                <h4>No slots available</h4>
                <p>Add time slots for the selected doctor and date</p>
              </div>
            )}
            </div>
        </div>
      </div>

      {/* Appointments Overview */}
      <div className="management-section appointments-section">
        <div className="appointments-header">
        <h3>All Appointments</h3>
          <button 
            className="refresh-btn" 
            onClick={loadAppointments}
            title="Refresh appointments"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="appointments-grid">
          {appointments
            .sort((a, b) => new Date(b.createdAt || b.appointmentDate) - new Date(a.createdAt || a.appointmentDate))
            .slice(0, 8)
            .map(appointment => (
            <div key={appointment._id} className="appointment-card" data-status={appointment.status}>
              {/* Card Header */}
              <div className="appointment-card-header">
                <div className="appointment-patient">
                  <h4>{appointment.patient?.name || 'Unknown Patient'}</h4>
                  <p className="appointment-id">ID: {appointment._id.slice(-8)}</p>
                </div>
                <div className={`appointment-status-badge ${appointment.status.toLowerCase()}`}>
                  {appointment.status}
              </div>
              </div>

              {/* Card Body */}
              <div className="appointment-card-body">
                <div className="appointment-details">
                  <div className="detail-row">
                    <span className="detail-label">👨‍⚕️ Doctor</span>
                    <span className="detail-value">Dr. {appointment.doctor?.name || 'Unknown Doctor'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">🏥 Specialty</span>
                    <span className="detail-value">{appointment.specialty?.name || 'Unknown Specialty'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">📅 Date</span>
                    <span className="detail-value">{new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">⏰ Time</span>
                    <span className="detail-value">{appointment.appointmentTime}</span>
                  </div>
                  
                  {appointment.reasonForVisit && (
                    <div className="detail-row reason-row">
                      <span className="detail-label">📝 Reason</span>
                      <span className="detail-value reason-text">{appointment.reasonForVisit}</span>
                    </div>
                  )}
                  
                  {appointment.abhaId && (
                    <div className="detail-row">
                      <span className="detail-label">🆔 ABHA ID</span>
                      <span className="detail-value">{appointment.abhaId}</span>
                    </div>
                  )}
                  
                  {appointment.virtualMeetingLink && (
                    <div className="detail-row meeting-id-row">
                      <span className="detail-label">🎥 Meeting ID</span>
                      <span className="detail-value meeting-id-value">
                        {appointment.virtualMeetingLink.split('/').pop()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Video Call Button */}
                <VideoCallButton 
                  appointment={appointment}
                  userType="admin"
                  onCallStart={(appointmentId, meetingLink) => {
                    console.log('Admin started call for appointment:', appointmentId);
                    // Update appointment status to IN_PROGRESS
                    updateAppointmentStatus(appointmentId, 'IN_PROGRESS');
                  }}
                  onCallEnd={(appointmentId) => {
                    console.log('Admin ended call for appointment:', appointmentId);
                    // Update appointment status back to SCHEDULED or COMPLETED
                    updateAppointmentStatus(appointmentId, 'COMPLETED');
                  }}
                />
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Edit Specialty Dialog - Card Format */}
      {showEditDialog && (
        <div className="dialog-overlay" onClick={() => setShowEditDialog(false)}>
          <div className="edit-specialty-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>✏️ Edit Specialty</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="card-content">
              <form onSubmit={handleUpdateSpecialty} className="edit-form">
                <div className="input-group">
                  <label>Specialty Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Cardiology, Neurology, Dermatology"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                    className="card-input"
                  />
                </div>
                
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Brief description of the specialty..."
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="card-textarea"
                    rows="4"
                  />
                </div>
                
                <div className="card-actions">
                  <button 
                    type="button" 
                    className="card-cancel-btn"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="card-update-btn">
                    <span className="btn-icon">💾</span>
                    Update Specialty
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>🗑️ Delete Specialty</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeleteDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="delete-content">
              <div className="warning-icon">⚠️</div>
              <h4>Are you sure you want to delete this specialty?</h4>
              <div className="specialty-info">
                <div className="specialty-name">{deletingSpecialty?.name}</div>
                <div className="specialty-description">{deletingSpecialty?.description || 'No description'}</div>
              </div>
              <p className="warning-text">
                This action cannot be undone. The specialty will be permanently removed from the system.
              </p>
            </div>
            <div className="dialog-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
              >
                <span className="btn-icon">🗑️</span>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Dialog - Card Format */}
      {showDoctorEditDialog && (
        <div className="dialog-overlay" onClick={() => setShowDoctorEditDialog(false)}>
          <div className="edit-doctor-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>✏️ Edit Doctor</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDoctorEditDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="card-content">
              <form onSubmit={handleUpdateDoctor} className="edit-form">
                <div className="input-row">
                  <div className="input-group">
                    <label>Doctor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Dr. John Smith"
                      value={editDoctorFormData.name}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, name: e.target.value})}
                      required
                      className="card-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="doctor@example.com"
                      value={editDoctorFormData.email}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, email: e.target.value})}
                      required
                      className="card-input"
                    />
                  </div>
                </div>
                
                <div className="input-row">
                  <div className="input-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={editDoctorFormData.phone}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, phone: e.target.value})}
                      className="card-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Specialty</label>
                    <select
                      value={editDoctorFormData.specialty}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, specialty: e.target.value})}
                      className="card-select"
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map(specialty => (
                        <option key={specialty._id} value={specialty._id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="input-row">
                  <div className="input-group">
                    <label>License Number</label>
                    <input
                      type="text"
                      placeholder="e.g., MED123456"
                      value={editDoctorFormData.licenseNumber}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, licenseNumber: e.target.value})}
                      className="card-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Consultation Fee (₹) *</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={editDoctorFormData.consultationFee}
                      onChange={(e) => setEditDoctorFormData({...editDoctorFormData, consultationFee: e.target.value})}
                      required
                      min="0"
                      className="card-input"
                    />
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    type="button" 
                    className="card-cancel-btn"
                    onClick={() => setShowDoctorEditDialog(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="card-update-btn">
                    <span className="btn-icon">💾</span>
                    Update Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Doctor Dialog */}
      {showDoctorDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDoctorDeleteDialog(false)}>
          <div className="delete-dialog doctor-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>🗑️ Delete Doctor</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDoctorDeleteDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="delete-content">
              <div className="warning-icon">⚠️</div>
              <h4>Are you sure you want to delete this doctor?</h4>
              <div className="specialty-info">
                <div className="specialty-name">{deletingDoctor?.name}</div>
                <div className="specialty-description">
                  {deletingDoctor?.specialty?.name || 'No Specialty'} • {deletingDoctor?.email}
                </div>
              </div>
              <p className="warning-text">
                This action cannot be undone. The doctor will be permanently removed from the system.
              </p>
            </div>
            <div className="dialog-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowDoctorDeleteDialog(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-confirm-btn"
                onClick={handleConfirmDeleteDoctor}
              >
                <span className="btn-icon">🗑️</span>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Validation Alert */}
      {showTimeValidationAlert && (
        <div className="validation-alert-overlay">
          <div className="validation-alert-card">
            <div className="alert-header">
              <div className="alert-icon">⚠️</div>
              <h4>Time Validation Error</h4>
              <button 
                className="alert-close-btn"
                onClick={() => setShowTimeValidationAlert(false)}
              >
                ×
              </button>
            </div>
            <div className="alert-content">
              <p>{validationMessage}</p>
              <div className="alert-actions">
                <button 
                  className="alert-ok-btn"
                  onClick={() => setShowTimeValidationAlert(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentManagement;
