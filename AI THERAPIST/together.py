from flask import Flask, render_template, url_for, Response, request, jsonify
import cv2
from keras.models import load_model
import numpy as np
import time
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import re
import os
from dotenv import load_dotenv

# Load environment variables from config.env
load_dotenv('config.env')

app = Flask(__name__,static_url_path='/static')

# Opens Camera
cam = cv2.VideoCapture(0)
if not cam.isOpened():
    print("Error: Could not open camera")
    cam = None
else:
    print("Camera opened successfully")
# Loading the face detection and the emotion classification models
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
if face_detector.empty():
    print("Error: Could not load Haar cascade classifier")
else:
    print("Haar cascade classifier loaded successfully")

model = load_model('mobile_net_v2_firstmodel.h5')
print("Emotion model loaded successfully")
max_emotion = None
max_count = 0
emotion_history = []  # Store recent emotions for smoothing

def predict_emotion(face_image):
    face_image = cv2.imdecode(np.frombuffer(face_image, np.uint8), cv2.IMREAD_COLOR)
    final_image = cv2.resize(face_image, (224, 224))
    final_image = np.expand_dims(final_image, axis=0)
    final_image = final_image / 255.0

    predictions = model.predict(final_image)

    emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Surprise", "Sad", "Neutral"]
    predicted_emotion = emotion_labels[np.argmax(predictions)]

    return predicted_emotion

def detection():
    face_images = []
    capture_interval = 1
    start_time = time.time()
    
    global max_count, max_emotion, emotion_history

    if cam is None:
        print("Camera not available")
        return

    frame_count = 0
    while True:
        ret, frame = cam.read()
        if not ret:
            print("Failed to read from camera")
            break
        
        frame_count += 1
        if frame_count % 30 == 0:  # Print every 30 frames (about 1 second)
            print(f"Processing frame {frame_count}, size: {frame.shape}")

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # More robust face detection parameters - less sensitive to distance/angle
        faces = face_detector.detectMultiScale(
            gray, 
            scaleFactor=1.1,           # Slightly larger steps (less sensitive)
            minNeighbors=2,            # Fewer neighbors required (more permissive)
            minSize=(20, 20),          # Smaller minimum size (detects faces further away)
            maxSize=(300, 300),        # Maximum size limit
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # Only print every 10th frame to reduce spam
        if frame_count % 10 == 0:
            print(f"Faces detected: {len(faces)}")

        if len(faces) > 0:
            largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
            x, y, w, h = largest_face

            def expand_roi(x, y, w, h, scale_w, scale_h, img_shape):
                new_x = max(int(x - w * (scale_w - 1) / 2), 0)
                new_y = max(int(y - h * (scale_h - 1) / 2), 0)
                new_w = min(int(w * scale_w), img_shape[1] - new_x)
                new_h = min(int(h * scale_h), img_shape[0] - new_y)
                return new_x, new_y, new_w, new_h

            scale_w = 1.3
            scale_h = 1.5

            new_x, new_y, new_w, new_h = expand_roi(x, y, w, h, scale_w, scale_h, frame.shape)
            roi_color = frame[new_y:new_y+new_h, new_x:new_x+new_w]

            if time.time() - start_time >= capture_interval:
                face_images.append(cv2.imencode('.png', roi_color)[1].tobytes())
                if len(face_images) > 5:
                    face_images.pop(0)
                start_time = time.time()
                
            emotion_counts = {"Angry": 0, "Disgust": 0, "Fear": 0, "Happy": 0, "Surprise": 0, "Sad": 0, "Neutral": 0}
            if len(face_images) >= 2:  # Reduced threshold for faster detection
                    for face_image in face_images:
                        predicted_emotion = predict_emotion(face_image)
                        emotion_counts[predicted_emotion] += 1

                    current_emotion = max(emotion_counts, key=emotion_counts.get)
                    max_count = emotion_counts[current_emotion]
                    
                    # Add to emotion history for smoothing
                    emotion_history.append(current_emotion)
                    if len(emotion_history) > 10:  # Keep only last 10 emotions
                        emotion_history.pop(0)
                    
                    # Use most common emotion from recent history
                    if len(emotion_history) >= 3:
                        from collections import Counter
                        emotion_counts_smooth = Counter(emotion_history)
                        max_emotion = emotion_counts_smooth.most_common(1)[0][0]
                    else:
                        max_emotion = current_emotion
                    
                    if frame_count % 10 == 0:  # Print less frequently
                        print(f"Detected emotion: {max_emotion} (confidence: {max_count}/{len(face_images)})")
            
            # Display current emotion or "Detecting..."
            status = max_emotion if max_emotion else "Detecting..."
            if status == "Surprise":
                status = "Neutral"
            
            cv2.putText(frame, f"Emotion: {status}", (10, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2, cv2.LINE_4)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)   
                    #face_images=[]

        else:
            # No face detected
            cv2.putText(frame, "No face detected", (10, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2, cv2.LINE_4)

        if cv2.waitKey(1) & 0xFF == 13:
            break
        
        ret, buffer = cv2.imencode('.png', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/png\r\n\r\n' + frame + b'\r\n')
    cam.release()
    cv2.destroyAllWindows()

def initialize_bot(current_mood):
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your config.env file.")
    genai.configure(api_key = api_key)
    
    if current_mood=='Happy' or current_mood=='Surprise':
        title_template = PromptTemplate(input_variables = ['topic','current_mood'], template = 'You are a Personal Therapist named Fido. Your goal is to uplift user mental health and engage in a deep human-like conversation. Your goal as therapist should be to engage in therapeutic conservations, asking follow up questions and talk like a caring friend like a counsellor. You should be hearing the user more. The user is in a happy and joyful mood. Acknowledge this and complement them accordingly. Do engage like a friendly counsellor and make the conversation worth holding up to. Keeping that in mind, the query of the user is: {topic}. Respond to their queries with a warm, empathetic, and therapeutic and joyful tone, considering their mood, and aim to improve their emotional well-being. Keep it engaging by adding follow up questions, make it like a joyful human conversation. Limit your answer upto 60-80 words.')
    elif current_mood=='Angry' or current_mood=='Disgust':
        title_template = PromptTemplate(input_variables = ['topic','current_mood'], template = 'You are a Personal Therapist named Fido. Your goal is to uplift user mental health and engage in a deep human-like conversation. Your goal as therapist should be to engage in therapeutic conservations, asking follow up questions and talk like a caring friend like a counsellor. You should be hearing the user more. The user is in an angry mood. Do engage like a friendly counsellor. Keeping that in mind, the query of the user is: {topic}. Respond to their queries with a warm, empathetic, and therapeutic tone, considering their mood, and aim to improve their emotional well-being. Keep it engaging by adding follow up questions, make it like a human conversation. Keep a calming tone and try to calm down the user by hearing and replying appropriately. Limit your answer upto 60-80 words.')
    elif current_mood=='Fear' or current_mood=='Sad':
        title_template = PromptTemplate(input_variables = ['topic','current_mood'], template = 'You are a Personal Therapist named Fido. Your goal is to uplift user mental health and engage in a deep human-like conversation. Your goal as therapist should be to engage in therapeutic conservations, asking follow up questions and talk like a caring friend like a counsellor. You should be hearing the user more. The user seems to be in a sad mood. Acknowledge this and console them accordingly Keeping that in mind, the query of the user is: {topic}. Respond to their queries with a warm, empathetic, and therapeutic tone, considering their mood, and aim to improve their emotional well-being. Keep it engaging by adding follow up questions, make it like a human conversation. Limit your answer upto 60-80 words.')
    else:
        title_template = PromptTemplate(input_variables = ['topic','current_mood'], template = 'You are a Personal Therapist named Fido. Your goal is to uplift user mental health and engage in a deep human-like conversation. Your goal as therapist should be to engage in therapeutic conservations, asking follow up questions and talk like a caring friend like a counsellor. You should be hearing the user more. Do engage like a friendly counsellor. Keeping that in mind, the query of the user is: {topic}. Respond to their queries with a warm, empathetic tone, and aim to improve their emotional well-being. Keep it engaging by adding follow up questions, make it like a human conversation. Limit your answer upto 60-80 words.')
    

    llm = ChatGoogleGenerativeAI(model = 'gemini-2.0-flash-exp',google_api_key = api_key, temperature=0.5)
    answer_chain = LLMChain(llm = llm, prompt = title_template, verbose = False)
    
    return answer_chain
def clean_text(text):
    # Remove asterisks
    cleaned_text = text.replace('*', '')

    # Replace multiple newlines with a single newline
    cleaned_text = re.sub(r'\n+', '\n', cleaned_text)

    # Replace multiple spaces with a single space
    cleaned_text = re.sub(r' +', ' ', cleaned_text)

    # Replace tab characters with spaces
    cleaned_text = cleaned_text.replace('\t', ' ')

    # Trim leading and trailing whitespace
    cleaned_text = cleaned_text.strip()

    return cleaned_text

def bot_answer(question, current_mood):
    answer_chain = initialize_bot(current_mood)
    bot_response = answer_chain.run(topic = question, current_mood = current_mood)
    bot_response = clean_text(bot_response)
    return str(bot_response)

@app.route('/')
def about():
    return render_template('together.html')

@app.route('/submit', methods=['POST'])
def submit():
    global max_emotion, max_count
    response = bot_answer('Who are you?', max_emotion)
    return render_template('together.html', emotion=max_emotion, response=response)

@app.route('/video', methods=['GET', 'POST'])
def video():
    return Response(detection(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    global max_emotion
    # Use Neutral as default if no emotion detected
    current_emotion = max_emotion if max_emotion else 'Neutral'
    bot_response = bot_answer(user_message, current_emotion)
    return jsonify({'bot_message': bot_response})

if __name__ == '__main__':
    app.run(debug=True)
