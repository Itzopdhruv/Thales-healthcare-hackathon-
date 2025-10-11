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
    patient_context: dict = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    emotion: str

class SessionRequest(BaseModel):
    patient_id: str

class SessionResponse(BaseModel):
    session_id: str
    status: str

# Initialize models
def initialize_models():
    global emotion_model, face_detector
    
    try:
        # Load emotion detection model (using real Keras model)
        print("Loading emotion detection model...")
        try:
            from keras.models import load_model
            # Try different paths for the model
            model_paths = [
                '../AI THERAPIST/mobile_net_v2_firstmodel.h5',
                'AI THERAPIST/mobile_net_v2_firstmodel.h5',
                './AI THERAPIST/mobile_net_v2_firstmodel.h5'
            ]
            
            model_loaded = False
            for path in model_paths:
                try:
                    print(f"Trying to load model from: {path}")
                    emotion_model = load_model(path)
                    print(f"Real emotion detection model loaded successfully from {path}!")
                    model_loaded = True
                    break
                except Exception as path_error:
                    print(f"Failed to load from {path}: {path_error}")
                    continue
            
            if not model_loaded:
                raise Exception("Could not load model from any path")
                
        except Exception as model_error:
            print(f"Could not load real model: {model_error}")
            print("Falling back to rule-based system")
            emotion_model = "rule_based"
        
        # Load face detector
        face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        print("Face detector loaded successfully")
        
        print("All models loaded successfully!")
        
    except Exception as e:
        print(f"Error initializing models: {e}")
        import traceback
        traceback.print_exc()

# Predict emotion from image
def predict_emotion(image_data):
    try:
        print(f"🔍 Starting emotion detection...")
        print(f"📊 Image data length: {len(image_data) if image_data else 'None'}")
        
        # Enhanced validation
        if not image_data or len(image_data) < 100:
            print("❌ Invalid image data - too small or empty")
            return "Neutral", 0.5
        
        print(f"🔄 Decoding base64 image data...")
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        print(f"📦 Decoded bytes length: {len(image_bytes)}")
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        print(f"🔢 NumPy array shape: {nparr.shape}")
        
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            print("❌ Failed to decode image with OpenCV")
            return "Neutral", 0.5
        
        print(f"✅ Image decoded successfully: {image.shape}")
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        print(f"🔘 Converted to grayscale: {gray.shape}")
        
        # Detect faces using grayscale
        faces = face_detector.detectMultiScale(gray, 1.1, 4)
        print(f"👤 Detected {len(faces)} faces")
        
        if len(faces) == 0:
            print("❌ No faces detected in image")
            return "Neutral", 0.5
        
        # Get the largest face
        largest_face = max(faces, key=lambda x: x[2] * x[3])
        x, y, w, h = largest_face
        
        # Use the original color image for emotion detection, not grayscale
        face_roi = image[y:y+h, x:x+w]  # Use original BGR image
        print(f"🎯 Using color face ROI: {face_roi.shape}")
        
        print(f"🎯 Processing largest face: {w}x{h} at ({x},{y})")
        
        # Use real Keras model for emotion detection
        if emotion_model != "rule_based":
            print(f"🧠 Using Keras model for emotion detection...")
            emotion, confidence = detect_emotion_keras(face_roi)
        else:
            print(f"📊 Using rule-based emotion detection...")
            # Fallback to rule-based system
            emotion, confidence = detect_emotion_simple(face_roi)
        
        print(f"🎉 Final result: {emotion} (confidence: {confidence:.2f})")
        return emotion, confidence
        
    except Exception as e:
        print(f"💥 Error in emotion prediction: {e}")
        import traceback
        traceback.print_exc()
        return "Neutral", 0.5

# Real Keras model emotion detection
def detect_emotion_keras(face_roi):
    try:
        print(f"🔍 Processing face ROI shape: {face_roi.shape}")
        
        # Ensure we have a 3-channel RGB image
        if len(face_roi.shape) == 2:
            # Grayscale image - convert to RGB
            print("🔄 Converting grayscale to RGB...")
            face_roi = cv2.cvtColor(face_roi, cv2.COLOR_GRAY2RGB)
        elif len(face_roi.shape) == 3 and face_roi.shape[2] == 1:
            # Single channel - convert to RGB
            print("🔄 Converting single channel to RGB...")
            face_roi = cv2.cvtColor(face_roi, cv2.COLOR_GRAY2RGB)
        elif len(face_roi.shape) == 3 and face_roi.shape[2] == 3:
            # 3-channel image - convert BGR to RGB
            print("🔄 Converting BGR to RGB...")
            face_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
        else:
            print(f"⚠️ Unexpected shape: {face_roi.shape}, converting to RGB...")
            face_roi = cv2.cvtColor(face_roi, cv2.COLOR_GRAY2RGB)
        
        print(f"✅ Final face ROI shape: {face_roi.shape}")
        
        # Resize to model input size (224x224 for MobileNetV2)
        final_image = cv2.resize(face_roi, (224, 224))
        print(f"📐 Resized image shape: {final_image.shape}")
        
        # Add batch dimension and normalize
        final_image = np.expand_dims(final_image, axis=0)
        final_image = final_image / 255.0
        
        print(f"🎯 Final input shape for model: {final_image.shape}")
        print(f"🎯 Expected: (1, 224, 224, 3) - Got: {final_image.shape}")
        
        # Make prediction
        predictions = emotion_model.predict(final_image, verbose=0)
        
        # Get emotion labels (same as in original FIDO)
        emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Surprise", "Sad", "Neutral"]
        
        # Debug: Print all predictions
        print(f"🔍 All emotion predictions: {predictions[0]}")
        for i, (label, score) in enumerate(zip(emotion_labels, predictions[0])):
            print(f"  {label}: {score:.3f}")
        
        predicted_emotion = emotion_labels[np.argmax(predictions)]
        confidence = float(np.max(predictions))
        
        # Boost sensitivity for better emotion detection
        # Apply a multiplier to make emotions more detectable
        sensitivity_multiplier = 1.5
        boosted_predictions = predictions[0] * sensitivity_multiplier
        boosted_predictions = np.clip(boosted_predictions, 0, 1)  # Keep within [0,1] range
        
        print(f"🚀 Boosted predictions (x{sensitivity_multiplier}): {boosted_predictions}")
        
        # Use boosted predictions for final decision
        predicted_emotion = emotion_labels[np.argmax(boosted_predictions)]
        confidence = float(np.max(boosted_predictions))
        
        # If confidence is still too low, try to boost it or use second best
        if confidence < 0.4:
            print(f"⚠️ Low confidence ({confidence:.3f}), checking second best...")
            sorted_indices = np.argsort(boosted_predictions)[::-1]
            second_best_idx = sorted_indices[1]
            second_best_emotion = emotion_labels[second_best_idx]
            second_best_confidence = float(boosted_predictions[second_best_idx])
            print(f"  Second best: {second_best_emotion} ({second_best_confidence:.3f})")
            
            # Use second best if it's significantly better
            if second_best_confidence > confidence * 1.2:
                predicted_emotion = second_best_emotion
                confidence = second_best_confidence
                print(f"🔄 Using second best: {predicted_emotion} ({confidence:.3f})")
        
        print(f"🎯 Final Keras prediction: {predicted_emotion} with confidence: {confidence:.3f}")
        return predicted_emotion, confidence
        
    except Exception as e:
        print(f"Error in Keras emotion detection: {e}")
        return "Neutral", 0.5

# Simple emotion detection based on facial features (fallback)
def detect_emotion_simple(face_roi):
    try:
        # Convert to grayscale if not already
        if len(face_roi.shape) == 3:
            face_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Resize for consistent processing
        face_resized = cv2.resize(face_roi, (100, 100))
        
        # Calculate basic features
        # Brightness (higher = happier)
        brightness = np.mean(face_resized)
        
        # Contrast (higher = more expressive)
        contrast = np.std(face_resized)
        
        # Edge density (higher = more tense/angry)
        edges = cv2.Canny(face_resized, 50, 150)
        edge_density = np.sum(edges > 0) / (face_resized.shape[0] * face_resized.shape[1])
        
        # Simple rule-based emotion detection
        if brightness > 120 and contrast > 30 and edge_density < 0.1:
            return "Happy", 0.8
        elif brightness < 100 and contrast > 25:
            return "Sad", 0.7
        elif edge_density > 0.15 and contrast > 35:
            return "Angry", 0.75
        elif brightness > 110 and edge_density < 0.08:
            return "Surprise", 0.7
        elif brightness < 110 and edge_density > 0.12:
            return "Fear", 0.65
        else:
            return "Neutral", 0.6
            
    except Exception as e:
        print(f"Error in simple emotion detection: {e}")
        return "Neutral", 0.5

# Initialize FIDO bot
def initialize_fido_bot(current_mood):
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        return model
        
    except Exception as e:
        print(f"Error initializing FIDO bot: {e}")
        return None

# Generate FIDO response
def get_fido_response(message, current_mood):
    try:
        model = initialize_fido_bot(current_mood)
        if not model:
            return "I'm here to listen and support you. Could you tell me more about what's on your mind?"
        
        # Different prompts based on mood
        if current_mood in ['Happy', 'Surprise']:
            prompt = f'''You are FIDO, a Personal AI Therapist. The user is in a happy mood. 
            Acknowledge their positive state and engage in uplifting conversation. 
            Ask follow-up questions to maintain their positive energy. 
            Keep responses warm, empathetic, and joyful. Limit to 60-80 words.
            User message: {message}'''
        elif current_mood in ['Angry', 'Disgust']:
            prompt = f'''You are FIDO, a Personal AI Therapist. The user seems angry or frustrated. 
            Use a calming tone and help them process their emotions. 
            Ask gentle questions to understand what's bothering them.
            Focus on de-escalation and emotional support. Limit to 60-80 words.
            User message: {message}'''
        elif current_mood in ['Fear', 'Sad']:
            prompt = f'''You are FIDO, a Personal AI Therapist. The user appears sad or fearful. 
            Show empathy and understanding. Offer comfort and support.
            Ask caring questions to help them express their feelings.
            Be gentle and reassuring. Limit to 60-80 words.
            User message: {message}'''
        else:
            prompt = f'''You are FIDO, a Personal AI Therapist. Engage in therapeutic conversation.
            Ask follow-up questions and show genuine care. 
            Help the user process their thoughts and feelings.
            Be warm and empathetic. Limit to 60-80 words.
            User message: {message}'''
        
        response = model.generate_content(prompt)
        return clean_text(response.text)
    except Exception as e:
        print(f"Error generating FIDO response: {e}")
        return "I'm here to listen and support you. Could you tell me more about what's on your mind?"

# Clean text response
def clean_text(text):
    # Remove extra whitespace and clean up
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove any unwanted characters
    text = re.sub(r'[^\w\s.,!?;:\-()]', '', text)
    return text

# Startup event
@app.on_event("startup")
async def startup_event():
    initialize_models()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI Therapist API is running"}

# Test emotion detection endpoint
@app.get("/test-emotion")
async def test_emotion():
    try:
        # Test if face detector is loaded
        if face_detector is None:
            return {"error": "Face detector not loaded"}
        
        # Test if API key is available
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return {"error": "Google API key not found"}
        
        return {
            "status": "ok",
            "face_detector_loaded": face_detector is not None,
            "api_key_available": bool(api_key),
            "active_sessions": len(active_sessions)
        }
    except Exception as e:
        return {"error": str(e)}

# Debug image processing endpoint
@app.post("/debug-image")
async def debug_image(request: EmotionDetectionRequest):
    try:
        print(f"=== DEBUG IMAGE PROCESSING ===")
        print(f"Session ID: {request.session_id}")
        print(f"Image data length: {len(request.image_data) if request.image_data else 0}")
        print(f"Image data preview: {request.image_data[:100] if request.image_data else 'None'}...")
        
        # Test base64 decoding
        try:
            image_bytes = base64.b64decode(request.image_data)
            print(f"Base64 decode successful. Bytes length: {len(image_bytes)}")
        except Exception as e:
            print(f"Base64 decode failed: {e}")
            return {"error": f"Base64 decode failed: {e}"}
        
        # Test OpenCV decoding
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                print("OpenCV decode failed - image is None")
                return {"error": "OpenCV decode failed - image is None"}
            print(f"OpenCV decode successful. Image shape: {image.shape}")
        except Exception as e:
            print(f"OpenCV decode failed: {e}")
            return {"error": f"OpenCV decode failed: {e}"}
        
        # Test face detection
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, 1.1, 4)
            print(f"Face detection successful. Found {len(faces)} faces")
        except Exception as e:
            print(f"Face detection failed: {e}")
            return {"error": f"Face detection failed: {e}"}
        
        return {
            "status": "success",
            "image_shape": image.shape,
            "faces_detected": len(faces),
            "faces": faces.tolist() if len(faces) > 0 else []
        }
        
    except Exception as e:
        print(f"Debug image processing error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Start therapy session
@app.post("/session/start", response_model=SessionResponse)
async def start_session(request: SessionRequest):
    session_id = f"session_{int(datetime.now().timestamp())}_{request.patient_id}"
    
    active_sessions[session_id] = {
        "patient_id": request.patient_id,
        "start_time": datetime.now(),
        "emotions": [],
        "messages": []
    }
    
    emotion_history[session_id] = []
    current_emotions[session_id] = "Neutral"
    
    return SessionResponse(session_id=session_id, status="started")

# Emotion detection endpoint
@app.post("/emotion/detect", response_model=EmotionDetectionResponse)
async def detect_emotion(request: EmotionDetectionRequest):
    try:
        print(f"🎯 Received emotion detection request for session: {request.session_id}")
        print(f"📊 Image data length: {len(request.image_data) if request.image_data else 0}")
        print(f"🔍 Image data preview: {request.image_data[:50] if request.image_data else 'None'}...")
        
        emotion, confidence = predict_emotion(request.image_data)
        
        # Update session data
        if request.session_id in active_sessions:
            active_sessions[request.session_id]["emotions"].append({
                "emotion": emotion,
                "confidence": confidence,
                "timestamp": datetime.now()
            })
            
            # Update current emotion (use most recent)
            current_emotions[request.session_id] = emotion
            
            # Update emotion history
            if request.session_id not in emotion_history:
                emotion_history[request.session_id] = []
            
            emotion_history[request.session_id].append(emotion)
            
            # Keep only last 10 emotions
            if len(emotion_history[request.session_id]) > 10:
                emotion_history[request.session_id] = emotion_history[request.session_id][-10:]
        
        print(f"Returning emotion: {emotion} with confidence: {confidence}")
        return EmotionDetectionResponse(
            emotion=emotion,
            confidence=confidence,
            session_id=request.session_id
        )
        
    except Exception as e:
        print(f"Error in emotion detection: {e}")
        import traceback
        traceback.print_exc()
        return EmotionDetectionResponse(
            emotion="Neutral",
            confidence=0.5,
            session_id=request.session_id
        )

# Update mood endpoint
@app.post("/update-mood")
async def update_mood(request: dict):
    try:
        session_id = request.get('session_id')
        mood = request.get('mood', 'neutral')
        
        if session_id:
            current_emotions[session_id] = mood
            print(f"🎭 Updated mood for session {session_id}: {mood}")
            return {"status": "success", "mood": mood}
        else:
            return {"status": "error", "message": "Session ID required"}
    except Exception as e:
        print(f"Error updating mood: {e}")
        return {"status": "error", "message": str(e)}

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_with_fido(request: ChatRequest):
    try:
        # Get current emotion for this session
        current_mood = current_emotions.get(request.session_id, "Neutral")
        
        # Generate FIDO response
        response = get_fido_response(request.message, current_mood)
        
        # Update session data
        if request.session_id in active_sessions:
            active_sessions[request.session_id]["messages"].append({
                "user_message": request.message,
                "fido_response": response,
                "emotion": current_mood,
                "timestamp": datetime.now()
            })
        
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            emotion=current_mood
        )
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return ChatResponse(
            response="I'm here to listen and support you. Could you tell me more about what's on your mind?",
            session_id=request.session_id,
            emotion="Neutral"
        )

# End therapy session
@app.post("/session/{session_id}/end")
async def end_session(session_id: str):
    if session_id in active_sessions:
        active_sessions[session_id]["end_time"] = datetime.now()
        return {"status": "session_ended", "session_id": session_id}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

# Save session data
@app.post("/save-session")
async def save_session(session_data: dict):
    try:
        # In a real implementation, you would save this to a database
        # For now, we'll just store it in memory
        session_id = f"session_{int(datetime.now().timestamp())}_{session_data.get('patient_id', 'anonymous')}"
        active_sessions[session_id] = session_data
        return {"status": "saved", "session_id": session_id}
    except Exception as e:
        print(f"Error saving session: {e}")
        raise HTTPException(status_code=500, detail="Failed to save session")

# Get session history
@app.get("/session-history/{patient_id}")
async def get_session_history(patient_id: str):
    try:
        # In a real implementation, you would query a database
        # For now, we'll return sessions for this patient
        patient_sessions = []
        for session_id, session_data in active_sessions.items():
            if session_data.get('patient_id') == patient_id:
                patient_sessions.append(session_data)
        
        return {"sessions": patient_sessions}
    except Exception as e:
        print(f"Error loading session history: {e}")
        return {"sessions": []}

# WebSocket for real-time video streaming
@app.websocket("/ws/{session_id}/video")
async def websocket_video(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        while True:
            # Receive video frame data
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            # Process emotion detection
            emotion, confidence = predict_emotion(frame_data["image"])
            
            # Send emotion data back
            await websocket.send_text(json.dumps({
                "emotion": emotion,
                "confidence": confidence,
                "session_id": session_id
            }))
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)