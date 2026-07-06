# ============================================================================
#  AIBI ROBOT — Windows derleme + yukleme betigi
#  Kullanim:
#    .\upload.ps1                  → derle ve karta yukle (port otomatik bulunur)
#    .\upload.ps1 -SadeceDerle     → sadece derle, yukleme yapma
#    .\upload.ps1 -Port COM5       → portu elle belirt
# ============================================================================

param(
    [switch]$SadeceDerle,
    [string]$Port = ""
)

$ErrorActionPreference = "Stop"
$ProjeKok = $PSScriptRoot
$Cli = Join-Path $ProjeKok "bin\arduino-cli.exe"
$Sketch = Join-Path $ProjeKok "sketch_may5a"
$Fqbn = "esp32:esp32:esp32"

# --- 1. arduino-cli var mi? Yoksa indir ---
if (-not (Test-Path $Cli)) {
    Write-Host "=== 1. arduino-cli indiriliyor ===" -ForegroundColor Cyan
    $binKlasor = Join-Path $ProjeKok "bin"
    New-Item -ItemType Directory -Force $binKlasor | Out-Null
    $zipYol = Join-Path $env:TEMP "arduino-cli.zip"
    Invoke-WebRequest -Uri "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip" -OutFile $zipYol
    Expand-Archive -Path $zipYol -DestinationPath $binKlasor -Force
    Remove-Item $zipYol
    Write-Host "arduino-cli kuruldu: $Cli"
} else {
    Write-Host "=== 1. arduino-cli mevcut ===" -ForegroundColor Cyan
}

# --- 2. ESP32 cekirdegi ---
Write-Host "=== 2. ESP32 cekirdegi kontrol ediliyor ===" -ForegroundColor Cyan
$esp32Url = "https://espressif.github.io/arduino-esp32/package_esp32_index.json"
$kurulu = & $Cli core list --additional-urls $esp32Url 2>$null | Select-String "esp32:esp32"
if (-not $kurulu) {
    & $Cli core update-index --additional-urls $esp32Url
    & $Cli core install esp32:esp32 --additional-urls $esp32Url
    if ($LASTEXITCODE -ne 0) { throw "ESP32 cekirdegi kurulamadi!" }
} else {
    Write-Host "ESP32 cekirdegi zaten kurulu."
}

# --- 3. TFT_eSPI kutuphanesi ---
Write-Host "=== 3. TFT_eSPI kutuphanesi kontrol ediliyor ===" -ForegroundColor Cyan
$libKurulu = & $Cli lib list 2>$null | Select-String "TFT_eSPI"
if (-not $libKurulu) {
    & $Cli lib install TFT_eSPI
    if ($LASTEXITCODE -ne 0) { throw "TFT_eSPI kurulamadi!" }
} else {
    Write-Host "TFT_eSPI zaten kurulu."
}

# --- 4. User_Setup.h'i kutuphaneye kopyala (ekran pin ayarlari) ---
Write-Host "=== 4. User_Setup.h kutuphaneye kopyalaniyor ===" -ForegroundColor Cyan
$libYol = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Arduino\libraries\TFT_eSPI"
if (-not (Test-Path $libYol)) { throw "TFT_eSPI kutuphane klasoru bulunamadi: $libYol" }
Copy-Item (Join-Path $ProjeKok "User_Setup.h") (Join-Path $libYol "User_Setup.h") -Force
Write-Host "Kopyalandi: $libYol\User_Setup.h"

# --- 5. wifi_config.h kontrolu ---
$wifiConf = Join-Path $Sketch "wifi_config.h"
if (-not (Test-Path $wifiConf)) {
    Copy-Item (Join-Path $Sketch "wifi_config.example.h") $wifiConf
    Write-Host "UYARI: wifi_config.h sablondan olusturuldu - TTS kullanacaksaniz duzenleyin." -ForegroundColor Yellow
}

# --- 6. Derleme ---
Write-Host "=== 5. Kod derleniyor (ilk seferde birkac dakika surebilir) ===" -ForegroundColor Cyan
& $Cli compile --fqbn $Fqbn $Sketch
if ($LASTEXITCODE -ne 0) { throw "DERLEME HATASI! Yukaridaki ciktiyi kontrol edin." }
Write-Host "Derleme basarili." -ForegroundColor Green

if ($SadeceDerle) {
    Write-Host "=== Sadece derleme istendi, cikiliyor. ===" -ForegroundColor Green
    exit 0
}

# --- 7. Port tespiti ---
if ($Port -eq "") {
    Write-Host "=== 6. ESP32 portu araniyor ===" -ForegroundColor Cyan
    $portJson = & $Cli board list --format json | ConvertFrom-Json
    $adaylar = @($portJson.detected_ports | Where-Object { $_.port.protocol -eq "serial" })
    if ($adaylar.Count -eq 0) {
        throw "Seri port bulunamadi! ESP32 USB'ye takili mi? Surucu (CP210x/CH340) kurulu mu?"
    }
    $Port = $adaylar[0].port.address
    Write-Host "Port bulundu: $Port"
}

# --- 8. Yukleme ---
Write-Host "=== 7. Karta yukleniyor ($Port) ===" -ForegroundColor Cyan
& $Cli upload -p $Port --fqbn $Fqbn $Sketch
if ($LASTEXITCODE -ne 0) { throw "YUKLEME HATASI! Kart baglantisini ve portu kontrol edin." }

Write-Host "=== BASARILI! Kod ESP32'ye yuklendi. ===" -ForegroundColor Green
Write-Host "Seri monitor icin: $Cli monitor -p $Port -c baudrate=115200"
