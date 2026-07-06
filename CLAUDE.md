# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

"Aibi" — ESP32-WROOM tabanlı cep robotu. ILI9341 TFT ekranda animasyonlu göz/yüz,
MPU6050 (sarsma/ters çevrilme/baş dönmesi), 2× TTP223 (dokunma/okşama), INMP441 I2S
mikrofon, MAX98357A I2S amfi. Yol haritasında OpenAI tabanlı anlık sesli çeviri var
(Aşama 5, henüz yazılmadı). Kod ve dokümantasyon Türkçedir (ASCII, Türkçe karakter
kullanılmaz — kaynak dosyalara ç/ğ/ş yazmayın, encoding sorunları yaşandı).

## Kritik çalışma kuralı

`GELISTIRME_PLANI.md` projenin canlı plan + değişiklik günlüğüdür. Her anlamlı
değişiklikte ilgili madde işaretlenir ve "Değişiklik Günlüğü"ne tarihli satır eklenir.
Donanım pin haritası ve kablolama rehberi de bu dosyadadır; pin değişikliği yaparken
hem `sketch_may5a/config.h` hem bu dosya güncellenmelidir.

## Derleme ve yükleme

```powershell
.\upload.ps1 -SadeceDerle     # sadece derle
.\upload.ps1                  # derle + COM portu otomatik bul + yükle
.\upload.ps1 -Port COM4       # portu elle belirt
```

Betik gerekirse arduino-cli'yi `bin\` içine indirir, esp32 çekirdeğini ve TFT_eSPI'yi
kurar ve **projedeki `User_Setup.h`'ı TFT_eSPI kütüphane klasörüne kopyalar** (ekran
pinleri oradan gelir — bu kopyalama atlanırsa ekran çalışmaz). Doğrudan cli:
`bin\arduino-cli.exe compile --fqbn esp32:esp32:esp32 sketch_may5a`.

Seri test: 115200 baud; `yardim` komut listesini basar. Duygular seri komutla
tetiklenir (`mutlu`, `oksa`, `ters`, `sersem`...), `durum` telemetri basar
(durum adı, mikrofon seviyesi, MPU var/yok, ham acc, boş heap). Donanımsız test
için bu komutlar birincil araçtır.

**Doğrulama geleneği:** config.h'daki `MODUL_*` bayrakları hem hepsi 1 hem hepsi 0
iken derleme temiz olmalı (çift yönlü derleme testi).

## Mimari

Tek sketch: `sketch_may5a/sketch_may5a.ino` (+ `config.h` tüm pinler/eşikler/bayraklar).
Gizli dosyalar gitignore'ludur ve şablondan kopyalanır: `wifi_config.h`
(`wifi_config.example.h`) ve `api_config.h` (`api_config.example.h`).

- **Modül bayrakları** (`config.h` içinde `MODUL_MPU/MIK/DOKUNMA/OKSAMA/AMFI/APDS/CEVIRI`):
  takılı olmayan donanımın kodu derlenmez/çalışmaz. I2C cihazlar ayrıca açılışta
  taranıp `mpuVar` gibi bayraklarla çalışma zamanında da devre dışı kalır — modül
  yokken çöp veri okunmaz. Yeni sensör eklerken bu iki katmanlı deseni koru.
- **Durum makinesi**: `AibiDurum` enum'u (IDLE, MUTLU, ... TERS, BASI_DONDU, SEVINC).
  Geçişler `durumaGec(durum, süre)` ile; süre dolunca `durumMakinesiGuncelle()` IDLE'a
  döndürür. IDLE'da `idleDavranisSec()` ağırlıklı rastgele duygu seçer (boşta canlanma).
  IMU tespit önceliği: TERS > BASI_DONDU > SARSMA. Yeni duygu eklerken: enum +
  `durumAdi()` + `animasyonlariHesapla()` case + `durumSesiCal()` + gerekiyorsa
  `cizimiGuncelle()` renk/maske + seri komut.
- **Çizim**: 320x240 8-bit sprite'a çizilir, `pushSprite` ile basılır (~77 KB heap;
  16-bit sprite kullanma — tek parça heap yetmez). Ana döngü millis tabanlı ~60 FPS
  (`KARE_SURESI_MS`). Gözler `Goz` struct'ı ile lerp animasyonu + squash&stretch.
- **Ses**: `tonCal(frekans)` soyutlaması — `MODUL_AMFI=1` iken I2S_NUM_0'a sinüs
  sentezi yapan `sesGorev` FreeRTOS görevi (core 0), 0 iken LEDC buzzer. Melodiler
  `TonAdim` dizileri + `melodiBaslat()`; `sesKontrol()` ana döngüde ilerletir.
  GPIO26 çift görevlidir: AMFI=1'de I2S BCLK, AMFI=0'da buzzer.
- **Mikrofon**: `mikGorev` görevi (core 0, I2S_NUM_1) pencere ortalamasını
  `sesSeviyesi`ne yazar; `mikSesDinle()` eşik üstünde DINLIYOR durumuna geçirir.
  `SES_ESIGI` tepe değil ortalamaya göredir; donanım testinde kalibrasyon gerekebilir.

## Bilinen tuzaklar

- PowerShell 5.1 betikleri (upload.ps1) BOM'suz UTF-8'i ANSI okur: betiklerde ve
  kaynak kodda em-dash/ok gibi çok baytlı karakter kullanma.
- GPIO12 boot strapping pinidir, kullanılmaz. Pin bütçesi ve yedek pinler
  GELISTIRME_PLANI.md'deki haritada.
- Kullanıcının fotoğrafları (\*.jpeg) yereldir, gitignore'ludur — `git add -A`
  ile repoya sokma (gizlilik).
- Çalışma dalı `kod-revizyonu`; main'e doğrudan commit atma.
