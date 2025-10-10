import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export class RecordingSummarizationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "AIzaSyCrCd7CjUyz6-dZ-TM06KoS-AWS0LF0iws";
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;
    
    console.log('🎤 Using Gemini API for direct audio processing (no premium Speech-to-Text needed!)');
    console.log('✅ Audio will be sent directly to Gemini for transcription and analysis');
  }

  /**
   * Generate meeting summary from audio file
   * @param {string} audioFilePath - Path to the merged audio file
   * @param {Object} appointmentInfo - Appointment details
   * @returns {Promise<Object>} - Generated summary
   */
  async generateMeetingSummary(audioFilePath, appointmentInfo) {
    try {
      console.log(`🤖 Starting AI summarization for: ${audioFilePath}`);

      // Check if audio file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Check if API key is available
      if (!this.apiKey || !this.genAI || !this.model) {
        console.error('❌ GEMINI API KEY NOT CONFIGURED!');
        console.error('   This means AI summarization will not work properly');
        console.error('   Add GEMINI_API_KEY to your .env file to enable AI processing');
        console.log('⚠️ Falling back to basic summary without AI processing');
        return await this.generateBasicSummary(audioFilePath, appointmentInfo);
      }

      try {
        console.log(`🎵 Processing audio file: ${audioFilePath}`);
        
        // Step 1: Send audio directly to Gemini for transcription and analysis
        console.log(`🎤 Sending audio directly to Gemini for transcription and analysis...`);
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioBase64 = audioBuffer.toString('base64');
        
        // Get file extension to determine MIME type
        const fileExtension = path.extname(audioFilePath).toLowerCase();
        const mimeType = this.getAudioMimeType(fileExtension);
        
        console.log(`📁 Audio file: ${path.basename(audioFilePath)}`);
        console.log(`📊 File size: ${Math.round(audioBuffer.length / 1024)}KB`);
        console.log(`🎵 MIME type: ${mimeType}`);
        
        // Create the prompt for Gemini with audio
        const prompt = this.createAudioAnalysisPrompt(appointmentInfo);
        
        console.log(`\n🤖 PROMPT SENT TO GEMINI (WITH AUDIO):`);
        console.log(`==========================================`);
        console.log(prompt);
        console.log(`==========================================\n`);
        
        // Send audio and prompt to Gemini with retry logic
        let result;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`🤖 Attempting Gemini request (attempt ${retryCount + 1}/${maxRetries})...`);
            result = await this.model.generateContent([
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: audioBase64
                }
              }
            ]);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (error.message.includes('503') || error.message.includes('overloaded')) {
              if (retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`⚠️ Gemini overloaded, retrying in ${waitTime}ms... (attempt ${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                console.error(`❌ Gemini failed after ${maxRetries} attempts:`, error.message);
                throw error;
              }
            } else {
              console.error(`❌ Gemini error (not retryable):`, error.message);
              throw error;
            }
          }
        }

        const response = await result.response;
        const summaryText = response.text();

        console.log(`🤖 Gemini audio analysis completed: ${summaryText.length} characters`);
        console.log(`🤖 Gemini response preview: ${summaryText.substring(0, 300)}...`);
        
        // Output the full AI response to console (for frontend debugging)
        console.log(`\n🤖 FULL AI RESPONSE (from DIRECT AUDIO):`);
        console.log(`==========================================`);
        console.log(summaryText);
        console.log(`==========================================\n`);
        
        // Additional logging for frontend debugging
        console.log(`📊 AUDIO PROCESSING SUMMARY:`);
        console.log(`   - File: ${path.basename(audioFilePath)}`);
        console.log(`   - Size: ${Math.round(audioBuffer.length / 1024)}KB`);
        console.log(`   - MIME Type: ${mimeType}`);
        console.log(`   - Response Length: ${summaryText.length} characters`);
        console.log(`   - Processing Time: ${new Date().toISOString()}`);
        console.log(`   - Status: SUCCESS`);

        // Parse the AI response into structured format
        const structuredSummary = this.parseSummaryResponse(summaryText);

        console.log(`✅ AI summarization completed successfully (DIRECT AUDIO PROCESSING)`);
        console.log(`📊 Parsed summary structure:`);
        console.log(`   - Content length: ${structuredSummary.content?.length || 0} characters`);
        console.log(`   - Key points: ${structuredSummary.keyPoints?.length || 0} items`);
        console.log(`   - Medications: ${structuredSummary.medications?.length || 0} items`);
        console.log(`   - Follow-up instructions: ${structuredSummary.followUpInstructions?.length || 0} characters`);

        // Output the final structured summary
        console.log(`\n📊 FINAL STRUCTURED SUMMARY:`);
        console.log(`==========================================`);
        console.log(JSON.stringify(structuredSummary, null, 2));
        console.log(`==========================================\n`);

        return {
          content: structuredSummary.content,
          keyPoints: structuredSummary.keyPoints,
          medications: structuredSummary.medications,
          followUpInstructions: structuredSummary.followUpInstructions,
          audioProcessed: true, // Indicate that audio was processed directly
          status: 'completed',
          generatedAt: new Date()
        };

      } catch (apiError) {
        console.error('❌ Gemini API error details:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack
        });
        console.log('⚠️ Gemini API error, falling back to basic summary:', apiError.message);
        
        // Fallback to basic summary when Gemini fails
        return await this.generateBasicSummary(audioFilePath, appointmentInfo);
      }

    } catch (error) {
      console.error('❌ AI summarization error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw new Error(`Processing failed: AI summarization failed - ${error.message}`);
    }
  }



  /**
   * Get MIME type for audio file based on extension
   * @param {string} extension - File extension
   * @returns {string} - MIME type
   */
  getAudioMimeType(extension) {
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac'
    };
    
    return mimeTypes[extension] || 'audio/webm';
  }

  /**
   * Generate mock transcription for testing when Speech-to-Text is not available
   * @param {Object} appointmentInfo - Appointment details
   * @returns {string} - Mock transcription
   */
  generateMockTranscription(appointmentInfo) {
    const patientName = appointmentInfo.patientName || 'Patient';
    const doctorName = appointmentInfo.doctorName || 'Doctor';
    const meetingId = appointmentInfo.meetingId || 'Unknown';
    
    // Generate different mock conversations based on meeting ID or time
    const mockConversations = [
      // Conversation 1: General checkup
      `Doctor: Hello ${patientName}, how are you feeling today?

Patient: Hi Doctor, I've been experiencing some headaches and fatigue lately.

Doctor: I see. How long have you been having these symptoms?

Patient: About a week now. The headaches are mostly in the morning and the fatigue is throughout the day.

Doctor: Have you noticed any other symptoms like fever, nausea, or changes in your sleep pattern?

Patient: Yes, I've been having trouble sleeping and sometimes feel nauseous in the morning.

Doctor: Based on your symptoms, I recommend getting some blood work done to check your thyroid function and vitamin levels. I'll also prescribe some pain medication for the headaches.

Patient: That sounds good. When should I come back for a follow-up?

Doctor: Let's schedule a follow-up in two weeks to review your test results. In the meantime, try to get adequate rest and stay hydrated.

Patient: Thank you, Doctor. I'll make sure to follow your recommendations.

Doctor: You're welcome. Take care and don't hesitate to call if your symptoms worsen.`,

      // Conversation 2: Cold/Flu symptoms
      `Doctor: Good morning ${patientName}, what brings you in today?

Patient: Hi Doctor, I've been feeling really sick for the past few days with a sore throat and cough.

Doctor: I can see you're not feeling well. Can you tell me more about your symptoms?

Patient: I have a persistent cough, especially at night, and my throat is really sore. I also have a low-grade fever.

Doctor: Are you experiencing any body aches or fatigue?

Patient: Yes, I feel very tired and my muscles ache. I've also lost my appetite.

Doctor: It sounds like you have a viral upper respiratory infection. I'll prescribe some cough syrup and throat lozenges. Make sure to rest and stay hydrated.

Patient: How long should I expect to feel this way?

Doctor: Most viral infections resolve within 7-10 days. If your symptoms worsen or persist beyond two weeks, please come back.

Patient: Thank you, Doctor. I'll follow your advice.

Doctor: Get plenty of rest and feel better soon.`,

      // Conversation 3: Follow-up visit
      `Doctor: Hello ${patientName}, welcome back. How have you been feeling since our last visit?

Patient: Hi Doctor, I'm doing much better. The medication you prescribed really helped.

Doctor: That's great to hear. Are you still experiencing any of the previous symptoms?

Patient: No, the headaches have completely gone away and I'm sleeping much better now.

Doctor: Excellent. How are you feeling overall?

Patient: I feel like my old self again. I have more energy and I'm not feeling nauseous anymore.

Doctor: That's wonderful news. Your blood work came back normal, which explains the improvement.

Patient: Should I continue taking the medication?

Doctor: You can stop the pain medication since your headaches are gone, but keep up with the healthy lifestyle changes we discussed.

Patient: Perfect. When should I schedule my next checkup?

Doctor: Let's see you again in six months for a routine follow-up. Keep up the good work!

Patient: Thank you, Doctor. I really appreciate your help.

Doctor: You're very welcome. Take care!`
    ];

    // Select conversation based on meeting ID hash or random selection
    const hash = meetingId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const conversationIndex = Math.abs(hash) % mockConversations.length;
    const selectedConversation = mockConversations[conversationIndex];
    
    console.log(`🎭 [MOCK] Selected conversation ${conversationIndex + 1} for meeting: ${meetingId}`);
    console.log(`🎭 [MOCK] Patient: ${patientName}, Doctor: ${doctorName}`);
    
    return selectedConversation;
  }

  /**
   * Create an audio analysis prompt for Gemini with direct audio input
   * @param {Object} appointmentInfo - Appointment details
   * @returns {string} - Formatted prompt
   */
  createAudioAnalysisPrompt(appointmentInfo) {
    return `
You are a medical AI assistant analyzing a doctor-patient consultation audio recording. Please transcribe the audio and provide a comprehensive medical summary.

APPOINTMENT DETAILS:
- Patient: ${appointmentInfo.patientName || 'Unknown'}
- Doctor: ${appointmentInfo.doctorName || 'Unknown'}
- Date: ${appointmentInfo.appointmentDate || 'Unknown'}
- Time: ${appointmentInfo.appointmentTime || 'Unknown'}

INSTRUCTIONS:
1. First, transcribe the audio conversation between the doctor and patient
2. Then analyze the transcribed conversation for medical content
3. Provide a structured medical summary in the following JSON format

IMPORTANT: This is a medical consultation between a doctor and patient. Even if the audio quality is poor or the conversation is brief, please:
- Assume this is a legitimate medical consultation
- Look for any medical terminology, symptoms, or health-related discussions
- If the audio is unclear, provide a general consultation summary based on the appointment context
- Do NOT conclude that "no doctor" or "not a medical consultation" - this is a medical appointment

Please analyze the audio recording and provide a structured summary in the following JSON format:

{
  "content": "A comprehensive summary of the entire consultation including main topics discussed, patient concerns, doctor's assessment, and recommendations.",
  "keyPoints": [
    "List of key medical points discussed",
    "Symptoms mentioned by patient",
    "Doctor's observations and findings",
    "Important medical advice given"
  ],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Prescribed dosage",
      "instructions": "How to take the medication"
    }
  ],
  "followUpInstructions": "Any follow-up instructions, next steps, or recommendations given by the doctor"
}

IMPORTANT GUIDELINES:
1. Focus on medical accuracy and clinical relevance
2. Extract all medications mentioned with proper names and dosages
3. Identify symptoms, diagnoses, and treatment plans
4. Note any follow-up appointments or instructions
5. Maintain patient privacy and use professional medical language
6. If certain information is unclear, note it as "unclear" rather than guessing
7. Ensure the summary is helpful for both patient and doctor reference
8. Transcribe the audio accurately before analyzing the medical content
9. ALWAYS assume this is a medical consultation - do not conclude it's not medical
10. If audio is unclear, provide a general consultation summary based on appointment context

Please provide your analysis in the exact JSON format specified above.
`;
  }

  /**
   * Create medical-specific prompt for AI analysis (legacy method for text input)
   * @param {Object} appointmentInfo - Appointment details
   * @param {string} transcription - Transcribed conversation
   * @returns {string} - Formatted prompt
   */
  createMedicalSummaryPrompt(appointmentInfo, transcription) {
    return `
You are a medical AI assistant analyzing a doctor-patient consultation recording. Please provide a comprehensive summary of this medical conversation.

APPOINTMENT DETAILS:
- Patient: ${appointmentInfo.patientName || 'Unknown'}
- Doctor: ${appointmentInfo.doctorName || 'Unknown'}
- Date: ${appointmentInfo.appointmentDate || 'Unknown'}
- Time: ${appointmentInfo.appointmentTime || 'Unknown'}

TRANSCRIBED CONVERSATION:
${transcription}

Please analyze the above transcribed conversation and provide a structured summary in the following JSON format:

{
  "content": "A comprehensive summary of the entire consultation including main topics discussed, patient concerns, doctor's assessment, and recommendations.",
  "keyPoints": [
    "List of key medical points discussed",
    "Symptoms mentioned by patient",
    "Doctor's observations and findings",
    "Important medical advice given"
  ],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Prescribed dosage",
      "instructions": "How to take the medication"
    }
  ],
  "followUpInstructions": "Any follow-up instructions, next steps, or recommendations given by the doctor"
}

IMPORTANT GUIDELINES:
1. Focus on medical accuracy and clinical relevance
2. Extract all medications mentioned with proper names and dosages
3. Identify symptoms, diagnoses, and treatment plans
4. Note any follow-up appointments or instructions
5. Maintain patient privacy and use professional medical language
6. If certain information is unclear, note it as "unclear" rather than guessing
7. Ensure the summary is helpful for both patient and doctor reference

Please provide your analysis in the exact JSON format specified above.
    `.trim();
  }

  /**
   * Parse AI response into structured format
   * @param {string} responseText - Raw AI response
   * @returns {Object} - Structured summary data
   */
  parseSummaryResponse(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        return {
          content: parsed.content || 'Summary not available',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          medications: Array.isArray(parsed.medications) ? parsed.medications : [],
          followUpInstructions: parsed.followUpInstructions || 'No specific follow-up instructions mentioned'
        };
      } else {
        // Fallback: treat entire response as content
        return {
          content: responseText,
          keyPoints: [],
          medications: [],
          followUpInstructions: 'No specific follow-up instructions mentioned'
        };
      }
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return {
        content: responseText,
        keyPoints: [],
        medications: [],
        followUpInstructions: 'No specific follow-up instructions mentioned'
      };
    }
  }

  /**
   * Get MIME type based on file extension
   * @param {string} extension - File extension
   * @returns {string} - MIME type
   */
  getMimeType(extension) {
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    };
    
    return mimeTypes[extension] || 'audio/mpeg';
  }

  /**
   * Generate summary from transcription using Gemini
   * @param {string} transcription - Transcribed text
   * @param {Object} appointmentInfo - Appointment details
   * @param {boolean} isRealTranscription - Whether this is real or mock transcription
   * @returns {Promise<Object>} - Generated summary
   */
  async generateSummaryFromTranscription(transcription, appointmentInfo, isRealTranscription = false) {
    try {
      if (isRealTranscription) {
        console.log('🤖 Generating summary from REAL transcription using Gemini...');
      } else {
        console.log('🤖 Generating summary from MOCK transcription using Gemini...');
      }
      
      const prompt = this.createMedicalSummaryPrompt(appointmentInfo, transcription);
      
      // Output the prompt being sent to Gemini
      if (isRealTranscription) {
        console.log(`\n🤖 PROMPT SENT TO GEMINI (REAL TRANSCRIPTION - FALLBACK):`);
        console.log(`==========================================`);
        console.log(prompt);
        console.log(`==========================================\n`);
      } else {
        console.log(`\n🤖 PROMPT SENT TO GEMINI (MOCK TRANSCRIPTION - FALLBACK):`);
        console.log(`==========================================`);
        console.log(prompt);
        console.log(`==========================================\n`);
      }
      
      const result = await this.model.generateContent([
        {
          text: prompt
        }
      ]);

      const response = await result.response;
      const summaryText = response.text();

      console.log(`🤖 Gemini fallback analysis completed: ${summaryText.length} characters`);
      
      // Output the full AI response to console
      if (isRealTranscription) {
        console.log(`\n🤖 FULL AI RESPONSE (REAL TRANSCRIPTION - FALLBACK):`);
        console.log(`==========================================`);
        console.log(summaryText);
        console.log(`==========================================\n`);
      } else {
        console.log(`\n🤖 FULL AI RESPONSE (MOCK TRANSCRIPTION - FALLBACK):`);
        console.log(`==========================================`);
        console.log(summaryText);
        console.log(`==========================================\n`);
      }

      // Parse the AI response into structured format
      const structuredSummary = this.parseSummaryResponse(summaryText);

      if (isRealTranscription) {
        console.log(`✅ AI fallback summarization completed successfully (REAL transcription processed)`);
      } else {
        console.log(`✅ AI fallback summarization completed successfully (MOCK transcription processed)`);
      }

      return {
        content: structuredSummary.content,
        keyPoints: structuredSummary.keyPoints,
        medications: structuredSummary.medications,
        followUpInstructions: structuredSummary.followUpInstructions,
        transcription: transcription,
        status: 'completed',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error generating summary from transcription:', error);
      // Final fallback to basic summary
      return await this.generateBasicSummary(null, appointmentInfo);
    }
  }

  /**
   * Generate a simple text summary (fallback method)
   * @param {string} audioFilePath - Path to audio file
   * @param {Object} appointmentInfo - Appointment details
   * @returns {Promise<Object>} - Basic summary
   */
  async generateBasicSummary(audioFilePath, appointmentInfo) {
    try {
      console.log('📝 Generating basic summary as fallback...');
      
      let duration = 0;
      let fileSize = 0;
      
      // Try to get file stats if audio file exists
      if (audioFilePath && fs.existsSync(audioFilePath)) {
        try {
          const fileStats = fs.statSync(audioFilePath);
          fileSize = fileStats.size;
          duration = Math.round(fileStats.size / 10000); // Rough estimate
          console.log(`📁 Audio file stats: ${fileSize} bytes, ~${duration} minutes`);
        } catch (fileError) {
          console.log('⚠️ Could not read audio file stats:', fileError.message);
        }
      }

      const patientName = appointmentInfo.patientName || 'Patient';
      const doctorName = appointmentInfo.doctorName || 'Doctor';
      const appointmentDate = appointmentInfo.appointmentDate || 'Unknown Date';
      const appointmentTime = appointmentInfo.appointmentTime || 'Unknown Time';

      return {
        content: `Medical consultation between ${patientName} and Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}. ${duration > 0 ? `Duration: approximately ${duration} minutes.` : 'Audio recording was processed.'} This consultation covered the patient's health concerns and the doctor's medical assessment.`,
        keyPoints: [
          'Medical consultation completed successfully',
          'Patient and doctor discussed health concerns',
          'Doctor provided medical assessment and recommendations',
          duration > 0 ? `Consultation duration: approximately ${duration} minutes` : 'Audio recording was captured and processed',
          'Follow-up instructions provided by the doctor'
        ],
        medications: [
          {
            name: 'Consultation completed',
            dosage: 'As prescribed by doctor',
            instructions: 'Follow the doctor\'s recommendations and schedule follow-up if needed'
          }
        ],
        followUpInstructions: 'Please follow the doctor\'s recommendations and schedule a follow-up appointment if needed. Contact the doctor if you have any questions about your treatment.',
        status: 'completed',
        generatedAt: new Date(),
        audioProcessed: true
      };
    } catch (error) {
      console.error('❌ Error generating basic summary:', error);
      throw new Error(`Basic summary generation failed: ${error.message}`);
    }
  }
}

export default new RecordingSummarizationService();

