import { Appointment, DoctorAvailabilitySlot } from '../models/AppointmentModels.js';

/**
 * Fix existing appointments to use their slot's Jitsi meeting ID
 * This ensures all appointments use the correct slot-based meeting ID
 */
export const fixAppointmentMeetingIds = async () => {
  try {
    console.log('🔄 Starting fix for appointment meeting IDs...');
    
    // Find all appointments that have a slot reference
    const appointments = await Appointment.find({
      slot: { $exists: true },
      virtualMeetingLink: { $exists: true, $ne: '' }
    }).populate('slot', 'jitsiMeetingId');

    console.log(`📊 Found ${appointments.length} appointments with meeting links`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const appointment of appointments) {
      try {
        if (!appointment.slot || !appointment.slot.jitsiMeetingId) {
          console.log(`⚠️ Skipping appointment ${appointment._id} - no slot or slot has no Jitsi ID`);
          skippedCount++;
          continue;
        }

        // Check if the appointment's meeting link matches the slot's Jitsi ID
        const expectedMeetingLink = `https://meet.jit.si/${appointment.slot.jitsiMeetingId}`;
        
        if (appointment.virtualMeetingLink === expectedMeetingLink) {
          console.log(`✅ Appointment ${appointment._id} already has correct meeting ID`);
          skippedCount++;
          continue;
        }

        // Update the appointment with the correct meeting link from slot
        appointment.virtualMeetingLink = expectedMeetingLink;
        await appointment.save();

        updatedCount++;
        console.log(`✅ Updated appointment ${appointment._id}:`);
        console.log(`   Old: ${appointment.virtualMeetingLink}`);
        console.log(`   New: ${expectedMeetingLink}`);
        console.log(`   Slot ID: ${appointment.slot.jitsiMeetingId}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`🎉 Fix completed! Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: appointments.length
    };
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Add a fix endpoint for manual execution
 */
export const addFixEndpoint = (app) => {
  app.post('/api/admin/fix-meeting-ids', async (req, res) => {
    try {
      const result = await fixAppointmentMeetingIds();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};







