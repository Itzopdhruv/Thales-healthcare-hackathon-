import mongoose from 'mongoose';

// Specialties Schema
const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Doctors Schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  licenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Doctor Availability Slots Schema
const doctorAvailabilitySlotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookingLock: {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    lockedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Appointments Schema
const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorAvailabilitySlot',
    required: true
  },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED'
  },
  reasonForVisit: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  virtualMeetingLink: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for performance
specialtySchema.index({ name: 1, isActive: 1 });
doctorSchema.index({ specialty: 1, isActive: 1 });
doctorAvailabilitySlotSchema.index({ doctor: 1, date: 1 });
doctorAvailabilitySlotSchema.index({ specialty: 1, date: 1 });
doctorAvailabilitySlotSchema.index({ isAvailable: 1, isBooked: 1, date: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });

// Models
const Specialty = mongoose.model('Specialty', specialtySchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const DoctorAvailabilitySlot = mongoose.model('DoctorAvailabilitySlot', doctorAvailabilitySlotSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

export {
  Specialty,
  Doctor,
  DoctorAvailabilitySlot,
  Appointment
};
