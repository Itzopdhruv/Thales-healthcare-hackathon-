import User from '../models/User.js';
import Patient from '../models/Patient.js';
import bcrypt from 'bcryptjs';

/**
 * Generate a unique ABHA ID in the format XX-XX-XX-XX (12 digits)
 * @returns {string} Generated ABHA ID
 */
const generateABHAId = () => {
  // Generate 12 random digits
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  
  // Format as XX-XX-XX-XX
  const formatted = [
    digits.slice(0, 2).join(''),
    digits.slice(2, 4).join(''),
    digits.slice(4, 6).join(''),
    digits.slice(6, 8).join('')
  ].join('-');
  
  return formatted;
};

/**
 * Check if ABHA ID already exists in the database
 * @param {string} abhaId - ABHA ID to check
 * @returns {boolean} True if exists, false otherwise
 */
const checkABHAIdExists = async (abhaId) => {
  const existingPatient = await Patient.findOne({ abhaId });
  return !!existingPatient;
};

/**
 * Generate a unique ABHA ID that doesn't exist in the database
 * @returns {Promise<string>} Unique ABHA ID
 */
const generateUniqueABHAId = async () => {
  let abhaId;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    abhaId = generateABHAId();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique ABHA ID after multiple attempts');
    }
  } while (await checkABHAIdExists(abhaId));
  
  return abhaId;
};

/**
 * Create a new patient record with ABHA ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createPatientWithABHA = async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const {
      fullName,
      age,
      gender,
      dateOfBirth,
      bloodType,
      phoneNumber,
      emergencyContact,
      allergies,
      medicalConditions,
      medications,
      email,
      abhaId: providedAbhaId,
      address = {}
    } = req.body;

    // Validate required fields
    if (!fullName || !age || !gender || !dateOfBirth || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, age, gender, dateOfBirth, phoneNumber are required'
      });
    }

    // Use provided ABHA ID or generate a new one
    let abhaId;
    if (providedAbhaId) {
      // Check if the provided ABHA ID already exists
      if (await checkABHAIdExists(providedAbhaId)) {
        return res.status(400).json({
          success: false,
          error: 'ABHA ID already exists. Please generate a new one or use a different ID.'
        });
      }
      abhaId = providedAbhaId;
    } else {
      // Generate unique ABHA ID if none provided
      abhaId = await generateUniqueABHAId();
    }

    // Create Patient record in Patient collection (used for OTP login)
    const normalizePhone = (p) => (p || '').toString().replace(/\D/g, '');
    const patientData = {
      name: fullName.trim(),
      phone: normalizePhone(phoneNumber) || phoneNumber,
      abhaId,
      age: parseInt(age),
      gender: (gender || '').toLowerCase(),
      bloodType: bloodType || undefined
    };
    console.log('Creating Patient with data:', JSON.stringify(patientData, null, 2));
    const newPatient = await Patient.create(patientData);
    console.log('Patient saved successfully with ID:', newPatient._id);

    // Health record functionality removed - using MedicalHistory and Prescription models instead

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Patient record created successfully with ABHA ID',
      data: {
        patientId: newPatient._id,
        abhaId,
        name: fullName,
        phone: patientData.phone,
        age,
        gender,
        bloodType: bloodType || 'Not specified',
        dateOfBirth,
        emergencyContact: {
          name: emergencyContact ? emergencyContact.split(' ')[0] : 'Not provided',
          phone: emergencyContact ? emergencyContact.split(' ').slice(1).join(' ') : '',
          relationship: 'Emergency Contact'
        },
        allergies: allergies || 'None reported',
        medicalConditions: medicalConditions || 'None reported',
        medications: medications || 'None reported',
        createdAt: newPatient.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating patient with ABHA ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating patient record',
      details: error.message
    });
  }
};

/**
 * Generate ABHA ID only (without creating patient record)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateABHAIdOnly = async (req, res) => {
  try {
    const abhaId = await generateUniqueABHAId();
    
    res.status(200).json({
      success: true,
      message: 'ABHA ID generated successfully',
      data: {
        abhaId,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating ABHA ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ABHA ID',
      details: error.message
    });
  }
};

/**
 * Get patient by ABHA ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPatientByABHAId = async (req, res) => {
  try {
    const { abhaId } = req.params;

    if (!abhaId) {
      return res.status(400).json({
        success: false,
        error: 'ABHA ID is required'
      });
    }

    const patient = await Patient.findOne({ abhaId })
      .select('-__v');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found with this ABHA ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient found successfully',
      data: {
        patient: {
          id: patient._id,
          abhaId: patient.abhaId,
          name: patient.name,
          phone: patient.phone,
          age: patient.age ?? null,
          gender: patient.gender ?? null,
          bloodType: patient.bloodType ?? null,
          currentMedications: patient.currentMedications || [],
          createdAt: patient.createdAt,
          lastLogin: patient.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Error fetching patient by ABHA ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching patient',
      details: error.message
    });
  }
};

/**
 * Update patient record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePatientRecord = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const updateData = req.body;

    if (!abhaId) {
      return res.status(400).json({
        success: false,
        error: 'ABHA ID is required'
      });
    }

    const patient = await User.findOneAndUpdate(
      { abhaId, role: 'patient' },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found with this ABHA ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient record updated successfully',
      data: {
        patient: {
          id: patient._id,
          abhaId: patient.abhaId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          profile: patient.profile,
          updatedAt: patient.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating patient record:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating patient record',
      details: error.message
    });
  }
};

// Patch-only demographics update for Patient collection
export const updatePatientDemographics = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { age, gender, bloodType } = req.body;

    if (!abhaId) {
      return res.status(400).json({ success: false, error: 'ABHA ID is required' });
    }

    const patch = {};
    if (typeof age !== 'undefined') patch.age = parseInt(age);
    if (typeof gender !== 'undefined') patch.gender = (gender || '').toLowerCase();
    if (typeof bloodType !== 'undefined') patch.bloodType = bloodType;

    const updated = await Patient.findOneAndUpdate(
      { abhaId },
      { $set: patch },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, message: 'Demographics updated', data: { patient: updated } });
  } catch (error) {
    console.error('Error updating demographics:', error);
    res.status(500).json({ success: false, error: 'Failed to update demographics', details: error.message });
  }
};
