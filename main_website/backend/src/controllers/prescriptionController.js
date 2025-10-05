import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

export const createPrescription = async (req, res) => {
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
      issuedDate,
      doctor,
      hospitalClinic,
      diagnosis,
      medications,
      instructions,
      totalAmount,
      insuranceCovered,
      insuranceAmount
    } = req.body;

    const adminId = req.userId;

    // Find patient by ABHA ID
    const patient = await User.findOne({ abhaId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with this ABHA ID'
      });
    }

    const prescriptionData = {
      patientId: patient._id,
      abhaId,
      issuedDate: new Date(issuedDate),
      doctor,
      hospitalClinic,
      diagnosis,
      medications,
      instructions: instructions || {},
      totalAmount: totalAmount || 0,
      insuranceCovered: insuranceCovered || false,
      insuranceAmount: insuranceAmount || 0,
      patientAmount: (totalAmount || 0) - (insuranceAmount || 0),
      createdBy: adminId
    };

    const newPrescription = new Prescription(prescriptionData);
    await newPrescription.save();

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        prescription: newPrescription,
        patient: {
          id: patient._id,
          name: patient.name,
          abhaId: patient.abhaId
        }
      }
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Find patient by ABHA ID
    const patient = await User.findOne({ abhaId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with this ABHA ID'
      });
    }

    // Build query
    const query = { 
      patientId: patient._id
    };
    
    if (status) {
      query.status = status;
    }

    // Get prescriptions with pagination
    const prescriptions = await Prescription.find(query)
      .populate('createdBy', 'name email')
      .sort({ issuedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Prescriptions retrieved successfully',
      data: {
        prescriptions,
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
    console.error('Error getting prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status, pharmacy, fulfillmentDate } = req.body;
    const adminId = req.userId;

    const updateData = {
      status,
      updatedBy: adminId
    };

    if (status === 'fulfilled') {
      updateData.fulfillmentDate = new Date(fulfillmentDate || Date.now());
      if (pharmacy) {
        updateData.pharmacy = pharmacy;
      }
    }

    const prescription = await Prescription.findOneAndUpdate(
      { prescriptionId, patientId: req.patientId },
      updateData,
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription status updated successfully',
      data: { prescription }
    });

  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({ prescriptionId })
      .populate('patientId', 'name abhaId email phone')
      .populate('createdBy', 'name email');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription retrieved successfully',
      data: { prescription }
    });

  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
