# Aibi Cep Robotu — Geliştirme Planı ve Değişiklik Günlüğü

Bu dosya projenin yol haritasını ve yapılan her değişikliğin kaydını tutar.
Her madde tamamlandıkça `[x]` işaretlenir ve sondaki **Değişiklik Günlüğü**ne tarihli satır eklenir.

## Projenin Amacı

Aibi bir **cep robotu**: ILI9341 ekranda animasyonlu yüz, okşayınca sevinir, sallanınca
başı döner, ters çevrilince tepki verir, **anlık sesli çeviri** yapar (konuşulan dili
otomatik algılar, seçilen hedef dile çevirip sesli söyler) ve jest sensörüyle "görür"
(el sallama, yaklaşma, ortam ışığı). Hareket etmez. İleride PCB'ye taşınacak; bu yüzden
tüm modüller **lehimsiz** (hazır header'lı) seçildi. Sabit kalanlar: ESP32-WROOM + ILI9341.

---

# v2 — Cep Robotu Dönüşümü (AKTİF)

## Satın Alma Listesi (hepsi lehimsiz / header'lı versiyon)

| # | Modül | Görev | Bağlantı | Not |
|---|-------|-------|----------|-----|
| 1 | MPU6050 (GY-521) | Sallanma, ters çevrilme, sarsılma | I2C (0x68) | "Lehimli headerlı" versiyonu alın |
| 2 | 2× TTP223 dokunmatik | Okşama algısı (sıralı tetikleme) | 2 GPIO | Tek dokunuş = mutlu; iki sensör art arda = okşama |
| 3 | INMP441 I2S mikrofon | Çeviri kaydı + ses tepkisi | I2S ×3 | Kod desteği hazır |
| 4 | MAX98357A I2S amfi | Çeviri sesi + tüm efekt sesleri | I2S ×3 | **Vidalı klemensli** versiyonu alın (hoparlör lehimsiz bağlanır) |
| 5 | 4Ω 3W mini hoparlör | Ses çıkışı | Amfi klemensi | Çıplak uçlu kablolu olan yeterli |
| 6 | APDS-9960 | "Görme": jest, yaklaşma, ışık | I2C (0x39) | MPU ile aynı I2C hattı, adres çakışmaz |
| 7 | (Ops.) Mini powerbank | Cepte güç | USB | LiPo devresi lehim ister; powerbank lehimsiz çözüm |

## Pin Haritası (PCB'ye temel olacak)

| Modül | Sinyal | ESP32 GPIO |
|-------|--------|-----------|
| ILI9341 | CS / DC / RST / SCLK / MOSI / MISO | 15 / 2 / 4 / 18 / 23 / 19 |
| I2C (MPU6050 + APDS-9960) | SDA / SCL | 21 / 22 |
| INMP441 (I2S_NUM_1) | SCK / WS / SD | 14 / 27 / 32 |
| MAX98357A (I2S_NUM_0) | BCLK / LRC / DIN | 26 / 25 / 33 |
| TTP223 #1 | I/O | 13 |
| TTP223 #2 | I/O | 16 |
| APDS-9960 INT (ops.) | INT | 35 (input-only) |

GPIO 12 boot strapping pini olduğu için bilinçli kullanılmadı. Yedek: 17, 34, 36, 39.
Güç: tüm modüller 3.3V; MAX98357A VIN'e (5V) bağlanabilir (daha gür ses).

## RAM Bütçesi Notu

Sprite 77 KB + WiFi ~50 KB + TLS ~45 KB + ses tamponu (32 KB/sn, hedef 4-6 sn).
Önlem: çeviri modunda sprite geçici serbest bırakılır (statik "dinliyorum" ekranı),
mod bitince yeniden oluşturulur.

## Aşamalar

### Aşama 0 — Altyapı (modüller gelmeden) ✅ TAMAMLANDI
- [x] `config.h`: yeni pin haritası + `MODUL_*` aç/kapa bayrakları
- [x] `api_config.h` (gitignore'lu) + `api_config.example.h` (OpenAI anahtarı/modeller)
- [x] Seri komutlara yer tutucular: `cevir`, `jest`, `oksa` (+ `durum` artık boş heap gösteriyor)
- [x] Kütüphaneler: ESP8266Audio 2.4.1, ArduinoJson 7.4.3, SparkFun APDS9960 1.4.2
- [x] Derleme doğrulaması: bayraklar açıkken %31, tümü kapalıyken %29 flash — iki durum da temiz

### Aşama 1 — Ses sistemi (MAX98357A)
- [ ] LEDC buzzer → I2S ton sentezi (`sesBaslat`/`gulmeBaslat` arayüzü korunur)
- [ ] MP3 çalma altyapısı (ESP8266Audio → I2S_NUM_0)
- [ ] Donanım testi: tüm duygu sesleri hoparlörden

### Aşama 2 — IMU davranışları (MPU6050)
- [ ] Ters çevrilme: accZ ~1 sn negatif → `TERS` (gözler ters, itiraz sesi)
- [ ] Sallanma: X ekseninde ritmik salınım → `BASI_DONDU` (spiral gözler, 3-4 sn)
- [ ] Mevcut sarsma korunur; üç tespit öncelik sırasına bağlanır

### Aşama 3 — Okşama (2× TTP223)
- [ ] İki sensör ≤800 ms arayla → `SEVINC` (kalp animasyonu + neşe melodisi)
- [ ] Tek dokunuş = mevcut MUTLU davranışı kalır

### Aşama 4 — "Görme" (APDS-9960)
- [ ] El sallama → selamlaşma; yaklaşma → MERAK; karanlık → UYKULU, ışıkta uyanma
- [ ] 0x39 oto-algı (`apdsVar`, mpuVar deseniyle)

### Aşama 5 — Anlık çeviri (en son)
- [ ] Tetikleme → robot hedef dili sorar (SPIFFS'e gömülü sabit ses)
- [ ] Kullanıcı dil adını söyler → Whisper + GPT ile dil eşleştirme, ekranda gösterim
- [ ] Döngü: VAD kayıt (maks ~5 sn) → Whisper (dil oto-algı) → GPT-4o-mini çeviri
      → OpenAI TTS → MP3 → hoparlör; DINLIYOR/DUSUNUYOR/KONUSUYOR animasyonları
- [ ] WiFi çeviri modu girişinde bağlanır; hata yolları (WiFi/API) üzgün suratla bildirilir
- [ ] RAM önlemi uygulanır; `ESP.getFreeHeap()` DEBUG izleme

### Aşama 6 — PCB hazırlığı
- [ ] Kesinleşen şema notları bu dosyaya eklenir

---

# v1 — Kod Revizyonu (TAMAMLANDI — 2026-07-06)

Tek dosyalık orijinal kod revize edildi. Yapılanlar:
- Dosya yapısı: `sketch_may5a/` + `config.h` + gitignore'lu `wifi_config.h`
- Performans: SPI 40 MHz, millis kare zamanlaması, log seli DEBUG'a alındı, hızlı açılış
- Sağlamlık: MPU oto-algı (yokken devre dışı), `Wire.requestFrom` kontrolü,
  `randomSeed(esp_random())`, mikrofon pencere ortalaması
- Yeni: seri komut arayüzü (`yardim` ile liste), boşta canlanma motoru
- `upload.ps1`: arduino-cli otomatik kurulum + derleme + COM tespiti + yükleme
- Doğrulama: derleme (Flash %31, RAM %7), karta yükleme, seri komut testi BAŞARILI
- Donanım notu: eski MPU6050 ve mikrofon devrede görünmüyordu; v2'de modüller yenileniyor

## Değişiklik Günlüğü

- 2026-07-06: v1 planı oluşturuldu, uygulandı, derlendi, karta yüklendi, test edildi
  (ayrıntılar üstteki v1 bölümünde).
- 2026-07-06: KARAR — proje "cep robotu" olarak netleşti; ekran ve ESP32 dışındaki tüm
  modüller yenilenecek (lehimsiz). v2 planı yazıldı ve onaylandı: APDS-9960 (görme),
  OpenAI API (çeviri zinciri), MAX98357A (ses), 2×TTP223 (okşama), MPU6050 (hareket).
- 2026-07-06: v2 Aşama 0 tamamlandı: modül bayrakları, v2 pin haritası, api_config
  şablonu, yer tutucu seri komutlar, 3 kütüphane kuruldu, çift yönlü derleme doğrulandı.
