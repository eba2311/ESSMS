@echo off
title ESSMS MASTER LAUNCHER
cd /d C:\Users\hp\Desktop\sms
color 0A

echo ================================================
echo    ETHIOPIAN SECONDARY SCHOOL MANAGEMENT SYSTEM
echo    MASTER LAUNCHER - FULL SETUP
echo ================================================
echo.

:: Step 1: Check node
where node >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Node.js not found. Please install Node.js 18+
  pause
  exit /b 1
)
echo [OK] Node.js found

:: Step 2: Install dependencies if needed
if not exist "node_modules\.package-lock.json" (
  echo [INFO] Installing root dependencies...
  call npm install
)
if not exist "server\node_modules" (
  echo [INFO] Installing server dependencies...
  cd server && call npm install && cd ..
)
if not exist "client\node_modules" (
  echo [INFO] Installing client dependencies...
  cd client && call npm install && cd ..
)
echo [OK] Dependencies installed

:: Step 3: Kill old processes
echo [INFO] Stopping old servers...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

:: Step 4: Start the backend server
echo.
echo [STEP 1/4] Starting API Server (auto-seeds database)...
echo           Waiting up to 120s for server...
start "ESSMS Server" cmd /k "cd /d C:\Users\hp\Desktop\sms\server && npm run dev"

:: Wait for server to be ready
setlocal enabledelayedexpansion
set waited=0
:SERVER_CHECK
timeout /t 5 /nobreak >nul
set /a waited+=5
netstat -an 2>nul | findstr ":5002 " >nul
if !errorlevel! equ 0 (
  echo [OK] API Server ready on port 5002 (took !waited!s)
  goto SERVER_READY
)
if !waited! geq 120 (
  echo [WARN] Server not detected on port 5002 after !waited!s.
  echo        Check SERVER window for errors (MongoDB may be starting).
  goto SERVER_READY
)
echo   Waiting... (!waited!s)
goto SERVER_CHECK

:SERVER_READY
endlocal

:: Step 5: Run assessment creator
echo.
echo [STEP 2/4] Creating assessments for ALL students...
cd /d C:\Users\hp\Desktop\sms\server
node add-assessments.js
if errorlevel 1 (
  echo [WARN] Assessment creation had issues - may need MongoDB running
) else (
  echo [OK] All assessments created successfully!
)

:: Step 6: Start frontend
echo.
echo [STEP 3/4] Starting Frontend...
start "ESSMS Client" cmd /k "cd /d C:\Users\hp\Desktop\sms\client && npm run dev"
echo [OK] Frontend starting on port 5173

cd /d C:\Users\hp\Desktop\sms

:: Step 7: Final status
echo.
echo ================================================
echo    SYSTEM READY!
echo ================================================
echo.
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:5002/api/v1
echo.
echo   LOGIN CREDENTIALS:
echo   -------------------------------------------
echo   Admin:   admin@school.edu.et / Admin123!
echo   Teacher: teacher1@school.edu.et / Teacher123!
echo   Student: student1@school.edu.et / Student123!
echo   Parent:  parent1@school.edu.et  / Parent123!
echo   -------------------------------------------
echo.
echo   ASSESSMENTS CREATED:
echo   - 6 types per subject per section per term
echo   - Marks for ALL students
echo   - Semester/annual results calculated
echo   - Rankings generated
echo.
echo ================================================
pause
