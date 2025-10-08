# AI Doctor Integration Guide

This guide explains how to integrate the AI Doctor service with the main healthcare application.

## 🏗️ Architecture Overview

```
Patient Dashboard → AI Doctor Chatbot → Node.js Backend → FastAPI → Python AI Doctor
```

## 🚀 Quick Start

### 1. Set up Environment Variables

Copy the example environment file and add your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here  # Optional
```

### 2. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or using pipenv
pipenv install
```

### 3. Start the AI Doctor Service

```bash
# Option 1: Using the startup script
python start_ai_doctor.py

# Option 2: Direct uvicorn command
uvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start the Main Application

In separate terminals:

```bash
# Terminal 1: Start Node.js backend
cd main_website/backend
npm start

# Terminal 2: Start React frontend
cd main_website/frontend
npm run dev
```

## 🔧 Configuration

### Backend Configuration

The Node.js backend is configured to connect to the AI Doctor service at `http://localhost:8000`. You can change this in:

```javascript
// main_website/backend/src/controllers/aiDoctorController.js
const AI_DOCTOR_API_URL = process.env.AI_DOCTOR_API_URL || 'http://localhost:8000';
```

### Frontend Configuration

The frontend uses the Vite proxy to forward `/api` requests to the Node.js backend. This is configured in:

```javascript
// main_website/frontend/vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5001'
  }
}
```

## 📡 API Endpoints

### FastAPI AI Doctor Service (Port 8000)

- `GET /` - Service status
- `GET /health` - Health check
- `POST /analyze` - Analyze medical input (audio, image, text)
- `GET /audio/{filename}` - Get generated audio response

### Node.js Backend (Port 5001)

- `GET /api/ai-doctor/health` - Check AI Doctor service health
- `POST /api/ai-doctor/analyze` - Analyze medical input
- `GET /api/ai-doctor/audio/{filename}` - Get audio response

## 🎯 Usage

### For Patients

1. Log in to the patient dashboard
2. Click the robot icon (🤖) in the top-right corner
3. The AI Doctor chatbot will appear in the bottom-left
4. You can:
   - Type your question
   - Record audio
   - Upload an image
   - Combine any of the above

### For Developers

#### Testing the AI Doctor Service

```bash
# Health check
curl http://localhost:8000/health

# Test with text input
curl -X POST http://localhost:8000/analyze \
  -F "text_input=What's wrong with my skin?"

# Test with image
curl -X POST http://localhost:8000/analyze \
  -F "image_file=@path/to/image.jpg" \
  -F "text_input=Please analyze this image"
```

#### Testing the Full Integration

```bash
# Test through Node.js backend
curl -X POST http://localhost:5001/api/ai-doctor/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "textInput=Hello AI Doctor"
```

## 🔍 Troubleshooting

### Common Issues

1. **AI Doctor service not responding**
   - Check if the FastAPI service is running on port 8000
   - Verify GROQ_API_KEY is set correctly
   - Check console logs for errors

2. **Audio not playing**
   - Ensure the audio file was generated successfully
   - Check browser console for audio playback errors
   - Verify the audio file URL is accessible

3. **Image analysis not working**
   - Ensure the image file is in a supported format (JPEG, PNG)
   - Check if GROQ_API_KEY has vision model access
   - Verify the image file size is reasonable

4. **CORS errors**
   - The FastAPI service includes CORS middleware
   - If issues persist, check the CORS configuration in `fastapi_app.py`

### Debug Mode

Enable debug logging by setting environment variables:

```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## 🔒 Security Considerations

1. **API Keys**: Store API keys securely in environment variables
2. **File Uploads**: The service validates file types and sizes
3. **Authentication**: All requests go through the Node.js backend with JWT authentication
4. **CORS**: Configure CORS appropriately for production

## 📊 Monitoring

### Health Checks

- FastAPI: `http://localhost:8000/health`
- Node.js: `http://localhost:5001/api/ai-doctor/health`

### Logs

- FastAPI logs: Console output when running `uvicorn`
- Node.js logs: Check the backend console output
- Frontend logs: Browser developer console

## 🚀 Production Deployment

### Environment Variables

Set these in your production environment:

```env
GROQ_API_KEY=your_production_groq_key
ELEVEN_API_KEY=your_production_elevenlabs_key
AI_DOCTOR_API_URL=https://your-ai-doctor-service.com
NODE_ENV=production
```

### Docker Deployment

You can containerize the AI Doctor service:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 API Documentation

Once the FastAPI service is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

When making changes to the AI Doctor integration:

1. Test both the FastAPI service and the full integration
2. Update this README if you add new features
3. Ensure backward compatibility with existing functionality
4. Add appropriate error handling and logging



