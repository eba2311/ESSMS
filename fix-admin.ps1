# Run this in PowerShell as Administrator
Write-Host "Resetting admin password..." -ForegroundColor Cyan

# Try using mongosh first
try {
    $result = mongosh "mongodb://localhost:27017/essms_dev" --eval "db.users.updateOne({email:'admin@school.edu.et'},{\$set:{failedLoginAttempts:0,accountLockedUntil:null,isActive:true,forcePasswordChange:false}})"
    Write-Host "mongosh result: $result" -ForegroundColor Green
} catch {
    Write-Host "mongosh not found, trying via node script..." -ForegroundColor Yellow
}

# Try the existing reset script
Push-Location "$PSScriptRoot\server"
node reset-admin-password.js
Pop-Location

Write-Host "`nDone! Try logging in now." -ForegroundColor Green
Write-Host "Email: admin@school.edu.et" -ForegroundColor Yellow
Write-Host "Password: Admin123!" -ForegroundColor Yellow
