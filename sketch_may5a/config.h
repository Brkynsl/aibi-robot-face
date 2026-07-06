#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
//  AIBI ROBOT — TUM PIN BAGLANTILARI VE AYARLAR
//  Donanim degisikligi yapacaksaniz SADECE bu dosyayi duzenleyin.
// ============================================================================
//
//  BAGLANTI SEMASI (ESP32 DevKit):
//
//  ILI9341 TFT EKRAN (SPI — pinleri User_Setup.h belirler, buraya bilgi icin yazildi):
//    VCC → 3.3V   GND → GND    LED → 3.3V
//    CS  → GPIO15  RESET → GPIO4   DC → GPIO2
//    MOSI→ GPIO23  SCK   → GPIO18  MISO → GPIO19 (istege bagli)
//
//  MPU6050 IVME SENSORU (I2C):
//    VCC → 3.3V   GND → GND   SDA → GPIO21   SCL → GPIO22
//
//  INMP441 MIKROFON (I2S):
//    VDD → 3.3V   GND → GND   L/R → GND
//    SCK → GPIO14  WS → GPIO27  SD → GPIO32
//
//  HOPARLOR (amplifikator uzerinden!): sinyal → GPIO26 (DAC2)
//  DOKUNMA SENSORU (TTP223): VCC → 3.3V  GND → GND  I/O → GPIO13
//
// ============================================================================

// --- Genel ---
#define DEBUG      0   // 1 = seri porta detayli log (MPU degerleri, FPS)
#define TTS_AKTIF  0   // 1 = WiFi uzerinden Google TTS (wifi_config.h gerekir)

#if DEBUG
  #define DEBUG_LOG(...) Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_LOG(...)
#endif

// --- Ekran ---
#define EKRAN_GENISLIK  320
#define EKRAN_YUKSEKLIK 240
#define KARE_SURESI_MS  16   // hedef ~60 FPS

// --- Hoparlor ---
#define HOPARLOR_PIN     26  // DAC2 — TTS'in dahili DAC cikisiyla ayni pin
#define LEDC_COZUNURLUK  8

// --- Dokunma Sensoru ---
#define DOKUNMA_PIN            13
#define DOKUNMA_BEKLEME_MS   5000  // iki dokunma tepkisi arasi minimum sure

// --- MPU6050 Hareket Sensoru (I2C) ---
#define MPU_ADRES      0x68
#define MPU_SDA        21
#define MPU_SCL        22
#define SARSMA_ESIGI   12000
#define SARSMA_BEKLEME 3000
#define MPU_OKUMA_ARALIGI_MS 50

// --- Mikrofon (INMP441, I2S) ---
#define MIC_SCK          14
#define MIC_WS           27
#define MIC_SD           32
#define MIC_I2S_PORT     I2S_NUM_1
#define SES_ESIGI        150000  // pencere ortalamasi bu degeri asarsa DINLIYOR
#define SES_BITIS_SURESI 2000    // ses kesildikten sonra IDLE'a donus (ms)

// --- Bosta canlanma (idle davranis motoru) ---
#define IDLE_MIN_BEKLEME_MS  4000   // iki kendiliginden duygu arasi min sure
#define IDLE_MAX_BEKLEME_MS 10000   // max sure

#endif // CONFIG_H
