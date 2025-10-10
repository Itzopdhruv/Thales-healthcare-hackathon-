@echo off
echo 🎵 Installing FFmpeg for Windows...
echo.

REM Check if FFmpeg is already installed
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ FFmpeg is already installed!
    ffmpeg -version
    echo.
    echo You can now use the full audio merging features.
    pause
    exit /b 0
)

echo ❌ FFmpeg is not installed.
echo.
echo 📋 To install FFmpeg on Windows:
echo.
echo 1. Download FFmpeg from: https://ffmpeg.org/download.html
echo 2. Or use Chocolatey: choco install ffmpeg
echo 3. Or use winget: winget install ffmpeg
echo.
echo 🔧 Quick installation with winget:
echo    winget install ffmpeg
echo.
echo After installation, restart your terminal and run this script again.
echo.
echo ⚠️  Note: The app will work without FFmpeg using a simple fallback method.
echo.

pause






