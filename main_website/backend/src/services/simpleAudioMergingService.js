import path from 'path';
import fs from 'fs';

/**
 * Simple Audio Merging Service (No FFmpeg Required)
 * For testing purposes when FFmpeg is not available
 * Just copies the first available audio file as "merged"
 */

export class SimpleAudioMergingService {
  constructor() {
    this.mergedDir = 'uploads/recordings/merged';
    this.ensureMergedDirectory();
  }

  ensureMergedDirectory() {
    if (!fs.existsSync(this.mergedDir)) {
      fs.mkdirSync(this.mergedDir, { recursive: true });
    }
  }

  /**
   * "Merge" audio files by copying the first available one
   * This is a fallback when FFmpeg is not available
   */
  async mergeAudioFiles(patientAudioPath, doctorAudioPath, outputFileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.mergedDir, outputFileName);
      
      console.log(`🎵 Simple audio merge (no FFmpeg):`);
      console.log(`   Patient: ${patientAudioPath}`);
      console.log(`   Doctor: ${doctorAudioPath}`);
      console.log(`   Output: ${outputPath}`);

      // Check which files exist
      const patientExists = fs.existsSync(patientAudioPath);
      const doctorExists = fs.existsSync(doctorAudioPath);

      if (!patientExists && !doctorExists) {
        return reject(new Error('No audio files found to merge'));
      }

      // Choose which file to use as "merged"
      let sourceFile;
      let sourceType;
      
      if (patientExists && doctorExists) {
        // Both exist - use patient file as primary
        sourceFile = patientAudioPath;
        sourceType = 'patient (both available)';
      } else if (patientExists) {
        sourceFile = patientAudioPath;
        sourceType = 'patient only';
      } else {
        sourceFile = doctorAudioPath;
        sourceType = 'doctor only';
      }

      try {
        // Copy the source file to merged location
        fs.copyFileSync(sourceFile, outputPath);
        
        // Get file stats
        const stats = fs.statSync(outputPath);
        
        console.log(`✅ Simple audio merge completed: ${outputPath}`);
        console.log(`   Source: ${sourceType}`);
        console.log(`   File size: ${stats.size} bytes`);

        resolve({
          filePath: outputPath,
          fileName: outputFileName,
          fileSize: stats.size,
          duration: 0, // We can't get duration without FFmpeg
          status: 'completed',
          note: 'Merged using simple copy (FFmpeg not available)'
        });
      } catch (error) {
        reject(new Error(`Simple audio merge failed: ${error.message}`));
      }
    });
  }

  /**
   * Process single audio file (just copy it)
   */
  async processSingleAudio(audioPath, outputFileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.mergedDir, outputFileName);
      
      console.log(`🎵 Simple single audio processing:`);
      console.log(`   Input: ${audioPath}`);
      console.log(`   Output: ${outputPath}`);

      if (!fs.existsSync(audioPath)) {
        return reject(new Error(`Audio file not found: ${audioPath}`));
      }

      try {
        // Copy the file
        fs.copyFileSync(audioPath, outputPath);
        
        const stats = fs.statSync(outputPath);
        
        console.log(`✅ Simple single audio processing completed: ${outputPath}`);

        resolve({
          filePath: outputPath,
          fileName: outputFileName,
          fileSize: stats.size,
          duration: 0,
          status: 'completed',
          note: 'Processed using simple copy (FFmpeg not available)'
        });
      } catch (error) {
        reject(new Error(`Simple audio processing failed: ${error.message}`));
      }
    });
  }

  /**
   * Generate unique filename for merged audio
   */
  generateMergedFileName(meetingId) {
    const timestamp = Date.now();
    return `merged-${meetingId}-${timestamp}.webm`;
  }

  /**
   * Clean up temporary files
   */
  cleanupFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Error cleaning up ${filePath}:`, error.message);
      }
    });
  }
}

export default new SimpleAudioMergingService();






