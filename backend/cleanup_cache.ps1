Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Python Cache Cleanup Utility" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Get the backend directory
$backendDir = $PSScriptRoot

Write-Host "Cleaning cache in: " -NoNewline
Write-Host $backendDir -ForegroundColor Yellow
Write-Host ""

# Count variables
$filesRemoved = 0
$dirsRemoved = 0

# Find and remove .pyc and .pyo files
Write-Host "Scanning for cache files..." -ForegroundColor Cyan
Write-Host ""

# Remove .pyc and .pyo files (excluding venv)
$cacheFiles = Get-ChildItem -Path $backendDir -Recurse -Include *.pyc,*.pyo -File -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch '\\(venv|\.venv|env|node_modules|\.git)\\' }

foreach ($file in $cacheFiles) {
    try {
        Remove-Item -Path $file.FullName -Force -ErrorAction Stop
        Write-Host "Removed: $($file.FullName)" -ForegroundColor Gray
        $filesRemoved++
    }
    catch {
        Write-Host "Error removing $($file.FullName): $_" -ForegroundColor Red
    }
}

# Remove __pycache__ directories (excluding venv)
Write-Host ""
$cacheDirs = Get-ChildItem -Path $backendDir -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch '\\(venv|\.venv|env|node_modules|\.git)\\' }

foreach ($dir in $cacheDirs) {
    try {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction Stop
        Write-Host "Removed: $($dir.FullName)" -ForegroundColor Gray
        $dirsRemoved++
    }
    catch {
        Write-Host "Error removing $($dir.FullName): $_" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Cleanup Summary:" -ForegroundColor Green
Write-Host "  Cache files removed: $filesRemoved" -ForegroundColor White
Write-Host "  Cache directories removed: $dirsRemoved" -ForegroundColor White
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""
Write-Host "Cache cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: If you have a running development server," -ForegroundColor Yellow
Write-Host "please restart it to ensure it uses the updated code." -ForegroundColor Yellow
Write-Host ""
