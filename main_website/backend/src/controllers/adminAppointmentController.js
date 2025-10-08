import { Specialty, Doctor, DoctorAvailabilitySlot, Appointment } from '../models/AppointmentModels.js';

// Get all specialties for admin
const getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
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

// Create new specialty
const createSpecialty = async (req, res) => {
  try {
    const { name, description } = req.body;

    const specialty = new Specialty({
      name,
      description
    });

    await specialty.save();

    res.status(201).json({
      success: true,
      message: 'Specialty created successfully',
      data: specialty
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Specialty with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating specialty',
      error: error.message
    });
  }
};

// Get all doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('specialty', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// Create new doctor
const createDoctor = async (req, res) => {
  try {
    const { name, email, phone, specialty, licenseNumber, consultationFee } = req.body;

    const doctor = new Doctor({
      name,
      email,
      phone,
      specialty,
      licenseNumber,
      consultationFee
    });

    await doctor.save();
    await doctor.populate('specialty', 'name');

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email or license number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message
    });
  }
};

// Get doctor's availability slots
const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    let query = { doctor: doctorId };
    if (date) {
      query.date = new Date(date);
    }

    const slots = await DoctorAvailabilitySlot.find(query)
      .populate('specialty', 'name')
      .sort({ date: 1, startTime: 1 });

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

// Create availability slot
const createAvailabilitySlot = async (req, res) => {
  try {
    const { doctorId, specialtyId, date, startTime, endTime, durationMinutes } = req.body;

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format'
      });
    }

    // Check for overlapping slots
    const overlappingSlot = await DoctorAvailabilitySlot.findOne({
      doctor: doctorId,
      date: new Date(date),
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (overlappingSlot) {
      return res.status(409).json({
        success: false,
        message: 'Time slot overlaps with existing slot'
      });
    }

    const slot = new DoctorAvailabilitySlot({
      doctor: doctorId,
      specialty: specialtyId,
      date: new Date(date),
      startTime,
      endTime,
      durationMinutes: durationMinutes || 30
    });

    await slot.save();
    await slot.populate('specialty', 'name');

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitSlotCreated(slot, doctorId);
    }

    res.status(201).json({
      success: true,
      message: 'Availability slot created successfully',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating availability slot',
      error: error.message
    });
  }
};

// Update slot availability
const updateSlotAvailability = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { isAvailable } = req.body;

    const slot = await DoctorAvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    if (slot.isBooked && isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Cannot make booked slot available'
      });
    }

    slot.isAvailable = isAvailable;
    await slot.save();

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitSlotAvailabilityChanged(slot._id, isAvailable, slot.doctor);
    }

    res.json({
      success: true,
      message: 'Slot availability updated successfully',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating slot availability',
      error: error.message
    });
  }
};

// Delete availability slot
const deleteAvailabilitySlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await DoctorAvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete booked slot'
      });
    }

    await DoctorAvailabilitySlot.findByIdAndDelete(slotId);

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitSlotDeleted(slotId, slot.doctor);
    }

    res.json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting availability slot',
      error: error.message
    });
  }
};

// Get all appointments for admin
const getAllAppointments = async (req, res) => {
  try {
    const { status, doctorId, specialtyId, date } = req.query;

    let query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (specialtyId) query.specialty = specialtyId;
    if (date) query.appointmentDate = new Date(date);

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

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

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();

    // Emit real-time update
    if (global.webSocketService) {
      global.webSocketService.emitAppointmentStatusUpdated(appointmentId, status, appointment.patient, appointment.doctor);
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
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

// Bulk create availability slots
const bulkCreateSlots = async (req, res) => {
  try {
    const { doctorId, specialtyId, date, timeSlots } = req.body;

    const slots = [];
    for (const timeSlot of timeSlots) {
      const slot = new DoctorAvailabilitySlot({
        doctor: doctorId,
        specialty: specialtyId,
        date: new Date(date),
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        durationMinutes: timeSlot.durationMinutes || 30
      });
      slots.push(slot);
    }

    await DoctorAvailabilitySlot.insertMany(slots);

    res.status(201).json({
      success: true,
      message: `${slots.length} availability slots created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bulk slots',
      error: error.message
    });
  }
};

export {
  getSpecialties,
  createSpecialty,
  getDoctors,
  createDoctor,
  getDoctorSlots,
  createAvailabilitySlot,
  updateSlotAvailability,
  deleteAvailabilitySlot,
  getAllAppointments,
  updateAppointmentStatus,
  bulkCreateSlots
};
