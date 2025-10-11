import Patient from '../models/Patient.js';
import User from '../models/User.js';
import HealthMetrics from '../models/HealthMetrics.js';
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

export const lookupPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Looking up patient with ID:', patientId);

    // Try to find patient by ABHA ID first
    let patient = await Patient.findOne({ abhaId: patientId });
    
    // If not found by ABHA ID, try by MongoDB _id
    if (!patient) {
      patient = await Patient.findById(patientId);
    }

    if (!patient) {
      console.log('Patient not found for ID:', patientId);
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('Patient found:', patient.name, patient.abhaId);

    // Get latest health metrics for this patient
    const latestHealthMetrics = await HealthMetrics.findOne({ abhaId: patient.abhaId })
      .sort({ createdAt: -1 })
      .populate('recordedBy', 'name email');

    // Get health records for this patient (if any)
    const healthRecords = []; // You can implement health records lookup here

    res.status(200).json({
      success: true,
      message: 'Patient lookup successful',
      data: {
        patient: {
          _id: patient._id,
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId,
          phone: patient.phone,
          age: patient.age,
          gender: patient.gender,
          bloodType: patient.bloodType,
          profileImage: patient.profileImage,
          currentMedications: patient.currentMedications || [],
          allergies: patient.allergies || [],
          existingMedicalConditions: patient.existingMedicalConditions || [],
          emergencyContact: patient.emergencyContact,
          isActive: patient.isActive,
          lastLogin: patient.lastLogin,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt
        },
        healthMetrics: latestHealthMetrics ? {
          id: latestHealthMetrics._id,
          bloodPressure: {
            value: `${latestHealthMetrics.bloodPressure.systolic}/${latestHealthMetrics.bloodPressure.diastolic}`,
            systolic: latestHealthMetrics.bloodPressure.systolic,
            diastolic: latestHealthMetrics.bloodPressure.diastolic,
            status: latestHealthMetrics.status.bloodPressure
          },
          heartRate: {
            value: `${latestHealthMetrics.heartRate.value} ${latestHealthMetrics.heartRate.unit}`,
            bpm: latestHealthMetrics.heartRate.value,
            status: latestHealthMetrics.status.heartRate
          },
          bloodSugar: {
            value: `${latestHealthMetrics.bloodSugar.value} ${latestHealthMetrics.bloodSugar.unit}`,
            mgdL: latestHealthMetrics.bloodSugar.value,
            status: latestHealthMetrics.status.bloodSugar
          },
          weight: {
            value: `${latestHealthMetrics.weight.value} ${latestHealthMetrics.weight.unit}`,
            kg: latestHealthMetrics.weight.value,
            status: latestHealthMetrics.status.weight
          },
          recordedBy: latestHealthMetrics.recordedByName,
          recordedAt: latestHealthMetrics.createdAt,
          notes: latestHealthMetrics.notes
        } : null,
        healthRecords: healthRecords
      }
    });

  } catch (error) {
    console.error('Error looking up patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};