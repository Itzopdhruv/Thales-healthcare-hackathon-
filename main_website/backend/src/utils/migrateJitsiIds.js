import { generateJitsiMeetingId } from './jitsiUtils.js';
import { DoctorAvailabilitySlot } from '../models/AppointmentModels.js';

/**
 * Migrate existing slots to have Jitsi meeting IDs
 * This function should be run once to update existing slots
 */
export const migrateExistingSlots = async () => {
  try {
    console.log('🔄 Starting migration of existing slots to add Jitsi meeting IDs...');
    
    // Find all slots without Jitsi meeting IDs
    const slotsWithoutJitsiId = await DoctorAvailabilitySlot.find({
      $or: [
        { jitsiMeetingId: { $exists: false } },
        { jitsiMeetingId: null },
        { jitsiMeetingId: '' }
      ]
    });

    console.log(`📊 Found ${slotsWithoutJitsiId.length} slots without Jitsi meeting IDs`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const slot of slotsWithoutJitsiId) {
      try {
        // Generate Jitsi meeting ID for this slot
        const jitsiMeetingId = generateJitsiMeetingId({
          doctor: slot.doctor,
          date: slot.date,
          startTime: slot.startTime
        });

        // Update the slot with the Jitsi meeting ID
        await DoctorAvailabilitySlot.findByIdAndUpdate(slot._id, {
          jitsiMeetingId
        });

        updatedCount++;
        console.log(`✅ Updated slot ${slot._id} with Jitsi ID: ${jitsiMeetingId}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating slot ${slot._id}:`, error.message);
      }
    }

    console.log(`🎉 Migration completed! Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      updated: updatedCount,
      errors: errorCount,
      total: slotsWithoutJitsiId.length
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Add a migration endpoint for manual execution
 */
export const addMigrationEndpoint = (app) => {
  app.post('/api/admin/migrate-jitsi-ids', async (req, res) => {
    try {
      const result = await migrateExistingSlots();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};







