Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESSMS - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
$mongod = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Host "[WARNING] MongoDB does not appear to be running." -ForegroundColor Yellow
    Write-Host "         Please start MongoDB Manually or install it from:" -ForegroundColor Yellow
    Write-Host "         https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host ""
    $choice = Read-Host "Continue anyway? (Y/N)"
    if ($choice -ne "Y") { exit }
}

Write-Host "[1/3] Installing server dependencies..." -ForegroundColor Green
Push-Location "C:\Users\hp\Desktop\sms\server"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Server dependencies failed!" -ForegroundColor Red
    pause
    exit
}
Pop-Location

Write-Host "[2/3] Installing client dependencies..." -ForegroundColor Green
Push-Location "C:\Users\hp\Desktop\sms\client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Client dependencies failed!" -ForegroundColor Red
    pause
    exit
}
Pop-Location

Write-Host "[3/3] Starting servers..." -ForegroundColor Green
Write-Host ""

$serverJob = Start-Job -ScriptBlock {
    Push-Location "C:\Users\hp\Desktop\sms\server"
    npm run dev
}

$clientJob = Start-Job -ScriptBlock {
    Push-Location "C:\Users\hp\Desktop\sms\client"
    npm run dev
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers are starting!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:5002" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Login Credentials:" -ForegroundColor Yellow
Write-Host "    Admin:   admin / Admin123!" -ForegroundColor White
Write-Host "    Teacher: teacher1 / Teacher123!" -ForegroundColor White
Write-Host "    Student: abebe / Student123!" -ForegroundColor White
Write-Host "    Parent:  parent1 / Parent123!" -ForegroundColor White
Write-Host ""
Write-Host "  Close this window to stop all servers." -ForegroundColor Magenta
Write-Host ""

# Keep script running and show job output
while ($true) {
    Start-Sleep -Seconds 5
    Receive-Job $serverJob
    Receive-Job $clientJob
}
