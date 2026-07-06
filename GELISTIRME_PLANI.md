# Aibi Robot — Kod Revizyonu ve İyileştirme Planı

Bu dosya projenin revizyon planını ve yapılan her değişikliğin kaydını tutar.
Her madde tamamlandıkça `[x]` işaretlenir ve sondaki **Değişiklik Günlüğü**ne tarihli satır eklenir.

## Bağlam

ESP32 tabanlı "Aibi" robot yüzü: ILI9341 TFT ekranda animasyonlu gözler, MPU6050
sarsma/eğim tespiti, INMP441 mikrofonla ses tepkisi, dokunma sensörü ve buzzer sesleri.
Kod çalışıyor ancak performans kayıpları (27 MHz SPI, seri log seli, sabit `delay(16)`),
sağlamlık sorunları (MPU yokken çöp veri okuma, tohumlanmamış `random()`), repoya açık
WiFi şifresi ve Windows'ta çalışmayan yükleme betiği mevcut.

Alınan kararlar:
- Derleme/yükleme: **arduino-cli + Windows (PowerShell) betiği** (`upload.ps1`)
- **Seri komut arayüzü** eklenecek (donanım testi amaçlı)
- **Boşta canlanma (idle davranış motoru)** eklenecek

## Hedef Dosya Yapısı

```
aibiproje/
├── sketch_may5a/
│   ├── sketch_may5a.ino           ← ana kod (revize edilmiş)
│   ├── config.h                   ← TÜM pinler, eşikler, ayarlar
│   ├── wifi_config.h              ← WiFi bilgileri (gitignore'da)
│   └── wifi_config.example.h      ← şablon (repoya girer)
├── User_Setup.h                   ← TFT_eSPI ayarı (SPI 40 MHz)
├── upload.ps1                     ← Windows derleme+yükleme betiği
├── upload.sh                      ← Mac/Linux betiği (korundu)
├── GELISTIRME_PLANI.md            ← bu dosya
└── .gitignore
```

## Yapılacaklar

### 1. Güvenlik ve düzen
- [x] WiFi SSID/şifre koddan `wifi_config.h`'a taşındı; `.gitignore`'a eklendi; `wifi_config.example.h` şablonu repoya kondu
- [x] Tüm pinler/eşikler/ayarlar `config.h`'a toplandı; başına bağlantı şeması yorumu eklendi
- [x] `SENSOR_KULLAN` altındaki ölü kod kaldırıldı
- [x] Yanlış yorumlar düzeltildi ("50ms debounce" → gerçekte 5 sn bekleme)

### 2. Performans
- [x] `User_Setup.h`: `SPI_FREQUENCY` 27 MHz → 40 MHz
- [x] Sabit `delay(16)` yerine millis tabanlı kare zamanlaması; DEBUG modunda FPS sayacı
- [x] MPU'nun 50 ms'de bir seri porta log basması `DEBUG_LOG` makrosu arkasına alındı
- [x] Açılıştaki `delay(4000)` → 500 ms
- [x] 8-bit sprite korundu (16-bit, 153 KB tek parça heap ister — mevcut tasarım doğru)

### 3. Sağlamlık (bug düzeltmeleri)
- [x] MPU varlık bayrağı (`mpuVar`): I2C taramasında 0x68 yoksa MPU okumaları tamamen atlanıyor
- [x] `Wire.requestFrom()` dönüş değeri kontrolü (6 bayt gelmediyse okuma atlanıyor)
- [x] `randomSeed(esp_random())` — her açılışta farklı göz kırpma/duygu deseni
- [x] Mikrofon eşiği tepe değer yerine pencere ortalamasıyla karşılaştırılıyor
      (NOT: `SES_ESIGI` tepe değere göre ayarlıydı; ortalama daha düşük çıkacağı için
      gerçek testte eşiği düşürmek gerekebilir — config.h'dan ayarlanır)

### 4. Seri komut arayüzü (test aracı)
- [x] Bloklamayan `seriKomutKontrol()`: `mutlu`, `uzgun`, `saskin`, `sinirli`, `uykulu`,
      `merak`, `suphe`, `titre`, `salla`, `sol`, `sag`, `idle`, `durum`, `yardim`
- [x] Komut yokken maliyet tek `Serial.available()` çağrısı

### 5. Boşta canlanma (idle davranış motoru)
- [x] IDLE'da 4–10 sn rastgele aralıklarla ağırlıklı duygu seçimi (`idleDavranisSec()`):
      SOLA_BAK/SAGA_BAK/MERAK %20'şer, SUPHE/KAFASALLA/MUTLU %10'ar, UYKULU %5
- [x] DINLIYOR ve dokunma kaynaklı MUTLU sürerken idle motoru devreye girmiyor
      (idle motoru yalnızca durum IDLE iken çalışır)

### 6. Windows betiği (`upload.ps1`)
- [x] arduino-cli otomatik indirme (proje içi `bin\`), ESP32 çekirdeği + TFT_eSPI kurulumu
- [x] `User_Setup.h`'ı TFT_eSPI kütüphane klasörüne otomatik kopyalama
- [x] COM port otomatik tespiti; `-SadeceDerle` ve `-Port COMx` parametreleri

### 7. Doğrulama
- [ ] `upload.ps1 -SadeceDerle` ile hatasız derleme
- [ ] Karta yükleme + seri monitörden donanım testi (I2C tarama, seri komutlar,
      dokunma/sarsma/ses tepkileri, idle davranışları, FPS kontrolü)

## Değişiklik Günlüğü

- 2026-07-06: Plan oluşturuldu, uygulamaya başlandı.
