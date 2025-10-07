import MedicalHistory from '../models/MedicalHistory.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { validationResult } from 'express-validator';

export const createMedicalHistoryEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      abhaId,
      entryType,
      date,
      summary,
      consultingDoctor,
      hospitalClinicName,
      diagnosis,
      medications,
      symptoms,
      vitalSigns,
      labResults
    } = req.body;

    const adminId = req.userId;

    // Find patient by ABHA ID (prefer Patient, fallback to legacy User)
    let patient = await Patient.findOne({ abhaId });
    if (!patient) {
      patient = await User.findOne({ abhaId, role: 'patient' });
    }
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with this ABHA ID'
      });
    }

    const medicalHistoryData = {
      patientId: patient._id,
      abhaId,
      entryType,
      date: new Date(date),
      summary,
      consultingDoctor,
      hospitalClinicName,
      diagnosis: diagnosis || {},
      medications: medications || [],
      symptoms: symptoms || [],
      vitalSigns: vitalSigns || {},
      labResults: labResults || [],
      createdBy: adminId
    };

    const newEntry = new MedicalHistory(medicalHistoryData);
    await newEntry.save();

    res.status(201).json({
      success: true,
      message: 'Medical history entry created successfully',
      data: {
        entry: newEntry,
        patient: {
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId
        }
      }
    });

  } catch (error) {
    console.error('Error creating medical history entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getMedicalHistory = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { page = 1, limit = 10, entryType } = req.query;

    // Find patient by ABHA ID (prefer Patient, fallback to legacy User)
    let patient = await Patient.findOne({ abhaId });
    if (!patient) {
      patient = await User.findOne({ abhaId, role: 'patient' });
    }
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with this ABHA ID'
      });
    }

    // Build query
    const query = { 
      patientId: patient._id, 
      status: 'active' 
    };
    
    if (entryType) {
      query.entryType = entryType;
    }

    // Get medical history with pagination
    const entries = await MedicalHistory.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Medical history retrieved successfully',
      data: {
        entries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        patient: {
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId
        }
      }
    });

  } catch (error) {
    console.error('Error getting medical history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateMedicalHistoryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const updateData = req.body;
    const adminId = req.userId;

    const entry = await MedicalHistory.findOneAndUpdate(
      { _id: entryId, status: 'active' },
      { 
        ...updateData,
        updatedBy: adminId
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Medical history entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical history entry updated successfully',
      data: { entry }
    });

  } catch (error) {
    console.error('Error updating medical history entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const deleteMedicalHistoryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const adminId = req.userId;

    const entry = await MedicalHistory.findOneAndUpdate(
      { _id: entryId, status: 'active' },
      { 
        status: 'deleted',
        updatedBy: adminId
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Medical history entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical history entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medical history entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
