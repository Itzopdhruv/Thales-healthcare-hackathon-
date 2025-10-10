#!/bin/bash

# 🎤 Recording Feature Setup Script
# This script sets up all dependencies and configurations for the recording feature

echo "🎤 Setting up Recording Feature..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "main_website/backend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting recording feature setup..."

# Step 1: Install FFmpeg
print_status "Step 1: Installing FFmpeg..."

if command -v ffmpeg &> /dev/null; then
    print_success "FFmpeg is already installed"
    ffmpeg -version | head -1
else
    print_warning "FFmpeg not found. Installing..."
    
    # Detect OS and install FFmpeg
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
        sudo apt install -y ffmpeg
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ffmpeg
        else
            print_error "Homebrew not found. Please install FFmpeg manually from https://ffmpeg.org/download.html"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        print_warning "Windows detected. Please download FFmpeg from https://ffmpeg.org/download.html and add to PATH"
        print_warning "Or use: winget install ffmpeg"
    else
        print_error "Unsupported OS. Please install FFmpeg manually from https://ffmpeg.org/download.html"
    fi
fi

# Step 2: Install Node.js dependencies
print_status "Step 2: Installing Node.js dependencies..."

cd main_website/backend
if npm install fluent-ffmpeg; then
    print_success "fluent-ffmpeg installed successfully"
else
    print_error "Failed to install fluent-ffmpeg"
    exit 1
fi

cd ../..

# Step 3: Create required directories
print_status "Step 3: Creating required directories..."

mkdir -p uploads/recordings
mkdir -p uploads/recordings/merged
chmod 755 uploads/recordings
chmod 755 uploads/recordings/merged

print_success "Directories created successfully"

# Step 4: Check environment variables
print_status "Step 4: Checking environment variables..."

if [ -f "main_website/backend/.env" ]; then
    if grep -q "GEMINI_API_KEY" main_website/backend/.env; then
        print_success "GEMINI_API_KEY found in .env file"
    else
        print_warning "GEMINI_API_KEY not found in .env file"
        echo "Please add the following to your .env file:"
        echo "GEMINI_API_KEY=your_gemini_api_key_here"
        echo "FFMPEG_PATH=/usr/bin/ffmpeg  # Optional: specify FFmpeg path"
    fi
else
    print_warning ".env file not found"
    echo "Please create a .env file in main_website/backend/ with:"
    echo "GEMINI_API_KEY=your_gemini_api_key_here"
    echo "FFMPEG_PATH=/usr/bin/ffmpeg  # Optional: specify FFmpeg path"
fi

# Step 5: Test FFmpeg installation
print_status "Step 5: Testing FFmpeg installation..."

if command -v ffmpeg &> /dev/null; then
    ffmpeg -version | head -1
    print_success "FFmpeg is working correctly"
else
    print_error "FFmpeg test failed. Please check installation."
fi

# Step 6: Create test script
print_status "Step 6: Creating test script..."

cat > test_recording_setup.js << 'EOF'
// Test script for recording feature setup
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

console.log('🧪 Testing recording feature setup...');

// Test 1: Check FFmpeg
console.log('1. Testing FFmpeg...');
ffmpeg.getAvailableFormats((err, formats) => {
  if (err) {
    console.error('❌ FFmpeg error:', err.message);
  } else {
    console.log('✅ FFmpeg is working');
  }
});

// Test 2: Check directories
console.log('2. Testing directories...');
const dirs = ['uploads/recordings', 'uploads/recordings/merged'];
dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ Directory exists: ${dir}`);
  } else {
    console.log(`❌ Directory missing: ${dir}`);
  }
});

// Test 3: Check environment
console.log('3. Testing environment...');
if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY is set');
} else {
  console.log('❌ GEMINI_API_KEY is not set');
}

console.log('🎉 Setup test completed!');
EOF

print_success "Test script created: test_recording_setup.js"

# Step 7: Final instructions
print_status "Step 7: Setup completed! Next steps:"

echo ""
echo "🎯 To complete the setup:"
echo "1. Add your GEMINI_API_KEY to main_website/backend/.env"
echo "2. Start your backend server: cd main_website/backend && npm start"
echo "3. Start your frontend: cd main_website/frontend && npm start"
echo "4. Test the recording feature using test_recording_workflow.html"
echo ""
echo "🔧 Troubleshooting:"
echo "- If FFmpeg errors occur, check the FFMPEG_PATH in your .env file"
echo "- If microphone access is denied, check browser permissions"
echo "- If uploads fail, check CORS settings and file permissions"
echo ""
echo "📚 Documentation: See RECORDING_FEATURE_README.md for detailed usage"

print_success "Recording feature setup completed! 🎉"







