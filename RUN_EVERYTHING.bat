@echo off
title ESSMS
cd /d "C:\Users\hp\Desktop\sms"

echo ==========================================
echo  ESSMS - School Management System
echo ==========================================

:: Quick dependency check
IF NOT EXIST "client\node_modules" (
  echo [1] Installing client dependencies...
  cd /d "C:\Users\hp\Desktop\sms\client"
  call npm install
  cd /d "C:\Users\hp\Desktop\sms"
)
IF NOT EXIST "server\node_modules" (
  echo [1] Installing server dependencies...
  cd /d "C:\Users\hp\Desktop\sms\server"
  call npm install
  cd /d "C:\Users\hp\Desktop\sms"
)

:: Kill old processes on ports
echo [2] Freeing ports 5002 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5002"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul
echo [OK]

:: Drop old database so auto-seed runs with correct academic year
echo [3] Resetting database...
cd /d "C:\Users\hp\Desktop\sms\server"
node -e "const mc=require('mongoose');mc.connect('mongodb://localhost:27017/essms_dev').then(()=>mc.connection.db.dropDatabase()).then(()=>{console.log('DB dropped');process.exit(0)}).catch(()=>{console.log('DB not available (using in-memory)');process.exit(0)})"
cd /d "C:\Users\hp\Desktop\sms"
echo [OK]

:: Start backend
echo [4] Starting Backend (port 5002)...
start "ESSMS-Backend" cmd /k "cd /d C:\Users\hp\Desktop\sms\server && npm run dev"

:: Wait for backend to start
echo [5] Waiting 10s for backend to initialize...
timeout /t 10 /nobreak >nul

:: Start frontend
echo [6] Starting Frontend (port 5173)...
start "ESSMS-Frontend" cmd /k "cd /d C:\Users\hp\Desktop\sms\client && npm run dev"

echo.
echo ==========================================
echo  BOTH STARTED
echo.
echo  Wait for backend window to show:
echo    "Server running on port 5002"
echo.
echo  Then open: http://localhost:5173
echo.
echo  Login: admin@school.edu.et / Admin123!
echo.
echo  Dashboard should now load with real data
echo ==========================================
pause
