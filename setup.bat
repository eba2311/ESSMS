@echo off
echo ========================================
echo   ESSMS - Quick Setup
echo ========================================
echo.
echo Step 1: Installing Server Dependencies...
cd /d "%~dp0server"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Server dependencies failed to install.
    pause
    exit /b 1
)
echo Server dependencies installed successfully.
echo.
echo Step 2: Installing Client Dependencies...
cd /d "%~dp0client"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Client dependencies failed to install.
    pause
    exit /b 1
)
echo Client dependencies installed successfully.
echo.
echo ========================================
echo   SETUP COMPLETE
echo ========================================
echo.
echo To start the application:
echo.
echo 1. Start MongoDB (if not running)
echo 2. Open Terminal 1 and run:
echo    cd server
echo    npm run dev
echo.
echo 3. Open Terminal 2 and run:
echo    cd client
echo    npm run dev
echo.
echo 4. Open http://localhost:5173
echo    Login: admin / Admin123!
echo.
pause
