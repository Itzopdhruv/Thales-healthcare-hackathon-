import User from '../models/User.js';
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
        age: parseInt(age),
        gender: gender.toLowerCase(),
        bloodType: bloodType || 'Not specified',
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
        },
        // Critical health information
        allergies: allergies ? [allergies] : [],
        medicalConditions: medicalConditions ? [medicalConditions] : [],
        currentMedications: medications ? [{
          name: medications,
          dosage: '',
          frequency: '',
          prescribedBy: 'System',
          startDate: new Date()
        }] : [],
        // Medical history
        medicalHistory: {
          surgeries: [],
          hospitalizations: [],
          vaccinations: []
        },
        preferredLanguage: 'en'
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

    // Health record functionality removed - using MedicalHistory and Prescription models instead

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
