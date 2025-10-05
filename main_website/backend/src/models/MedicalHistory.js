import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  abhaId: {
    type: String,
    required: true,
    trim: true
  },
  entryType: {
    type: String,
    enum: ['consultation', 'prescription', 'lab_test', 'scan', 'surgery', 'vaccination', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  consultingDoctor: {
    type: String,
    required: true,
    trim: true
  },
  hospitalClinicName: {
    type: String,
    required: true,
    trim: true
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
  symptoms: [String],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number
  },
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    unit: String,
    date: Date
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
medicalHistorySchema.index({ patientId: 1, date: -1 });
medicalHistorySchema.index({ abhaId: 1, date: -1 });
medicalHistorySchema.index({ entryType: 1, date: -1 });
medicalHistorySchema.index({ status: 1 });

export default mongoose.model('MedicalHistory', medicalHistorySchema);
