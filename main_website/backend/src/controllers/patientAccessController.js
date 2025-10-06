import User from '../models/User.js';
import PatientAccess from '../models/PatientAccess.js';

/**
 * Request access to patient records (send OTP)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const requestPatientAccess = async (req, res) => {
  try {
    const { abhaId, consentDuration = 24 } = req.body;
    const adminId = req.userId; // From auth middleware

    // Validate input
    if (!abhaId) {
      return res.status(400).json({
        success: false,
        error: 'ABHA ID is required'
      });
    }

    // Find patient by ABHA ID
    const patient = await User.findOne({ abhaId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found with this ABHA ID'
      });
    }

    // Check if there's already an active access request
    const existingAccess = await PatientAccess.findOne({
      patientId: patient._id,
      adminId,
      status: { $in: ['pending', 'granted'] },
      isActive: true
    });

    if (existingAccess) {
      // If access is still valid, return existing access
      if (existingAccess.isAccessValid()) {
        return res.json({
          success: true,
          message: 'Access already granted',
          data: {
            accessId: existingAccess._id,
            expiresAt: existingAccess.accessExpiresAt,
            otp: existingAccess.otp
          }
        });
      } else {
        // Revoke expired access
        existingAccess.revokeAccess();
        await existingAccess.save();
      }
    }

    // Create new access request
    const accessRequest = new PatientAccess({
      patientId: patient._id,
      abhaId: patient.abhaId,
      adminId,
      consentDuration: parseInt(consentDuration),
      accessExpiresAt: new Date(Date.now() + parseInt(consentDuration) * 60 * 60 * 1000), // Convert hours to milliseconds
      accessLog: [{
        action: 'otp_sent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }]
    });

    await accessRequest.save();

    // In a real implementation, you would send OTP via SMS
    // For now, we'll just return the default OTP
    console.log(`OTP for patient ${abhaId}: ${accessRequest.otp}`);

    res.json({
      success: true,
      message: 'OTP sent to patient mobile number',
      data: {
        accessId: accessRequest._id,
        otp: accessRequest.otp, // In production, don't return OTP
        expiresAt: accessRequest.otpExpiresAt,
        consentDuration: accessRequest.consentDuration
      }
    });

  } catch (error) {
    console.error('Error requesting patient access:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Verify OTP and grant access to patient records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyOTPAndGrantAccess = async (req, res) => {
  try {
    const { accessId, otp } = req.body;
    const adminId = req.userId;

    // Validate input
    if (!accessId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Access ID and OTP are required'
      });
    }

    // Find access request
    const accessRequest = await PatientAccess.findOne({
      _id: accessId,
      adminId,
      isActive: true
    });

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        error: 'Access request not found'
      });
    }

    // Check if OTP is expired
    if (new Date() > accessRequest.otpExpiresAt) {
      accessRequest.status = 'expired';
      await accessRequest.save();
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (accessRequest.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Grant access
    accessRequest.grantAccess();
    await accessRequest.save();

    res.json({
      success: true,
      message: 'Access granted successfully',
      data: {
        accessId: accessRequest._id,
        expiresAt: accessRequest.accessExpiresAt,
        patientId: accessRequest.patientId
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Get patient records with access validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const adminId = req.userId;

    // Validate access
    const accessRequest = await PatientAccess.findOne({
      patientId,
      adminId,
      status: 'granted',
      isActive: true
    });

    if (!accessRequest || !accessRequest.isAccessValid()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Please request access with valid OTP.'
      });
    }

    // Get patient details
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Health records functionality removed - using MedicalHistory and Prescription models instead

    // Log access usage
    accessRequest.accessLog.push({
      action: 'access_used',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await accessRequest.save();

    res.json({
      success: true,
      message: 'Patient records retrieved successfully',
      data: {
        patient: {
          id: patient._id,
          abhaId: patient.abhaId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          profile: patient.profile,
          createdAt: patient.createdAt
        },
        accessInfo: {
          grantedAt: accessRequest.accessGrantedAt,
          expiresAt: accessRequest.accessExpiresAt,
          remainingTime: Math.max(0, accessRequest.accessExpiresAt - new Date())
        }
      }
    });

  } catch (error) {
    console.error('Error getting patient records:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Revoke patient access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const revokePatientAccess = async (req, res) => {
  try {
    const { accessId } = req.params;
    const adminId = req.userId;

    const accessRequest = await PatientAccess.findOne({
      _id: accessId,
      adminId,
      isActive: true
    });

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        error: 'Access request not found'
      });
    }

    accessRequest.revokeAccess();
    await accessRequest.save();

    res.json({
      success: true,
      message: 'Patient access revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking patient access:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Get all active access requests for an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveAccessRequests = async (req, res) => {
  try {
    const adminId = req.userId;

    const accessRequests = await PatientAccess.find({
      adminId,
      isActive: true
    })
    .populate('patientId', 'name abhaId phone profile')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Active access requests retrieved successfully',
      data: accessRequests
    });

  } catch (error) {
    console.error('Error getting active access requests:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
