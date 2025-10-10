import express from 'express';
const router = express.Router();
import {
  getSpecialties,
  getDoctorsBySpecialty,
  getDoctorSlots,
  lockSlot,
  bookAppointment,
  getPatientAppointments,
  getPatientAppointmentsByAbha,
  cancelAppointment,
  markAppointmentAsServiced
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

// Public routes
router.get('/specialties', getSpecialties);

// Protected routes (temporarily disabled authentication for testing)
router.get('/doctors/specialty/:specialtyId', getDoctorsBySpecialty);
router.get('/doctors/:doctorId/slots', getDoctorSlots);
router.post('/slots/:slotId/lock', lockSlot);
router.post('/book', bookAppointment);
router.get('/patient/:patientId', getPatientAppointments);
router.get('/patient/abha/:abhaId', getPatientAppointmentsByAbha);
router.put('/:appointmentId/cancel', cancelAppointment);
router.put('/:appointmentId/serviced', markAppointmentAsServiced);

export default router;
