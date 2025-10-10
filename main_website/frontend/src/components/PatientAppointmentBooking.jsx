import React, { useState, useEffect } from 'react';
import './PatientAppointmentBooking.css';
import VideoCallButton from './VideoCallButton';

const PatientAppointmentBooking = () => {
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [lockedSlots, setLockedSlots] = useState(new Set());
  const [userAppointments, setUserAppointments] = useState([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingData, setBookingData] = useState({
    abhaId: '',
    reason: '',
    consultationFee: 0
  });
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Booking flow states
  const [currentStep, setCurrentStep] = useState(1); // 1: Specialty, 2: Doctor, 3: Date, 4: Time, 5: Confirmation

  useEffect(() => {
    // Get ABHA ID from the logged-in patient data
    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    const abhaId = patientData.abhaId || '54-50-97-31'; // Use actual patient's ABHA ID
    
    if (!localStorage.getItem('abhaId')) {
      localStorage.setItem('abhaId', abhaId);
      console.log('🆔 Using ABHA ID from patient data:', abhaId);
    }
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    
    loadSpecialties();
    loadUserAppointments();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctorsBySpecialty(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    try {
      const response = await fetch('/api/appointments/specialties');
      const data = await response.json();
      setSpecialties(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const loadDoctorsBySpecialty = async (specialtyId) => {
    try {
      const response = await fetch(`/api/appointments/doctors/specialty/${specialtyId}?date=${selectedDate || new Date().toISOString().split('T')[0]}`);
      const data = await response.json();
      setDoctors(data.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      const response = await fetch(`/api/appointments/doctors/${doctorId}/slots?date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.data);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const loadUserAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      const abhaId = localStorage.getItem('abhaId'); // Use ABHA ID as primary identifier
      if (abhaId) {
        const response = await fetch(`/api/appointments/patient/abha/${abhaId}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          // Separate appointments by status
          const scheduledAppointments = data.data.filter(apt => apt.status === 'SCHEDULED');
          const cancelledAppointments = data.data.filter(apt => apt.status === 'CANCELLED');
          const otherAppointments = data.data.filter(apt => apt.status !== 'SCHEDULED' && apt.status !== 'CANCELLED');
          
          // Limit cancelled appointments to maximum 3
          const limitedCancelledAppointments = cancelledAppointments.slice(0, 3);
          
          // Combine all appointments with cancelled ones limited
          const filteredAppointments = [
            ...scheduledAppointments,
            ...otherAppointments,
            ...limitedCancelledAppointments
          ];
          
          // Sort by appointment date (newest first)
          filteredAppointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
          
          console.log('📅 Loaded appointments:', {
            total: data.data.length,
            scheduled: scheduledAppointments.length,
            cancelled: cancelledAppointments.length,
            limitedCancelled: limitedCancelledAppointments.length,
            final: filteredAppointments.length
          });
          
          setUserAppointments(filteredAppointments);
        } else {
          setUserAppointments([]);
        }
      } else {
        setUserAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setUserAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleSpecialtySelect = async (specialtyId) => {
    setSelectedSpecialty(specialtyId);
    setSelectedDoctor('');
    setSelectedSlot('');
    setAvailableSlots([]);
    setCurrentStep(2);
    
    // Load doctors for this specialty (without date filter)
    try {
      const response = await fetch(`/api/appointments/doctors/specialty/${specialtyId}`);
      const data = await response.json();
      setDoctors(data.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot('');
    setAvailableSlots([]);
    setCurrentStep(3);
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setAvailableSlots([]);
    
    if (selectedDoctor && date) {
      // Load slots for the selected doctor and date
      try {
        const response = await fetch(`/api/appointments/doctors/${selectedDoctor}/slots?date=${date}`);
        const data = await response.json();
        setAvailableSlots(data.data);
        setCurrentStep(4); // Move to time slot selection
      } catch (error) {
        console.error('Error loading slots:', error);
      }
    }
  };

  const handleSlotSelect = (slotId) => {
    console.log('🎯 Slot selected:', slotId);
    console.log('🎯 Available slots:', availableSlots);
    
    if (lockedSlots.has(slotId)) {
      alert('This slot is currently being booked by another user. Please try another slot.');
      return;
    }

    setSelectedSlot(slotId);
    setCurrentStep(5); // Move to confirmation step
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !bookingData.reason.trim() || !bookingData.abhaId.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    console.log('🔍 Debug - Selected Slot ID:', selectedSlot);
    console.log('🔍 Debug - Booking Data:', bookingData);
    console.log('🔍 Debug - Selected Doctor:', selectedDoctor);

    setIsBooking(true);
    try {
      // Get patient data from localStorage
      const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
      
      // First lock the slot
      console.log(`🔒 Attempting to lock slot: ${selectedSlot}`);
      const lockResponse = await fetch(`/api/appointments/slots/${selectedSlot}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId: localStorage.getItem('abhaId') })
      });

      console.log('🔒 Lock response status:', lockResponse.status);
      
      if (!lockResponse.ok) {
        const lockError = await lockResponse.json();
        console.error('❌ Lock error:', lockError);
        alert(lockError.message || 'Failed to lock slot. Please try again.');
        return;
      }
      
      const lockData = await lockResponse.json();
      console.log('✅ Slot locked successfully:', lockData);

      // Then book the appointment
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abhaId: localStorage.getItem('abhaId'), // Use ABHA ID as primary identifier
          doctorId: selectedDoctor,
          slotId: selectedSlot,
          reasonForVisit: bookingData.reason.trim(),
          patientName: patientData.name || 'RAVI YADAV', // Use actual patient's name
          patientPhone: patientData.phone || '+91-9876543210' // Use actual patient's phone
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Appointment booked successfully!');
        
        // Reset form
        setSelectedSpecialty('');
        setSelectedDoctor('');
        setSelectedSlot('');
        setSelectedDate('');
        setReasonForVisit('');
        setCurrentStep(1);
        setLockedSlots(new Set());
        setShowBookingDialog(false);
        setBookingData({ abhaId: '', reason: '', consultationFee: 0 });
        
        // Reload appointments
        loadUserAppointments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
    setSelectedSlot('');
    setSelectedDate('');
    setReasonForVisit('');
    setCurrentStep(1);
    setLockedSlots(new Set());
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Cancelled by patient' })
        });

        if (response.ok) {
          alert('Appointment cancelled successfully!');
          loadUserAppointments();
          
          // Reload available slots if we're currently viewing slots for the same doctor and date
          if (selectedDoctor && selectedDate) {
            console.log('🔄 Reloading available slots after cancellation...');
            await loadAvailableSlots(selectedDoctor, selectedDate);
          }
        } else {
          alert('Failed to cancel appointment. Please try again.');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Error cancelling appointment. Please try again.');
      }
    }
  };

  const getSpecialtyButtonClass = (specialtyId) => {
    if (selectedSpecialty === specialtyId) return 'specialty-btn selected';
    return 'specialty-btn';
  };

  const getDoctorButtonClass = (doctorId) => {
    if (selectedDoctor === doctorId) return 'doctor-btn selected';
    return 'doctor-btn';
  };


  return (
    <div className="patient-appointment-booking">
      <h2>Book New Appointment</h2>

      {/* Step 1: Specialty Selection */}
      {currentStep === 1 && (
        <div className="booking-step">
          <h3>Select Medical Specialty</h3>
          <div className="specialty-selection">
            {(specialties || []).map(specialty => (
              <button
                key={specialty._id}
                className={getSpecialtyButtonClass(specialty._id)}
                onClick={() => handleSpecialtySelect(specialty._id)}
              >
                {specialty.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Doctor Selection */}
      {currentStep === 2 && (
        <div className="booking-step">
          <h3>Select Doctor</h3>
          <div className="doctor-selection">
            {doctors.map(doctor => (
              <div
                key={doctor._id}
                className={`doctor-card ${selectedDoctor === doctor._id ? 'selected' : ''}`}
                onClick={() => handleDoctorSelect(doctor._id)}
              >
                <h4>Dr. {doctor.name}</h4>
                <p>Specialty: {doctor.specialty.name}</p>
                <p>Consultation Fee: ₹{doctor.consultationFee}</p>
                <p>Experience: {doctor.experience || 'Not specified'}</p>
              </div>
            ))}
          </div>
          <button className="back-btn" onClick={() => setCurrentStep(1)}>
            Back to Specialties
          </button>
        </div>
      )}

      {/* Step 3: Date Selection */}
      {currentStep === 3 && (
        <div className="booking-step">
          <h3>Select Date</h3>
          <div className="date-selection">
            <div className="date-picker">
              <label>Select Date</label>
              <p className="date-instruction">Choose your preferred date:</p>
              <div className="date-input-container">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {selectedDate && (
                <div className="selected-date-display">
                  📅 Selected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              )}
            </div>
            
            <div className="selected-doctor-info">
              <h4>Selected Doctor:</h4>
              <div className="doctor-card">
                <h5>Dr. {doctors.find(d => d._id === selectedDoctor)?.name}</h5>
                <p>Specialty: {specialties.find(s => s._id === selectedSpecialty)?.name}</p>
                <p>Consultation Fee: ₹{doctors.find(d => d._id === selectedDoctor)?.consultationFee}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Time Slot Selection */}
      {currentStep === 4 && (
        <div className="booking-step">
          <h3>Select Time Slot</h3>
          <div className="time-selection">
            <div className="selected-info">
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Doctor:</strong> Dr. {doctors.find(d => d._id === selectedDoctor)?.name}</p>
            </div>
            
            {availableSlots.length > 0 ? (
              <div className="time-slots">
                <h4>Available Time Slots:</h4>
                <div className="time-slots-display">
                  {availableSlots.map(slot => (
                    <div
                      key={slot._id}
                      className={`time-slot-card ${selectedSlot === slot._id ? 'selected' : ''} ${lockedSlots.has(slot._id) ? 'booked' : ''}`}
                      onClick={() => !lockedSlots.has(slot._id) && handleSlotSelect(slot._id)}
                    >
                      <div className="time-slot-time">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="time-slot-duration">
                        {slot.durationMinutes} minutes
                      </div>
                      <div className="time-slot-status">
                        {lockedSlots.has(slot._id) ? 'Locked' : selectedSlot === slot._id ? 'Selected' : 'Available'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDate ? (
              <p className="no-slots">No available slots for the selected date.</p>
            ) : (
              <p className="select-date">Please select a date to view available slots.</p>
            )}
          </div>
          <button className="back-btn" onClick={() => setCurrentStep(2)}>
            Back to Doctors
          </button>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {currentStep === 5 && (
        <div className="booking-step">
          <h3>Confirm Appointment</h3>
          <div className="confirmation-details">
            <div className="detail-row">
              <span>Specialty:</span>
              <span>{specialties.find(s => s._id === selectedSpecialty)?.name}</span>
            </div>
            <div className="detail-row">
              <span>Doctor:</span>
              <span>Dr. {doctors.find(d => d._id === selectedDoctor)?.name}</span>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <span>{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span>Time:</span>
              <span>{availableSlots.find(s => s._id === selectedSlot)?.startTime} - {availableSlots.find(s => s._id === selectedSlot)?.endTime}</span>
            </div>
            <div className="detail-row">
              <span>Consultation Fee:</span>
              <span>₹{doctors.find(d => d._id === selectedDoctor)?.consultationFee}</span>
            </div>
          </div>
          
          <div className="reason-input">
            <label>Reason for Visit:</label>
            <textarea
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Please describe your symptoms or reason for the appointment..."
              rows={4}
              required
            />
          </div>
          
          <div className="confirmation-actions">
            <button
              className="book-btn"
              onClick={() => {
                // Show booking dialog with pre-filled data
                const selectedSlotData = availableSlots.find(slot => slot._id === selectedSlot);
                const selectedDoctorData = doctors.find(doc => doc._id === selectedDoctor);
                
                if (selectedSlotData && selectedDoctorData) {
                  setBookingData({
                    abhaId: localStorage.getItem('abhaId') || '',
                    reason: reasonForVisit,
                    consultationFee: selectedDoctorData.consultationFee || 500
                  });
                  setShowBookingDialog(true);
                }
              }}
              disabled={!reasonForVisit.trim()}
            >
              Confirm Booking
            </button>
            <button className="cancel-btn" onClick={handleCancelBooking}>
              Cancel
            </button>
          </div>
          
          <button className="back-btn" onClick={() => setCurrentStep(4)}>
            Back to Time Slots
          </button>
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      {showBookingDialog && (
        <div className="booking-dialog-overlay">
          <div className="booking-dialog">
            <div className="booking-dialog-header">
              <h3>Confirm Your Appointment</h3>
              <button 
                className="close-dialog-btn"
                onClick={() => setShowBookingDialog(false)}
              >
                ×
              </button>
            </div>
            
            <div className="booking-dialog-content">
              <div className="appointment-summary">
                <h4>Appointment Details</h4>
                <div className="summary-row">
                  <span>Doctor:</span>
                  <span>Dr. {doctors.find(d => d._id === selectedDoctor)?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Specialty:</span>
                  <span>{doctors.find(d => d._id === selectedDoctor)?.specialty?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Time:</span>
                  <span>{availableSlots.find(s => s._id === selectedSlot)?.startTime} - {availableSlots.find(s => s._id === selectedSlot)?.endTime}</span>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <span>{new Date(selectedDate || new Date()).toLocaleDateString()}</span>
                </div>
                <div className="summary-row fee-row">
                  <span>Consultation Fee:</span>
                  <span className="fee-amount">₹{bookingData.consultationFee}</span>
                </div>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label htmlFor="abhaId">ABHA ID *</label>
                  <input
                    type="text"
                    id="abhaId"
                    value={bookingData.abhaId}
                    onChange={(e) => setBookingData({...bookingData, abhaId: e.target.value})}
                    placeholder="Enter your ABHA ID"
                    className="booking-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Visit *</label>
                  <textarea
                    id="reason"
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                    placeholder="Please describe your symptoms or reason for the appointment"
                    className="booking-textarea"
                    rows="4"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="booking-dialog-actions">
              <button 
                className="cancel-booking-btn"
                onClick={() => setShowBookingDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-booking-btn"
                onClick={handleBookAppointment}
                disabled={isBooking || !bookingData.abhaId.trim() || !bookingData.reason.trim()}
              >
                {isBooking ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User's Appointments */}
      <div className="user-appointments">
        <div className="appointments-header">
          <h3>Your Appointments</h3>
          <button 
            className="refresh-btn" 
            onClick={loadUserAppointments}
            disabled={isLoadingAppointments}
          >
            {isLoadingAppointments ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
        {isLoadingAppointments ? (
          <div className="loading-appointments">
            <p>Loading your appointments...</p>
          </div>
        ) : userAppointments && userAppointments.length > 0 ? (
          <div className="appointments-list">
            {userAppointments
              .sort((a, b) => new Date(b.createdAt || b.appointmentDate) - new Date(a.createdAt || a.appointmentDate))
              .slice(0, 6)
              .map(appointment => (
              <div key={appointment._id} className="appointment-card" data-status={appointment.status}>
                {/* Card Header */}
                <div className="appointment-card-header">
                  <h4 className="doctor-name">Dr. {appointment.doctor?.name || 'Unknown Doctor'}</h4>
                  <p className="specialty-name">{appointment.specialty?.name || 'Unknown Specialty'}</p>
                  <p className="appointment-datetime">
                    {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                  </p>
                </div>

                {/* Card Body */}
                <div className="appointment-card-body">
                  <div className="appointment-info">
                    {/* Reason Section */}
                    {appointment.reasonForVisit && (
                      <div className="appointment-reason">
                        <p className="reason-label">Reason for Visit</p>
                        <p className="reason-text">{appointment.reasonForVisit}</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="appointment-status">
                      <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </div>

                    {/* Meeting ID Display */}
                    {appointment.virtualMeetingLink && (
                      <div className="meeting-id-display">
                        <span className="meeting-id-label">🎥 Meeting ID:</span>
                        <span className="meeting-id-text">
                          {appointment.virtualMeetingLink.split('/').pop()}
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    {appointment.status === 'SCHEDULED' && (
                      <div className="appointment-actions">
                        <button
                          className="cancel-appointment-btn"
                          onClick={() => handleCancelAppointment(appointment._id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}

                    {/* Video Call Button */}
                    <VideoCallButton 
                      appointment={appointment}
                      userType="patient"
                      onCallStart={(appointmentId, meetingLink) => {
                        console.log('Patient started call for appointment:', appointmentId);
                        // Optionally update appointment status
                      }}
                      onCallEnd={(appointmentId) => {
                        console.log('Patient ended call for appointment:', appointmentId);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-appointments">No appointments scheduled.</p>
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentBooking;
