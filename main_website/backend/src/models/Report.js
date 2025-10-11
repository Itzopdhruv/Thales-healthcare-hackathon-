import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  // Patient identification
  abhaId: {
    type: String,
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  // Document information
  documentType: {
    type: String,
    required: true,
    enum: ['prescription', 'lab_report', 'scan_report', 'discharge_summary', 'other'],
    default: 'other'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // File information
  originalFileName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },

  // OCR/Scan results
  ocrData: {
    extractedText: String,
    structuredData: {
      patientName: String,
      doctorName: String,
      clinicName: String,
      date: Date,
      medicines: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String
      }],
      diagnosis: String,
      symptoms: [String],
      vitalSigns: {
        bloodPressure: String,
        temperature: String,
        heartRate: String,
        weight: String,
        height: String
      },
      labValues: [{
        testName: String,
        value: String,
        unit: String,
        normalRange: String,
        status: {
          type: String,
          enum: ['normal', 'high', 'low', 'critical'],
          default: 'normal'
        }
      }]
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    errorMessage: String
  },

  // Medical information extracted
  medicalData: {
    diagnosis: {
      primary: String,
      secondary: [String],
      icd10Codes: [String]
    },
    treatment: {
      medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
      }],
      procedures: [String],
      followUp: {
        required: Boolean,
        date: Date,
        instructions: String
      }
    },
    vitalSigns: {
      bloodPressure: String,
      temperature: String,
      heartRate: String,
      respiratoryRate: String,
      oxygenSaturation: String,
      weight: String,
      height: String,
      bmi: String
    },
    labResults: [{
      testName: String,
      value: String,
      unit: String,
      normalRange: String,
      status: {
        type: String,
        enum: ['normal', 'high', 'low', 'critical'],
        default: 'normal'
      },
      referenceLab: String,
      testDate: Date
    }]
  },

  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },

  // Privacy and access control
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Tags and categorization
  tags: [String],
  category: {
    type: String,
    enum: ['diagnostic', 'prescription', 'treatment', 'follow_up', 'emergency', 'routine'],
    default: 'diagnostic'
  },

  // Status and validation
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,

  // AI analysis
  aiAnalysis: {
    summary: String,
    keyFindings: [String],
    recommendations: [String],
    riskFactors: [String],
    generatedAt: Date,
    model: String,
    confidence: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ReportSchema.index({ abhaId: 1, uploadedAt: -1 });
ReportSchema.index({ patientId: 1, documentType: 1 });
ReportSchema.index({ uploadedBy: 1 });
ReportSchema.index({ 'ocrData.processingStatus': 1 });
ReportSchema.index({ tags: 1 });
ReportSchema.index({ category: 1 });

// Pre-save middleware
ReportSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual for file URL
ReportSchema.virtual('fileUrl').get(function() {
  return `/api/reports/file/${this._id}`;
});

// Method to get formatted file size
ReportSchema.methods.getFormattedFileSize = function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Method to check if user can access this report
ReportSchema.methods.canAccess = function(userId) {
  if (!userId) return false;
  
  // Owner can always access
  if (this.uploadedBy && this.uploadedBy.toString() === userId.toString()) return true;
  
  // The patient whose report this is can access (by patientId)
  if (this.patientId && this.patientId.toString() === userId.toString()) return true;
  
  // If uploadedBy is null but we have a patientId, allow access if user is the patient
  // This handles cases where reports were uploaded without proper authentication
  if (!this.uploadedBy && this.patientId && this.patientId.toString() === userId.toString()) return true;
  
  // Check if shared with user
  if (this.sharedWith && Array.isArray(this.sharedWith)) {
    const sharedWithUser = this.sharedWith.find(share => 
      share.userId && share.userId.toString() === userId.toString()
    );
    if (sharedWithUser) return true;
  }
  
  // Public reports can be accessed by anyone
  if (this.visibility === 'public') return true;
  
  return false;
};

// Method to check if user can access this report by ABHA ID (for patient tokens)
ReportSchema.methods.canAccessByAbhaId = function(abhaId) {
  if (!abhaId) return false;
  
  // If the report's ABHA ID matches the user's ABHA ID, allow access
  if (this.abhaId === abhaId) return true;
  
  // Public reports can be accessed by anyone
  if (this.visibility === 'public') return true;
  
  return false;
};

export default mongoose.model('Report', ReportSchema);
