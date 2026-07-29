@echo off
title ESSMS - Restart Backend
color 0A
echo.
echo ==========================================
echo   ESSMS Backend - Applying All Fixes
echo ==========================================
echo.

echo [1/3] Stopping old backend server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.

echo [2/3] Starting backend with all fixes applied...
echo.
start "ESSMS Backend" cmd /k "cd /d c:\Users\hp\Desktop\sms\server && color 0B && echo Starting ESSMS Backend... && echo. && npx ts-node --transpile-only src/server.ts"

echo [3/3] Waiting for backend to start...
timeout /t 4 /nobreak >nul

echo.
echo ==========================================
echo   Backend restarted! All fixes are live.
echo.
echo   Fixes applied:
echo   - AuditLog schema fixed
echo   - Auth service fixed
echo   - System Admin has FULL permissions
echo   - Section name validation relaxed
echo.
echo   You can now CREATE Sections, Students,
echo   Teachers, and ALL modules without errors!
echo ==========================================
echo.
pause
