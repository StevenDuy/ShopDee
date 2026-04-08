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

# --- DON DEP PORT CU ---
Write-Host "Dang don dep cac port (3000, 8000, 5000) de dam bao khoi dong sạch..." -ForegroundColor Gray
npx kill-port 3000 8000 5000 > $null 2>&1

# --- 0. KIEM TRA FILE CAU HINH ---
if (-not (Test-Path "$ROOT\backend\.env")) {
    Write-Host "      [CANH BAO] Thieu file backend/.env! Hay copy tu .env.example" -ForegroundColor Red
}
if (-not (Test-Path "$ROOT\frontend\.env.local")) {
    Write-Host "      [CANH BAO] Thieu file frontend/.env.local! Hay copy tu .env.local.example" -ForegroundColor Red
}

# --- 1. KIEM TRA XAMPP ---
Write-Section 1 5 "Kiem tra XAMPP (Apache + MySQL)..."
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

if (-not $apache -or -not $mysql) {
    Write-Host "      XAMPP chua chay! Hay mo XAMPP va Start Apache + MySQL." -ForegroundColor Red
    Write-Host "      Nhan phim bat ky de tiep tuc sau khi mo XAMPP..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "      OK - Apache va MySQL dang chay." -ForegroundColor Green
}

# --- 2. KHOI DONG BACKEND (Laravel) ---
Write-Section 2 5 "Khoi dong Backend Laravel (port 8000)..."
if (Test-PortOpen 8000) {
    Write-Host "      Backend da chay tren port 8000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee Backend :8000' "$ROOT\backend" 'php artisan serve --host=127.0.0.1 --port=8000'
    Start-Sleep -Seconds 3
    Write-Host "      OK - http://localhost:8000" -ForegroundColor Green
}

# --- 3. KHOI DONG FRONTEND (Next.js) ---
Write-Section 3 5 "Khoi dong Frontend Next.js (port 3000)..."
if (Test-PortOpen 3000) {
    Write-Host "      Frontend da chay tren port 3000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee Frontend :3000' "$ROOT\frontend" 'npx kill-port 3000; npm run dev'
    Start-Sleep -Seconds 3
    Write-Host "      OK - http://localhost:3000" -ForegroundColor Green
}

# --- 4. KHOI DONG AI MICRO SERVICE ---
Write-Section 4 5 "Khoi dong AI Fraud Detection Microservice (port 5000)..."
if (Test-PortOpen 5000) {
    Write-Host "      AI API da chay tren port 5000." -ForegroundColor Green
} else {
    Start-Window 'ShopDee AI API :5000' "$ROOT\shopdee-ai" 'python api.py'
    Start-Sleep -Seconds 3
    Write-Host "      OK - AI API: http://localhost:5000" -ForegroundColor Green
}

# --- 5. KHOI DONG CLOUDFLARE TUNNEL ---
Write-Section 5 5 "Khoi dong Cloudflare Tunnel (shopdee.io.vn)..."
$cloudflaredProcess = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
if ($cloudflaredProcess) {
    Write-Host "      Cloudflare tunnel da chay." -ForegroundColor Green
} else {
    if (-Not (Test-Path "$ROOT\cloudflared.exe")) {
        Write-Host "      Bo qua (Khong tim thay cloudflared.exe)" -ForegroundColor Gray
    } else {
        Start-Window 'ShopDee Cloudflare Tunnel' "$ROOT" '.\cloudflared.exe tunnel --config cloudflare-config.yml run'
        Write-Host "      OK - Tunnel dang ket noi..." -ForegroundColor Green
    }
}

# --- HOAN TAT ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   HE THONG DA HOAT DONG!                      " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Admin Dash: http://localhost:3000/admin/ai-security" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:    http://localhost:8000" -ForegroundColor White
Write-Host "  AI metrics: http://localhost:5000/metrics" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Luu y: Hay dien cac API KEY trong file .env de cac tinh nang hoat dong." -ForegroundColor Cyan
Write-Host "  Dong cac cua so Terminal rieng le de tat tung thanh phan." -ForegroundColor Yellow
Write-Host ""
