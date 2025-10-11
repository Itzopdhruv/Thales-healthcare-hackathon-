import mongoose from 'mongoose';
import Report from './src/models/Report.js';
import fs from 'fs';

async function testReports() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare');
    console.log('Connected to MongoDB');
    
    const reports = await Report.find({abhaId: '34-68-64-07'}).limit(5);
    console.log('Reports found:', reports.length);
    
    if (reports.length > 0) {
      console.log('\nFirst report details:');
      console.log('ID:', reports[0]._id);
      console.log('Title:', reports[0].title);
      console.log('File path:', reports[0].filePath);
      console.log('File exists:', fs.existsSync(reports[0].filePath));
      console.log('Uploaded by:', reports[0].uploadedBy);
      console.log('Patient ID:', reports[0].patientId);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testReports();
