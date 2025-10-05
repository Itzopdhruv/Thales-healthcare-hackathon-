# AayuLink Database Schema Documentation

## Overview
This document outlines the complete database schema for the AayuLink AI-Powered Health Record Platform, designed to support RAG (Retrieval-Augmented Generation) systems and comprehensive health data management.

## Database Collections

### 1. Users Collection
**Purpose**: Store user authentication and profile information

```javascript
{
  _id: ObjectId,
  name: String (required, max 100 chars),
  email: String (required, unique, lowercase),
  phone: String (required, unique, 10 digits),
  abhaId: String (required, unique, 14 digits),
  password: String (required, min 6 chars, hashed),
  role: String (enum: ['patient', 'doctor', 'admin'], default: 'patient'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  profile: {
    dateOfBirth: Date,
    gender: String (enum: ['male', 'female', 'other']),
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String (default: 'India')
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  preferences: {
    language: String (default: 'en'),
    notifications: {
      email: Boolean (default: true),
      sms: Boolean (default: true),
      push: Boolean (default: true)
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. HealthRecords Collection
**Purpose**: Store comprehensive health records for RAG system

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Users, required, indexed),
  abhaId: String (required, indexed),
  recordType: String (enum: ['prescription', 'lab_report', 'diagnosis', 'treatment', 'vaccination', 'surgery', 'other'], required),
  title: String (required),
  description: String,
  date: Date (required),
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
    status: String (enum: ['normal', 'abnormal', 'critical'])
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
    type: String (enum: ['image', 'pdf', 'document']),
    url: String,
    filename: String,
    size: Number,
    uploadedAt: Date
  }],
  source: {
    type: String (enum: ['abdm', 'manual', 'imported', 'ai_generated']),
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
    isPublic: Boolean (default: false),
    sharedWith: [{
      doctorId: ObjectId,
      sharedAt: Date,
      expiresAt: Date
    }],
    consentGiven: Boolean (default: true),
    consentExpiry: Date
  },
  tags: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. AIChats Collection
**Purpose**: Store AI conversation history for context and RAG

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, required, indexed),
  sessionId: String (required, indexed),
  messages: [{
    role: String (enum: ['user', 'assistant', 'system'], required),
    content: String (required),
    timestamp: Date (default: Date.now),
    metadata: {
      messageType: String (enum: ['text', 'query', 'summary_request', 'prescription_help', 'general']),
      context: {
        patientId: ObjectId,
        recordId: ObjectId,
        queryType: String
      },
      aiModel: String,
      tokensUsed: Number,
      responseTime: Number
    }
  }],
  context: {
    patientId: ObjectId,
    currentRecords: [ObjectId],
    queryType: String (enum: ['general', 'record_summary', 'prescription_help', 'diagnosis_help', 'medication_query']),
    sessionPurpose: String
  },
  summary: {
    generated: Boolean,
    summary: String,
    keyTopics: [String],
    actionItems: [String],
    generatedAt: Date
  },
  isActive: Boolean (default: true),
  lastActivity: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. ABDMSessions Collection (Future)
**Purpose**: Store ABDM integration sessions and tokens

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, required),
  sessionToken: String (required),
  facilityId: String,
  facilityName: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  permissions: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. AISummaries Collection (Future)
**Purpose**: Store AI-generated summaries for quick retrieval

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Users, required),
  recordIds: [ObjectId] (ref: HealthRecords),
  summaryType: String (enum: ['comprehensive', 'medication', 'lab_results', 'diagnosis']),
  summary: String (required),
  keyPoints: [String],
  riskFactors: [String],
  recommendations: [String],
  aiModel: String,
  confidence: Number (0-1),
  generatedAt: Date,
  expiresAt: Date,
  isActive: Boolean (default: true)
}
```

## Indexes for RAG System

### Primary Indexes
```javascript
// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "phone": 1 }, { unique: true })
db.users.createIndex({ "abhaId": 1 }, { unique: true })

// HealthRecords Collection
db.healthrecords.createIndex({ "patientId": 1, "date": -1 })
db.healthrecords.createIndex({ "abhaId": 1, "recordType": 1 })
db.healthrecords.createIndex({ "doctor.name": 1 })
db.healthrecords.createIndex({ "diagnosis.primary": 1 })
db.healthrecords.createIndex({ "tags": 1 })
db.healthrecords.createIndex({ "aiSummary.generated": 1 })

// AIChats Collection
db.aichats.createIndex({ "userId": 1, "lastActivity": -1 })
db.aichats.createIndex({ "sessionId": 1 })
db.aichats.createIndex({ "context.patientId": 1 })
```

### Text Search Indexes for RAG
```javascript
// Full-text search on health records
db.healthrecords.createIndex({
  "title": "text",
  "description": "text",
  "diagnosis.primary": "text",
  "symptoms": "text",
  "treatment.notes": "text"
})

// Full-text search on AI chat messages
db.aichats.createIndex({
  "messages.content": "text"
})
```

## RAG System Data Flow

### 1. Data Ingestion
- **ABDM Integration**: Fetch records from ABDM sandbox
- **Manual Entry**: Doctor/patient manual record entry
- **File Upload**: PDF/image processing for record extraction
- **AI Processing**: Generate summaries and extract key information

### 2. Data Processing for RAG
- **Text Extraction**: Extract text from PDFs and images
- **Entity Recognition**: Identify medical entities (medications, symptoms, diagnoses)
- **Summary Generation**: Create AI-powered summaries
- **Vector Embeddings**: Generate embeddings for semantic search
- **Indexing**: Create searchable indexes

### 3. Query Processing
- **User Query**: Natural language health queries
- **Context Retrieval**: Find relevant records using vector similarity
- **Context Ranking**: Rank retrieved records by relevance
- **Response Generation**: Generate AI responses using retrieved context

## Data Privacy and Security

### 1. Data Encryption
- **At Rest**: Database-level encryption
- **In Transit**: TLS/SSL encryption
- **Sensitive Fields**: Additional field-level encryption for PII

### 2. Access Control
- **Role-based Access**: Patient, Doctor, Admin roles
- **Consent Management**: Time-based consent for data sharing
- **Audit Logs**: Track all data access and modifications

### 3. Data Retention
- **Retention Policies**: Configurable data retention periods
- **Anonymization**: Anonymize data after retention period
- **Deletion**: Secure data deletion upon request

## API Endpoints for RAG System

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Health Records
- `GET /api/records` - Get user's health records
- `POST /api/records` - Create new health record
- `GET /api/records/search` - Search records (RAG endpoint)
- `GET /api/records/summary` - Get AI summary

### AI Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/summarize` - Generate conversation summary

### ABDM Integration
- `POST /api/abdm/fetch` - Fetch records from ABDM
- `GET /api/abdm/status` - Check ABDM connection status

This schema is designed to support a comprehensive RAG system for health record management with proper indexing, privacy controls, and AI integration capabilities.
