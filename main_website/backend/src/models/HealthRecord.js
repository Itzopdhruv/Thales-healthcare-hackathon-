import mongoose from 'mongoose';

const HealthRecordSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  abhaId: {
    type: String,
    required: true,
    index: true
  },
  reports: [{
    fileName: {
      type: String,
      required: true
    },
    originalName: {
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
    documentType: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active'
    },
    ocrData: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
HealthRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
HealthRecordSchema.index({ patientId: 1, abhaId: 1 });
HealthRecordSchema.index({ 'reports.uploadDate': -1 });

const HealthRecord = mongoose.model('HealthRecord', HealthRecordSchema);

export default HealthRecord;







