@echo off
title ESSMS - Fix Login Credentials
color 0A
echo.
echo  ======================================
echo   ESSMS - Fixing Login Credentials
echo  ======================================
echo.
echo  Resetting passwords...
echo.
cd /d "%~dp0server"
node fix-login.js
echo.
pause
