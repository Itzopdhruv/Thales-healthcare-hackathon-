#!/usr/bin/env node

/**
 * Fix script to correct appointment meeting IDs to use slot-based IDs
 * Run this script to fix the meeting ID mismatch issue
 */

import { fixAppointmentMeetingIds } from './main_website/backend/src/utils/fixAppointmentMeetingIds.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://premyadavptts_db_user:qUoeB8QVKwigzaMt@cluster4.leu26pe.mongodb.net/';

async function runFix() {
  try {
    console.log('🚀 Starting appointment meeting ID fix...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Run fix
    const result = await fixAppointmentMeetingIds();
    
    if (result.success) {
      console.log('🎉 Fix completed successfully!');
      console.log(`📊 Updated: ${result.updated} appointments`);
      console.log(`⏭️ Skipped: ${result.skipped} appointments`);
      console.log(`❌ Errors: ${result.errors} appointments`);
      console.log(`📈 Total processed: ${result.total} appointments`);
    } else {
      console.error('❌ Fix failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Fix script failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the fix
runFix();







