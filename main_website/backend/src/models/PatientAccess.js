import mongoose from 'mongoose';

const patientAccessSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  abhaId: {
    type: String,
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    default: '081106' // Default OTP as requested
  },
  otpGeneratedAt: {
    type: Date,
    default: Date.now
  },
  otpExpiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }
  },
  accessGrantedAt: {
    type: Date
  },
  accessExpiresAt: {
    type: Date,
    required: true
  },
  consentDuration: {
    type: Number, // in hours
    required: true,
    default: 24
  },
  status: {
    type: String,
    enum: ['pending', 'granted', 'expired', 'revoked'],
    default: 'pending'
  },
  accessLog: [{
    action: {
      type: String,
      enum: ['otp_sent', 'otp_verified', 'access_granted', 'access_used', 'access_expired', 'access_revoked']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
patientAccessSchema.index({ patientId: 1, status: 1 });
patientAccessSchema.index({ abhaId: 1, status: 1 });
patientAccessSchema.index({ adminId: 1, status: 1 });
patientAccessSchema.index({ accessExpiresAt: 1 });
patientAccessSchema.index({ otp: 1, otpExpiresAt: 1 });

// Method to check if access is still valid
patientAccessSchema.methods.isAccessValid = function() {
  const now = new Date();
  return this.status === 'granted' && 
         this.accessExpiresAt > now && 
         this.isActive === true;
};

// Method to grant access
patientAccessSchema.methods.grantAccess = function() {
  this.status = 'granted';
  this.accessGrantedAt = new Date();
  this.accessLog.push({
    action: 'access_granted',
    timestamp: new Date()
  });
};

// Method to revoke access
patientAccessSchema.methods.revokeAccess = function() {
  this.status = 'revoked';
  this.isActive = false;
  this.accessLog.push({
    action: 'access_revoked',
    timestamp: new Date()
  });
};

export default mongoose.model('PatientAccess', patientAccessSchema);
