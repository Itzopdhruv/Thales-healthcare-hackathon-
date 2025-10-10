import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  abhaId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  bloodType: {
    type: String,
    required: false
  },
  profileImage: {
    type: String,
    default: null
  },
  // soft flags
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
  ,
  currentMedications: [{
    name: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    instructions: { type: String },
    startedAt: { type: Date, default: Date.now },
    nextRefill: { type: Date }
  }]
}, { timestamps: true });

patientSchema.index({ phone: 1, name: 1 });

export default mongoose.model('Patient', patientSchema);


