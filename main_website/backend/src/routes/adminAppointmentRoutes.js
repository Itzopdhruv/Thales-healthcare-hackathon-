import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/adminAppointmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// All admin routes require authentication and admin role
// Temporarily disabled for testing
// router.use(authenticateToken);
// router.use(requireAdmin);

// Specialty management
router.get('/specialties', getSpecialties);
router.post('/specialties', createSpecialty);
router.put('/specialties/:id', updateSpecialty);
router.delete('/specialties/:id', deleteSpecialty);

// Doctor management
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.post('/doctors/cleanup', cleanupOrphanedDoctors);

// Slot cleanup
router.post('/slots/cleanup', cleanupOrphanedSlots);
router.post('/slots/cleanup-booked', cleanupBookedSlots);

// Doctor slots management
router.get('/doctors/:doctorId/slots', getDoctorSlots);
router.post('/doctors/:doctorId/slots', createAvailabilitySlot);
router.post('/doctors/:doctorId/slots/bulk', bulkCreateSlots);

// Slot management
router.put('/slots/:slotId/availability', updateSlotAvailability);
router.delete('/slots/:slotId', deleteAvailabilitySlot);

// Appointment management
router.get('/appointments', getAllAppointments);
router.put('/appointments/:appointmentId/status', updateAppointmentStatus);
router.post('/appointments/:appointmentId/meeting-link', generateMeetingLink);

export default router;
