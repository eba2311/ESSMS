@echo off
cd /d C:\Users\hp\Desktop\sms
echo === Pushing ESSMS to GitHub ===
git remote set-url origin https://github.com/eba2311/ESSMS.git
git add -A
git status
echo.
echo === Committing ===
git commit -m "fix: critical bugs in student profile, finance pages, and academic year handling"
echo.
echo === Pushing ===
git push -u origin main
echo.
echo === Done! ===
pause
