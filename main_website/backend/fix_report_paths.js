import mongoose from 'mongoose';
import Report from './src/models/Report.js';
import fs from 'fs';
import path from 'path';

async function fixReportFilePaths() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare');
    console.log('Connected to MongoDB');
    
    // Find reports with missing filePath
    const reports = await Report.find({ filePath: { $exists: false } });
    console.log(`Found ${reports.length} reports with missing filePath`);
    
    for (const report of reports) {
      console.log(`\nFixing report: ${report._id}`);
      console.log(`  - Title: ${report.title}`);
      console.log(`  - Original filename: ${report.originalFileName}`);
      console.log(`  - Current filePath: ${report.filePath}`);
      
      // Try to find the file in the uploads directory
      const uploadsDir = path.join(process.cwd(), 'src', 'uploads', 'reports');
      const files = fs.readdirSync(uploadsDir);
      
      // Look for files that match the original filename or contain the report ID
      let foundFile = null;
      
      // First try exact match
      if (files.includes(report.originalFileName)) {
        foundFile = report.originalFileName;
      } else {
        // Try to find by report ID in filename
        const matchingFile = files.find(file => file.includes(report._id.toString()));
        if (matchingFile) {
          foundFile = matchingFile;
        } else {
          // Try to find by original filename pattern
          const nameWithoutExt = path.parse(report.originalFileName).name;
          const matchingFile2 = files.find(file => file.includes(nameWithoutExt));
          if (matchingFile2) {
            foundFile = matchingFile2;
          }
        }
      }
      
      if (foundFile) {
        const filePath = path.join(uploadsDir, foundFile);
        console.log(`  ✅ Found file: ${foundFile}`);
        
        // Update the report with the correct file path
        report.filePath = filePath;
        
        // Also set file size if missing
        if (!report.fileSize) {
          const stats = fs.statSync(filePath);
          report.fileSize = stats.size;
          console.log(`  📏 Set file size: ${stats.size} bytes`);
        }
        
        await report.save();
        console.log(`  💾 Updated report ${report._id}`);
      } else {
        console.log(`  ❌ Could not find file for report ${report._id}`);
        console.log(`  📁 Available files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      }
    }
    
    console.log('\n✅ File path fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixReportFilePaths();
