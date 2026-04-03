# CrimeAtlas - Simple Startup Script
# Run this file to start backend + frontend automatically

Write-Host "🚀 CrimeAtlas Startup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Kill any existing processes on ports 5000 and 3001
Write-Host "`n⏹️  Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear disk space
Write-Host "🧹 Clearing cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
Remove-Item -Path ".\frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null

# Start Backend
Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath PowerShell -ArgumentList "-NoExit", "-Command", "cd '.\backend' && & '.\.venv\Scripts\Activate.ps1' && python app.py" -PassThru -WindowStyle Normal
Start-Sleep -Seconds 4

# Start Frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath PowerShell -ArgumentList "-NoExit", "-Command", "cd '.\frontend' && npm run dev" -PassThru -WindowStyle Normal
Start-Sleep -Seconds 5

# Display info
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "✅ SERVERS RUNNING!" -ForegroundColor Green
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Backend Server:" -ForegroundColor Yellow
Write-Host "  📍 http://localhost:5000" -ForegroundColor Cyan

Write-Host "`nFrontend Server:" -ForegroundColor Yellow
Write-Host "  📍 http://localhost:3001 (or 3000)" -ForegroundColor Cyan

Write-Host "`n📱 Access the App:" -ForegroundColor Yellow
Write-Host "  🏠 Dashboard: http://localhost:3001" -ForegroundColor Cyan
Write-Host "  🗺️  Map: http://localhost:3001/map" -ForegroundColor Cyan
Write-Host "  🚔 Police: http://localhost:3001/police" -ForegroundColor Cyan
Write-Host "  📊 City Insights: http://localhost:3001/city/mumbai" -ForegroundColor Cyan
Write-Host "  🎯 Predictions: http://localhost:3001/predict" -ForegroundColor Cyan

Write-Host "`n⏹️  To stop: Close both terminal windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host "======================================`n" -ForegroundColor Cyan

# Keep script running
while ($true) { Start-Sleep -Seconds 10 }
