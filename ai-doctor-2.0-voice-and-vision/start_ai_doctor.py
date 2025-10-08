#!/usr/bin/env python3
"""
AI Doctor Service Startup Script
This script starts the FastAPI AI Doctor service
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['GROQ_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file or environment")
        return False
    
    print("✅ Environment variables check passed")
    return True

def check_dependencies():
    """Check if required Python packages are installed"""
    try:
        import fastapi
        import uvicorn
        import groq
        import gtts
        # elevenlabs removed - using only Google TTS
        print("✅ Required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False

def start_service():
    """Start the AI Doctor FastAPI service"""
    print("🚀 Starting AI Doctor Service...")
    print("📍 Service will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("\n" + "="*50)
    
    try:
        # Start the FastAPI service
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "fastapi_app:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n🛑 AI Doctor Service stopped by user")
    except Exception as e:
        print(f"❌ Error starting service: {e}")

def main():
    """Main startup function"""
    print("🤖 AI Doctor Service Startup")
    print("="*30)
    
    # Check if we're in the right directory
    if not Path("fastapi_app.py").exists():
        print("❌ fastapi_app.py not found. Please run this script from the ai-doctor-2.0-voice-and-vision directory")
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Start the service
    start_service()

if __name__ == "__main__":
    main()
