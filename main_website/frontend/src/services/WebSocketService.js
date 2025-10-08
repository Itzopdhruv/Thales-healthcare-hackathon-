import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.attemptReconnect();
    });

    return this.socket;
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join user room
  joinUserRoom(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-user-room', userId);
    }
  }

  // Join admin room
  joinAdminRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-admin-room');
    }
  }

  // Join doctor room
  joinDoctorRoom(doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-doctor-room', doctorId);
    }
  }

  // Lock slot
  lockSlot(slotId, patientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('lock-slot', { slotId, patientId });
    }
  }

  // Unlock slot
  unlockSlot(slotId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unlock-slot', { slotId });
    }
  }

  // Emit appointment booked
  emitAppointmentBooked(appointment, patientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('appointment-booked', { appointment, patientId });
    }
  }

  // Emit appointment cancelled
  emitAppointmentCancelled(appointmentId, patientId, doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('appointment-cancelled', { appointmentId, patientId, doctorId });
    }
  }

  // Emit emergency request
  emitEmergencyRequest(patientId, symptoms, priority) {
    if (this.socket && this.isConnected) {
      this.socket.emit('emergency-request', { patientId, symptoms, priority });
    }
  }

  // Emit slot availability update
  emitSlotAvailabilityUpdate(slotId, isAvailable, doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('slot-availability-updated', { slotId, isAvailable, doctorId });
    }
  }

  // Emit slot created
  emitSlotCreated(slot, doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('slot-created', { slot, doctorId });
    }
  }

  // Emit slot deleted
  emitSlotDeleted(slotId, doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('slot-deleted', { slotId, doctorId });
    }
  }

  // Emit appointment status update
  emitAppointmentStatusUpdate(appointmentId, status, patientId, doctorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('appointment-status-updated', { appointmentId, status, patientId, doctorId });
    }
  }

  // Event listeners
  onSlotLocked(callback) {
    if (this.socket) {
      this.socket.on('slot-locked', callback);
    }
  }

  onSlotUnlocked(callback) {
    if (this.socket) {
      this.socket.on('slot-unlocked', callback);
    }
  }

  onAppointmentConfirmed(callback) {
    if (this.socket) {
      this.socket.on('appointment-confirmed', callback);
    }
  }

  onAppointmentCancelled(callback) {
    if (this.socket) {
      this.socket.on('appointment-cancelled', callback);
    }
  }

  onNewAppointment(callback) {
    if (this.socket) {
      this.socket.on('new-appointment', callback);
    }
  }

  onEmergencyRequest(callback) {
    if (this.socket) {
      this.socket.on('emergency-request', callback);
    }
  }

  onEmergencyAlert(callback) {
    if (this.socket) {
      this.socket.on('emergency-alert', callback);
    }
  }

  onSlotAvailabilityChanged(callback) {
    if (this.socket) {
      this.socket.on('slot-availability-changed', callback);
    }
  }

  onSlotAdded(callback) {
    if (this.socket) {
      this.socket.on('slot-added', callback);
    }
  }

  onSlotRemoved(callback) {
    if (this.socket) {
      this.socket.on('slot-removed', callback);
    }
  }

  onAppointmentStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('appointment-status-changed', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
