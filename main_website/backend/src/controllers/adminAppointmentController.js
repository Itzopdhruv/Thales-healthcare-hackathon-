import { Specialty, Doctor, DoctorAvailabilitySlot, Appointment } from '../models/AppointmentModels.js';
import Patient from '../models/Patient.js';
import { generateJitsiMeetingId, generateJitsiUrl } from '../utils/jitsiUtils.js';

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

// Update specialty
const updateSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const specialty = await Specialty.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found'
      });
    }

    res.json({
      success: true,
      message: 'Specialty updated successfully',
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
      message: 'Error updating specialty',
      error: error.message
    });
  }
};

// Delete specialty
const deleteSpecialty = async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if any doctors are using this specialty
    const doctorsWithSpecialty = await Doctor.find({ specialty: id });
    
    if (doctorsWithSpecialty.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete specialty. ${doctorsWithSpecialty.length} doctor(s) are currently using this specialty. Please reassign or delete those doctors first.`,
        doctors: doctorsWithSpecialty.map(d => ({ id: d._id, name: d.name }))
      });
    }

    const specialty = await Specialty.findByIdAndDelete(id);

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found'
      });
    }

    res.json({
      success: true,
      message: 'Specialty deleted successfully',
      data: specialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting specialty',
      error: error.message
    });
  }
};

// Get all doctors
const getDoctors = async (req, res) => {
  try {
    // Only get doctors that have a valid specialty (not null)
    const doctors = await Doctor.find({ 
      specialty: { $ne: null, $exists: true } 
    })
      .populate('specialty', 'name description')
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

    let query = { 
      doctor: doctorId,
      isAvailable: true,
      isBooked: false
    };
    
    if (date) {
      // Convert date string to start and end of day for proper comparison
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const slots = await DoctorAvailabilitySlot.find(query)
      .populate('specialty', 'name')
      .select('startTime endTime durationMinutes _id isBooked isAvailable bookingLock jitsiMeetingId')
      .sort({ date: 1, startTime: 1 });

    console.log('📅 Admin fetching slots for doctor:', {
      doctorId,
      date,
      slotsFound: slots.length,
      query,
      slots: slots.map(s => ({
        id: s._id,
        time: `${s.startTime}-${s.endTime}`,
        isBooked: s.isBooked,
        isAvailable: s.isAvailable,
        jitsiId: s.jitsiMeetingId
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

// Create availability slot
const createAvailabilitySlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { specialtyId, date, startTime, endTime, durationMinutes } = req.body;

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

    // Generate Jitsi meeting ID for this slot
    const jitsiMeetingId = generateJitsiMeetingId({
      doctor: doctorId,
      date: new Date(date),
      startTime
    });

    const slot = new DoctorAvailabilitySlot({
      doctor: doctorId,
      specialty: specialtyId,
      date: new Date(date),
      startTime,
      endTime,
      durationMinutes: durationMinutes || 30,
      jitsiMeetingId
    });

    await slot.save();
    await slot.populate('specialty', 'name');

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
      .populate('patient', 'name phone abhaId')
      .populate('doctor', 'name specialty consultationFee')
      .populate('specialty', 'name')
      .sort({ createdAt: -1, appointmentDate: -1, appointmentTime: -1 });

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
    const { status, notes, meetingLink } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (meetingLink) appointment.virtualMeetingLink = meetingLink;
    await appointment.save();

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

// Generate meeting link for appointment (DEPRECATED - Use slot-based system)
const generateMeetingLink = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name abhaId')
      .populate('doctor', 'name specialty')
      .populate('specialty', 'name')
      .populate('slot', 'jitsiMeetingId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Use slot's Jitsi meeting ID if available
    if (appointment.slot && appointment.slot.jitsiMeetingId) {
      const meetingLink = `https://meet.jit.si/${appointment.slot.jitsiMeetingId}`;
      appointment.virtualMeetingLink = meetingLink;
      await appointment.save();

      res.json({
        success: true,
        message: 'Meeting link updated from slot',
        data: {
          appointmentId: appointment._id,
          meetingLink: meetingLink,
          roomName: appointment.slot.jitsiMeetingId,
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No slot or Jitsi meeting ID found for this appointment'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating meeting link',
      error: error.message
    });
  }
};

// Bulk create availability slots
const bulkCreateSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { specialtyId, date, timeSlots } = req.body;

    const slots = [];
    for (const timeSlot of timeSlots) {
      // Generate Jitsi meeting ID for each slot
      const jitsiMeetingId = generateJitsiMeetingId({
        doctor: doctorId,
        date: new Date(date),
        startTime: timeSlot.startTime
      });

      const slot = new DoctorAvailabilitySlot({
        doctor: doctorId,
        specialty: specialtyId,
        date: new Date(date),
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        durationMinutes: timeSlot.durationMinutes || 30,
        jitsiMeetingId
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

// Update doctor
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialty, licenseNumber, consultationFee } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { name, email, phone, specialty, licenseNumber, consultationFee },
      { new: true, runValidators: true }
    ).populate('specialty', 'name');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message
    });
  }
};

// Delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Delete all slots belonging to this doctor
    const deletedSlots = await DoctorAvailabilitySlot.deleteMany({ doctor: id });
    console.log(`🗑️ Deleted ${deletedSlots.deletedCount} slots for doctor ${doctor.name}`);

    // Delete all appointments for this doctor
    const deletedAppointments = await Appointment.deleteMany({ doctor: id });
    console.log(`🗑️ Deleted ${deletedAppointments.deletedCount} appointments for doctor ${doctor.name}`);

    // Finally, delete the doctor
    await Doctor.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Doctor and all associated data deleted successfully',
      data: {
        doctor: doctor.name,
        deletedSlots: deletedSlots.deletedCount,
        deletedAppointments: deletedAppointments.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor',
      error: error.message
    });
  }
};

// Clean up orphaned doctors (doctors without valid specialties)
const cleanupOrphanedDoctors = async (req, res) => {
  try {
    const orphanedDoctors = await Doctor.find({ 
      $or: [
        { specialty: null },
        { specialty: { $exists: false } }
      ]
    });

    if (orphanedDoctors.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned doctors found',
        data: []
      });
    }

    // Delete orphaned doctors
    const deleteResult = await Doctor.deleteMany({ 
      $or: [
        { specialty: null },
        { specialty: { $exists: false } }
      ]
    });

    res.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} orphaned doctors`,
      deletedCount: deleteResult.deletedCount,
      deletedDoctors: orphanedDoctors.map(d => ({ id: d._id, name: d.name }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up orphaned doctors',
      error: error.message
    });
  }
};

// Clean up orphaned slots (slots without valid doctors)
const cleanupOrphanedSlots = async (req, res) => {
  try {
    // Find all slots where the doctor no longer exists
    const allSlots = await DoctorAvailabilitySlot.find().populate('doctor');
    const orphanedSlots = allSlots.filter(slot => !slot.doctor);

    if (orphanedSlots.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned slots found',
        data: []
      });
    }

    // Delete orphaned slots
    const orphanedSlotIds = orphanedSlots.map(slot => slot._id);
    const deleteResult = await DoctorAvailabilitySlot.deleteMany({ 
      _id: { $in: orphanedSlotIds }
    });

    res.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} orphaned slots`,
      deletedCount: deleteResult.deletedCount,
      deletedSlots: orphanedSlots.map(slot => ({ 
        id: slot._id, 
        time: `${slot.startTime}-${slot.endTime}`,
        date: slot.date 
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up orphaned slots',
      error: error.message
    });
  }
};

// Clean up booked slots that are still showing as available
const cleanupBookedSlots = async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of booked slots...');
    
    // Find all slots that are marked as available but have appointments
    const allSlots = await DoctorAvailabilitySlot.find({ 
      isAvailable: true,
      isBooked: false 
    });

    let updatedCount = 0;
    let deletedCount = 0;
    const updatedSlots = [];
    const deletedSlots = [];

    for (const slot of allSlots) {
      // Check if there's an appointment for this slot
      const appointment = await Appointment.findOne({ slot: slot._id });
      
      if (appointment) {
        // Slot has an appointment, mark it as booked
        slot.isBooked = true;
        slot.isAvailable = false;
        await slot.save();
        
        updatedCount++;
        updatedSlots.push({
          id: slot._id,
          time: `${slot.startTime}-${slot.endTime}`,
          date: slot.date,
          appointmentId: appointment._id
        });
        
        console.log(`✅ Updated slot ${slot._id} to booked status`);
      } else {
        // Check if slot is in the past and has no appointments
        const now = new Date();
        const slotDateTime = new Date(slot.date);
        const [hours, minutes] = slot.startTime.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (slotDateTime < now) {
          // Past slot with no appointment, delete it
          await DoctorAvailabilitySlot.findByIdAndDelete(slot._id);
          deletedCount++;
          deletedSlots.push({
            id: slot._id,
            time: `${slot.startTime}-${slot.endTime}`,
            date: slot.date
          });
          
          console.log(`🗑️ Deleted past slot ${slot._id} with no appointment`);
        }
      }
    }

    console.log(`🎉 Cleanup completed! Updated: ${updatedCount}, Deleted: ${deletedCount}`);

    res.json({
      success: true,
      message: `Cleanup completed! Updated ${updatedCount} booked slots, deleted ${deletedCount} past slots`,
      updatedCount,
      deletedCount,
      updatedSlots,
      deletedSlots
    });
  } catch (error) {
    console.error('❌ Error in cleanupBookedSlots:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up booked slots',
      error: error.message
    });
  }
};

export {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  cleanupOrphanedDoctors,
  cleanupOrphanedSlots,
  cleanupBookedSlots,
  getDoctorSlots,
  createAvailabilitySlot,
  updateSlotAvailability,
  deleteAvailabilitySlot,
  getAllAppointments,
  updateAppointmentStatus,
  generateMeetingLink,
  bulkCreateSlots
};
