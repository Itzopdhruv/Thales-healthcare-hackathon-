import React, { useState, useEffect } from 'react';
import './PatientAppointmentBooking.css';

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

  // Booking flow states
  const [currentStep, setCurrentStep] = useState(1); // 1: Specialty, 2: Doctor, 3: Date/Time, 4: Confirmation
  const [bookingData, setBookingData] = useState({});

  useEffect(() => {
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
      setSpecialties(data.data);
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
      const patientId = localStorage.getItem('patientId'); // Assuming patient ID is stored
      if (patientId) {
        const response = await fetch(`/api/appointments/patient/${patientId}`);
        const data = await response.json();
        setUserAppointments(data.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleSpecialtySelect = (specialtyId) => {
    setSelectedSpecialty(specialtyId);
    setSelectedDoctor('');
    setSelectedSlot('');
    setCurrentStep(2);
  };

  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot('');
    setCurrentStep(3);
  };

  const handleSlotSelect = async (slotId) => {
    if (lockedSlots.has(slotId)) {
      alert('This slot is currently being booked by another user. Please try another slot.');
      return;
    }

    setSelectedSlot(slotId);
    
    // Lock the slot to prevent duplicate bookings
    try {
      const response = await fetch(`/api/appointments/slots/${slotId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: localStorage.getItem('patientId') })
      });

      if (response.ok) {
        setLockedSlots(prev => new Set([...prev, slotId]));
        setCurrentStep(4);
      } else {
        alert('Failed to lock slot. Please try again.');
      }
    } catch (error) {
      console.error('Error locking slot:', error);
      alert('Error locking slot. Please try again.');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !reasonForVisit.trim()) {
      alert('Please select a slot and provide reason for visit.');
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: localStorage.getItem('patientId'),
          doctorId: selectedDoctor,
          slotId: selectedSlot,
          reasonForVisit: reasonForVisit.trim()
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

  const getSlotButtonClass = (slotId) => {
    if (selectedSlot === slotId) return 'slot-btn selected';
    if (lockedSlots.has(slotId)) return 'slot-btn locked';
    return 'slot-btn';
  };

  return (
    <div className="patient-appointment-booking">
      <h2>Book New Appointment</h2>

      {/* Step 1: Specialty Selection */}
      {currentStep === 1 && (
        <div className="booking-step">
          <h3>Select Medical Specialty</h3>
          <div className="specialty-selection">
            {specialties.map(specialty => (
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
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-info">
                  <h4>Dr. {doctor.name}</h4>
                  <p>{doctor.specialty.name}</p>
                  <p>Consultation Fee: ₹{doctor.consultationFee}</p>
                  {doctor.availableSlots && (
                    <p className="available-slots">
                      {doctor.availableSlots.length} slots available today
                    </p>
                  )}
                </div>
                <button
                  className={getDoctorButtonClass(doctor._id)}
                  onClick={() => handleDoctorSelect(doctor._id)}
                >
                  Select Doctor
                </button>
              </div>
            ))}
          </div>
          <button className="back-btn" onClick={() => setCurrentStep(1)}>
            Back to Specialties
          </button>
        </div>
      )}

      {/* Step 3: Date and Time Selection */}
      {currentStep === 3 && (
        <div className="booking-step">
          <h3>Select Date and Time</h3>
          <div className="date-time-selection">
            <div className="date-picker">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {availableSlots.length > 0 ? (
              <div className="time-slots">
                <h4>Available Time Slots:</h4>
                <div className="slots-grid">
                  {availableSlots.map(slot => (
                    <button
                      key={slot._id}
                      className={getSlotButtonClass(slot._id)}
                      onClick={() => handleSlotSelect(slot._id)}
                      disabled={lockedSlots.has(slot._id)}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
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

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
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
              onClick={handleBookAppointment}
              disabled={isBooking || !reasonForVisit.trim()}
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button className="cancel-btn" onClick={handleCancelBooking}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User's Appointments */}
      <div className="user-appointments">
        <h3>Your Appointments</h3>
        {userAppointments.length > 0 ? (
          <div className="appointments-list">
            {userAppointments.map(appointment => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-info">
                  <h4>Dr. {appointment.doctor.name}</h4>
                  <p>{appointment.specialty.name}</p>
                  <p>{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</p>
                  <p className={`status ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </p>
                  {appointment.reasonForVisit && (
                    <p className="reason">Reason: {appointment.reasonForVisit}</p>
                  )}
                </div>
                {appointment.status === 'SCHEDULED' && (
                  <button
                    className="cancel-appointment-btn"
                    onClick={() => handleCancelAppointment(appointment._id)}
                  >
                    Cancel
                  </button>
                )}
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
