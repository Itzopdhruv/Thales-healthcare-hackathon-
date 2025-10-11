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
import tensorflow as tf
from collections import Counter
import time

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
emotion_model = None
face_detector = None
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
    # Set API key directly from config.env file
    api_key = "AIzaSyCrCd7CjUyz6-dZ-TM06KoS-AWS0LF0iws"
    print(f"[DEBUG] Configuring Gemini with API key: {api_key[:10]}...")
    genai.configure(api_key=api_key)
    print("[DEBUG] API key configured successfully")
    
    print("[DEBUG] Creating GenerativeModel with gemini-2.5-flash")
    model = genai.GenerativeModel('gemini-2.5-flash')
    print("[SUCCESS] Google Generative AI initialized successfully")
    print(f"[DEBUG] Model object: {model}")
    print(f"[DEBUG] Model name: {model.model_name}")
except Exception as e:
    print(f"[ERROR] Error initializing Google Generative AI: {e}")
    print(f"[ERROR] Error type: {type(e)}")
    print(f"[ERROR] Error details: {str(e)}")
    model = None

# Initialize OpenCV face detector
try:
    face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if face_detector.empty():
        print("[ERROR] Could not load Haar cascade classifier")
        face_detector = None
    else:
        print("[SUCCESS] OpenCV face detector initialized successfully")
except Exception as e:
    print(f"[ERROR] Error initializing face detector: {e}")
    face_detector = None

# Load the emotion detection model
def load_emotion_model():
    global emotion_model
    try:
        # Try to load the model from the AI THERAPIST directory
        model_path = "../AI THERAPIST/mobile_net_v2_firstmodel.h5"
        if os.path.exists(model_path):
            from keras.models import load_model
            emotion_model = load_model(model_path)
            print("[SUCCESS] Emotion model loaded successfully from AI THERAPIST directory")
            return True
        else:
            print("[ERROR] Model file not found at:", model_path)
            print("[INFO] Using fallback emotion detection (no ML model)")
            return False
    except Exception as e:
        print(f"[ERROR] Error loading emotion model: {e}")
        print("[INFO] Using fallback emotion detection (no ML model)")
        return False

# Load the model
load_emotion_model()

def clean_text(text):
    """Clean text by removing emojis and special characters"""
    import re
    # Remove emojis and special Unicode characters
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def predict_emotion(face_image):
    """Predict emotion using the MobileNetV2 model or fallback method"""
    try:
        if emotion_model is None:
            return predict_emotion_fallback(face_image)
        
        # Decode the image if it's base64
        if isinstance(face_image, str):
            face_image = base64.b64decode(face_image)
        
        # Convert to numpy array
        if not isinstance(face_image, np.ndarray):
            face_image = cv2.imdecode(np.frombuffer(face_image, np.uint8), cv2.IMREAD_COLOR)
        
        # Ensure array is C-contiguous
        face_image = np.ascontiguousarray(face_image)
        
        # Resize to model input size (224x224)
        final_image = cv2.resize(face_image, (224, 224))
        final_image = np.expand_dims(final_image, axis=0)
        final_image = final_image / 255.0  # Normalize
        final_image = np.ascontiguousarray(final_image)

        # Make prediction
        predictions = emotion_model.predict(final_image, verbose=0)
        
        # Emotion labels (same as in the original AI THERAPIST)
        emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Surprise", "Sad", "Neutral"]
        predicted_emotion = emotion_labels[np.argmax(predictions)]
        confidence = float(np.max(predictions))
        
        return predicted_emotion, confidence
        
    except Exception as e:
        print(f"Model prediction failed: {e}")
        return predict_emotion_fallback(face_image)

def predict_emotion_fallback(face_image):
    """Fallback emotion detection using basic image analysis"""
    try:
        # Decode the image if it's base64
        if isinstance(face_image, str):
            face_image = base64.b64decode(face_image)
        
        # Convert to numpy array
        face_image = cv2.imdecode(np.frombuffer(face_image, np.uint8), cv2.IMREAD_COLOR)
        
        if face_image is None:
            return "Neutral", 0.3
        
        # Ensure array is C-contiguous
        face_image = np.ascontiguousarray(face_image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        
        # Calculate basic features
        brightness = np.mean(gray)
        contrast = np.std(gray)
        
        # Simple heuristics based on image features
        if brightness > 140:
            return "Happy", 0.7
        elif brightness < 80:
            return "Sad", 0.6
        elif contrast > 60:
            return "Surprise", 0.5
        elif contrast < 30:
            return "Neutral", 0.6
        else:
            return "Neutral", 0.5
        
    except Exception as e:
        print(f"Fallback prediction failed: {e}")
        return "Neutral", 0.5

def detect_emotion_from_image(image_data):
    """Detect emotion from a single image using face detection + emotion prediction"""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return "Neutral", 0.3
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        if face_detector is None:
            return "Neutral", 0.3
            
        faces = face_detector.detectMultiScale(
            gray, 
            scaleFactor=1.1,   # Original sensitivity
            minNeighbors=3,    # Original strictness
            minSize=(30, 30),  # Original minimum size
            maxSize=(300, 300), # Original maximum size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        if len(faces) == 0:
            return "No Face", 0.0
        
        # Get the largest face
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        
        # Validate face size - should be reasonable for a full face
        if w < 20 or h < 20:
            return "No Face", 0.0
        
        # Expand ROI for better emotion detection
        def expand_roi(x, y, w, h, scale_w, scale_h, img_shape):
            new_x = max(int(x - w * (scale_w - 1) / 2), 0)
            new_y = max(int(y - h * (scale_h - 1) / 2), 0)
            new_w = min(int(w * scale_w), img_shape[1] - new_x)
            new_h = min(int(h * scale_h), img_shape[0] - new_y)
            return new_x, new_y, new_w, new_h
        
        scale_w = 1.3  # Original horizontal expansion
        scale_h = 1.5  # Original vertical expansion
        new_x, new_y, new_w, new_h = expand_roi(x, y, w, h, scale_w, scale_h, image.shape)
        
        # Extract face region
        face_roi = image[new_y:new_y+new_h, new_x:new_x+new_w]
        
        # Predict emotion
        emotion, confidence = predict_emotion(face_roi)
        
        # Convert Surprise to Neutral (as in original)
        if emotion == "Surprise":
            emotion = "Neutral"
            
        print(f"Face detected: {w}x{h} at ({x},{y}) - Emotion: {emotion} ({confidence:.2f})")
        
        return emotion, confidence
        
    except Exception as e:
        print(f"❌ ERROR IN EMOTION DETECTION: {e}")
        print("=" * 50)
        return "Neutral", 0.5

def generate_therapist_response(message, emotion, session_id):
    """Generate AI therapist response based on emotion"""
    try:
        print(f"[DEBUG] generate_therapist_response called with message: {message[:50]}...")
        print(f"[DEBUG] Model object: {model}")
        print(f"[DEBUG] Model is None: {model is None}")
        
        if not model:
            print("❌ Gemini model is not initialized")
            return "I'm sorry, the AI service is currently unavailable. Please try again later."
        
        # Get emotion history for this session
        session_emotions = emotion_history.get(session_id, [])
        recent_emotions = session_emotions[-5:] if len(session_emotions) > 5 else session_emotions
        
        # Create context-aware prompt based on emotion
        if emotion in ['Happy', 'Surprise']:
            mood_context = f"The user is in a happy and joyful mood. Acknowledge this and complement them accordingly."
            tone = "warm, empathetic, and therapeutic and joyful tone"
        elif emotion in ['Angry', 'Disgust']:
            mood_context = f"The user is in an angry mood. Keep a calming tone and try to calm down the user by hearing and replying appropriately."
            tone = "warm, empathetic, and therapeutic tone"
        elif emotion in ['Fear', 'Sad']:
            mood_context = f"The user seems to be in a sad mood. Acknowledge this and console them accordingly."
            tone = "warm, empathetic, and therapeutic tone"
        else:
            mood_context = f"The user is in a neutral mood. Engage like a friendly counsellor."
            tone = "warm, empathetic tone"
        
        prompt = f"""
        You are a Personal Therapist named Fido. Your goal is to uplift user mental health and engage in a deep human-like conversation. 
        Your goal as therapist should be to engage in therapeutic conversations, asking follow up questions and talk like a caring friend like a counsellor. 
        You should be hearing the user more. 
        
        IMPORTANT: Do not use any emojis, special characters, or Unicode symbols in your response. Use only plain text.
        
        Current emotion: {emotion}
        Recent emotions: {', '.join(recent_emotions) if recent_emotions else 'None'}
        
        {mood_context}
        
        The user's message: "{message}"
        
        Respond to their queries with a {tone}, considering their mood, and aim to improve their emotional well-being. 
        Keep it engaging by adding follow up questions, make it like a human conversation. 
        Limit your answer to 60-80 words.
        """
        
        print(f"🤖 Calling Gemini API with prompt length: {len(prompt)}")
        response = model.generate_content(prompt)
        print(f"🤖 Gemini response received: {response.text[:100]}...")
        # Clean any emojis or special characters that might come through
        cleaned_response = clean_text(response.text)
        print(f"🤖 Cleaned response: {cleaned_response[:100]}...")
        return cleaned_response
        
    except Exception as e:
        print(f"❌ ERROR in generate_therapist_response: {e}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {str(e)}")
        return "I'm here to listen and help. Could you tell me more about what you're experiencing?"

@app.get("/")
async def root():
    return {"message": "AI Therapist API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
        return {
        "status": "healthy",
        "services": {
            "opencv": face_detector is not None,
            "google_ai": model is not None,
            "emotion_model": emotion_model is not None
        }
    }

@app.post("/detect-emotion", response_model=EmotionDetectionResponse)
async def detect_emotion(request: EmotionDetectionRequest):
    try:
        emotion, confidence = detect_emotion_from_image(request.image_data)
        
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
        current_emotion = current_emotions.get(request.session_id, {}).get("emotion", "Neutral")
        
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
                emotion, confidence = detect_emotion_from_image(message_data["image_data"])
                
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
                current_emotion = current_emotions.get(session_id, {}).get("emotion", "Neutral")
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

@app.post("/update-mood")
async def update_mood(request: dict):
    """Update mood for a session"""
    try:
        session_id = request.get("session_id")
        mood = request.get("mood")
        
        if not session_id or not mood:
            raise HTTPException(status_code=400, detail="session_id and mood are required")
        
        # Store mood in session data
        if session_id not in emotion_history:
            emotion_history[session_id] = []
        
        emotion_history[session_id].append({
            "mood": mood,
            "timestamp": datetime.now().isoformat()
        })
        
        return {"status": "success", "message": "Mood updated successfully"}
    except Exception as e:
        print(f"Error updating mood: {e}")
        raise HTTPException(status_code=500, detail="Failed to update mood")

@app.post("/save-session")
async def save_session(request: dict):
    """Save therapy session data"""
    try:
        # In a real application, you would save this to a database
        # For now, we'll just return success
        session_id = request.get("patient_id", "anonymous")
        print(f"Session saved for patient: {session_id}")
        
        return {
            "status": "success", 
            "message": "Session saved successfully",
            "session_id": session_id
        }
    except Exception as e:
        print(f"Error saving session: {e}")
        raise HTTPException(status_code=500, detail="Failed to save session")

@app.get("/session-history/{patient_id}")
async def get_session_history(patient_id: str):
    """Get session history for a patient"""
    try:
        # In a real application, you would fetch this from a database
        # For now, we'll return empty sessions
        return {
            "patient_id": patient_id,
            "sessions": []
        }
    except Exception as e:
        print(f"Error getting session history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session history")

if __name__ == "__main__":
    import uvicorn
    print("[STARTING] AI Therapist API...")
    print("[INFO] Available endpoints:")
    print("   GET  / - Health check")
    print("   GET  /health - Detailed health status")
    print("   POST /detect-emotion - Detect emotion from image")
    print("   POST /chat - Chat with AI therapist")
    print("   POST /update-mood - Update mood for session")
    print("   POST /save-session - Save therapy session")
    print("   GET  /session-history/{patient_id} - Get session history")
    print("   GET  /session/{session_id}/emotions - Get emotion history")
    print("   WS   /ws/{session_id} - WebSocket connection")
    print("[INFO] Server will be available at: http://localhost:8001")
    print("[INFO] API docs at: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)