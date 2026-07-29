@echo off
echo ========================================
echo   ESSMS Database Seeder
echo ========================================
echo.
echo Dropping existing data and seeding 200 students, 20 teachers...
echo.

cd /d "%~dp0"
npx ts-node --transpile-only src/seed.ts

echo.
echo If the above finished with "SEED COMPLETED SUCCESSFULLY", you're done!
echo.
pause
