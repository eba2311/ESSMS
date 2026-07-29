@echo off
echo ============================================
echo FIXING GIT - Creating fresh repo in sms/
echo ============================================

echo [1/7] Removing lock file...
del /f "C:\Users\hp\.git\index.lock" 2>nul

echo [2/7] Removing broken git repo from home directory...
rmdir /s /q "C:\Users\hp\.git" 2>nul
del /f "C:\Users\hp\.gitignore" 2>nul

echo [3/7] Creating fresh git repo in sms folder...
cd /d C:\Users\hp\Desktop\sms
git init
git branch -M main

echo [4/7] Setting remote...
git remote add origin https://github.com/eba2311/ESSMS.git

echo [5/7] Staging only sms project files...
git add -A

echo [6/7] Committing...
git commit -m "ESSMS: complete Ethiopian Secondary School Management System"

echo [7/7] Pushing (force to overwrite)...
git push -u origin main --force

echo.
echo === DONE ===
pause
