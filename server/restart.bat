@echo off
cd /d "C:\Users\hp\Desktop\sms\server"
echo ============================================
echo STEP 1: Force-killing ALL Node.js processes...
taskkill /F /IM node.exe 2>nul
echo Waiting for port 5002 to be freed...
:checkport
netstat -ano | findstr ":5002" >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 5002 still in use... waiting 2s...
    timeout /t 2 /nobreak >nul
    taskkill /F /IM node.exe 2>nul
    goto checkport
)
echo Port 5002 is free.
echo ============================================
echo STEP 2: Installing dependencies (nodemon, ts-node, etc.)...
call npm install
if %errorlevel% neq 0 (
    echo WARNING: npm install failed, trying npx instead.
)
echo ============================================
echo STEP 3: Starting server...
echo (Use npx ts-node since nodemon may not be available)
echo Close this window to stop the server.
echo ============================================
npx ts-node --transpile-only src/server.ts
if %errorlevel% neq 0 (
    echo.
    echo Server failed to start! Check the error above.
    pause
)