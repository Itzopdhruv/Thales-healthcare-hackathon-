import React, { useState, useEffect } from 'react';
import './AdminAppointmentManagement.css';

const AdminAppointmentManagement = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddSlotForm, setShowAddSlotForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Form states
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
    durationMinutes: 30
  });

  const [newSpecialty, setNewSpecialty] = useState({
    name: '',
    description: ''
  });

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    consultationFee: 0
  });

  const [bulkSlots, setBulkSlots] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadInitialData = async () => {
    try {
      const [specialtiesRes, doctorsRes, appointmentsRes] = await Promise.all([
        fetch('/api/admin/appointments/specialties'),
        fetch('/api/admin/appointments/doctors'),
        fetch('/api/admin/appointments/appointments')
      ]);

      const [specialtiesData, doctorsData, appointmentsData] = await Promise.all([
        specialtiesRes.json(),
        doctorsRes.json(),
        appointmentsRes.json()
      ]);

      setSpecialties(specialtiesData.data);
      setDoctors(doctorsData.data);
      setAppointments(appointmentsData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
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
        alert('Specialty created successfully!');
      }
    } catch (error) {
      console.error('Error creating specialty:', error);
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
        alert('Doctor created successfully!');
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/appointments/doctors/${selectedDoctor}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSlot,
          specialtyId: selectedSpecialty,
          date: selectedDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailabilitySlots([...availabilitySlots, data.data]);
        setNewSlot({ startTime: '', endTime: '', durationMinutes: 30 });
        setShowAddSlotForm(false);
        alert('Availability slot created successfully!');
      }
    } catch (error) {
      console.error('Error creating slot:', error);
    }
  };

  const handleBulkCreateSlots = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/appointments/doctors/${selectedDoctor}/slots/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialtyId: selectedSpecialty,
          date: selectedDate,
          timeSlots: bulkSlots
        })
      });

      if (response.ok) {
        loadDoctorSlots(selectedDoctor, selectedDate);
        setBulkSlots([]);
        setShowBulkAddForm(false);
        alert('Bulk slots created successfully!');
      }
    } catch (error) {
      console.error('Error creating bulk slots:', error);
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
    setBulkSlots([...bulkSlots, { startTime: '', endTime: '', durationMinutes: 30 }]);
  };

  const removeBulkSlot = (index) => {
    setBulkSlots(bulkSlots.filter((_, i) => i !== index));
  };

  const updateBulkSlot = (index, field, value) => {
    const updated = [...bulkSlots];
    updated[index][field] = value;
    setBulkSlots(updated);
  };

  return (
    <div className="admin-appointment-management">
      <h2>Appointment Management</h2>

      {/* Specialties Management */}
      <div className="management-section">
        <h3>Specialties Management</h3>
        <div className="specialties-list">
          {specialties.map(specialty => (
            <div key={specialty._id} className="specialty-item">
              <span>{specialty.name}</span>
              <span className="description">{specialty.description}</span>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleCreateSpecialty} className="add-form">
          <input
            type="text"
            placeholder="Specialty Name"
            value={newSpecialty.name}
            onChange={(e) => setNewSpecialty({...newSpecialty, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newSpecialty.description}
            onChange={(e) => setNewSpecialty({...newSpecialty, description: e.target.value})}
          />
          <button type="submit">Add Specialty</button>
        </form>
      </div>

      {/* Doctors Management */}
      <div className="management-section">
        <h3>Doctors Management</h3>
        <div className="doctors-list">
          {doctors.map(doctor => (
            <div key={doctor._id} className="doctor-item">
              <span>{doctor.name}</span>
              <span>{doctor.specialty.name}</span>
              <span>₹{doctor.consultationFee}</span>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleCreateDoctor} className="add-form">
          <input
            type="text"
            placeholder="Doctor Name"
            value={newDoctor.name}
            onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newDoctor.email}
            onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newDoctor.phone}
            onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
          />
          <select
            value={newDoctor.specialty}
            onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
            required
          >
            <option value="">Select Specialty</option>
            {specialties.map(specialty => (
              <option key={specialty._id} value={specialty._id}>
                {specialty.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="License Number"
            value={newDoctor.licenseNumber}
            onChange={(e) => setNewDoctor({...newDoctor, licenseNumber: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Consultation Fee"
            value={newDoctor.consultationFee}
            onChange={(e) => setNewDoctor({...newDoctor, consultationFee: e.target.value})}
          />
          <button type="submit">Add Doctor</button>
        </form>
      </div>

      {/* Doctor Slots Management */}
      <div className="management-section">
        <h3>Doctor Availability Management</h3>
        
        <div className="slot-controls">
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="">Select Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialty.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <button onClick={() => setShowAddSlotForm(!showAddSlotForm)}>
            Add Single Slot
          </button>
          <button onClick={() => setShowBulkAddForm(!showBulkAddForm)}>
            Add Multiple Slots
          </button>
        </div>

        {showAddSlotForm && (
          <form onSubmit={handleCreateSlot} className="add-form">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              required
            >
              <option value="">Select Specialty</option>
              {specialties.map(specialty => (
                <option key={specialty._id} value={specialty._id}>
                  {specialty.name}
                </option>
              ))}
            </select>
            <input
              type="time"
              placeholder="Start Time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
              required
            />
            <input
              type="time"
              placeholder="End Time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={newSlot.durationMinutes}
              onChange={(e) => setNewSlot({...newSlot, durationMinutes: e.target.value})}
            />
            <button type="submit">Add Slot</button>
            <button type="button" onClick={() => setShowAddSlotForm(false)}>
              Cancel
            </button>
          </form>
        )}

        {showBulkAddForm && (
          <form onSubmit={handleBulkCreateSlots} className="add-form">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              required
            >
              <option value="">Select Specialty</option>
              {specialties.map(specialty => (
                <option key={specialty._id} value={specialty._id}>
                  {specialty.name}
                </option>
              ))}
            </select>
            
            {bulkSlots.map((slot, index) => (
              <div key={index} className="bulk-slot-row">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateBulkSlot(index, 'startTime', e.target.value)}
                  required
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateBulkSlot(index, 'endTime', e.target.value)}
                  required
                />
                <input
                  type="number"
                  value={slot.durationMinutes}
                  onChange={(e) => updateBulkSlot(index, 'durationMinutes', e.target.value)}
                />
                <button type="button" onClick={() => removeBulkSlot(index)}>
                  Remove
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addBulkSlot}>
              Add Another Slot
            </button>
            <button type="submit">Create All Slots</button>
            <button type="button" onClick={() => setShowBulkAddForm(false)}>
              Cancel
            </button>
          </form>
        )}

        <div className="slots-list">
          <h4>Available Slots for {selectedDate}</h4>
          {availabilitySlots.map(slot => (
            <div key={slot._id} className={`slot-item ${slot.isBooked ? 'booked' : ''}`}>
              <span>{slot.startTime} - {slot.endTime}</span>
              <span>{slot.specialty.name}</span>
              <span className={`status ${slot.isBooked ? 'booked' : 'available'}`}>
                {slot.isBooked ? 'Booked' : 'Available'}
              </span>
              <div className="slot-actions">
                <button
                  onClick={() => handleUpdateSlotAvailability(slot._id, !slot.isAvailable)}
                  disabled={slot.isBooked}
                >
                  {slot.isAvailable ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteSlot(slot._id)}
                  disabled={slot.isBooked}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments Overview */}
      <div className="management-section">
        <h3>All Appointments</h3>
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment._id} className="appointment-item">
              <div className="appointment-info">
                <span><strong>{appointment.patient.name}</strong></span>
                <span>Dr. {appointment.doctor.name}</span>
                <span>{appointment.specialty.name}</span>
                <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                <span>{appointment.appointmentTime}</span>
                <span className={`status ${appointment.status.toLowerCase()}`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentManagement;
