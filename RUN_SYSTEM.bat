@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo  ESSMS - Ethiopian Secondary School Management
echo  System Startup
echo ================================================
echo.

REM Install server dependencies if needed
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

REM Install client dependencies if needed
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

REM Build backend
echo Building backend TypeScript...
cd server
call npm run build
if errorlevel 1 (
    echo Backend build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo ================================================
echo Starting Services...
echo ================================================
echo.

REM Start backend
echo Starting Backend Server on http://localhost:5002
start "ESSMS Backend" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak

REM Start frontend
echo Starting Frontend Server...
start "ESSMS Frontend" cmd /k "cd client && npm run dev"

echo.
echo ================================================
echo Services Started!
echo ================================================
echo.
echo Backend API:  http://localhost:5002/api/v1
echo Frontend UI:  http://loc