@echo off
title ESSMS Dev Servers
cd /d "%~dp0"

echo ========================================
echo  Ethiopian School Management System
echo ========================================
echo.

where mongod >nul 2>&1
if errorlevel 1 (
  echo [WARN] mongod not found in PATH. Ensure MongoDB is running on localhost:27017
) else (
  echo [OK] MongoDB client found
)

echo.
echo Starting API server on http://localhost:5002 ...
start "ESSMS Server" cmd /k "cd /d %~dp0 && npm run dev -w essms-server"

timeout /t 3 /nobreak >nul

echo Starting frontend on http://localhost:5173 ...
start "ESSMS Client" cmd /k "cd /d %~dp0 && npm run dev -w essms-client"

echo.
echo Both servers are starting in separate windows.
echo   API:      http://localhost:5002
echo   Frontend: http://localhost:5173
echo.
echo To seed demo data (optional): npm run seed -w essms-server
echo.
pause
