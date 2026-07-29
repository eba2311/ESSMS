@echo off
echo Seeding database...
cd /d c:\Users\hp\Desktop\sms\server
npx ts-node --transpile-only src/seed.ts
echo.
echo Done! Now run start.bat to launch the app.
pause
