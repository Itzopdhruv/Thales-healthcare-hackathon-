#!/usr/bin/env node

/**
 * Cleanup script to fix booked slots that are still showing as available
 * Run this script to clean up the slot availability status
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://premyadavptts_db_user:qUoeB8QVKwigzaMt@cluster4.leu26pe.mongodb.net/';

async function cleanupBookedSlots() {
  try {
    console.log('🚀 Starting booked slots cleanup...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Call the cleanup API
    const response = await fetch('http://localhost:5001/api/admin/appointments/slots/cleanup-booked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🎉 Cleanup completed successfully!');
      console.log(`📊 Updated: ${result.updatedCount} booked slots`);
      console.log(`🗑️ Deleted: ${result.deletedCount} past slots`);
      
      if (result.updatedSlots && result.updatedSlots.length > 0) {
        console.log('\n📋 Updated slots:');
        result.updatedSlots.forEach(slot => {
          console.log(`  - ${slot.time} on ${slot.date} (Appointment: ${slot.appointmentId})`);
        });
      }
      
      if (result.deletedSlots && result.deletedSlots.length > 0) {
        console.log('\n🗑️ Deleted slots:');
        result.deletedSlots.forEach(slot => {
          console.log(`  - ${slot.time} on ${slot.date}`);
        });
      }
    } else {
      const error = await response.json();
      console.error('❌ Cleanup failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Cleanup script failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanupBookedSlots();







