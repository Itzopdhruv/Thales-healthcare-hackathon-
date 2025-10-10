#!/usr/bin/env python3
"""
Test script to verify GROQ API is working
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from groq import Groq
    
    # Check if API key is set
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment variables")
        exit(1)
    
    print(f"✅ GROQ_API_KEY found: {api_key[:10]}...")
    
    # Test GROQ API
    client = Groq()
    
    # Simple text test
    print("🧪 Testing GROQ API with simple text...")
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, this is a test. Please respond with 'API is working'."}],
        model="llama-3.1-8b-instant"
    )
    
    print(f"✅ GROQ API Response: {response.choices[0].message.content}")
    
    # Test image analysis
    print("🧪 Testing image analysis...")
    
    # Create a simple test image (1x1 pixel)
    import base64
    test_image = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What do you see in this image?"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{test_image}",
                    },
                },
            ],
        }
    ]
    
    response = client.chat.completions.create(
        messages=messages,
        model="llama-3.2-90b-vision-preview"
    )
    
    print(f"✅ Image Analysis Response: {response.choices[0].message.content}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install groq: pip install groq")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()




