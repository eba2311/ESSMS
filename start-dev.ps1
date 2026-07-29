# Ethiopian Secondary School Management System - Development Startup Script
Write-Host ""
Write-Host "========================================"
Write-Host "ESSMS Development Server Startup"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exist in server
if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

# Check if node_modules exist in client
if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

# Check if .env exists in server
if (-not (Test-Path "server/.env")) {
    Write-Host "Creating server .env file..." -ForegroundColor Yellow
    Copy-Item "server/.env.example" "server/.env"
    Write-Host ""
    Write-Host "NOTE: Please edit server/.env with your MongoDB URI and JWT_SECRET" -ForegroundColor Red
    Write-Host ""
}

# Start both servers in separate processes
Write-Host "Starting backend server on http://localhost:5002..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location server; npm run dev`""

Write-Host "Starting frontend server on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location client; npm run dev`""

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:   http://localhost:5002" -ForegroundColor Cyan
Write-Host "Frontend UI:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "Health Check:  http://localhost:5002/api/v1/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close the windows to stop the servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
