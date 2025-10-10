import mongoose from 'mongoose';

// Meeting Recording Schema
const meetingRecordingSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  patientRecording: {
    filePath: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'failed'],
      default: 'pending'
    }
  },
  doctorRecording: {
    filePath: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'failed'],
      default: 'pending'
    }
  },
  mergedRecording: {
    filePath: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    mergedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  },
  summary: {
    content: {
      type: String,
      default: ''
    },
    keyPoints: [{
      type: String
    }],
    medications: [{
      name: String,
      dosage: String,
      instructions: String
    }],
    followUpInstructions: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  },
  recordingStartedAt: {
    type: Date,
    default: null
  },
  recordingEndedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'recording', 'uploading', 'processing', 'completed', 'failed', 'stopping_both'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for efficient queries
meetingRecordingSchema.index({ appointment: 1 });
meetingRecordingSchema.index({ meetingId: 1 });
meetingRecordingSchema.index({ status: 1 });

export const MeetingRecording = mongoose.model('MeetingRecording', meetingRecordingSchema);


