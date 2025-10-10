# 🔧 Google Cloud Speech-to-Text Setup Guide

## ❓ Is Google Cloud Speech-to-Text Needed?

### ✅ **Current System Works WITHOUT Google Cloud:**
- Mock transcription is generated and sent to Gemini API
- Full AI processing and medical summaries work perfectly
- System is ready for testing and development
- No additional costs or setup required

### 🎯 **When You NEED Google Cloud Speech-to-Text:**
- **Real medical consultations** with actual patient conversations
- **Production environment** with real audio recordings
- **Accurate medical summaries** based on actual speech content
- **Better AI analysis** of real medical discussions

### 🚫 **When You DON'T NEED Google Cloud Speech-to-Text:**
- **Testing and development** (mock transcription works fine)
- **Demo purposes** (mock conversations are realistic)
- **Cost considerations** (Google Cloud has usage costs)
- **Quick setup** (mock transcription is instant)

---

## 📋 Step-by-Step Configuration (IF NEEDED)

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `aayulink-speech-to-text`
4. Click "Create"

### Step 2: Enable Speech-to-Text API
1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Cloud Speech-to-Text API"
3. Click on it and press "Enable"

### Step 3: Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `aayulink-speech-service`
   - **Description**: `Service account for AayuLink speech-to-text`
4. Click "Create and Continue"
5. **Grant roles**: `Cloud Speech-to-Text Client`
6. Click "Continue" → "Done"

### Step 4: Generate Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create" (downloads the key file)

### Step 5: Add Credentials to .env File

Add these lines to your `main_website/backend/.env` file:

```env
# Google Cloud Speech-to-Text Configuration (OPTIONAL)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
```

**Example:**
```env
# Google Cloud Speech-to-Text Configuration (OPTIONAL)
GOOGLE_APPLICATION_CREDENTIALS=./credentials/aayulink-speech-service.json
GOOGLE_CLOUD_PROJECT_ID=aayulink-speech-to-text
```

### Step 6: Place Service Account Key File
1. Create a `credentials` folder in `main_website/backend/`
2. Place the downloaded JSON key file in this folder
3. Update the path in `.env` file accordingly

### Step 7: Restart Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd main_website/backend
node src/server.js
```

---

## 🎯 What Happens After Configuration?

### ✅ **With Google Cloud Credentials:**
```
Audio File → Google Speech-to-Text → Real Transcription → Gemini API → AI Summary
```

**Console Output:**
```
🎤 Attempting real Speech-to-Text conversion...
✅ Real Speech-to-Text conversion successful
🎯 REAL TRANSCRIPTION DETECTED - This will be sent to Gemini API
```

### ⚠️ **Without Google Cloud Credentials (Current):**
```
Audio File → Mock Transcription → Gemini API → AI Summary
```

**Console Output:**
```
❌ SPEECH-TO-TEXT NOT AVAILABLE - USING MOCK TRANSCRIPTION
🎭 Mock transcription will be used for testing purposes
```

---

## 💰 Cost Considerations

### Google Cloud Speech-to-Text Pricing:
- **Free Tier**: 60 minutes per month
- **Paid Tier**: $0.006 per 15 seconds of audio
- **Example**: 1 hour of audio = ~$1.44

### Mock Transcription:
- **Cost**: $0 (completely free)
- **Quality**: Good for testing and demos
- **Speed**: Instant generation

---

## 🚀 Recommendation

### For Development/Testing:
- **Keep using mock transcription** (current setup)
- **No additional configuration needed**
- **System works perfectly for demos**

### For Production:
- **Configure Google Cloud Speech-to-Text**
- **Real audio transcription for medical accuracy**
- **Better AI analysis of actual conversations**

---

## 🔍 Verification

After configuration, you'll see this in the console:
```
✅ Google Cloud Speech-to-Text configured
🎤 Attempting real Speech-to-Text conversion...
✅ Real Speech-to-Text conversion successful
🎯 REAL TRANSCRIPTION DETECTED - This will be sent to Gemini API
```

Without configuration, you'll see:
```
❌ GOOGLE CLOUD SPEECH-TO-TEXT NOT CONFIGURED
⚠️ Using mock transcription for testing purposes
🎭 Mock transcription generated - this will be sent to Gemini for AI processing
```

---

## 📞 Support

If you need help with Google Cloud setup:
1. Check the [Google Cloud Speech-to-Text documentation](https://cloud.google.com/speech-to-text/docs)
2. Verify your service account has the correct permissions
3. Ensure the JSON key file path is correct in `.env`
4. Check that the Speech-to-Text API is enabled in your project





