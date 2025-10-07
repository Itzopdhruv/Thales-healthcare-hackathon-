@echo off
echo Starting AI Doctor Integration Services...
echo ========================================

echo.
echo Starting AI Doctor Service (Port 8000)...
start "AI Doctor Service" cmd /k "cd /d C:\Users\PREM YADAV\Documents\NEW THALES\Thales-healthcare-hackathon-\ai-doctor-2.0-voice-and-vision && python fastapi_app.py"

timeout /t 5 /nobreak >nul

echo.
echo Starting Node.js Backend (Port 5001)...
start "Node.js Backend" cmd /k "cd /d C:\Users\PREM YADAV\Documents\NEW THALES\Thales-healthcare-hackathon-\main_website\backend && npm start"

timeout /t 5 /nobreak >nul

echo.
echo Starting React Frontend (Port 3002)...
start "React Frontend" cmd /k "cd /d C:\Users\PREM YADAV\Documents\NEW THALES\Thales-healthcare-hackathon-\main_website\frontend && npm run dev"

echo.
echo All services are starting...
echo.
echo AI Doctor Service: http://localhost:8000
echo Node.js Backend: http://localhost:5001
echo React Frontend: http://localhost:3002
echo.
echo Wait for all services to fully start, then open http://localhost:3002
echo.
pause


