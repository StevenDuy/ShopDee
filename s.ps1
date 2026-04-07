$Host.UI.RawUI.WindowTitle = "ShopDee Modernized Launcher"

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Section($index, $total, $message) {
    Write-Host ""
    Write-Host "[$index/$total] $message" -ForegroundColor Yellow
}

function Test-PortOpen($port) {
    return Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet
}

function Start-Window($title, $path, $command) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "& { `$Host.UI.RawUI.WindowTitle = '$title'; Set-Location '$path'; $command }"
    )
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SHOPDEE MODERNIZED - SMART LOGISTICS AI      " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. KIEM TRA XAMPP ---
Write-Section 1 4 "Kiem tra XAMPP (Apache + MySQL)..."
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

if (-not $apache -or -not $mysql) {
    Write-Host "      XAMPP chua chay! Hay mo XAMPP va Start Apache + MySQL." -ForegroundColor Red
    Write-Host "      Nhan phim bat ky de tiep tuc..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "      OK - Apache va MySQL dang chay." -ForegroundColor Green
}

# --- 2. KHOI DONG BACKEND (Laravel) ---
Write-Section 2 4 "Khoi dong Backend Laravel (port 8000)..."
if (Test-PortOpen 8000) {
    Write-Host "      Backend da chay tren port 8000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee Backend :8000' "$ROOT\backend" 'php artisan serve --host=127.0.0.1 --port=8000'
    Start-Sleep -Seconds 5
    Write-Host "      OK - http://localhost:8000" -ForegroundColor Green
}

# --- 3. KHOI DONG FRONTEND (Next.js) ---
Write-Section 3 4 "Khoi dong Frontend Next.js (port 3000)..."
if (Test-PortOpen 3000) {
    Write-Host "      Frontend da chay tren port 3000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee Frontend :3000' "$ROOT\frontend" 'npx kill-port 3000; npm run dev'
    Start-Sleep -Seconds 5
    Write-Host "      OK - http://localhost:3000" -ForegroundColor Green
}

# --- 4. KHOI DONG CLOUDFLARE TUNNEL ---
Write-Section 4 4 "Khoi dong Cloudflare Tunnel (domain shopdee.io.vn)..."
$cloudflaredProcess = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
if ($cloudflaredProcess) {
    Write-Host "      Cloudflare tunnel da chay." -ForegroundColor Green
} else {
    if (-Not (Test-Path "$ROOT\cloudflared.exe")) {
        Write-Host "      Khong tim thay cloudflared.exe tai $ROOT" -ForegroundColor Red
    } else {
        Start-Window 'ShopDee Cloudflare Tunnel' "$ROOT" '.\cloudflared.exe tunnel --config cloudflare-config.yml run'
        Start-Sleep -Seconds 5
        Write-Host "      OK - Tunnel dang ket noi..." -ForegroundColor Green
    }
}

# --- 5. KHOI DONG AI MICRO SERVICE ---
Write-Host ""
Write-Host "[5/5] Khoi dong AI Fraud Detection Microservice..." -ForegroundColor Yellow
if (Test-PortOpen 5000) {
    Write-Host "      AI API da chay tren port 5000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee AI API :5000' "$ROOT\shopdee-ai" 'python -m uvicorn api:app --host=127.0.0.1 --port=5000'
    Start-Sleep -Seconds 5
    Write-Host "      OK - AI API: http://localhost:5000" -ForegroundColor Green
}

# --- HOAN TAT ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   HE THONG DA HOAT DONG!                      " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Local FE: http://localhost:3000              " -ForegroundColor White
Write-Host "  Local BE: http://localhost:8000              " -ForegroundColor White
Write-Host "  AI API:   http://localhost:5000              " -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Luu y: tren may can chay AI service va Cloudflare tunnel de truy cap backend/frontend." -ForegroundColor Cyan
Write-Host "  Neu can train lai AI, mo AI terminal va chay 'python train.py' hoac 'php artisan ai:export-data' tu dong." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dong cac cua so Terminal de tat he thong.    " -ForegroundColor Yellow
Write-Host ""
