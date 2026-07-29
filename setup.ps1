# ESSMS - Quick Start Script
# Run this in PowerShell at C:\Users\hp\Desktop\sms

Write-Host "=== Installing Server Dependencies ===" -ForegroundColor Cyan
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Server npm install failed!" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Installing Client Dependencies ===" -ForegroundColor Cyan
Set-Location ../client
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Client npm install failed!" -ForegroundColor Red; exit 1 }

Write-Host "`n✅ All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application, open TWO terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Server):" -ForegroundColor Cyan
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Client):" -ForegroundColor Cyan
Write-Host "  cd client" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:5173" -ForegroundColor Green
Write-Host "Login: admin / Admin123!" -ForegroundColor Green
