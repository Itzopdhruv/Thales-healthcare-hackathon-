# ABHA ID Integration Documentation

## Overview
This document describes the implementation of ABHA (Ayushman Bharat Health Account) ID generation and patient record management functionality in the AayuLink healthcare platform.

## Features Implemented

### 1. ABHA ID Generation
- **Format**: `XX-XXXX-XXXX-XXXX` (14 digits with hyphens)
- **Uniqueness**: Automatically checks for duplicates in the database
- **Generation**: Random 14-digit number with proper formatting
- **API Endpoint**: `GET /api/patient/generate-abha`

### 2. Patient Record Creation
- **Integration**: Seamlessly integrated with existing admin dashboard
- **Data Storage**: Stores patient information in MongoDB with ABHA ID as primary identifier
- **Validation**: Comprehensive input validation for all patient fields
- **API Endpoint**: `POST /api/patient/create-with-abha`

### 3. Patient Lookup
- **Search**: Find patients by ABHA ID
- **Data Retrieval**: Returns complete patient profile and health records
- **API Endpoint**: `GET /api/patient/lookup/:abhaId`

### 4. Patient Record Updates
- **Modification**: Update existing patient records
- **Authentication**: Requires admin authentication
- **API Endpoint**: `PUT /api/patient/update/:abhaId`

## Database Schema

### User Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  username: String (unique),
  name: String (required),
  email: String (unique),
  phone: String (required),
  abhaId: String (unique, indexed), // NEW: ABHA ID field
  password: String (hashed),
  role: String (enum: ['patient', 'doctor', 'admin']),
  isActive: Boolean,
  profile: {
    dateOfBirth: Date,
    gender: String (enum: ['male', 'female', 'other']),
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  preferences: {
    language: String,
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### HealthRecord Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  abhaId: String (required, indexed), // NEW: ABHA ID reference
  recordType: String (enum: ['prescription', 'lab_report', 'diagnosis', 'treatment', 'vaccination', 'surgery', 'other']),
  title: String,
  description: String,
  date: Date,
  // ... other health record fields
  source: {
    type: String (enum: ['abdm', 'manual', 'imported', 'ai_generated']),
    facilityId: String,
    facilityName: String,
    importedAt: Date
  },
  // ... other fields
}
```

## API Endpoints

### 1. Generate ABHA ID
```http
GET /api/patient/generate-abha
```

**Response:**
```json
{
  "success": true,
  "message": "ABHA ID generated successfully",
  "data": {
    "abhaId": "12-3456-7890-0001",
    "generatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. Create Patient with ABHA ID
```http
POST /api/patient/create-with-abha
Content-Type: application/json

{
  "fullName": "John Doe",
  "age": 30,
  "gender": "male",
  "dateOfBirth": "1994-01-15",
  "phoneNumber": "9876543210",
  "email": "john.doe@example.com",
  "bloodType": "O+",
  "emergencyContact": "Jane Doe 9876543211",
  "allergies": "None",
  "medicalConditions": "None",
  "medications": "None",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient record created successfully with ABHA ID",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "abhaId": "12-3456-7890-0001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "age": 30,
    "gender": "male",
    "bloodType": "O+",
    "dateOfBirth": "1994-01-15",
    "emergencyContact": "Jane Doe 9876543211",
    "allergies": "None",
    "medicalConditions": "None",
    "medications": "None",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 3. Lookup Patient by ABHA ID
```http
GET /api/patient/lookup/12-3456-7890-0001
```

**Response:**
```json
{
  "success": true,
  "message": "Patient found successfully",
  "data": {
    "patient": {
      "id": "507f1f77bcf86cd799439011",
      "abhaId": "12-3456-7890-0001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "role": "patient",
      "isActive": true,
      "profile": {
        "dateOfBirth": "1994-01-15T00:00:00.000Z",
        "gender": "male",
        "address": {
          "street": "123 Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "country": "India"
        },
        "emergencyContact": {
          "name": "Jane Doe",
          "phone": "9876543211",
          "relationship": "Emergency Contact"
        }
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "lastLogin": null
    },
    "healthRecords": [
      {
        "id": "507f1f77bcf86cd799439012",
        "recordType": "other",
        "title": "Initial Patient Profile",
        "date": "2025-01-15T10:30:00.000Z",
        "doctor": null,
        "diagnosis": {
          "primary": "None",
          "secondary": [],
          "icd10Codes": []
        },
        "medications": [],
        "symptoms": []
      }
    ]
  }
}
```

### 4. Update Patient Record
```http
PUT /api/patient/update/12-3456-7890-0001
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "9876543210",
  "profile": {
    "address": {
      "city": "Delhi",
      "state": "Delhi"
    }
  }
}
```

## Frontend Integration

### Admin Dashboard Features
1. **Generate ABHA ID Button**: Click to generate a new unique ABHA ID
2. **Copy ABHA ID Button**: Copy the generated ABHA ID to clipboard
3. **Patient Creation Form**: Enhanced form with all required fields
4. **Patient Lookup**: Search patients by ABHA ID
5. **Real-time Validation**: Client-side validation for all form fields

### Form Fields
- **Personal Information**: Full Name, Age, Gender, Date of Birth, Blood Type
- **Contact Information**: Phone Number, Email, Emergency Contact
- **Address Information**: Street, City, State, Pincode
- **Health Information**: Allergies, Medical Conditions, Current Medications

## Validation Rules

### Required Fields
- `fullName`: 2-100 characters, letters and spaces only
- `age`: 0-150 years
- `gender`: male, female, or other
- `dateOfBirth`: Valid date in YYYY-MM-DD format
- `phoneNumber`: 10-digit Indian mobile number

### Optional Fields
- `email`: Valid email format
- `bloodType`: Format A+, B-, AB+, O-, etc.
- `emergencyContact`: Max 200 characters
- `allergies`: Max 1000 characters
- `medicalConditions`: Max 1000 characters
- `medications`: Max 1000 characters

### Address Fields
- `street`: Max 200 characters
- `city`: Max 100 characters, letters and spaces only
- `state`: Max 100 characters, letters and spaces only
- `pincode`: Valid Indian postal code
- `country`: Max 50 characters

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "fullName",
      "message": "Full name is required",
      "value": ""
    }
  ]
}
```

## Security Features

1. **Input Validation**: Comprehensive server-side validation
2. **SQL Injection Prevention**: Using Mongoose ODM
3. **Rate Limiting**: Applied to all endpoints
4. **Authentication**: Required for sensitive operations
5. **Data Sanitization**: All inputs are sanitized and validated

## Usage Instructions

### For Administrators
1. Navigate to Admin Dashboard
2. Click "Create Patient Record" button
3. Click "Generate" to create a new ABHA ID
4. Fill in patient information
5. Click "Create Patient Record" to save
6. Use "Patient Lookup" to find existing patients by ABHA ID

### For Developers
1. Use the API endpoints for programmatic access
2. Implement proper error handling
3. Validate all inputs before sending requests
4. Use authentication tokens for protected endpoints

## Future Enhancements

1. **ABDM Integration**: Connect with official ABDM sandbox
2. **QR Code Generation**: Generate QR codes for ABHA IDs
3. **Bulk Import**: Import multiple patients from CSV/Excel
4. **Advanced Search**: Search by multiple criteria
5. **Audit Trail**: Track all changes to patient records
6. **Mobile App**: Mobile application for patient access

## Troubleshooting

### Common Issues
1. **ABHA ID Generation Fails**: Check database connection
2. **Validation Errors**: Ensure all required fields are provided
3. **Patient Not Found**: Verify ABHA ID format and existence
4. **Permission Denied**: Check authentication token

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in environment variables.

## Support

For technical support or questions about the ABHA ID integration, please contact the development team or refer to the API documentation.
