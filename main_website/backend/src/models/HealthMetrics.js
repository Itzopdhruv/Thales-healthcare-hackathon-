import mongoose from 'mongoose';

const healthMetricsSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  abhaId: {
    type: String,
    required: true
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true,
      min: 50,
      max: 300
    },
    diastolic: {
      type: Number,
      required: true,
      min: 30,
      max: 200
    }
  },
  heartRate: {
    value: {
      type: Number,
      required: true,
      min: 30,
      max: 250
    },
    unit: {
      type: String,
      default: 'bpm'
    }
  },
  bloodSugar: {
    value: {
      type: Number,
      required: true,
      min: 50,
      max: 500
    },
    unit: {
      type: String,
      default: 'mg/dL'
    }
  },
  weight: {
    value: {
      type: Number,
      required: true,
      min: 20,
      max: 300
    },
    unit: {
      type: String,
      default: 'kg'
    }
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  recordedByName: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    bloodPressure: {
      type: String,
      enum: ['Normal', 'High', 'Low', 'Pre-High'],
      default: 'Normal'
    },
    heartRate: {
      type: String,
      enum: ['Normal', 'High', 'Low', 'Bradycardia', 'Tachycardia'],
      default: 'Normal'
    },
    bloodSugar: {
      type: String,
      enum: ['Normal', 'High', 'Low', 'Pre-Diabetic', 'Diabetic'],
      default: 'Normal'
    },
    weight: {
      type: String,
      enum: ['Stable', 'Gained', 'Lost', 'Underweight', 'Overweight', 'Obese'],
      default: 'Stable'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
healthMetricsSchema.index({ patientId: 1, createdAt: -1 });
healthMetricsSchema.index({ abhaId: 1, createdAt: -1 });

// Method to determine health status based on values
healthMetricsSchema.methods.calculateStatus = function() {
  const { bloodPressure, heartRate, bloodSugar, weight } = this;
  
  // Blood Pressure Status
  if (bloodPressure.systolic >= 140 || bloodPressure.diastolic >= 90) {
    this.status.bloodPressure = 'High';
  } else if (bloodPressure.systolic >= 120 || bloodPressure.diastolic >= 80) {
    this.status.bloodPressure = 'Pre-High';
  } else if (bloodPressure.systolic < 90 || bloodPressure.diastolic < 60) {
    this.status.bloodPressure = 'Low';
  } else {
    this.status.bloodPressure = 'Normal';
  }

  // Heart Rate Status
  if (heartRate.value < 60) {
    this.status.heartRate = 'Bradycardia';
  } else if (heartRate.value > 100) {
    this.status.heartRate = 'Tachycardia';
  } else if (heartRate.value < 70) {
    this.status.heartRate = 'Low';
  } else if (heartRate.value > 90) {
    this.status.heartRate = 'High';
  } else {
    this.status.heartRate = 'Normal';
  }

  // Blood Sugar Status (assuming fasting glucose)
  if (bloodSugar.value >= 126) {
    this.status.bloodSugar = 'Diabetic';
  } else if (bloodSugar.value >= 100) {
    this.status.bloodSugar = 'Pre-Diabetic';
  } else if (bloodSugar.value < 70) {
    this.status.bloodSugar = 'Low';
  } else if (bloodSugar.value > 100) {
    this.status.bloodSugar = 'High';
  } else {
    this.status.bloodSugar = 'Normal';
  }

  // Weight Status (simplified - would need height for BMI calculation)
  if (weight.value < 50) {
    this.status.weight = 'Underweight';
  } else if (weight.value > 100) {
    this.status.weight = 'Overweight';
  } else if (weight.value > 120) {
    this.status.weight = 'Obese';
  } else {
    this.status.weight = 'Stable';
  }
};

// Pre-save middleware to calculate status
healthMetricsSchema.pre('save', function(next) {
  this.calculateStatus();
  next();
});

const HealthMetrics = mongoose.model('HealthMetrics', healthMetricsSchema);

export default HealthMetrics;
