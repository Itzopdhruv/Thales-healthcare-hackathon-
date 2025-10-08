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

    const slots = await DoctorAvailabilitySlot.find({
      doctor: doctorId,
      date: new Date(date),
      isAvailable: true,
      isBooked: false,
      $or: [
        { 'bookingLock.isActive': false },
        { 'bookingLock.expiresAt': { $lt: new Date() } }
      ]
    }).select('startTime endTime durationMinutes');

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
    const { patientId } = req.body;

    // Check if slot is still available
    const slot = await DoctorAvailabilitySlot.findById(slotId);
    if (!slot || slot.isBooked || !slot.isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Slot is no longer available'
      });
    }

    // Check if slot is already locked
    if (slot.bookingLock.isActive && slot.bookingLock.expiresAt > new Date()) {
      return res.status(409).json({
        success: false,
        message: 'Slot is currently being booked by another user'
      });
    }

    // Lock the slot for 5 minutes
    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    slot.bookingLock = {
      patientId,
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
    const { patientId, doctorId, slotId, reasonForVisit } = req.body;

    // Verify slot is still available and locked by this patient
    const slot = await DoctorAvailabilitySlot.findById(slotId);
    if (!slot || slot.isBooked || !slot.isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Slot is no longer available'
      });
    }

    if (!slot.bookingLock.isActive || 
        slot.bookingLock.patientId.toString() !== patientId ||
        slot.bookingLock.expiresAt < new Date()) {
      return res.status(409).json({
        success: false,
        message: 'Slot lock has expired or is not valid'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      slot: slotId,
      specialty: slot.specialty,
      appointmentDate: slot.date,
      appointmentTime: slot.startTime,
      reasonForVisit,
      status: 'SCHEDULED'
    });

    await appointment.save();

    // Mark slot as booked
    slot.isBooked = true;
    slot.bookingLock.isActive = false;
    await slot.save();

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name');

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitAppointmentBooked(populatedAppointment, patientId);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment
    });
  } catch (error) {
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
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

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
      slot.isBooked = false;
      slot.bookingLock.isActive = false;
      await slot.save();
    }

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitAppointmentCancelled(appointmentId, appointment.patient, appointment.doctor);
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

export {
  getSpecialties,
  getDoctorsBySpecialty,
  getDoctorSlots,
  lockSlot,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment
};
