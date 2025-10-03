const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  expiry_date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
medicineSchema.index({ name: 'text', dosage: 'text' });

// Virtual for checking if medicine is low stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.quantity <= 10;
});

// Pre-save middleware to update the updatedAt field
medicineSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find low stock medicines
medicineSchema.statics.findLowStock = function(threshold = 10) {
  return this.find({ quantity: { $lte: threshold } });
};

// Instance method to check if medicine is expired
medicineSchema.methods.isExpired = function() {
  return this.expiry_date < new Date();
};

module.exports = mongoose.model('Medicine', medicineSchema);
