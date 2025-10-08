import express from 'express';
const router = express.Router();
import {
  getSpecialties,
  getDoctorsBySpecialty,
  getDoctorSlots,
  lockSlot,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

// Public routes
router.get('/specialties', getSpecialties);

// Protected routes
router.get('/doctors/specialty/:specialtyId', getDoctorsBySpecialty);
router.get('/doctors/:doctorId/slots', getDoctorSlots);
router.post('/slots/:slotId/lock', authenticateToken, lockSlot);
router.post('/book', authenticateToken, bookAppointment);
router.get('/patient/:patientId', authenticateToken, getPatientAppointments);
router.put('/:appointmentId/cancel', authenticateToken, cancelAppointment);

export default router;
