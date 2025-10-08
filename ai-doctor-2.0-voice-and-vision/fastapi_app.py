# FastAPI wrapper for AI Doctor integration
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import tempfile
import shutil
import base64
import time
from typing import Optional
import uvicorn

from brain_of_the_doctor import encode_image, analyze_image_with_query
from voice_of_the_patient import transcribe_with_groq
from voice_of_the_doctor import text_to_speech_with_gtts

# Create FastAPI app
app = FastAPI(title="AI Doctor API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for request body
from pydantic import BaseModel

class MedicalInputRequest(BaseModel):
    text_input: Optional[str] = None
    audio_file: Optional[str] = None  # base64 string
    image_file: Optional[str] = None  # base64 string

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-doctor-api"}

@app.post("/analyze")
async def analyze_medical_input(request: MedicalInputRequest):
    """
    Analyze medical input (text, audio, image)
    """
    try:
        speech_to_text = None
        doctor_response = None
        audio_response_path = None
        
        # Handle text input
        if request.text_input:
            speech_to_text = request.text_input
            doctor_response = f"Thank you for your question: '{request.text_input}'. I understand you're asking about a medical concern. For a proper diagnosis, I would need to see any relevant images or have more specific details about your symptoms. Please describe your symptoms in more detail or upload any relevant images."
        
        # Handle audio input
        if request.audio_file:
            try:
                # Decode base64 audio
                audio_data = base64.b64decode(request.audio_file)
                
                # Save to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                    temp_audio.write(audio_data)
                    temp_audio_path = temp_audio.name
                
                # Transcribe audio
                speech_to_text = transcribe_with_groq(temp_audio_path)
                
                # Clean up temp file
                os.unlink(temp_audio_path)
                
                if speech_to_text:
                    doctor_response = f"Thank you for your question: '{speech_to_text}'. I understand you're asking about a medical concern. For a proper diagnosis, I would need to see any relevant images or have more specific details about your symptoms. Please describe your symptoms in more detail or upload any relevant images."
                else:
                    doctor_response = "I couldn't understand your audio. Please try speaking more clearly or type your question instead."
                    
            except Exception as e:
                print(f"Error processing audio: {e}")
                doctor_response = "Error processing audio. Please try typing your question instead."
        
        # Handle image input
        if request.image_file:
            try:
                print(f"Processing image, base64 length: {len(request.image_file)}")
                
                # Decode base64 image
                image_data = base64.b64decode(request.image_file)
                print(f"Decoded image data size: {len(image_data)} bytes")
                
                # Save to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_image:
                    temp_image.write(image_data)
                    temp_image_path = temp_image.name
                
                print(f"Saved image to: {temp_image_path}")
                
                # Encode image for analysis
                encoded_image = encode_image(temp_image_path)
                print(f"Encoded image for analysis, length: {len(encoded_image)}")
                
                # Analyze image
                query_text = speech_to_text or "What do you see in this medical image? Please analyze it for any medical conditions or abnormalities."
                print(f"Analyzing image with query: {query_text}")
                
                doctor_response = analyze_image_with_query(
                    query=query_text,
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                    encoded_image=encoded_image
                )
                
                print(f"Image analysis completed: {doctor_response[:100]}...")
                
                # Clean up temp image file
                os.unlink(temp_image_path)
                
            except Exception as e:
                print(f"Error processing image: {e}")
                import traceback
                traceback.print_exc()
                doctor_response = f"Error processing image: {str(e)}. Please try uploading a different image or check if the image format is supported (JPG, PNG)."
        else:
            # No image provided - provide a text response for testing
            if speech_to_text:
                doctor_response = f"Thank you for your question: '{speech_to_text}'. I understand you're asking about a medical concern. For a proper diagnosis, I would need to see any relevant images or have more specific details about your symptoms. Please describe your symptoms in more detail or upload any relevant images."
            else:
                doctor_response = "I'm here to help with your medical questions. Please describe your symptoms or upload any relevant images for a better analysis."
        
        # Generate audio response
        audio_response_path = None
        if doctor_response and doctor_response != "No image provided for me to analyze. Please upload an image along with your query.":
            try:
                # Create audio file in current directory for serving
                audio_filename = f"audio_response_{int(time.time())}.mp3"
                audio_response_path = os.path.join(os.getcwd(), audio_filename)
                
                print(f"🎵 Generating audio file: {audio_response_path}")
                text_to_speech_with_gtts(
                    input_text=doctor_response,
                    output_filepath=audio_response_path
                )
                print(f"✅ Audio file generated successfully: {audio_response_path}")
            except Exception as audio_error:
                print(f"❌ Error generating audio: {audio_error}")
                audio_response_path = None
        
        return {
            "success": True,
            "data": {
                "speech_to_text": speech_to_text,
                "doctor_response": doctor_response,
                "audio_response_url": f"/audio/{os.path.basename(audio_response_path)}" if audio_response_path else None
            }
        }
        
    except Exception as e:
        print(f"Error in analyze_medical_input: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Serve generated audio files
    """
    # Look for audio files in the current directory
    audio_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(audio_path):
        return FileResponse(audio_path, media_type="audio/mpeg")
    else:
        print(f"Audio file not found: {audio_path}")
        raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)