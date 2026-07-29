@echo off
cd /d C:\Users\hp\Desktop\sms

echo [1/5] Removing lock file...
del "C:\Users\hp\.git\index.lock" 2>nul
echo Done.

echo [2/5] Setting remote...
git remote set-url origin https://github.com/eba2311/ESSMS.git

echo [3/5] Staging and committing...
git add -A
git commit -m "fix: dashboard real data, outstanding fees, dynamic academic years, student profile bugs, fee CRUD"

echo [4/5] Pulling remote changes...
git pull origin main --rebase

echo [5/5] Pushing...
git push -u origin main

echo.
echo === DONE ===
if %ERRORLEVEL% NEQ 0 (
    echo Push failed. Try: git push -u origin master
)
pause
