import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';

const jwt_token = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const generatePatientToken = (patientId) => {
  return jwt.sign({ patientId, type: 'patient' }, jwt_token, { expiresIn: '7d' });
};

const normalizePhone = (phone) => (phone || '').toString().replace(/\D/g, '');

export const requestOtp = async (req, res) => {
  try {
    const { name, phone, abhaId } = req.body;
    console.log('[PatientAuth][requestOtp] payload:', { name, phone, abhaId });
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    // Find patient by abhaId if provided, otherwise by name+phone (case-insensitive, phone normalized)
    let patient = null;
    if (abhaId) {
      patient = await Patient.findOne({ abhaId });
      console.log('[PatientAuth][requestOtp] lookup by abhaId result:', !!patient, patient?._id);
    }
    if (!patient) {
      const phoneNorm = normalizePhone(phone);
      const nameRegex = new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      console.log('[PatientAuth][requestOtp] normalized phone:', phoneNorm);
      patient = await Patient.findOne({ name: nameRegex, phone: { $in: [phone, phoneNorm] } });
      console.log('[PatientAuth][requestOtp] lookup by name+phone result:', !!patient, patient?._id);
      if (!patient) {
        // Try alternative: store phones sometimes without country code or with spaces
        patient = await Patient.findOne({ name: nameRegex });
        console.log('[PatientAuth][requestOtp] fallback lookup by name only result:', !!patient, patient?._id);
      }
    }

    if (!patient) {
      if (!abhaId) {
        console.warn('[PatientAuth][requestOtp] Patient not found for name/phone', { name, phone });
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      patient = await Patient.create({ name: name.trim(), phone: normalizePhone(phone) || phone, abhaId });
      console.log('[PatientAuth][requestOtp] created new patient by abhaId:', patient._id);
    }

    // Dummy OTP for now
    const otp = process.env.DUMMY_PATIENT_OTP || '081106';

    // In real system, send OTP via SMS. For now, just return it for testing.
    res.json({ success: true, message: 'OTP sent', otp, patient: { id: patient._id, name: patient.name, phone: patient.phone, abhaId: patient.abhaId } });
  } catch (error) {
    console.error('Patient requestOtp error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { name, phone, abhaId, otp } = req.body;
    console.log('[PatientAuth][verifyOtp] payload:', { name, phone, abhaId });
    const expectedOtp = process.env.DUMMY_PATIENT_OTP || '081106';
    if (!otp || otp !== expectedOtp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    let patient = null;
    if (abhaId) {
      patient = await Patient.findOne({ abhaId });
      console.log('[PatientAuth][verifyOtp] lookup by abhaId result:', !!patient, patient?._id);
    }
    if (!patient) {
      const phoneNorm = normalizePhone(phone);
      const nameRegex = new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      console.log('[PatientAuth][verifyOtp] normalized phone:', phoneNorm);
      patient = await Patient.findOne({ name: nameRegex, phone: { $in: [phone, phoneNorm] } });
      console.log('[PatientAuth][verifyOtp] lookup by name+phone result:', !!patient, patient?._id);
      if (!patient) {
        patient = await Patient.findOne({ name: nameRegex });
        console.log('[PatientAuth][verifyOtp] fallback lookup by name only result:', !!patient, patient?._id);
      }
    }
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    patient.lastLogin = new Date();
    await patient.save();

    const token = generatePatientToken(patient._id);
    res.json({
      success: true,
      message: 'OTP verified',
      token,
      patient: { id: patient._id, name: patient.name, phone: patient.phone, abhaId: patient.abhaId }
    });
  } catch (error) {
    console.error('Patient verifyOtp error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


