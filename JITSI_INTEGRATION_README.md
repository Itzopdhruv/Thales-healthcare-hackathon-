# 🎥 Jitsi Video Call Integration

## Overview
This document describes the Jitsi Meet integration for the healthcare appointment system, enabling video calls between doctors and patients 5 minutes before their scheduled appointments.

## 🚀 Features Implemented

### ✅ Core Functionality
- **Time-based Access**: Video call button appears exactly 5 minutes before appointment time
- **Unique Meeting Rooms**: Each appointment gets a unique Jitsi room ID
- **Real-time Status Updates**: Appointment status automatically updates during calls
- **Dual Interface Support**: Both admin and patient interfaces have video call functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### ✅ Technical Implementation
- **Frontend Components**: Reusable `VideoCallButton` component
- **Backend API**: Meeting link generation and status management
- **Database Integration**: Meeting links stored in appointment records
- **Real-time Updates**: WebSocket integration for live status changes

## 📁 Files Created/Modified

### New Files
- `main_website/frontend/src/components/VideoCallButton.jsx` - Main video call component
- `main_website/frontend/src/components/VideoCallButton.css` - Styling for video call interface
- `test_jitsi_integration.html` - Test page for demonstration
- `JITSI_INTEGRATION_README.md` - This documentation

### Modified Files
- `main_website/frontend/src/components/AdminAppointmentManagement.jsx` - Added video call button
- `main_website/frontend/src/components/PatientAppointmentBooking.jsx` - Added video call button
- `main_website/backend/src/controllers/adminAppointmentController.js` - Added meeting link generation
- `main_website/backend/src/routes/adminAppointmentRoutes.js` - Added meeting link route

## 🔧 How It Works

### 1. Time-based Access Control
```javascript
// Video call is enabled 5 minutes before appointment
const fiveMinutesBefore = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
const canStartCall = now >= fiveMinutesBefore && now <= appointmentDateTime;
```

### 2. Meeting Room Generation
```javascript
// Unique room name based on appointment ID and date
const roomName = `appointment-${appointmentId.slice(-8)}-${appointmentDate.split('T')[0]}`;
const meetingLink = `https://meet.jit.si/${roomName}`;
```

### 3. Status Management
- **SCHEDULED** → **IN_PROGRESS** (when call starts)
- **IN_PROGRESS** → **COMPLETED** (when call ends)

## 🎨 UI/UX Features

### Visual Design
- **Gradient Buttons**: Modern gradient styling matching the existing design
- **Status Indicators**: Different colors for different call states
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Adapts to different screen sizes

### User Experience
- **Clear Status Messages**: "Call in X minutes", "Call Available", "Call Expired"
- **One-click Access**: Simple button to start video calls
- **Modal Interface**: Clean, focused video call experience
- **Copy Link Feature**: Easy sharing of meeting links

## 🔌 API Endpoints

### Generate Meeting Link
```
POST /api/admin/appointments/:appointmentId/meeting-link
```
**Response:**
```json
{
  "success": true,
  "message": "Meeting link generated successfully",
  "data": {
    "appointmentId": "...",
    "meetingLink": "https://meet.jit.si/appointment-12345678-2024-01-15",
    "roomName": "appointment-12345678-2024-01-15",
    "patient": {...},
    "doctor": {...}
  }
}
```

### Update Appointment Status
```
PUT /api/admin/appointments/:appointmentId/status
```
**Body:**
```json
{
  "status": "IN_PROGRESS",
  "meetingLink": "https://meet.jit.si/..."
}
```

## 🧪 Testing

### Test Scenarios
1. **Call Available**: Button appears 5 minutes before appointment
2. **Call Not Available**: Shows countdown timer
3. **Call Expired**: Shows expired message
4. **Different Statuses**: Different styling for SCHEDULED, IN_PROGRESS, etc.

### Test Page
Open `test_jitsi_integration.html` in a browser to see the integration in action.

## 🚀 Usage Instructions

### For Admins
1. Navigate to the Admin Appointment Management page
2. Find appointments with "SCHEDULED" status
3. Video call button will appear 5 minutes before appointment time
4. Click "Start Call" to open Jitsi meeting room
5. Appointment status automatically updates to "IN_PROGRESS"

### For Patients
1. Navigate to the Patient Appointment Booking page
2. View your scheduled appointments
3. Video call button will appear 5 minutes before appointment time
4. Click "Start Call" to join the video call
5. Use the modal interface for the video call experience

## 🔒 Security Features

- **Time-based Access**: Prevents unauthorized access outside appointment windows
- **Unique Room IDs**: Each appointment has a unique, non-guessable room name
- **Status Validation**: Backend validates appointment status before allowing calls
- **Secure URLs**: Jitsi Meet provides encrypted video communication

## 📱 Mobile Compatibility

- **Responsive Design**: Video call interface adapts to mobile screens
- **Touch-friendly**: Large buttons and touch-optimized controls
- **Mobile Jitsi**: Full Jitsi Meet mobile app compatibility
- **Cross-platform**: Works on iOS, Android, and desktop browsers

## 🔄 Real-time Updates

The integration uses WebSocket connections to provide real-time updates:
- Appointment status changes are broadcast to all connected clients
- Both admin and patient interfaces stay synchronized
- No page refresh needed for status updates

## 🛠️ Configuration

### Environment Variables
No additional environment variables required. The integration uses the public Jitsi Meet service.

### Customization
- **Meeting Duration**: Modify the 5-minute window in `VideoCallButton.jsx`
- **Room Naming**: Customize room name format in the backend controller
- **Styling**: Update `VideoCallButton.css` for custom appearance

## 🐛 Troubleshooting

### Common Issues
1. **Button Not Appearing**: Check appointment time and status
2. **Meeting Not Loading**: Verify internet connection and Jitsi service
3. **Status Not Updating**: Check WebSocket connection and backend logs

### Debug Mode
Enable console logging by checking browser developer tools for detailed information about:
- Time calculations
- API responses
- Status updates
- Meeting link generation

## 🎯 Future Enhancements

### Potential Improvements
- **Recording Capability**: Add option to record video calls
- **Screen Sharing**: Enhanced screen sharing features
- **Chat Integration**: Text chat during video calls
- **Call Notifications**: Push notifications for call availability
- **Analytics**: Track call duration and quality metrics

## 📞 Support

For technical support or questions about the Jitsi integration:
1. Check the browser console for error messages
2. Verify appointment data and timing
3. Test with the provided test page
4. Review the API endpoints and responses

---

**Integration Status**: ✅ Complete and Ready for Production
**Last Updated**: January 2024
**Version**: 1.0.0







