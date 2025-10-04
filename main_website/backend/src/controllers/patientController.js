import User from '../models/User.js';
import HealthRecord from '../models/HealthRecord.js';
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
  const existingUser = await User.findOne({ abhaId });
  return !!existingUser;
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
      address = {}
    } = req.body;

    // Validate required fields
    if (!fullName || !age || !gender || !dateOfBirth || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, age, gender, dateOfBirth, phoneNumber are required'
      });
    }

    // Generate unique ABHA ID
    const abhaId = await generateUniqueABHAId();

    // Create username from name (replace spaces with underscores and make lowercase)
    const username = fullName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);

    // Generate email if not provided
    const userEmail = email || `${username}@aayulink.com`;

    // Create user record
    const userData = {
      username,
      name: fullName,
      email: userEmail,
      phone: phoneNumber,
      abhaId,
      password: await bcrypt.hash('temp_password_123', 10), // Temporary password
      role: 'patient',
      isActive: true,
      profile: {
        dateOfBirth: new Date(dateOfBirth),
        gender: gender.toLowerCase(),
        address: {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          country: address.country || 'India'
        },
        emergencyContact: {
          name: emergencyContact ? emergencyContact.split(' ')[0] : 'Not provided',
          phone: emergencyContact ? emergencyContact.split(' ').slice(1).join(' ') : '',
          relationship: 'Emergency Contact'
        }
      },
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    };

    // Save user to database
    console.log('Creating user with data:', JSON.stringify(userData, null, 2));
    const newUser = new User(userData);
    console.log('User object created, saving to database...');
    await newUser.save();
    console.log('User saved successfully with ID:', newUser._id);

    // Create initial health record with patient information
    const healthRecordData = {
      patientId: newUser._id,
      abhaId,
      recordType: 'other',
      title: 'Initial Patient Profile',
      description: 'Patient profile created with ABHA ID',
      date: new Date(),
      diagnosis: {
        primary: medicalConditions || 'No known conditions',
        secondary: [],
        icd10Codes: []
      },
      medications: medications ? [{
        name: medications,
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        prescribedBy: 'System'
      }] : [],
      symptoms: [],
      treatment: {
        procedure: 'Initial Assessment',
        notes: `Patient profile created. Allergies: ${allergies || 'None reported'}`,
        followUp: null
      },
      source: {
        type: 'manual',
        facilityId: 'AayuLink',
        facilityName: 'AayuLink Healthcare Platform',
        importedAt: new Date()
      },
      aiSummary: {
        generated: false,
        summary: '',
        keyPoints: [],
        riskFactors: [],
        recommendations: [],
        generatedAt: null,
        model: ''
      },
      privacy: {
        isPublic: false,
        sharedWith: [],
        consentGiven: true,
        consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      tags: ['initial_profile', 'abha_created'],
      isActive: true
    };

    const newHealthRecord = new HealthRecord(healthRecordData);
    // Temporarily comment out health record creation to isolate issues
    // await newHealthRecord.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Patient record created successfully with ABHA ID',
      data: {
        patientId: newUser._id,
        abhaId,
        name: fullName,
        email: userEmail,
        phone: phoneNumber,
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
        createdAt: newUser.createdAt
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

    const patient = await User.findOne({ abhaId, role: 'patient' })
      .select('-password -__v')
      .populate('profile');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found with this ABHA ID'
      });
    }

    // Get health records for this patient
    const healthRecords = await HealthRecord.find({ abhaId })
      .select('-__v')
      .sort({ date: -1 })
      .limit(10); // Get last 10 records

    res.status(200).json({
      success: true,
      message: 'Patient found successfully',
      data: {
        patient: {
          id: patient._id,
          abhaId: patient.abhaId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          role: patient.role,
          isActive: patient.isActive,
          profile: patient.profile,
          createdAt: patient.createdAt,
          lastLogin: patient.lastLogin
        },
        healthRecords: healthRecords.map(record => ({
          id: record._id,
          recordType: record.recordType,
          title: record.title,
          date: record.date,
          doctor: record.doctor,
          diagnosis: record.diagnosis,
          medications: record.medications,
          symptoms: record.symptoms
        }))
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
