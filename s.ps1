$Host.UI.RawUI.WindowTitle = "ShopDee Modernized Launcher"

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# Helper function for section headers
function Write-Section($index, $total, $message) {
    Write-Host ""
    Write-Host "[$index/$total] $message" -ForegroundColor Yellow
}

# Improved port check to suppress internal warnings
function Test-PortOpen($port) {
    try {
        $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Wait for a port to open with a timeout
function Wait-PortOpen($port, $timeoutSeconds = 30) {
    Write-Host "      Dang doi dich vu tren port $port khoi dong..." -ForegroundColor Gray -NoNewline
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-PortOpen $port) {
            Write-Host " [OK]" -ForegroundColor Green
            return $true
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    Write-Host " [TIMEOUT]" -ForegroundColor Red
    return $false
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

# --- 0. CLEANUP PORTS ---
Write-Host "Dang lam sach cac port (3000, 8000, 5000)..." -ForegroundColor Gray
npx kill-port 3000 8000 5000 > $null 2>&1

# --- 1. CONFIGURATION CHECK ---
if (-not (Test-Path "$ROOT\backend\.env")) {
    Write-Host "      [CANH BAO] Thieu file backend/.env! Hay copy tu .env.example" -ForegroundColor Red
}
if (-not (Test-Path "$ROOT\frontend\.env.local")) {
    Write-Host "      [CANH BAO] Thieu file frontend/.env.local! Hay copy tu .env.local.example" -ForegroundColor Red
}

# --- 2. XAMPP CHECK ---
Write-Section 1 5 "Kiem tra XAMPP (Apache + MySQL)..."
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

if (-not $apache -or -not $mysql) {
    Write-Host "      XAMPP chua chay! Vui long mo XAMPP Control Panel va bat Apache + MySQL." -ForegroundColor Red
    Write-Host "      Nhan phim bat ky de tiep tuc sau khi da bat..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
else {
    Write-Host "      OK - Apache va MySQL dang hoat dong." -ForegroundColor Green
}

# --- 3. BACKEND (Laravel) ---
Write-Section 2 5 "Khoi dong Backend Laravel..."
Start-Window 'ShopDee Backend :8000' "$ROOT\backend" 'php artisan serve --host=127.0.0.1 --port=8000'
if (Wait-PortOpen 8000) {
    Write-Host "      Backend: http://localhost:8000" -ForegroundColor Green
}
else {
    Write-Host "      Loi: Backend khong phan hoi tren port 8000." -ForegroundColor Red
}

# --- 4. FRONTEND (Next.js) ---
Write-Section 3 5 "Khoi dong Frontend Next.js..."
Start-Window 'ShopDee Frontend :3000' "$ROOT\frontend" 'npm run dev'
if (Wait-PortOpen 3000) {
    Write-Host "      Frontend: http://localhost:3000" -ForegroundColor Green
}
else {
    Write-Host "      Loi: Frontend khong phan hoi tren port 3000." -ForegroundColor Red
}

# --- 5. AI MICROSERVICE ---
Write-Section 4 5 "Khoi dong AI Fraud Detection..."
Start-Window 'ShopDee AI API :5000' "$ROOT\shopdee-ai" 'python api.py'
if (Wait-PortOpen 5000) {
    Write-Host "      AI API: http://localhost:5000" -ForegroundColor Green
}
else {
    Write-Host "      Loi: AI API khong phan hoi tren port 5000." -ForegroundColor Red
}

# --- 6. CLOUDFLARE TUNNEL ---
Write-Section 5 5 "Khoi dong Cloudflare Tunnel..."
$cloudflaredProcess = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
if ($cloudflaredProcess) {
    Write-Host "      OK - Cloudflare tunnel dang chay." -ForegroundColor Green
}
else {
    if (-Not (Test-Path "$ROOT\cloudflared.exe")) {
        Write-Host "      Bo qua (Khong tim thay cloudflared.exe)" -ForegroundColor Gray
    }
    else {
        Start-Window 'ShopDee Cloudflare Tunnel' "$ROOT" '.\cloudflared.exe tunnel --config cloudflare-config.yml run'
        Write-Host "      OK - Tunnel dang khoi tao..." -ForegroundColor Green
    }
}

# --- COMPLETION ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   HE THONG DA SẴN SÀNG!                       " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Admin Dash: http://localhost:3000/admin/ai-security" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:    http://localhost:8000" -ForegroundColor White
Write-Host "  AI metrics: http://localhost:5000/metrics" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Luu y: Kiem tra API KEY trong .env neu co loi tinh nang." -ForegroundColor Cyan
Write-Host "  Dong cac terminal rieng de dung tung dich vu." -ForegroundColor Yellow
Write-Host ""
