@echo off
echo Starting ChatFlow Development Environment...

echo Starting Backend (Port 4000)...
start "ChatFlow Backend" cmd /k "cd backend && npm start"

echo Starting Frontend...
start "ChatFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting in separate windows.
echo Backend will be at http://localhost:4000
echo Frontend will be at http://localhost:8080
echo.
pause
