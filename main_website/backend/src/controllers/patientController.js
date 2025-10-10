import Patient from '../models/Patient.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { abhaId } = req.body;
    if (!abhaId) {
      return res.status(400).json({
        success: false,
        message: 'ABHA ID is required'
      });
    }

    // Find patient by ABHA ID
    let patient = await Patient.findOne({ abhaId });
    if (!patient) {
      const legacyUser = await User.findOne({ abhaId, role: 'patient' });
      if (!legacyUser) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found with this ABHA ID'
        });
      }
      // Create patient record if doesn't exist
      patient = await Patient.findOneAndUpdate(
        { abhaId: legacyUser.abhaId },
        { 
          name: legacyUser.name, 
          phone: legacyUser.phone || '', 
          abhaId: legacyUser.abhaId, 
          isActive: true 
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    // Delete old profile image if exists
    if (patient.profileImage) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'profiles', path.basename(patient.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update patient with new image path
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    patient.profileImage = imageUrl;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        patient: {
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId
        }
      }
    });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const { abhaId } = req.params;

    const patient = await Patient.findOne({ abhaId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId,
          phone: patient.phone,
          age: patient.age,
          gender: patient.gender,
          bloodType: patient.bloodType,
          profileImage: patient.profileImage,
          currentMedications: patient.currentMedications,
          isActive: patient.isActive,
          lastLogin: patient.lastLogin,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};