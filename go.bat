@echo off
title ESSMS LAUNCHER
cd /d C:\Users\hp\Desktop\sms
echo Killing old processes...
taskkill /F /IM node.exe 2>nul
timeout /t 4 >nul
echo Starting SERVER on port 5002...
start "SERVER" cmd /k "cd /d C:\Users\hp\Desktop\sms\server && npm run dev"
echo.
echo Waiting for server (checking port 5002 every 5s, max 120s)...
setlocal enabledelayedexpansion
set waited=0
:CHECK
timeout /t 5 >nul
set /a waited+=5
netstat -an 2>nul | findstr ":5002 " >nul
if !errorlevel! equ 0 (
  echo.
  echo ========================================
  echo SERVER IS READY on port 5002!
  echo ========================================
  goto START_CLIENT
)
if !waited! geq 120 (
  echo.
  echo WARNING: Server not detected after 120s.
  echo Check the SERVER window for errors.
  pause
  exit /b
)
echo   Still waiting... (!waited!s elapsed)
goto CHECK
:START_CLIENT
echo Starting CLIENT on port 5173...
start "CLIENT" cmd /k "cd /d C:\Users\hp\Desktop\sms\client && npm run dev"
echo.
echo ========================================
echo OPEN http://localhost:5173 IN YOUR BROWSER
echo ========================================
echo.
echo Login: admin@school.edu.et / Admin123!
echo.
pause
