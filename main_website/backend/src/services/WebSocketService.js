import { Server } from 'socket.io';

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their personal room
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join admin to admin room
      socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log('Admin joined admin room');
      });

      // Join doctor to their room
      socket.on('join-doctor-room', (doctorId) => {
        socket.join(`doctor-${doctorId}`);
        console.log(`Doctor ${doctorId} joined their room`);
      });

      // Handle slot locking
      socket.on('lock-slot', async (data) => {
        try {
          const { slotId, patientId } = data;
          
          // Emit to all users that slot is being locked
          this.io.emit('slot-locked', { slotId, patientId });
          
          // Notify admin panel
          this.io.to('admin-room').emit('slot-locked', { slotId, patientId });
        } catch (error) {
          socket.emit('error', { message: 'Failed to lock slot' });
        }
      });

      // Handle slot unlocking
      socket.on('unlock-slot', (data) => {
        const { slotId } = data;
        this.io.emit('slot-unlocked', { slotId });
        this.io.to('admin-room').emit('slot-unlocked', { slotId });
      });

      // Handle appointment booking
      socket.on('appointment-booked', (data) => {
        const { appointment, patientId } = data;
        
        // Notify the patient
        this.io.to(`user-${patientId}`).emit('appointment-confirmed', appointment);
        
        // Notify admin panel
        this.io.to('admin-room').emit('new-appointment', appointment);
        
        // Notify the doctor
        this.io.to(`doctor-${appointment.doctor._id}`).emit('new-appointment', appointment);
      });

      // Handle appointment cancellation
      socket.on('appointment-cancelled', (data) => {
        const { appointmentId, patientId, doctorId } = data;
        
        // Notify all relevant parties
        this.io.to(`user-${patientId}`).emit('appointment-cancelled', { appointmentId });
        this.io.to('admin-room').emit('appointment-cancelled', { appointmentId });
        this.io.to(`doctor-${doctorId}`).emit('appointment-cancelled', { appointmentId });
      });

      // Handle emergency requests
      socket.on('emergency-request', async (data) => {
        try {
          const { patientId, symptoms, priority } = data;
          
          // Notify admin panel immediately
          this.io.to('admin-room').emit('emergency-request', {
            patientId,
            symptoms,
            priority,
            timestamp: new Date()
          });
          
          // Notify available doctors
          this.io.emit('emergency-alert', {
            patientId,
            symptoms,
            priority,
            timestamp: new Date()
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to process emergency request' });
        }
      });

      // Handle slot availability updates
      socket.on('slot-availability-updated', (data) => {
        const { slotId, isAvailable, doctorId } = data;
        
        // Notify all users about slot availability change
        this.io.emit('slot-availability-changed', { slotId, isAvailable });
        
        // Notify admin panel
        this.io.to('admin-room').emit('slot-availability-changed', { slotId, isAvailable, doctorId });
      });

      // Handle new slot creation
      socket.on('slot-created', (data) => {
        const { slot, doctorId } = data;
        
        // Notify admin panel
        this.io.to('admin-room').emit('slot-created', { slot, doctorId });
        
        // Notify users if they're viewing this doctor's slots
        this.io.emit('slot-added', { slot, doctorId });
      });

      // Handle slot deletion
      socket.on('slot-deleted', (data) => {
        const { slotId, doctorId } = data;
        
        // Notify admin panel
        this.io.to('admin-room').emit('slot-deleted', { slotId, doctorId });
        
        // Notify users
        this.io.emit('slot-removed', { slotId, doctorId });
      });

      // Handle appointment status updates
      socket.on('appointment-status-updated', (data) => {
        const { appointmentId, status, patientId, doctorId } = data;
        
        // Notify patient
        this.io.to(`user-${patientId}`).emit('appointment-status-changed', { appointmentId, status });
        
        // Notify admin panel
        this.io.to('admin-room').emit('appointment-status-changed', { appointmentId, status });
        
        // Notify doctor
        this.io.to(`doctor-${doctorId}`).emit('appointment-status-changed', { appointmentId, status });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  // Method to emit appointment booking
  emitAppointmentBooked(appointment, patientId) {
    this.io.emit('appointment-booked', { appointment, patientId });
  }

  // Method to emit slot availability change
  emitSlotAvailabilityChanged(slotId, isAvailable, doctorId) {
    this.io.emit('slot-availability-changed', { slotId, isAvailable, doctorId });
  }

  // Method to emit new slot creation
  emitSlotCreated(slot, doctorId) {
    this.io.emit('slot-created', { slot, doctorId });
  }

  // Method to emit slot deletion
  emitSlotDeleted(slotId, doctorId) {
    this.io.emit('slot-deleted', { slotId, doctorId });
  }

  // Method to emit appointment cancellation
  emitAppointmentCancelled(appointmentId, patientId, doctorId) {
    this.io.emit('appointment-cancelled', { appointmentId, patientId, doctorId });
  }

  // Method to emit appointment status update
  emitAppointmentStatusUpdated(appointmentId, status, patientId, doctorId) {
    this.io.emit('appointment-status-updated', { appointmentId, status, patientId, doctorId });
  }

  // Method to emit emergency request
  emitEmergencyRequest(patientId, symptoms, priority) {
    this.io.to('admin-room').emit('emergency-request', {
      patientId,
      symptoms,
      priority,
      timestamp: new Date()
    });
  }

  // Method to get connected users count
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  // Method to get admin room users count
  getAdminUsersCount() {
    const adminRoom = this.io.sockets.adapter.rooms.get('admin-room');
    return adminRoom ? adminRoom.size : 0;
  }
}

export default WebSocketService;
