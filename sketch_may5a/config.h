#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
//  AIBI CEP ROBOTU - TUM PIN BAGLANTILARI VE AYARLAR
//  Donanim degisikligi yapacaksaniz SADECE bu dosyayi duzenleyin.
// ============================================================================
//
//  BAGLANTI SEMASI (ESP32-WROOM DevKit) - v2 pin haritasi:
//
//  ILI9341 TFT EKRAN (SPI - pinleri User_Setup.h belirler, buraya bilgi icin yazildi):
//    VCC -> 3.3V   GND -> GND    LED -> 3.3V
//    CS  -> GPIO15  RESET -> GPIO4   DC -> GPIO2
//    MOSI-> GPIO23  SCK   -> GPIO18  MISO -> GPIO19 (istege bagli)
//
//  MPU6050 / GY-521 (I2C, adres 0x68):
//    VCC -> 3.3V   GND -> GND   SDA -> GPIO21   SCL -> GPIO22
//    (AD0, XDA, XCL, INT bos birakilir)
//
//  APDS-9960 JEST SENSORU (I2C, adres 0x39 - MPU ile ayni hat):
//    VCC -> 3.3V   GND -> GND   SDA -> GPIO21   SCL -> GPIO22   INT -> GPIO35 (ops.)
//
//  INMP441 MIKROFON (I2S_NUM_1):
//    VDD -> 3.3V   GND -> GND   L/R -> GND
//    SCK -> GPIO14  WS -> GPIO27  SD -> GPIO32
//
//  MAX98357A I2S AMFI (I2S_NUM_0):
//    VIN -> 5V(VIN) veya 3.3V   GND -> GND
//    BCLK -> GPIO26  LRC -> GPIO25  DIN -> GPIO33
//    Hoparlor (4 ohm) vidali klemense baglanir
//
//  TTP223 DOKUNMATIK x2 (oksama algisi icin yan yana):
//    #1: VCC -> 3.3V  GND -> GND  I/O -> GPIO13
//    #2: VCC -> 3.3V  GND -> GND  I/O -> GPIO16
//
//  NOT: GPIO12 boot strapping pini oldugu icin kullanilmiyor.
//       Yedek pinler: 17, 34, 36, 39.
// ============================================================================

// --- Modul bayraklari ---------------------------------------------------
// Takili olmayan modulun bayragini 0 yapin; kod o modul olmadan calisir.
// (I2C moduller ayrica acilista otomatik algilanir: takili degilse devre disi.)
#define MODUL_MPU     1  // MPU6050 hareket sensoru
#define MODUL_MIK     1  // INMP441 mikrofon
#define MODUL_DOKUNMA 1  // TTP223 #1 (tek dokunus = mutlu)
#define MODUL_OKSAMA  1  // TTP223 #2 (GPIO16) - oksama algisi
#define MODUL_AMFI    1  // MAX98357A I2S amfi - 1 iken GPIO26 BCLK olur, buzzer kullanilamaz
#define MODUL_APDS    0  // APDS-9960 - ASKIDA (modul alinmadi, gorme ozelligi ertelendi)
#define MODUL_CEVIRI  0  // Ceviri ozelligi (Asama 5) - MODUL_AMFI ve MODUL_MIK gerektirir

// --- Genel ---
#define DEBUG      0   // 1 = seri porta detayli log (MPU degerleri, FPS, heap)
#define TTS_AKTIF  0   // eski dahili-DAC TTS denemesi (v2'de Asama 5 ile kalkacak)

#if DEBUG
  #define DEBUG_LOG(...) Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_LOG(...)
#endif

// --- Ekran ---
#define EKRAN_GENISLIK  320
#define EKRAN_YUKSEKLIK 240
#define KARE_SURESI_MS  16   // hedef ~60 FPS

// --- Ses cikisi ---
// MODUL_AMFI=0 iken: pasif buzzer GPIO26'da LEDC ile calisir (gecici durum).
// MODUL_AMFI=1 iken: GPIO26 amfinin BCLK hatti olur, buzzer KULLANILAMAZ.
#define HOPARLOR_PIN     26  // buzzer (sadece MODUL_AMFI=0 iken)
#define LEDC_COZUNURLUK  8
#define AMFI_BCLK        26
#define AMFI_LRC         25
#define AMFI_DIN         33
#define AMFI_I2S_PORT    I2S_NUM_0

// --- Dokunma / Oksama ---
#define DOKUNMA_PIN            13   // TTP223 #1
#define DOKUNMA2_PIN           16   // TTP223 #2 (oksama)
#define DOKUNMA_BEKLEME_MS   5000   // iki dokunma tepkisi arasi minimum sure
#define OKSAMA_PENCERE_MS     800   // iki sensorun art arda tetiklenme penceresi

// --- MPU6050 Hareket Sensoru (I2C) ---
#define MPU_ADRES      0x68
#define MPU_SDA        21
#define MPU_SCL        22
#define SARSMA_ESIGI   12000
#define SARSMA_BEKLEME 3000
#define MPU_OKUMA_ARALIGI_MS 50

// --- APDS-9960 Jest Sensoru (I2C, MPU ile ayni hat) ---
#define APDS_ADRES     0x39
#define APDS_INT_PIN   35

// --- Mikrofon (INMP441, I2S) ---
#define MIC_SCK          14
#define MIC_WS           27
#define MIC_SD           32
#define MIC_I2S_PORT     I2S_NUM_1
#define SES_ESIGI        150000  // pencere ortalamasi bu degeri asarsa DINLIYOR
#define SES_BITIS_SURESI 2000    // ses kesildikten sonra IDLE'a donus (ms)

// --- Bosta canlanma (idle davranis motoru) ---
#define IDLE_MIN_BEKLEME_MS  4000
#define IDLE_MAX_BEKLEME_MS 10000

#endif // CONFIG_H
