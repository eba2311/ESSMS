@echo off
echo ============================================
echo   ESSMS - Starting Server + Client
echo ============================================
echo.

echo [1/2] Killing old node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/2] Starting server on port 5002...
echo.
start "ESSMS Server" cmd /k "cd /d C:\Users\hp\Desktop\sms\server && npm run dev"
timeout /t 8 /nobreak >nul

echo Starting client on port 5173...
echo.
start "ESSMS Client" cmd /k "cd /d C:\Users\hp\Desktop\sms\client && npm run dev"

echo.
echo ============================================
echo   Both started! Open http://localhost:5173
echo ============================================
timeout /t 5 /nobreak >nul
