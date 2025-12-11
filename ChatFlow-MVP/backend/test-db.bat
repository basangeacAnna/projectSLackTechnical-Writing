@echo off
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies if missing...
if not exist "node_modules" (
    call npm install
)

echo Running Database Connection Test...
node test-db.js
pause
