@echo off
cd /d "C:\Users\hp\Desktop\sms\server"
title ESSMS Server - FRESH START
echo ==========================================
echo  STEP 1: Killing ALL Node processes...
echo ==========================================
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo  STEP 2: Installing dependencies...
echo ==========================================
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed! Check internet connection.
    pause
    exit /b 1
)
echo [OK] Dependencies installed.

echo.
echo ==========================================
echo  STEP 3: Starting server with FRESH code...
echo ==========================================
echo Loading:  AssessmentMark.model.ts (no required on gradePoint)
echo Loading:  assessment.controller.ts (explicit gradePoint)
echo Loading:  teacher.controller.ts (explicit gradePoint)
echo.
npx ts-node --transpile-only --no-cache src/server.ts
pause