import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      messageType: {
        type: String,
        enum: ['text', 'query', 'summary_request', 'prescription_help', 'general']
      },
      context: {
        patientId: mongoose.Schema.Types.ObjectId,
        recordId: mongoose.Schema.Types.ObjectId,
        queryType: String
      },
      aiModel: String,
      tokensUsed: Number,
      responseTime: Number
    }
  }],
  context: {
    patientId: mongoose.Schema.Types.ObjectId,
    currentRecords: [mongoose.Schema.Types.ObjectId],
    queryType: {
      type: String,
      enum: ['general', 'record_summary', 'prescription_help', 'diagnosis_help', 'medication_query']
    },
    sessionPurpose: String
  },
  summary: {
    generated: Boolean,
    summary: String,
    keyTopics: [String],
    actionItems: [String],
    generatedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
aiChatSchema.index({ userId: 1, lastActivity: -1 });
aiChatSchema.index({ sessionId: 1 });
aiChatSchema.index({ 'context.patientId': 1 });

export default mongoose.model('AIChat', aiChatSchema);
