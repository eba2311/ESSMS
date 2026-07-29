@echo off
title ESSMS Assessment Creator
cd /d "%~dp0"
echo ========================================
echo  Creating Assessments for ALL Students
echo  ALL Subjects, ALL Sections
echo ========================================
echo.
node add-assessments.js
echo.
if errorlevel 1 (
  echo [ERROR] Assessment creation failed.
  echo Make sure MongoDB is running on localhost:27017
  echo and that the server seed data exists.
) else (
  echo [SUCCESS] All assessments created!
)
echo.
pause
