$Host.UI.RawUI.WindowTitle = "ShopDee Modernized Launcher"

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SHOPDEE MODERNIZED - SMART LOGISTICS AI      " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. KIEM TRA XAMPP ---
Write-Host "[1/4] Kiem tra XAMPP (Apache + MySQL)..." -ForegroundColor Yellow
$apache = Get-Process -Name "httpd"  -ErrorAction SilentlyContinue
$mysql  = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

if (-not $apache -or -not $mysql) {
    Write-Host "      XAMPP chua chay! Hay mo XAMPP va Start Apache + MySQL." -ForegroundColor Red
    Write-Host "      Nhan phim bat ky de tiep tuc..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "      OK - Apache va MySQL dang chay." -ForegroundColor Green
}

# --- 2. KHOI DONG BACKEND (Laravel) ---
Write-Host ""
Write-Host "[2/4] Khoi dong Backend Laravel (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$Host.UI.RawUI.WindowTitle = 'ShopDee Backend :8000'; Set-Location '$ROOT\backend'; php artisan migrate; php artisan serve --host=127.0.0.1 --port=8000 }"
)
Start-Sleep -Seconds 3
Write-Host "      OK - http://localhost:8000" -ForegroundColor Green

# --- 3. KHOI DONG FRONTEND (Next.js) ---
Write-Host ""
Write-Host "[3/4] Khoi dong Frontend Next.js (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$Host.UI.RawUI.WindowTitle = 'ShopDee Frontend :3000'; Set-Location '$ROOT\frontend';npx kill-port 3000; npm run dev }"
)
Start-Sleep -Seconds 2
Write-Host "      OK - http://localhost:3000" -ForegroundColor Green

# --- 4. KHOI DONG CLOUDFLARE TUNNEL ---
Write-Host ""
Write-Host "[4/4] Khoi dong Cloudflare Tunnel (domain shopdee.io.vn)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$Host.UI.RawUI.WindowTitle = 'ShopDee Cloudflare Tunnel'; Set-Location '$ROOT'; .\cloudflared.exe tunnel --config cloudflare-config.yml run }"
)
Start-Sleep -Seconds 3
Write-Host "      OK - Tunnel dang ket noi..." -ForegroundColor Green

# --- HOAN TAT ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   HE THONG DA HOAT DONG!                      " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Website:  https://shopdee.io.vn              " -ForegroundColor White
Write-Host "  API:      https://api.shopdee.io.vn          " -ForegroundColor White
Write-Host "  Local FE: http://localhost:3000              " -ForegroundColor White
Write-Host "  Local BE: http://localhost:8000              " -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Ghi chu: AI Behavioral Telemetry dang duoc ghi lai." -ForegroundColor Cyan
Write-Host "  Dung lenh 'php artisan ai:simulate-fraud' de tao du lieu." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dong cac cua so Terminal de tat he thong.    " -ForegroundColor Yellow
Write-Host ""
