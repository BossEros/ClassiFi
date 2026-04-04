# ============================================================
# ClassiFi: Validate-and-Push Hook Script (Windows PowerShell)
# Triggered by: Stop event (end of agent session)
# Purpose: Run all tests, builds, and lint checks.
#          Push to remote only if every check passes.
# ============================================================

$ErrorActionPreference = "Continue"

# Resolve workspace root via git
$WorkspaceRoot = git rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not inside a git repository. Aborting." -ForegroundColor Red
    exit 2
}
$WorkspaceRoot = $WorkspaceRoot.Trim()

$OverallFailed = $false

function Invoke-Check {
    param(
        [string]$Label,
        [scriptblock]$ScriptBlock
    )
    Write-Host ""
    Write-Host "--- [$Label] ---" -ForegroundColor Cyan
    & $ScriptBlock
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Label" -ForegroundColor Red
        return $false
    }
    Write-Host "PASSED: $Label" -ForegroundColor Green
    return $true
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host " ClassiFi: Pre-Push Validation Starting..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow

# ── Backend Checks ────────────────────────────────────────
Set-Location "$WorkspaceRoot\backend-ts"

$Result = Invoke-Check -Label "Backend | TypeScript Check" -ScriptBlock { npm run typecheck }
if (-not $Result) { $OverallFailed = $true }

$Result = Invoke-Check -Label "Backend | Lint Check" -ScriptBlock { npm run lint }
if (-not $Result) { $OverallFailed = $true }

$Result = Invoke-Check -Label "Backend | Unit Tests" -ScriptBlock { npm test }
if (-not $Result) { $OverallFailed = $true }

# ── Frontend Checks ───────────────────────────────────────
Set-Location "$WorkspaceRoot\frontend"

$Result = Invoke-Check -Label "Frontend | Build (TypeScript + Vite)" -ScriptBlock { npm run build }
if (-not $Result) { $OverallFailed = $true }

$Result = Invoke-Check -Label "Frontend | Lint Check" -ScriptBlock { npm run lint }
if (-not $Result) { $OverallFailed = $true }

$Result = Invoke-Check -Label "Frontend | Unit Tests" -ScriptBlock { npx vitest run }
if (-not $Result) { $OverallFailed = $true }

# ── Result ────────────────────────────────────────────────
Set-Location $WorkspaceRoot

Write-Host ""
if ($OverallFailed) {
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host " VALIDATION FAILED — Push aborted." -ForegroundColor Red
    Write-Host " Fix all errors above before pushing." -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    exit 2
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host " All checks passed! Pushing to remote..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git push failed." -ForegroundColor Red
    exit 2
}

Write-Host ""
Write-Host "Push complete!" -ForegroundColor Green
exit 0
