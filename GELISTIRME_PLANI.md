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

## KABLOLAMA REHBERİ (donanım envanteri fotoğraflardan doğrulandı — 2026-07-06)

**Envanter durumu:** ESP32 DevKit 38-pin USB-C ✔ | 2.4" TFT (dokunmatik+SD'li, kullanılmıyor) ✔ |
MPU6050 header lehimli ✔ | hoparlör kablolu ✔ | breadboard ×2 ✔ |
MAX98357A + INMP441 + 2×TTP223 **header'ları lehimsiz** ⚠ → geçici temas çözümü uygulanıyor
(bacak deliğe geçirilip ~15° bükülür, jumper sıkıştırılır; temas oynayabilir, kalıcı çözüm lehim/PCB).

**ESP32 kart etiketi eşlemesi:** Karttaki `G21` = GPIO21. `V5` = 5V, `3V3` = 3.3V.

**Güç rayları:** ESP32 `3V3` → breadboard kırmızı (+) ray, ESP32 `GND` → mavi (−) ray.
Tüm modül VCC/VDD'leri (+) raydan, tüm GND'ler (−) raydan alınır.

| Modül | Modül pini | Nereye | Not |
|-------|-----------|--------|-----|
| TFT | VCC | 3.3V (+) ray | |
| TFT | GND | (−) ray | |
| TFT | CS | G15 | |
| TFT | RESET | G4 | |
| TFT | DC | G2 | |
| TFT | SDI (MOSI) | G23 | |
| TFT | SCK | G18 | |
| TFT | LED | 3.3V (+) ray | arka ışık |
| TFT | SDO (MISO) | G19 | opsiyonel, boş da kalabilir |
| TFT | T_CLK, T_CS, T_DIN, T_DO, T_IRQ | **BOŞ** | dokunmatik kullanılmıyor |
| TFT (arka) | SD_SCK, SD_MISO, SD_MOSI, SD_CS | **BOŞ** | SD kart kullanılmıyor |
| MPU6050 | VCC | 3.3V (+) ray | |
| MPU6050 | GND | (−) ray | |
| MPU6050 | SCL | G22 | **unutulmasın!** (ilk kurulumda eksikti) |
| MPU6050 | SDA | G21 | **unutulmasın!** |
| MPU6050 | XDA, XCL, AD0, INT | **BOŞ** | |
| INMP441 | VDD | 3.3V (+) ray | 5V'a BAĞLAMAYIN |
| INMP441 | GND | (−) ray | |
| INMP441 | L/R | (−) ray (GND) | sol kanal seçimi |
| INMP441 | SCK | G14 | |
| INMP441 | WS | G27 | |
| INMP441 | SD | G32 | |
| MAX98357A | Vin | V5 (5V) | 3.3V de çalışır, 5V daha gür |
| MAX98357A | GND | (−) ray | |
| MAX98357A | BCLK | G26 | |
| MAX98357A | LRC | G25 | |
| MAX98357A | DIN | G33 | |
| MAX98357A | GAIN, SD | **BOŞ** | varsayılan kazanç, çıkış aktif |
| MAX98357A | hoparlör + | hoparlör kırmızı | klemens/delikten büküm |
| MAX98357A | hoparlör − | hoparlör siyah | |
| TTP223 #1 | VCC | 3.3V (+) ray | |
| TTP223 #1 | GND | (−) ray | |
| TTP223 #1 | I/O | G13 | |
| TTP223 #2 | VCC | 3.3V (+) ray | |
| TTP223 #2 | GND | (−) ray | |
| TTP223 #2 | I/O | G16 | #1'in 1-2 cm yanına yerleştirin (okşama) |
| TTP223 (her ikisi) | A, B pedleri | **DOKUNMAYIN** | varsayılan an-tetik modu doğru |

**Breadboard kuralı:** Her satırın a-e ve f-j yarıları ortadaki olukla AYRIKTIR.
Jumper, modül bacağıyla AYNI satırın AYNI yarısına takılmalı.

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

### Aşama 1 — Ses sistemi (MAX98357A) ✅ KOD TAMAM (donanım testi bekliyor)
- [x] LEDC buzzer → I2S sinüs sentezi (`sesGorev` görevi; `sesBaslat`/`gulmeBaslat` arayüzü korundu)
- [x] Melodi altyapısı genelleştirildi (gülme + sevinç + sersem + ters melodileri)
- [ ] MP3 çalma altyapısı (Aşama 5 ile birlikte gelecek)
- [ ] Donanım testi: tüm duygu sesleri hoparlörden

### Aşama 2 — IMU davranışları (MPU6050) ✅ KOD TAMAM (donanım testi bekliyor)
- [x] Ters çevrilme: accZ ~1 sn < −8000 → `TERS` (turuncu kısık gözler yukarıda, itiraz sesi)
- [x] Sallanma: 2 sn'de ≥4 yön değişimi → `BASI_DONDU` (camgöbeği dönen gözler, sarhoş melodisi)
- [x] Öncelik: TERS > BASI_DONDU > SARSMA (SASKIN/TITREME korundu)
- [x] `durum` komutu ham accX/accY/accZ basıyor (eşik kalibrasyonu için)
- [ ] Donanım testi: elle ters çevirme / sallama

### Aşama 3 — Okşama (2× TTP223) ✅ KOD TAMAM (donanım testi bekliyor)
- [x] İki farklı sensör ≤800 ms arayla → `SEVINC` 5 sn (hilal gözler + 3 zıplayan pembe kalp + neşe melodisi)
- [x] Tek dokunuş = mevcut MUTLU davranışı korundu
- [ ] Donanım testi: iki sensöre sırayla dokunma

### Aşama 4 — "Görme" (APDS-9960) ⏸ ASKIDA (modül alınmadı — karar 2026-07-06)
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
- 2026-07-06: Modüller geldi (8 fotoğrafla envanter doğrulandı). GÖRME ASKIYA ALINDI
  (APDS-9960 alınmamış). Amfi/mikrofon/dokunmatik header'ları lehimsiz → geçici temas
  çözümü kararlaştırıldı. Kablolama rehberi bu dosyaya eklendi.
- 2026-07-06: Aşama 1+2+3 kodları yazıldı: I2S sinüs sentezi + melodi altyapısı
  (MODUL_AMFI=1), TERS/BASI_DONDU tespiti ve animasyonları, SEVINC okşama algısı
  (MODUL_OKSAMA=1). Yeni seri komutlar: oksa/ters/sersem. Çift derleme temiz
  (bayraklar açık %30, kapalı %30). Donanım testleri kablolama sonrası yapılacak.
