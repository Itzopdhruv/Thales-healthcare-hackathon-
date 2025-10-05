import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
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
  recordType: {
    type: String,
    enum: ['prescription', 'lab_report', 'diagnosis', 'treatment', 'vaccination', 'surgery', 'other'],
    required: true
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
  date: {
    type: Date,
    required: true
  },
  doctor: {
    name: String,
    specialization: String,
    licenseNumber: String,
    hospital: String,
    contact: String
  },
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Codes: [String]
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    prescribedBy: String
  }],
  labResults: [{
    testName: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical']
    }
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  symptoms: [String],
  treatment: {
    procedure: String,
    notes: String,
    followUp: Date
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'pdf', 'document']
    },
    url: String,
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  source: {
    type: {
      type: String,
      enum: ['abdm', 'manual', 'imported', 'ai_generated']
    },
    facilityId: String,
    facilityName: String,
    importedAt: Date
  },
  aiSummary: {
    generated: Boolean,
    summary: String,
    keyPoints: [String],
    riskFactors: [String],
    recommendations: [String],
    generatedAt: Date,
    model: String
  },
  privacy: {
    isPublic: { type: Boolean, default: false },
    sharedWith: [{
      doctorId: mongoose.Schema.Types.ObjectId,
      sharedAt: Date,
      expiresAt: Date
    }],
    consentGiven: { type: Boolean, default: true },
    consentExpiry: Date
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
healthRecordSchema.index({ patientId: 1, date: -1 });
healthRecordSchema.index({ abhaId: 1, recordType: 1 });
healthRecordSchema.index({ 'doctor.name': 1 });
healthRecordSchema.index({ 'diagnosis.primary': 1 });
healthRecordSchema.index({ tags: 1 });

export default mongoose.model('HealthRecord', healthRecordSchema);
