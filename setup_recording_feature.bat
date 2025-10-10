@echo off
REM 🎤 Recording Feature Setup Script for Windows
REM This script sets up all dependencies and configurations for the recording feature

echo 🎤 Setting up Recording Feature...

REM Check if we're in the right directory
if not exist "main_website\backend\package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

echo [INFO] Starting recording feature setup...

REM Step 1: Check FFmpeg
echo [INFO] Step 1: Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] FFmpeg is already installed
    ffmpeg -version | findstr "ffmpeg version"
) else (
    echo [WARNING] FFmpeg not found. Please install FFmpeg:
    echo 1. Download from https://ffmpeg.org/download.html
    echo 2. Extract to C:\ffmpeg
    echo 3. Add C:\ffmpeg\bin to your PATH environment variable
    echo 4. Or use: winget install ffmpeg
    echo.
    echo Press any key to continue after installing FFmpeg...
    pause
)

REM Step 2: Install Node.js dependencies
echo [INFO] Step 2: Installing Node.js dependencies...
cd main_website\backend
call npm install fluent-ffmpeg
if %errorlevel% equ 0 (
    echo [SUCCESS] fluent-ffmpeg installed successfully
) else (
    echo [ERROR] Failed to install fluent-ffmpeg
    pause
    exit /b 1
)
cd ..\..

REM Step 3: Create required directories
echo [INFO] Step 3: Creating required directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\recordings" mkdir uploads\recordings
if not exist "uploads\recordings\merged" mkdir uploads\recordings\merged

echo [SUCCESS] Directories created successfully

REM Step 4: Check environment variables
echo [INFO] Step 4: Checking environment variables...
if exist "main_website\backend\.env" (
    findstr "GEMINI_API_KEY" main_website\backend\.env >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] GEMINI_API_KEY found in .env file
    ) else (
        echo [WARNING] GEMINI_API_KEY not found in .env file
        echo Please add the following to your .env file:
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
    )
) else (
    echo [WARNING] .env file not found
    echo Please create a .env file in main_website\backend\ with:
    echo GEMINI_API_KEY=your_gemini_api_key_here
    echo FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
)

REM Step 5: Test FFmpeg installation
echo [INFO] Step 5: Testing FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] FFmpeg is working correctly
) else (
    echo [ERROR] FFmpeg test failed. Please check installation.
)

REM Step 6: Create test script
echo [INFO] Step 6: Creating test script...
(
echo // Test script for recording feature setup
echo import ffmpeg from 'fluent-ffmpeg';
echo import fs from 'fs';
echo.
echo console.log('🧪 Testing recording feature setup...'^);
echo.
echo // Test 1: Check FFmpeg
echo console.log('1. Testing FFmpeg...'^);
echo ffmpeg.getAvailableFormats((err, formats^) =^> {
echo   if (err^) {
echo     console.error('❌ FFmpeg error:', err.message^);
echo   } else {
echo     console.log('✅ FFmpeg is working'^);
echo   }
echo }^);
echo.
echo // Test 2: Check directories
echo console.log('2. Testing directories...'^);
echo const dirs = ['uploads/recordings', 'uploads/recordings/merged'];
echo dirs.forEach(dir =^> {
echo   if (fs.existsSync(dir^)^) {
echo     console.log(`✅ Directory exists: ${dir}`^);
echo   } else {
echo     console.log(`❌ Directory missing: ${dir}`^);
echo   }
echo }^);
echo.
echo // Test 3: Check environment
echo console.log('3. Testing environment...'^);
echo if (process.env.GEMINI_API_KEY^) {
echo   console.log('✅ GEMINI_API_KEY is set'^);
echo } else {
echo   console.log('❌ GEMINI_API_KEY is not set'^);
echo }
echo.
echo console.log('🎉 Setup test completed!'^);
) > test_recording_setup.js

echo [SUCCESS] Test script created: test_recording_setup.js

REM Step 7: Final instructions
echo [INFO] Step 7: Setup completed! Next steps:
echo.
echo 🎯 To complete the setup:
echo 1. Add your GEMINI_API_KEY to main_website\backend\.env
echo 2. Start your backend server: cd main_website\backend ^&^& npm start
echo 3. Start your frontend: cd main_website\frontend ^&^& npm start
echo 4. Test the recording feature using test_recording_workflow.html
echo.
echo 🔧 Troubleshooting:
echo - If FFmpeg errors occur, check the FFMPEG_PATH in your .env file
echo - If microphone access is denied, check browser permissions
echo - If uploads fail, check CORS settings and file permissions
echo.
echo 📚 Documentation: See RECORDING_FEATURE_README.md for detailed usage

echo [SUCCESS] Recording feature setup completed! 🎉
pause







