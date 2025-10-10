# 🔧 Environment Configuration Example

## Current .env File Structure

Your current `main_website/backend/.env` file contains:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://premyadavptts_db_user:qUoeB8QVKwigzaMt@cluster4.leu26pe.mongodb.net/

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyCrCd7CjUyz6-dZ-TM06KoS-AWS0LF0iws

# CORS Configuration
FRONTEND_URL=http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=9000000
RATE_LIMIT_MAX_REQUESTS=10000
```

## What to Add for Google Cloud Speech-to-Text

Add these lines to your `.env` file (OPTIONAL):

```env
# Google Cloud Speech-to-Text Configuration (OPTIONAL)
GOOGLE_APPLICATION_CREDENTIALS=./credentials/aayulink-speech-service.json
GOOGLE_CLOUD_PROJECT_ID=aayulink-speech-to-text
```

## Complete .env File (with Google Cloud)

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://premyadavptts_db_user:qUoeB8QVKwigzaMt@cluster4.leu26pe.mongodb.net/

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyCrCd7CjUyz6-dZ-TM06KoS-AWS0LF0iws

# CORS Configuration
FRONTEND_URL=http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=9000000
RATE_LIMIT_MAX_REQUESTS=10000

# Google Cloud Speech-to-Text Configuration (OPTIONAL)
GOOGLE_APPLICATION_CREDENTIALS=./credentials/aayulink-speech-service.json
GOOGLE_CLOUD_PROJECT_ID=aayulink-speech-to-text
```

## File Structure After Setup

```
main_website/backend/
├── .env
├── credentials/
│   └── aayulink-speech-service.json  # Downloaded from Google Cloud
├── src/
│   └── server.js
└── ...
```

## Quick Setup Commands

1. **Create credentials directory:**
   ```bash
   mkdir main_website/backend/credentials
   ```

2. **Add Google Cloud lines to .env:**
   ```bash
   echo "" >> main_website/backend/.env
   echo "# Google Cloud Speech-to-Text Configuration (OPTIONAL)" >> main_website/backend/.env
   echo "GOOGLE_APPLICATION_CREDENTIALS=./credentials/aayulink-speech-service.json" >> main_website/backend/.env
   echo "GOOGLE_CLOUD_PROJECT_ID=aayulink-speech-to-text" >> main_website/backend/.env
   ```

3. **Place your downloaded JSON key file in the credentials folder**

4. **Restart the server:**
   ```bash
   cd main_website/backend
   node src/server.js
   ```

## Verification

After setup, check the console output when starting the server:

**✅ With Google Cloud configured:**
```
✅ Google Cloud Speech-to-Text configured
```

**⚠️ Without Google Cloud (current):**
```
❌ GOOGLE CLOUD SPEECH-TO-TEXT NOT CONFIGURED
   This means audio recordings will use mock transcription instead of real speech recognition
```

## Important Notes

- **The system works perfectly WITHOUT Google Cloud credentials**
- **Mock transcription is sent to Gemini API for AI processing**
- **Google Cloud is only needed for real audio transcription**
- **No additional setup required for current functionality**





