# apply-cleanup.ps1
# Run this from your mise-en-place repo root in PowerShell.
# Expects mise-en-place-cleanup.zip in the same directory (or pass path as argument).
#
# Usage:
#   .\apply-cleanup.ps1
#   # or
#   .\apply-cleanup.ps1 -ZipPath "C:\path\to\mise-en-place-cleanup.zip"

param(
    [string]$ZipPath = "mise-en-place-cleanup.zip"
)

$ErrorActionPreference = "Stop"

# Check zip exists
if (-not (Test-Path $ZipPath)) {
    Write-Host "ERROR: Could not find $ZipPath" -ForegroundColor Red
    Write-Host "Place it in this directory or pass -ZipPath <path>"
    exit 1
}

# Safety check — make sure we're in the repo root
if (-not (Test-Path "package.json") -or -not (Test-Path "prisma")) {
    Write-Host "ERROR: Run this from the mise-en-place repo root." -ForegroundColor Red
    exit 1
}

Write-Host "=== Creating new directories ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "src\middleware" | Out-Null
New-Item -ItemType Directory -Force -Path "tests\helpers" | Out-Null

Write-Host "=== Extracting updated files ===" -ForegroundColor Cyan
$tempDir = Join-Path $env:TEMP "mep-cleanup"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath $tempDir -Force

# Copy everything from the extracted tree into the repo
$sourceDir = Join-Path $tempDir "mise-en-place"
Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
    $destPath = Join-Path (Get-Location) $relativePath
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    Copy-Item $_.FullName -Destination $destPath -Force
    Write-Host "  Updated: $relativePath"
}

# Clean up temp
Remove-Item $tempDir -Recurse -Force

Write-Host "=== Removing old root jest-setup.ts ===" -ForegroundColor Cyan
if (Test-Path "jest-setup.ts") {
    git rm jest-setup.ts 2>$null
    if ($LASTEXITCODE -ne 0) { Remove-Item "jest-setup.ts" }
    Write-Host "  Removed jest-setup.ts (moved to tests\helpers\)"
} else {
    Write-Host "  jest-setup.ts already gone, skipping."
}

Write-Host "=== Removing cleanup changelog ===" -ForegroundColor Cyan
if (Test-Path "CHANGELOG-cleanup.md") {
    Remove-Item "CHANGELOG-cleanup.md"
    Write-Host "  Removed CHANGELOG-cleanup.md (reference only)"
}

Write-Host ""
Write-Host "=== Done! Next steps ===" -ForegroundColor Green
Write-Host "  1. Review changes:  git diff"
Write-Host "  2. Run tests:       npm test"
Write-Host "  3. If happy:        git add -A && git commit -m 'refactor: Phase 1 code cleanup and standardisation'"
