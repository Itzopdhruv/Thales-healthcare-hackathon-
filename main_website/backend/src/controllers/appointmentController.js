import { Specialty, Doctor, DoctorAvailabilitySlot, Appointment } from '../models/AppointmentModels.js';
import Patient from '../models/Patient.js';

// Get all specialties
const getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find({ isActive: true }).select('name description');
    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching specialties',
      error: error.message
    });
  }
};

// Get doctors by specialty
const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;
    const { date } = req.query;

    const doctors = await Doctor.find({ 
      specialty: specialtyId, 
      isActive: true 
    }).populate('specialty', 'name');

    // If date is provided, also get available slots
    let doctorsWithSlots = doctors;
    if (date) {
      doctorsWithSlots = await Promise.all(
        doctors.map(async (doctor) => {
          const availableSlots = await DoctorAvailabilitySlot.find({
            doctor: doctor._id,
            specialty: specialtyId,
            date: new Date(date),
            isAvailable: true,
            isBooked: false,
            $or: [
              { 'bookingLock.isActive': false },
              { 'bookingLock.expiresAt': { $lt: new Date() } }
            ]
          }).select('startTime endTime durationMinutes');

          return {
            ...doctor.toObject(),
            availableSlots
          };
        })
      );
    }

    res.json({
      success: true,
      data: doctorsWithSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// Get available slots for a doctor
const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Convert date string to start and end of day for proper comparison
    // Use UTC to avoid timezone issues
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const slots = await DoctorAvailabilitySlot.find({
      doctor: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      isAvailable: true,
      isBooked: false,
      $or: [
        { 'bookingLock.isActive': false },
        { 'bookingLock.expiresAt': { $lt: new Date() } }
      ]
    }).select('startTime endTime durationMinutes _id isBooked isAvailable bookingLock');

    console.log('📅 Available slots for doctor:', {
      doctorId,
      date,
      slotsFound: slots.length,
      slots: slots.map(s => ({
        id: s._id,
        time: `${s.startTime}-${s.endTime}`,
        isBooked: s.isBooked,
        isAvailable: s.isAvailable,
        lockActive: s.bookingLock?.isActive
      }))
    });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor slots',
      error: error.message
    });
  }
};

// Lock a slot for booking (prevent duplicate bookings)
const lockSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { abhaId } = req.body;

    console.log('🔒 Locking slot:', slotId, 'for ABHA ID:', abhaId);

    // Check if slot is still available
    const slot = await DoctorAvailabilitySlot.findById(slotId);
    console.log('📋 Slot found:', slot ? 'Yes' : 'No');
    if (slot) {
      console.log('📊 Slot details:', {
        isBooked: slot.isBooked,
        isAvailable: slot.isAvailable,
        bookingLock: slot.bookingLock
      });
    }
    
    if (!slot) {
      console.log('❌ Slot not found');
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }
    
    if (slot.isBooked) {
      console.log('❌ Slot already booked');
      return res.status(409).json({
        success: false,
        message: 'Slot is already booked'
      });
    }
    
    if (slot.isAvailable === false) {
      console.log('❌ Slot not available');
      return res.status(409).json({
        success: false,
        message: 'Slot is not available'
      });
    }

    // Check if slot is already locked
    if (slot.bookingLock.isActive && slot.bookingLock.expiresAt > new Date()) {
      return res.status(409).json({
        success: false,
        message: 'Slot is currently being booked by another user'
      });
    }

    // Lock the slot for 15 minutes
    const lockExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    
    slot.bookingLock = {
      abhaId,
      lockedAt: new Date(),
      expiresAt: lockExpiry,
      isActive: true
    };

    await slot.save();

    res.json({
      success: true,
      message: 'Slot locked successfully',
      lockExpiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error locking slot',
      error: error.message
    });
  }
};

// Book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { abhaId, doctorId, slotId, reasonForVisit, patientName, patientPhone } = req.body;
    
    console.log('📅 Booking appointment with data:', {
      abhaId,
      doctorId,
      slotId,
      reasonForVisit,
      patientName,
      patientPhone
    });

    // Verify slot is still available and locked by this patient
    const slot = await DoctorAvailabilitySlot.findById(slotId);
    console.log('📋 Slot found:', slot ? 'Yes' : 'No');
    if (slot) {
      console.log('📊 Slot details:', {
        isBooked: slot.isBooked,
        isAvailable: slot.isAvailable,
        bookingLock: slot.bookingLock
      });
    }
    
    if (!slot || slot.isBooked || slot.isAvailable === false) {
      console.log('❌ Slot not available for booking - blocking');
      return res.status(500).json({
        success: false,
        message: 'Slot is no longer available'
      });
    }

    if (!slot.bookingLock.isActive || 
        slot.bookingLock.abhaId !== abhaId ||
        slot.bookingLock.expiresAt < new Date()) {
      return res.status(409).json({
        success: false,
        message: 'Slot lock has expired or is not valid'
      });
    }

    // Find or create patient
    let patient;
    
    // Find patient by ABHA ID
    if (abhaId) {
      patient = await Patient.findOne({ abhaId: abhaId });
    }
    
    // If still not found, create new patient
    if (!patient) {
      patient = new Patient({
        name: patientName || 'John Doe',
        phone: patientPhone || '1234567890',
        abhaId: abhaId || '34-68-64-07',
        age: 30,
        gender: 'male'
      });
      await patient.save();
      console.log('✅ Created new patient:', patient.name);
    } else {
      console.log('✅ Found existing patient:', patient.name);
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctorId,
      slot: slotId,
      specialty: slot.specialty,
      appointmentDate: slot.date,
      appointmentTime: slot.startTime,
      reasonForVisit,
      abhaId,
      status: 'SCHEDULED',
      virtualMeetingLink: slot.jitsiMeetingId ? `https://meet.jit.si/${slot.jitsiMeetingId}` : ''
    });

    console.log('🔗 Appointment meeting link set to:', appointment.virtualMeetingLink);
    console.log('📋 Slot Jitsi ID:', slot.jitsiMeetingId);

    await appointment.save();

    // Mark slot as booked
    slot.isBooked = true;
    slot.bookingLock.isActive = false;
    await slot.save();

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name phone abhaId')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('❌ Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
};

// Get patient's appointments
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    let query = { patient: patientId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name phone abhaId')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name')
      .sort({ appointmentDate: -1, appointmentTime: -1, createdAt: -1 })
      .limit(20); // Limit to 20 most recent appointments

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// Get patient appointments by ABHA ID
const getPatientAppointmentsByAbha = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { status } = req.query;

    console.log('🔍 Fetching appointments for ABHA ID:', abhaId);

    // First find the patient by ABHA ID
    const patient = await Patient.findOne({ abhaId: abhaId });
    if (!patient) {
      console.log('❌ No patient found with ABHA ID:', abhaId);
      return res.json({
        success: true,
        data: [] // Return empty array if no patient found
      });
    }

    console.log('✅ Found patient:', patient.name, 'with ID:', patient._id);

    let query = { patient: patient._id };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name phone abhaId')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name')
      .sort({ appointmentDate: -1, appointmentTime: -1, createdAt: -1 })
      .limit(20); // Limit to 20 most recent appointments

    console.log('📅 Found appointments:', appointments.length);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments by ABHA ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Update appointment status
    appointment.status = 'CANCELLED';
    appointment.notes = reason || 'Cancelled by patient';
    await appointment.save();

    // Free up the slot
    const slot = await DoctorAvailabilitySlot.findById(appointment.slot);
    if (slot) {
      console.log('🔄 Freeing up slot after cancellation:', {
        slotId: slot._id,
        wasBooked: slot.isBooked,
        wasLocked: slot.bookingLock.isActive
      });
      
      slot.isBooked = false;
      slot.bookingLock.isActive = false;
      await slot.save();
      
      console.log('✅ Slot freed successfully:', {
        slotId: slot._id,
        isBooked: slot.isBooked,
        isLocked: slot.bookingLock.isActive
      });
    } else {
      console.log('❌ Slot not found for appointment:', appointment.slot);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
};

// Mark appointment as serviced (when meeting ends)
const markAppointmentAsServiced = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'SERVICED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already marked as serviced'
      });
    }

    // Update appointment status to SERVICED
    appointment.status = 'SERVICED';
    appointment.notes = appointment.notes ? 
      `${appointment.notes}\nMeeting completed - appointment serviced` : 
      'Meeting completed - appointment serviced';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment marked as serviced successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
};

export {
  getSpecialties,
  getDoctorsBySpecialty,
  getDoctorSlots,
  lockSlot,
  bookAppointment,
  getPatientAppointments,
  getPatientAppointmentsByAbha,
  cancelAppointment,
  markAppointmentAsServiced
};
