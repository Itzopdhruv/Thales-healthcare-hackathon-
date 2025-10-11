from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
import re
import uuid
from datetime import datetime, timedelta
import asyncio

# Load environment variables
load_dotenv('config.env')

app = FastAPI(title="AI Therapist API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
current_emotions = {}
emotion_history = {}
active_sessions = {}

# Pydantic models
class EmotionDetectionRequest(BaseModel):
    image_data: str
    session_id: str

class EmotionDetectionResponse(BaseModel):
    emotion: str
    confidence: float
    session_id: str

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Initialize Google Generative AI
try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    model = genai.GenerativeModel('gemini-pro')
    print("✅ Google Generative AI initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Google Generative AI: {e}")
    model = None

# Initialize OpenCV face detector
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("✅ OpenCV face detector initialized successfully")
except Exception as e:
    print(f"❌ Error initializing face detector: {e}")
    face_cascade = None

def detect_emotion_simple(image_data):
    """Simple emotion detection using basic image analysis"""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return "neutral", 0.5
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4) if face_cascade else []
        
        if len(faces) == 0:
            return "neutral", 0.3
        
        # Simple emotion detection based on face features
        # This is a placeholder - in a real implementation, you'd use a trained model
        emotion = "neutral"
        confidence = 0.7
        
        # Basic heuristics (very simplified)
        face_region = gray[faces[0][1]:faces[0][1]+faces[0][3], faces[0][0]:faces[0][0]+faces[0][2]]
        
        # Calculate some basic features
        brightness = np.mean(face_region)
        contrast = np.std(face_region)
        
        if brightness > 120:
            emotion = "happy"
            confidence = 0.8
        elif brightness < 80:
            emotion = "sad"
            confidence = 0.7
        elif contrast > 50:
            emotion = "surprised"
            confidence = 0.6
        else:
            emotion = "neutral"
            confidence = 0.5
            
        return emotion, confidence
        
    except Exception as e:
        print(f"Error in emotion detection: {e}")
        return "neutral", 0.5

def generate_therapist_response(message, emotion, session_id):
    """Generate AI therapist response"""
    try:
        if not model:
            return "I'm sorry, the AI service is currently unavailable. Please try again later."
        
        # Get emotion history for this session
        session_emotions = emotion_history.get(session_id, [])
        recent_emotions = session_emotions[-5:] if len(session_emotions) > 5 else session_emotions
        
        # Create context-aware prompt
        emotion_context = f"Current emotion: {emotion}. Recent emotions: {', '.join(recent_emotions) if recent_emotions else 'None'}"
        
        prompt = f"""
        You are a compassionate AI therapist. The patient has shared: "{message}"
        
        {emotion_context}
        
        Please provide a supportive, empathetic response that:
        1. Acknowledges their feelings
        2. Offers practical advice or coping strategies
        3. Asks thoughtful follow-up questions
        4. Maintains a professional yet warm tone
        
        Keep your response concise but meaningful (2-3 sentences).
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Error generating response: {e}")
        return "I'm here to listen and help. Could you tell me more about what you're experiencing?"

@app.get("/")
async def root():
    return {"message": "AI Therapist API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "opencv": face_cascade is not None,
            "google_ai": model is not None
        }
    }

@app.post("/detect-emotion", response_model=EmotionDetectionResponse)
async def detect_emotion(request: EmotionDetectionRequest):
    try:
        emotion, confidence = detect_emotion_simple(request.image_data)
        
        # Store emotion in history
        if request.session_id not in emotion_history:
            emotion_history[request.session_id] = []
        emotion_history[request.session_id].append(emotion)
        
        # Update current emotions
        current_emotions[request.session_id] = {
            "emotion": emotion,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
        
        return EmotionDetectionResponse(
            emotion=emotion,
            confidence=confidence,
            session_id=request.session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting emotion: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get current emotion for this session
        current_emotion = current_emotions.get(request.session_id, {}).get("emotion", "neutral")
        
        # Generate response
        response = generate_therapist_response(request.message, current_emotion, request.session_id)
        
        return ChatResponse(
            response=response,
            session_id=request.session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.get("/session/{session_id}/emotions")
async def get_emotion_history(session_id: str):
    """Get emotion history for a session"""
    return {
        "session_id": session_id,
        "emotions": emotion_history.get(session_id, []),
        "current_emotion": current_emotions.get(session_id, {})
    }

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    active_sessions[session_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "emotion_detection":
                # Handle emotion detection
                emotion, confidence = detect_emotion_simple(message_data["image_data"])
                
                # Store emotion
                if session_id not in emotion_history:
                    emotion_history[session_id] = []
                emotion_history[session_id].append(emotion)
                
                current_emotions[session_id] = {
                    "emotion": emotion,
                    "confidence": confidence,
                    "timestamp": datetime.now().isoformat()
                }
                
                await websocket.send_text(json.dumps({
                    "type": "emotion_detected",
                    "emotion": emotion,
                    "confidence": confidence
                }))
                
            elif message_data.get("type") == "chat":
                # Handle chat message
                current_emotion = current_emotions.get(session_id, {}).get("emotion", "neutral")
                response = generate_therapist_response(message_data["message"], current_emotion, session_id)
                
                await websocket.send_text(json.dumps({
                    "type": "chat_response",
                    "response": response
                }))
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if session_id in active_sessions:
            del active_sessions[session_id]

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Therapist API...")
    print("📝 Available endpoints:")
    print("   GET  / - Health check")
    print("   GET  /health - Detailed health status")
    print("   POST /detect-emotion - Detect emotion from image")
    print("   POST /chat - Chat with AI therapist")
    print("   GET  /session/{session_id}/emotions - Get emotion history")
    print("   WS   /ws/{session_id} - WebSocket connection")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
