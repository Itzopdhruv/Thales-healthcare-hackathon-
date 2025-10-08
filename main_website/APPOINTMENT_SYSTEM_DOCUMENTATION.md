# AayuLink Appointment Booking System
## Complete Technical Documentation

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Real-time Communication](#real-time-communication)
6. [User Flows](#user-flows)
7. [State Management](#state-management)
8. [Security Features](#security-features)
9. [Installation Guide](#installation-guide)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The AayuLink Appointment Booking System is a comprehensive healthcare management solution that enables seamless appointment scheduling between patients and doctors. The system features real-time updates, duplicate booking prevention, and intuitive user interfaces for both administrators and patients.

### Key Features
- **Real-time Slot Management**: Live updates of availability
- **Duplicate Prevention**: Advanced locking mechanism
- **Multi-role Access**: Admin and Patient interfaces
- **WebSocket Integration**: Real-time communication
- **Responsive Design**: Mobile and desktop support
- **State Management**: Robust error handling

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Admin Panel   │  Patient Portal │     WebSocket Client        │
│                 │                 │                             │
│ • Doctor Mgmt   │ • Book Slots    │ • Real-time Updates         │
│ • Slot Mgmt     │ • View Apps     │ • State Synchronization     │
│ • Monitor Apps  │ • Cancel Apps   │ • Error Handling            │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   REST API      │  WebSocket      │        Services             │
│                 │   Server        │                             │
│ • Auth Routes   │ • Real-time     │ • Appointment Service       │
│ • Appt Routes   │   Updates       │ • Notification Service      │
│ • Admin Routes  │ • State Mgmt    │ • WebSocket Service         │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Collections   │    Indexes      │        Constraints          │
│                 │                 │                             │
│ • Specialties   │ • Performance   │ • Unique Constraints        │
│ • Doctors       │   Optimization  │ • Referential Integrity     │
│ • Slots         │ • Query Speed   │ • Data Validation           │
│ • Appointments  │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Database Schema

### Specialties Collection
```javascript
{
  _id: ObjectId,
  name: String (unique, required),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Doctors Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (unique, required),
  phone: String,
  specialty: ObjectId (ref: 'Specialty', required),
  licenseNumber: String (unique, required),
  consultationFee: Number (default: 0),
  isActive: Boolean (default: true),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Doctor Availability Slots Collection
```javascript
{
  _id: ObjectId,
  doctor: ObjectId (ref: 'Doctor', required),
  specialty: ObjectId (ref: 'Specialty', required),
  date: Date (required),
  startTime: String (required, format: "HH:MM"),
  endTime: String (required, format: "HH:MM"),
  durationMinutes: Number (default: 30),
  isAvailable: Boolean (default: true),
  isBooked: Boolean (default: false),
  bookingLock: {
    patientId: ObjectId,
    lockedAt: Date,
    expiresAt: Date,
    isActive: Boolean (default: false)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Appointments Collection
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: 'Patient', required),
  doctor: ObjectId (ref: 'Doctor', required),
  slot: ObjectId (ref: 'DoctorAvailabilitySlot', required),
  specialty: ObjectId (ref: 'Specialty', required),
  appointmentDate: Date (required),
  appointmentTime: String (required),
  status: String (enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], default: 'SCHEDULED'),
  reasonForVisit: String,
  notes: String,
  virtualMeetingLink: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Documentation

### Patient Endpoints

#### Get All Specialties
```http
GET /api/appointments/specialties
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "specialty_id",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system"
    }
  ]
}
```

#### Get Doctors by Specialty
```http
GET /api/appointments/doctors/specialty/:specialtyId?date=2024-01-20
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "doctor_id",
      "name": "Dr. John Smith",
      "specialty": {
        "name": "Cardiology"
      },
      "consultationFee": 500,
      "availableSlots": [
        {
          "startTime": "09:00",
          "endTime": "09:30",
          "durationMinutes": 30
        }
      ]
    }
  ]
}
```

#### Get Available Slots
```http
GET /api/appointments/doctors/:doctorId/slots?date=2024-01-20
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "slot_id",
      "startTime": "09:00",
      "endTime": "09:30",
      "durationMinutes": 30
    }
  ]
}
```

#### Lock Slot
```http
POST /api/appointments/slots/:slotId/lock
Content-Type: application/json

{
  "patientId": "patient_id"
}
```

#### Book Appointment
```http
POST /api/appointments/book
Content-Type: application/json

{
  "patientId": "patient_id",
  "doctorId": "doctor_id",
  "slotId": "slot_id",
  "reasonForVisit": "Regular checkup"
}
```

### Admin Endpoints

#### Create Specialty
```http
POST /api/admin/appointments/specialties
Content-Type: application/json

{
  "name": "Dermatology",
  "description": "Skin and hair conditions"
}
```

#### Create Doctor
```http
POST /api/admin/appointments/doctors
Content-Type: application/json

{
  "name": "Dr. Jane Doe",
  "email": "jane.doe@hospital.com",
  "phone": "+1234567890",
  "specialty": "specialty_id",
  "licenseNumber": "LIC123456",
  "consultationFee": 400
}
```

#### Create Availability Slot
```http
POST /api/admin/appointments/doctors/:doctorId/slots
Content-Type: application/json

{
  "specialtyId": "specialty_id",
  "date": "2024-01-20",
  "startTime": "09:00",
  "endTime": "09:30",
  "durationMinutes": 30
}
```

---

## Real-time Communication

### WebSocket Events

#### Client to Server Events
- `join-user-room` - Join user's personal room
- `join-admin-room` - Join admin monitoring room
- `join-doctor-room` - Join doctor's room
- `lock-slot` - Lock slot for booking
- `unlock-slot` - Unlock slot
- `appointment-booked` - Emit appointment booking
- `appointment-cancelled` - Emit appointment cancellation
- `emergency-request` - Emit emergency request
- `slot-availability-updated` - Update slot availability

#### Server to Client Events
- `slot-locked` - Slot is being locked by another user
- `slot-unlocked` - Slot lock has been released
- `appointment-confirmed` - Appointment has been confirmed
- `appointment-cancelled` - Appointment has been cancelled
- `new-appointment` - New appointment created
- `emergency-request` - Emergency request received
- `slot-availability-changed` - Slot availability updated
- `slot-added` - New slot added by admin
- `slot-removed` - Slot removed by admin
- `appointment-status-changed` - Appointment status updated

---

## User Flows

### Admin Flow
1. **Login** → Access admin dashboard
2. **Manage Specialties** → Create/update medical specialties
3. **Manage Doctors** → Add doctors with specialties and fees
4. **Create Slots** → Set availability for doctors
5. **Monitor** → View real-time appointments and updates

### Patient Flow
1. **Login** → Access patient portal
2. **Select Specialty** → Choose medical specialty needed
3. **Choose Doctor** → Select from available doctors
4. **Pick Slot** → Select date and time
5. **Confirm** → Provide reason and confirm booking
6. **Manage** → View and cancel appointments

### Real-time Flow
1. **User Action** → Patient selects slot
2. **Lock Creation** → Server creates 5-minute lock
3. **Broadcast** → All users notified of lock
4. **Booking Process** → Patient completes booking
5. **Status Update** → Slot marked as booked
6. **Notification** → All users see updated status

---

## State Management

### Slot States
- **Available** - Slot is open for booking
- **Locked** - Slot is temporarily reserved (5 minutes)
- **Booked** - Slot has been permanently booked
- **Unavailable** - Slot disabled by admin

### Appointment States
- **SCHEDULED** - Appointment created, awaiting confirmation
- **CONFIRMED** - Appointment confirmed by doctor
- **IN_PROGRESS** - Appointment currently happening
- **COMPLETED** - Appointment finished successfully
- **CANCELLED** - Appointment cancelled
- **NO_SHOW** - Patient didn't show up

### Lock Management
```javascript
// Lock creation
{
  patientId: ObjectId,
  lockedAt: Date,
  expiresAt: Date (lockedAt + 5 minutes),
  isActive: Boolean
}
```

---

## Security Features

### Authentication
- JWT token-based authentication
- Role-based access control (Admin/Patient)
- Session management and token refresh

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### Real-time Security
- Room-based access control
- User permission validation
- Rate limiting on WebSocket events
- Connection timeout handling

---

## Installation Guide

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup
```bash
# Navigate to backend directory
cd main_website/backend

# Install dependencies
npm install

# Install additional packages
npm install socket.io

# Create .env file
cp .env.example .env

# Update environment variables
MONGODB_URI=mongodb://localhost:27017/aayulink
PORT=5001
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000

# Start the server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd main_website/frontend

# Install dependencies
npm install

# Install additional packages
npm install socket.io-client

# Create .env file
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WEBSOCKET_URL=http://localhost:5001

# Start the development server
npm start
```

### Database Setup
```bash
# Connect to MongoDB
mongo

# Create database
use aayulink

# Create collections (automatic on first use)
# Collections will be created when first documents are inserted
```

---

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
**Problem:** WebSocket connection not establishing
**Solution:**
1. Check CORS settings in server.js
2. Verify WebSocket URL in frontend
3. Ensure server is running on correct port
4. Check firewall settings

#### Slot Locking Issues
**Problem:** Slots not locking properly
**Solution:**
1. Check server time synchronization
2. Verify lock expiry logic
3. Check database connection
4. Review WebSocket event handling

#### Database Connection Issues
**Problem:** Cannot connect to MongoDB
**Solution:**
1. Verify MongoDB URI in .env
2. Check MongoDB service status
3. Verify network connectivity
4. Check authentication credentials

#### Authentication Errors
**Problem:** JWT token validation failing
**Solution:**
1. Check JWT_SECRET in environment
2. Verify token format and expiry
3. Check token refresh logic
4. Review authentication middleware

### Debug Mode
Enable debug logging:
```bash
# Set environment variable
export NODE_ENV=development

# Check console logs for detailed error information
```

### Performance Issues
1. **Database Queries:** Check query performance and indexes
2. **WebSocket Connections:** Monitor connection count and memory usage
3. **Frontend Rendering:** Check component re-rendering frequency
4. **Network Latency:** Monitor API response times

---

## Support and Maintenance

### Monitoring
- Database performance metrics
- WebSocket connection monitoring
- API response time tracking
- Error rate monitoring

### Backup Strategy
- Regular database backups
- Configuration file backups
- Code repository backups
- Environment variable backups

### Updates and Maintenance
- Regular dependency updates
- Security patch management
- Performance optimization
- Feature enhancement planning

---

## Conclusion

The AayuLink Appointment Booking System provides a robust, scalable solution for healthcare appointment management. With its real-time capabilities, duplicate prevention mechanisms, and intuitive user interfaces, it ensures a seamless experience for both administrators and patients.

The system is designed with security, performance, and maintainability in mind, making it suitable for production deployment in healthcare environments.

For technical support or feature requests, please contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Author:** AayuLink Development Team
