import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
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
  prescriptionId: {
    type: String,
    unique: true,
    trim: true
  },
  issuedDate: {
    type: Date,
    required: true
  },
  doctor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    specialization: String,
    licenseNumber: String,
    contactNumber: String,
    email: String
  },
  hospitalClinic: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: String,
    contactNumber: String,
    licenseNumber: String
  },
  diagnosis: {
    primary: {
      type: String,
      required: true,
      trim: true
    },
    secondary: [String],
    icd10Codes: [String],
    notes: String
  },
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    },
    instructions: String,
    quantity: Number,
    unit: String,
    genericName: String,
    manufacturer: String
  }],
  instructions: {
    general: String,
    followUp: String,
    precautions: [String],
    dietaryRestrictions: [String]
  },
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending'
  },
  fulfillmentDate: Date,
  pharmacy: {
    name: String,
    address: String,
    contactNumber: String,
    pharmacistName: String
  },
  totalAmount: Number,
  insuranceCovered: Boolean,
  insuranceAmount: Number,
  patientAmount: Number,
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
prescriptionSchema.index({ patientId: 1, issuedDate: -1 });
prescriptionSchema.index({ abhaId: 1, issuedDate: -1 });
prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ 'doctor.name': 1 });

// Generate prescription ID before saving
prescriptionSchema.pre('save', function(next) {
  if (!this.prescriptionId) {
    // Generate a random 6-character alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.prescriptionId = result;
  }
  next();
});

export default mongoose.model('Prescription', prescriptionSchema);
