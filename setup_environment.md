# 🔧 Environment Setup Guide

## 🚀 Quick Setup (No API Key Required)

The app now works **without any API keys**! It will use fallback methods for AI features.

## 📋 Optional: Full AI Features Setup

If you want full AI summarization features, follow these steps:

### 1. Get Google Gemini API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### 2. Set Environment Variable
Create a `.env` file in `main_website/backend/` with:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ayulink-healthcare

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Google Gemini API Key (optional)
GEMINI_API_KEY=your-gemini-api-key-here

# FFmpeg Path (optional)
FFMPEG_PATH=ffmpeg
```

### 3. Restart Backend
```bash
cd main_website/backend
npm start
```

## ✅ What Works Without API Key

- ✅ Video calls
- ✅ Audio recording
- ✅ Audio merging (with FFmpeg)
- ✅ Basic meeting summary
- ✅ All core features

## 🤖 What You Get With API Key

- ✅ Advanced AI summarization
- ✅ Medical conversation analysis
- ✅ Medication extraction
- ✅ Follow-up instructions
- ✅ Key points extraction

## 🎯 Current Status

**The app works perfectly without any API keys!** The "AI summarization failed" error should be gone now.






