import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/adminAppointmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Specialty management
router.get('/specialties', getSpecialties);
router.post('/specialties', createSpecialty);

// Doctor management
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);

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

export default router;
