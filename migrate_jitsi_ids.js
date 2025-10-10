#!/usr/bin/env node

/**
 * Migration script to add Jitsi meeting IDs to existing slots
 * Run this script once to update existing slots
 */

import { migrateExistingSlots } from './main_website/backend/src/utils/migrateJitsiIds.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://premyadavptts_db_user:qUoeB8QVKwigzaMt@cluster4.leu26pe.mongodb.net/';

async function runMigration() {
  try {
    console.log('🚀 Starting Jitsi ID migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Run migration
    const result = await migrateExistingSlots();
    
    if (result.success) {
      console.log('🎉 Migration completed successfully!');
      console.log(`📊 Updated: ${result.updated} slots`);
      console.log(`❌ Errors: ${result.errors} slots`);
      console.log(`📈 Total processed: ${result.total} slots`);
    } else {
      console.error('❌ Migration failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the migration
runMigration();







