#!/usr/bin/env python3
"""
AI Doctor FastAPI Application
Provides endpoints for AI-powered medical image analysis and voice processing
"""

import os
import base64
import tempfile
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our custom modules
from brain_of_the_doctor import encode_image, analyze_image_with_query
from voice_of_the_patient import transcribe_with_groq
from voice_of_the_doctor import text_to_speech_with_gtts

# Initialize FastAPI app
app = FastAPI(
    title="AI Doctor Service",
    description="AI-powered medical image analysis and voice processing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ImageAnalysisRequest(BaseModel):
    query: str
    model: Optional[str] = "meta-llama/llama-4-scout-17b-16e-instruct"

class ImageAnalysisResponse(BaseModel):
    success: bool
    analysis: str
    query: str
    model_used: str

class VoiceResponse(BaseModel):
    success: bool
    transcription: str
    audio_file: Optional[str] = None

class CombinedResponse(BaseModel):
    success: bool
    transcription: str
    analysis: str
    audio_response: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Doctor",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "AI Doctor Service is running",
        "docs": "/docs",
        "health": "/health"
    }

# Image analysis endpoint
@app.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    query: str = Form(...),
    model: str = Form("meta-llama/llama-4-scout-17b-16e-instruct")
):
    """
    Analyze a medical image with a query using AI
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Encode image
            encoded_image = encode_image(tmp_file_path)
            
            # Analyze image
            analysis = analyze_image_with_query(
                query=query,
                model=model,
                encoded_image=encoded_image
            )
            
            return ImageAnalysisResponse(
                success=True,
                analysis=analysis,
                query=query,
                model_used=model
            )
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

# Voice transcription endpoint
@app.post("/transcribe-audio", response_model=VoiceResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio to text using Groq Whisper
    """
    try:
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Transcribe audio
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key:
                raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
            
            transcription = transcribe_with_groq(
                GROQ_API_KEY=groq_api_key,
                audio_filepath=tmp_file_path,
                stt_model="whisper-large-v3"
            )
            
            return VoiceResponse(
                success=True,
                transcription=transcription
            )
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

# Combined analysis endpoint (image + voice)
@app.post("/analyze-combined", response_model=CombinedResponse)
async def analyze_combined(
    image_file: UploadFile = File(...),
    audio_file: UploadFile = File(...),
    query: str = Form("What do you see in this image?"),
    model: str = Form("meta-llama/llama-4-scout-17b-16e-instruct")
):
    """
    Combined analysis: transcribe audio and analyze image
    """
    try:
        # Validate files
        if not image_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Image file must be an image")
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Audio file must be an audio file")
        
        # Save files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{image_file.filename.split('.')[-1]}") as img_tmp:
            img_content = await image_file.read()
            img_tmp.write(img_content)
            img_tmp_path = img_tmp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.split('.')[-1]}") as audio_tmp:
            audio_content = await audio_file.read()
            audio_tmp.write(audio_content)
            audio_tmp_path = audio_tmp.name
        
        try:
            # Transcribe audio
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key:
                raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
            
            transcription = transcribe_with_groq(
                GROQ_API_KEY=groq_api_key,
                audio_filepath=audio_tmp_path,
                stt_model="whisper-large-v3"
            )
            
            # Analyze image with transcription as query
            encoded_image = encode_image(img_tmp_path)
            analysis = analyze_image_with_query(
                query=f"{query} {transcription}",
                model=model,
                encoded_image=encoded_image
            )
            
            # Generate audio response
            audio_response_path = text_to_speech_with_gtts(
                input_text=analysis,
                output_filepath="response.mp3"
            )
            
            return CombinedResponse(
                success=True,
                transcription=transcription,
                analysis=analysis,
                audio_response=audio_response_path if os.path.exists(audio_response_path) else None
            )
            
        finally:
            # Clean up temporary files
            os.unlink(img_tmp_path)
            os.unlink(audio_tmp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in combined analysis: {str(e)}")

# Text-to-speech endpoint
@app.post("/text-to-speech")
async def text_to_speech(text: str = Form(...)):
    """
    Convert text to speech
    """
    try:
        audio_file_path = text_to_speech_with_gtts(
            input_text=text,
            output_filepath="tts_output.mp3"
        )
        
        if os.path.exists(audio_file_path):
            return {
                "success": True,
                "audio_file": audio_file_path,
                "message": "Text converted to speech successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate audio file")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting text to speech: {str(e)}")

# Text-only analysis endpoint for chat
@app.post("/analyze-text")
async def analyze_text(query: str = Form(...)):
    """
    Analyze text-only medical queries using AI
    """
    try:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        # Create a medical-focused prompt
        medical_prompt = f"""You are a professional AI medical assistant. Please provide helpful, accurate medical information about the following query: "{query}"

        Guidelines:
        - Provide clear, concise medical information
        - Include general symptoms, causes, and treatment options when appropriate
        - Always recommend consulting a healthcare professional for proper diagnosis
        - Keep responses informative but not overly technical
        - Focus on general health information and common conditions
        - Do not provide specific medical diagnoses or prescriptions
        
        Query: {query}
        
        Please provide a helpful response:"""
        
        # Use Groq for text analysis
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI medical assistant that provides general health information and guidance."
                },
                {
                    "role": "user", 
                    "content": medical_prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        analysis = response.choices[0].message.content
        
        return {
            "success": True,
            "analysis": analysis,
            "query": query,
            "model_used": "llama-3.1-8b-instant"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

# Chat endpoint for general medical queries
@app.post("/chat")
async def chat_endpoint(message: str = Form(...), session_id: Optional[str] = Form(None)):
    """
    General chat endpoint for medical queries
    """
    try:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        # Create a medical-focused prompt
        medical_prompt = f"""You are a professional AI medical assistant. Please provide helpful, accurate medical information about the following query: "{message}"

        Guidelines:
        - Provide clear, concise medical information
        - Include general symptoms, causes, and treatment options when appropriate
        - Always recommend consulting a healthcare professional for proper diagnosis
        - Keep responses informative but not overly technical
        - Focus on general health information and common conditions
        - Do not provide specific medical diagnoses or prescriptions
        - Be empathetic and supportive in your responses
        
        Query: {message}
        
        Please provide a helpful response:"""
        
        # Use Groq for text analysis
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI medical assistant that provides general health information and guidance. Always be empathetic and supportive."
                },
                {
                    "role": "user", 
                    "content": medical_prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        analysis = response.choices[0].message.content
        
        return {
            "success": True,
            "response": analysis,
            "message": message,
            "session_id": session_id,
            "model_used": "llama-3.1-8b-instant"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

# Main analyze endpoint that the backend expects
@app.post("/analyze")
async def analyze_endpoint(request_data: dict):
    """
    Main analysis endpoint that handles text, audio, and image inputs
    """
    try:
        text_input = request_data.get('text_input')
        audio_file = request_data.get('audio_file')
        image_file = request_data.get('image_file')
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        # Handle text-only input
        if text_input and not audio_file and not image_file:
            # Create a medical-focused prompt
            medical_prompt = f"""You are a professional AI medical assistant. Please provide helpful, accurate medical information about the following query: "{text_input}"

            Guidelines:
            - Provide clear, concise medical information
            - Include general symptoms, causes, and treatment options when appropriate
            - Always recommend consulting a healthcare professional for proper diagnosis
            - Keep responses informative but not overly technical
            - Focus on general health information and common conditions
            - Do not provide specific medical diagnoses or prescriptions
            - Be empathetic and supportive in your responses
            
            Query: {text_input}
            
            Please provide a helpful response:"""
            
            # Use Groq for text analysis
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI medical assistant that provides general health information and guidance. Always be empathetic and supportive."
                    },
                    {
                        "role": "user", 
                        "content": medical_prompt
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            analysis = response.choices[0].message.content
            
            return {
                "success": True,
                "data": {
                    "analysis": analysis,
                    "input_type": "text",
                    "query": text_input,
                    "model_used": "llama-3.1-8b-instant"
                }
            }
        
        # Handle image analysis
        elif image_file and not audio_file:
            # For now, return a message that image analysis is not implemented
            return {
                "success": True,
                "data": {
                    "analysis": "Image analysis feature is currently being developed. Please try asking a text-based medical question instead.",
                    "input_type": "image",
                    "model_used": "not_implemented"
                }
            }
        
        # Handle audio analysis
        elif audio_file and not image_file:
            # For now, return a message that audio analysis is not implemented
            return {
                "success": True,
                "data": {
                    "analysis": "Audio analysis feature is currently being developed. Please try asking a text-based medical question instead.",
                    "input_type": "audio",
                    "model_used": "not_implemented"
                }
            }
        
        # Handle combined inputs
        else:
            return {
                "success": True,
                "data": {
                    "analysis": "Combined input analysis feature is currently being developed. Please try asking a text-based medical question instead.",
                    "input_type": "combined",
                    "model_used": "not_implemented"
                }
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in analysis: {str(e)}")

if __name__ == "__main__":
    # Check for required environment variables
    required_vars = ['GROQ_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file")
        exit(1)
    
    print("🚀 Starting AI Doctor FastAPI Service...")
    print("📍 Service will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    
    uvicorn.run(
        "fastapi_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )