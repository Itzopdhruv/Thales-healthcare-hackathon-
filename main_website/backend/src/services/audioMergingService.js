import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

/**
 * Audio Merging Service
 * Merges patient and doctor audio recordings into a single file
 * Stores merged file in: uploads/recordings/merged/
 */

export class AudioMergingService {
  constructor() {
    this.mergedDir = 'uploads/recordings/merged';
    this.ensureMergedDirectory();
    this.setFFmpegPath();
  }

  setFFmpegPath() {
    // Set FFmpeg path based on environment or system
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`🎵 FFmpeg path set to: ${ffmpegPath}`);
  }

  ensureMergedDirectory() {
    if (!fs.existsSync(this.mergedDir)) {
      fs.mkdirSync(this.mergedDir, { recursive: true });
    }
  }

  /**
   * Merge two audio files into one
   * @param {string} patientAudioPath - Path to patient's audio file
   * @param {string} doctorAudioPath - Path to doctor's audio file
   * @param {string} outputFileName - Name for the merged file
   * @returns {Promise<Object>} - Merged file information
   */
  async mergeAudioFiles(patientAudioPath, doctorAudioPath, outputFileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.mergedDir, outputFileName);
      
      console.log(`🎵 Starting audio merge:`);
      console.log(`   Patient: ${patientAudioPath}`);
      console.log(`   Doctor: ${doctorAudioPath}`);
      console.log(`   Output: ${outputPath}`);

      // Check if both input files exist
      if (!fs.existsSync(patientAudioPath)) {
        return reject(new Error(`Patient audio file not found: ${patientAudioPath}`));
      }
      if (!fs.existsSync(doctorAudioPath)) {
        return reject(new Error(`Doctor audio file not found: ${doctorAudioPath}`));
      }

      // Use FFmpeg to merge audio files
      ffmpeg()
        .input(patientAudioPath)
        .input(doctorAudioPath)
        .complexFilter([
          // Mix both audio streams together
          '[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=2[out]'
        ])
        .outputOptions([
          '-map', '[out]',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-ac', '2'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎵 FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`🎵 Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
          try {
            // Get file stats
            const stats = fs.statSync(outputPath);
            
            // Get audio duration using FFprobe
            const duration = await this.getAudioDuration(outputPath);
            
            console.log(`✅ Audio merge completed: ${outputPath}`);
            console.log(`   File size: ${stats.size} bytes`);
            console.log(`   Duration: ${duration} seconds`);

            resolve({
              filePath: outputPath,
              fileName: outputFileName,
              fileSize: stats.size,
              duration: duration,
              status: 'completed'
            });
          } catch (error) {
            reject(new Error(`Error getting merged file info: ${error.message}`));
          }
        })
        .on('error', (error) => {
          console.error('❌ FFmpeg error:', error);
          reject(new Error(`Audio merge failed: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Get audio duration using FFprobe
   * @param {string} filePath - Path to audio file
   * @returns {Promise<number>} - Duration in seconds
   */
  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Error getting audio duration: ${err.message}`));
        } else {
          const duration = metadata.format.duration || 0;
          resolve(Math.round(duration));
        }
      });
    });
  }

  /**
   * Process single audio file (if only one recording available)
   * @param {string} audioPath - Path to audio file
   * @param {string} outputFileName - Name for the processed file
   * @returns {Promise<Object>} - Processed file information
   */
  async processSingleAudio(audioPath, outputFileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.mergedDir, outputFileName);
      
      console.log(`🎵 Processing single audio file:`);
      console.log(`   Input: ${audioPath}`);
      console.log(`   Output: ${outputPath}`);

      if (!fs.existsSync(audioPath)) {
        return reject(new Error(`Audio file not found: ${audioPath}`));
      }

      // Copy and optimize the audio file
      ffmpeg(audioPath)
        .outputOptions([
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-ac', '2'
        ])
        .output(outputPath)
        .on('end', async () => {
          try {
            const stats = fs.statSync(outputPath);
            const duration = await this.getAudioDuration(outputPath);
            
            console.log(`✅ Single audio processing completed: ${outputPath}`);

            resolve({
              filePath: outputPath,
              fileName: outputFileName,
              fileSize: stats.size,
              duration: duration,
              status: 'completed'
            });
          } catch (error) {
            reject(new Error(`Error getting processed file info: ${error.message}`));
          }
        })
        .on('error', (error) => {
          console.error('❌ FFmpeg error:', error);
          reject(new Error(`Audio processing failed: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} filePaths - Array of file paths to delete
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

  /**
   * Generate unique filename for merged audio
   * @param {string} meetingId - Meeting ID
   * @returns {string} - Unique filename
   */
  generateMergedFileName(meetingId) {
    const timestamp = Date.now();
    return `merged-${meetingId}-${timestamp}.m4a`;
  }
}

export default new AudioMergingService();
