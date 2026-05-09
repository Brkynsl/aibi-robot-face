// --- WiFi / TTS ---
#define TTS_AKTIF  0  // 1 = açık, 0 = kapalı

#include <TFT_eSPI.h>
#include <SPI.h>
#include <Wire.h>
#include <driver/i2s.h>
#if TTS_AKTIF
#include <WiFi.h>
#include <esp_task_wdt.h>
#include "AudioGeneratorMP3.h"
#include "AudioFileSourceHTTPStream.h"
#include "AudioOutputI2S.h"
#endif
#define WIFI_SSID  "Mustafa"
#define WIFI_SIFRE "musti123"

TFT_eSPI tft = TFT_eSPI();
TFT_eSprite spr = TFT_eSprite(&tft);

// --- Ayarlar ---
#define EKRAN_GENISLIK 320
#define EKRAN_YUKSEKLIK 240
#define SENSOR_KULLAN 0 // Sensörleri aktif etmek için 1 yapın

// --- Hoparlör ---
#define HOPARLOR_PIN 26
#define LEDC_KANAL   0
#define LEDC_COZUNURLUK 8

// --- Dokunma Sensörü ---
#define DOKUNMA_PIN 13

// --- MPU6050 Hareket Sensörü ---
#define MPU_ADRES      0x68
#define MPU_SDA        21
#define MPU_SCL        22
#define SARSMA_ESIGI   12000
#define SARSMA_BEKLEME 3000

int16_t accX = 0, accY = 0, accZ = 0;
float egilimX = 0, egilimY = 0;
unsigned long sonMpuOkuma   = 0;
unsigned long sonSarsmaZamani = 0;

// --- Mikrofon (INMP441) ---
#define MIC_SCK      14
#define MIC_WS       27
#define MIC_SD       32
#define MIC_I2S_PORT I2S_NUM_1
#define SES_ESIGI    150000
#define SES_BITIS_SURESI 2000

volatile int32_t sesSeviyesi = 0;
unsigned long sonSesZamani   = 0;

// --- Göz Yapısı ve Değişkenleri ---
struct Goz {
  float currentX;
  float currentY;
  float targetX;
  float targetY;
  float currentWidth;
  float currentHeight;
  float targetWidth;
  float targetHeight;
  float previousX;
  
  void update() {
    // Linear Interpolation (Yumuşak geçiş)
    float hiz = 0.15; // Değer 1'e ne kadar yakınsa o kadar hızlı
    previousX = currentX;
    currentX += (targetX - currentX) * hiz;
    currentY += (targetY - currentY) * hiz;
    currentWidth += (targetWidth - currentWidth) * hiz;
    currentHeight += (targetHeight - currentHeight) * hiz;
  }
};

Goz solGoz =  {70, 80, 70, 80, 40, 80, 40, 80, 70};
Goz sagGoz = {210, 80, 210, 80, 40, 80, 40, 80, 210};

// --- Duygu ve Durum Makinesi ---
enum AibiDurum { IDLE, MUTLU, UZGUN, SASKIN, SINIRLI, UYKULU, KAFASALLA, SOLA_BAK, SAGA_BAK, MERAK, SUPHE, TITREME, DINLIYOR };
AibiDurum mevcutDurum = IDLE;
unsigned long sonDurumDegisimi = 0;
unsigned long beklemeSuresi = 3000;

// Göz Kırpma Zamanlayıcıları
unsigned long sonGozKirpma = 0;
bool gozKirpiyorMu = false;

// Kafa Sallama Değişkenleri
int kafaSallaAsama = 0;
unsigned long sonKafaSallaZaman = 0;

// Ses Değişkenleri
unsigned long sesBitisZamani = 0;
bool sesAktifMi = false;

// Gülme Ses Dizisi
struct TonAdim { int frekans; int sure; };
const TonAdim GULME_SIRASI[] = {
  {650, 60}, {950, 70}, {0, 45},
  {650, 60}, {950, 70}, {0, 45},
  {700, 65}, {1000, 90}, {0, 0}
};
const int GULME_ADIM_SAYISI = 9;
int aktifAdim = -1;
unsigned long adimBitisZamani = 0;

// Dokunma Sensörü
bool oncekiDokunmaDurumu = false;
unsigned long sonDokunmaZamani = 0;

// TTS
volatile bool ttsCal = false;
volatile bool ttsAktif = false;

void sesBaslat(int frekans, int sureMilis) {
  if (ttsAktif) return;
  aktifAdim = -1;
  ledcWriteTone(HOPARLOR_PIN, frekans);
  sesBitisZamani = millis() + sureMilis;
  sesAktifMi = true;
}

void gulmeBaslat() {
  aktifAdim = 0;
  ledcWriteTone(HOPARLOR_PIN, GULME_SIRASI[0].frekans);
  adimBitisZamani = millis() + GULME_SIRASI[0].sure;
  sesAktifMi = true;
}

void sesKontrol() {
  if (ttsAktif) return;
  unsigned long simdikiZaman = millis();
  if (aktifAdim >= 0 && simdikiZaman >= adimBitisZamani) {
    aktifAdim++;
    if (aktifAdim >= GULME_ADIM_SAYISI) {
      aktifAdim = -1;
      sesAktifMi = false;
      ledcWriteTone(HOPARLOR_PIN, 0);
    } else {
      ledcWriteTone(HOPARLOR_PIN, GULME_SIRASI[aktifAdim].frekans);
      adimBitisZamani = simdikiZaman + GULME_SIRASI[aktifAdim].sure;
    }
  } else if (aktifAdim < 0 && sesAktifMi && simdikiZaman >= sesBitisZamani) {
    ledcWriteTone(HOPARLOR_PIN, 0);
    sesAktifMi = false;
  }
}

void durumSesiCal(AibiDurum durum) {
  switch (durum) {
    case MUTLU:      sesBaslat(880, 120); break;
    case UZGUN:      sesBaslat(220, 350); break;
    case SASKIN:     sesBaslat(1200, 100); break;
    case SINIRLI:    sesBaslat(140, 400); break;
    case UYKULU:     sesBaslat(280, 250); break;
    case MERAK:      sesBaslat(520, 150); break;
    case SUPHE:      sesBaslat(360, 200); break;
    case TITREME:    sesBaslat(110, 500); break;
    case SOLA_BAK:
    case SAGA_BAK:   sesBaslat(600, 60);  break;
    case KAFASALLA:  sesBaslat(700, 80);  break;
    default: break; // IDLE: sessiz
  }
}

#if TTS_AKTIF
void audioGorev(void* param) {
  while (true) {
    if (ttsCal) {
      ttsCal = false;
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("TTS: WiFi bagli degil, atlaniyor.");
        ttsAktif = false;
        vTaskDelay(50 / portTICK_PERIOD_MS);
        continue;
      }
      Serial.println("TTS: Ses indiriliyor...");
      ttsAktif = true;
      ledcDetach(HOPARLOR_PIN);

      AudioFileSourceHTTPStream *file = new AudioFileSourceHTTPStream(
        "http://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=Merhaba+ben+Aibi&tl=tr"
      );
      AudioOutputI2S *out = new AudioOutputI2S(0, AudioOutputI2S::INTERNAL_DAC);
      out->SetOutputModeMono(true);
      out->SetGain(0.8);
      AudioGeneratorMP3 *mp3 = new AudioGeneratorMP3();
      mp3->begin(file, out);
      unsigned long ttsBaslangic = millis();
      while (mp3->isRunning()) {
        esp_task_wdt_reset();
        if (!mp3->loop()) mp3->stop();
        if (millis() - ttsBaslangic > 15000) {
          Serial.println("TTS: Zaman asimi, durduruluyor.");
          mp3->stop();
          break;
        }
      }
      delete mp3;
      delete file;
      delete out;

      ledcAttach(HOPARLOR_PIN, 2000, LEDC_COZUNURLUK);
      ttsAktif = false;
      Serial.println("TTS: Bitti.");
    }
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}
#endif

void mikGorev(void* param) {
  int32_t samples[128];
  size_t bytes_read;
  while (true) {
    i2s_read(MIC_I2S_PORT, samples, sizeof(samples), &bytes_read, portMAX_DELAY);
    int count = bytes_read / sizeof(int32_t);
    int32_t maxVal = 0;
    for (int i = 0; i < count; i++) {
      int32_t v = abs(samples[i] >> 8);
      if (v > maxVal) maxVal = v;
    }
    sesSeviyesi = maxVal;
    vTaskDelay(1);
  }
}

void setup() {
  Serial.begin(115200);
  delay(4000);
  Serial.println("\n\n--- Aibi Gelismis Animasyon Sistemi Baslatiliyor ---");

  ledcAttach(HOPARLOR_PIN, 2000, LEDC_COZUNURLUK);
  pinMode(DOKUNMA_PIN, INPUT);

  // MPU6050 başlat
  Wire.begin(MPU_SDA, MPU_SCL);
  // I2C Tarama
  Serial.println("I2C tarama basliyor...");
  int bulunan = 0;
  for (byte adres = 1; adres < 127; adres++) {
    Wire.beginTransmission(adres);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Cihaz bulundu: 0x%02X\n", adres);
      bulunan++;
    }
  }
  if (bulunan == 0) Serial.println("Hicbir I2C cihazi bulunamadi!");
  Wire.beginTransmission(MPU_ADRES);
  Wire.write(0x6B);
  Wire.write(0x00); // Uyku modundan çık
  Wire.endTransmission(true);

  // Mikrofon I2S başlat
  i2s_config_t micConfig = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };
  i2s_pin_config_t micPins = {
    .bck_io_num   = MIC_SCK,
    .ws_io_num    = MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = MIC_SD
  };
  i2s_driver_install(MIC_I2S_PORT, &micConfig, 0, NULL);
  i2s_set_pin(MIC_I2S_PORT, &micPins);
  i2s_zero_dma_buffer(MIC_I2S_PORT);
  xTaskCreatePinnedToCore(mikGorev, "MIK", 4096, NULL, 1, NULL, 0);

#if TTS_AKTIF
  WiFi.begin(WIFI_SSID, WIFI_SIFRE);
  Serial.print("WiFi baglaniyor");
  unsigned long wifiBaslangic = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiBaslangic < 10000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " Baglandi!" : " Basarisiz!");
  xTaskCreatePinnedToCore(audioGorev, "TTS", 16384, NULL, 1, NULL, 0);
#endif

  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  
  // Sprite oluştur (8-bit renk derinliği - RAM'den %50 tasarruf eder)
  spr.setColorDepth(8);
  void* spritePtr = spr.createSprite(EKRAN_GENISLIK, EKRAN_YUKSEKLIK);
  
  if (spritePtr == nullptr) {
    Serial.println("HATA: Sprite (Tuval) icin yeterli RAM bulunamadi!");
  } else {
    Serial.println("Sprite basariyla hafizada olusturuldu.");
  }
  
  spr.fillSprite(TFT_BLACK);
  Serial.println("Aibi animasyon sistemi hazir!");
  
  if (SENSOR_KULLAN) {
    // Sensör pin modları buraya eklenebilir
  }
}

// Tüm özellikleri hedeflere aktarır
void hedefBelirle(float sX, float sY, float sW, float sH, float sgX, float sgY, float sgW, float sgH) {
  solGoz.targetX = sX; solGoz.targetY = sY;
  solGoz.targetWidth = sW; solGoz.targetHeight = sH;
  
  sagGoz.targetX = sgX; sagGoz.targetY = sgY;
  sagGoz.targetWidth = sgW; sagGoz.targetHeight = sgH;
}

// Sadece pozisyonu kaydırmak için yardımcı fonksiyon
void bakisYonu(float xOffset, float yOffset) {
  hedefBelirle(70 + xOffset + egilimX, 80 + yOffset + egilimY, 40, 80,
               210 + xOffset + egilimX, 80 + yOffset + egilimY, 40, 80);
}

void dokunmaSensoruKontrol() {
  bool simdikiDurum = digitalRead(DOKUNMA_PIN);
  unsigned long simdikiZaman = millis();

  // Yükselen kenar: dokunma başladı (50ms debounce)
  if (simdikiDurum && !oncekiDokunmaDurumu && (simdikiZaman - sonDokunmaZamani > 5000)) {
    sonDokunmaZamani = simdikiZaman;
    mevcutDurum = MUTLU;
    sonDurumDegisimi = simdikiZaman;
    beklemeSuresi = 5000;
#if TTS_AKTIF
    if (!ttsAktif) ttsCal = true;
#endif
    gulmeBaslat();
    Serial.println("Dokunma algilandi! TTS tetiklendi.");
  }
  oncekiDokunmaDurumu = simdikiDurum;
}

void durumMakinesiGuncelle() {
  unsigned long simdikiZaman = millis();
  
  // Sensörler açıksa durumu sensörlere göre belirle
  if (SENSOR_KULLAN) {
    // Örnek Sensör Mantığı:
    // float mesafe = mesafeOku();
    // if (mesafe < 10) mevcutDurum = SASKIN;
    // else mevcutDurum = IDLE;
  } 
  else {
    // Rastgele durum geçişi kapalı (test modu)
    // Dokunma sensörü ve MPU6050 hâlâ durum değiştirebilir
    if (mevcutDurum != KAFASALLA && mevcutDurum != DINLIYOR
        && simdikiZaman - sonDurumDegisimi > beklemeSuresi) {
      mevcutDurum = IDLE;
      sonDurumDegisimi = simdikiZaman;
    }
  }
}

void gozKirpmaKontrolu() {
  unsigned long simdikiZaman = millis();
  
  // Göz kırpma açıkken (kapanmışken) 150ms sonra geri aç
  if (gozKirpiyorMu && (simdikiZaman - sonGozKirpma > 150)) {
    gozKirpiyorMu = false;
    // Hedef boyutları duruma göre normale döndür (Bazı durumlar hariç)
    if (mevcutDurum != UYKULU && mevcutDurum != SINIRLI && mevcutDurum != UZGUN && mevcutDurum != MERAK && mevcutDurum != SUPHE) {
      solGoz.targetHeight = 80;
      sagGoz.targetHeight = 80;
    }
    sonGozKirpma = simdikiZaman;
  }
  // Rastgele göz kırpma tetiklemesi (2 saniye ile 6 saniye arası)
  else if (!gozKirpiyorMu && (simdikiZaman - sonGozKirpma > random(2000, 6000))) {
    // Belirli durumlardayken (Idle, Sola/Sağa bakma vb.) göz kırp
    if (mevcutDurum == IDLE || mevcutDurum == SOLA_BAK || mevcutDurum == SAGA_BAK || mevcutDurum == MUTLU || mevcutDurum == MERAK) {
      gozKirpiyorMu = true;
      sonGozKirpma = simdikiZaman;
      // Göz yüksekliklerini anında 2 yap (Kapanma efekti)
      solGoz.targetHeight = 2;
      sagGoz.targetHeight = 2;
    }
  }
}

void kafaSallaGuncelle() {
  unsigned long simdikiZaman = millis();
  // Her 200ms'de bir başı yukarı/aşağı oynat
  if (simdikiZaman - sonKafaSallaZaman > 200) {
    sonKafaSallaZaman = simdikiZaman;
    if (kafaSallaAsama == 0) { bakisYonu(0, -25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 1) { bakisYonu(0, 25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 2) { bakisYonu(0, -25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 3) { bakisYonu(0, 0); mevcutDurum = IDLE; kafaSallaAsama = 0; }
  }
}

void animasyonlariHesapla() {
  switch (mevcutDurum) {
    case IDLE:
    {
      bakisYonu(0, 0);
      // NEFES ALMA (Breathing) Fiziği: Yükseklik hafifçe sinüs dalgasıyla değişir
      float nefes = sin(millis() / 400.0) * 4.0; 
      if (!gozKirpiyorMu) { 
        solGoz.targetHeight = 80 + nefes; 
        sagGoz.targetHeight = 80 + nefes; 
      }
      break;
    }
    case SOLA_BAK:
      bakisYonu(-45, 0);
      break;
    case SAGA_BAK:
      bakisYonu(45, 0);
      break;
    case MUTLU:
      bakisYonu(0, -5);
      break;
    case UZGUN:
      bakisYonu(0, 15);
      solGoz.targetHeight = 50; sagGoz.targetHeight = 50;
      break;
    case SASKIN:
      bakisYonu(0, -10);
      // Gözler kocaman olur
      hedefBelirle(60, 60, 60, 100, 200, 60, 60, 100);
      break;
    case SINIRLI:
      bakisYonu(0, 10);
      solGoz.targetHeight = 50; sagGoz.targetHeight = 50;
      break;
    case UYKULU:
      bakisYonu(0, 25);
      solGoz.targetHeight = 25; sagGoz.targetHeight = 25;
      break;
    case KAFASALLA:
      kafaSallaGuncelle();
      break;
    case MERAK:
      bakisYonu(0, -5);
      if (!gozKirpiyorMu) {
        solGoz.targetHeight = 80;
        sagGoz.targetHeight = 45; // Tek göz kısık (Sanki kaş kaldırmış gibi)
      }
      break;
    case SUPHE:
    {
      // Kısık gözlerle yavaşça tarama yapar
      float tarama = sin(millis() / 500.0) * 25.0;
      bakisYonu(tarama, 0);
      if (!gozKirpiyorMu) {
        solGoz.targetHeight = 30;
        sagGoz.targetHeight = 30;
      }
      break;
    }
    case TITREME:
      bakisYonu(0, 15);
      if (!gozKirpiyorMu) {
        solGoz.targetHeight = 55; sagGoz.targetHeight = 55;
        solGoz.targetWidth = 35; sagGoz.targetWidth = 35;
      }
      break;
    case DINLIYOR:
    {
      // Hızlı sol-sağ tarama: ses kaynağını arıyor gibi
      float tarama = sin(millis() / 120.0) * 40.0;
      bakisYonu(tarama, -5);
      if (!gozKirpiyorMu) {
        solGoz.targetHeight = 88;
        sagGoz.targetHeight = 88;
      }
      break;
    }
  }
  
  gozKirpmaKontrolu();
  
  // Pozisyonları hedeflere doğru kaydır
  solGoz.update();
  sagGoz.update();
}

void cizimiGuncelle() {
  spr.fillSprite(TFT_BLACK); // Sadece arka plan tuvalini temizle
  
  uint16_t gozRengi = TFT_GREEN;
  if (mevcutDurum == SINIRLI)   gozRengi = TFT_RED;
  else if (mevcutDurum == UYKULU)   gozRengi = 0x03E0;   // Koyu yeşil
  else if (mevcutDurum == TITREME)  gozRengi = 0x05E0;   // Hafif soluk yeşil
  else if (mevcutDurum == DINLIYOR) gozRengi = TFT_YELLOW;

  // SQUASH & STRETCH (Ezilme ve Sünme Fiziği)
  // X eksenindeki hızlarına göre genişleyip basıklaşırlar
  float solHizX = abs(solGoz.currentX - solGoz.previousX);
  float sagHizX = abs(sagGoz.currentX - sagGoz.previousX);

  float solCizimW = solGoz.currentWidth + (solHizX * 1.5);
  float solCizimH = solGoz.currentHeight - (solHizX * 1.0);
  if (solCizimH < 5) solCizimH = 5; // Minimum yükseklik sınırı

  float sagCizimW = sagGoz.currentWidth + (sagHizX * 1.5);
  float sagCizimH = sagGoz.currentHeight - (sagHizX * 1.0);
  if (sagCizimH < 5) sagCizimH = 5;

  float solCizimX = solGoz.currentX;
  float solCizimY = solGoz.currentY;
  float sagCizimX = sagGoz.currentX;
  float sagCizimY = sagGoz.currentY;

  // TITREME / KORKU efekti (Rastgele pozisyon sapması)
  if (mevcutDurum == TITREME) {
    solCizimX += random(-3, 4); solCizimY += random(-3, 4);
    sagCizimX += random(-3, 4); sagCizimY += random(-3, 4);
  }

  // Temel göz çizimleri (Tam yuvarlak hap şekli)
  spr.fillRoundRect(solCizimX, solCizimY, solCizimW, solCizimH, solGoz.currentWidth / 2, gozRengi);
  spr.fillRoundRect(sagCizimX, sagCizimY, sagCizimW, sagCizimH, sagGoz.currentWidth / 2, gozRengi);

  // Duygulara özel maskeleme kesikleri (Üçgen ve Daireler)
  if (mevcutDurum == SINIRLI && !gozKirpiyorMu) {
    spr.fillTriangle(solCizimX, solCizimY - 5, 
                     solCizimX + solCizimW + 15, solCizimY - 5, 
                     solCizimX + solCizimW + 15, solCizimY + 30, TFT_BLACK);
                     
    spr.fillTriangle(sagCizimX - 15, sagCizimY - 5, 
                     sagCizimX + sagCizimW, sagCizimY - 5, 
                     sagCizimX - 15, sagCizimY + 30, TFT_BLACK);
  }
  else if (mevcutDurum == MUTLU && !gozKirpiyorMu) {
    // Alt kısmı daireyle keserek hilal (^ ^) yap
    spr.fillCircle(solCizimX + solCizimW/2, solCizimY + solCizimH + 10, 25, TFT_BLACK);
    spr.fillCircle(sagCizimX + sagCizimW/2, sagCizimY + sagCizimH + 10, 25, TFT_BLACK);
  }
  else if (mevcutDurum == UZGUN && !gozKirpiyorMu) {
    spr.fillTriangle(solCizimX - 15, solCizimY - 5, 
                     solCizimX + solCizimW, solCizimY - 5, 
                     solCizimX - 15, solCizimY + 25, TFT_BLACK);
                     
    spr.fillTriangle(sagCizimX, sagCizimY - 5, 
                     sagCizimX + sagCizimW + 15, sagCizimY - 5, 
                     sagCizimX + sagCizimW + 15, sagCizimY + 25, TFT_BLACK);
  }

  // Çizimi ekrana yolla (Titreşimi önler)
  spr.pushSprite(0, 0);
}

void mpuGuncelle() {
  if (millis() - sonMpuOkuma < 50) return;
  sonMpuOkuma = millis();

  Wire.beginTransmission(MPU_ADRES);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADRES, 6, true);
  int16_t yX = Wire.read() << 8 | Wire.read();
  int16_t yY = Wire.read() << 8 | Wire.read();
  int16_t yZ = Wire.read() << 8 | Wire.read();
  Serial.printf("accX:%d accY:%d accZ:%d egilimX:%.1f egilimY:%.1f\n", yX, yY, yZ, egilimX, egilimY);

  // Sarsma tespiti
  int32_t delta = abs(yX - accX) + abs(yY - accY) + abs(yZ - accZ);
  accX = yX; accY = yY; accZ = yZ;

  if (delta > SARSMA_ESIGI && millis() - sonSarsmaZamani > SARSMA_BEKLEME
      && mevcutDurum != DINLIYOR && mevcutDurum != MUTLU) {
    sonSarsmaZamani = millis();
    mevcutDurum = (random(2) == 0) ? SASKIN : TITREME;
    sonDurumDegisimi = millis();
    beklemeSuresi = 2000;
    durumSesiCal(mevcutDurum);
  }

  // Eğim → göz yönü (sadece sakin durumlarda)
  if (mevcutDurum == IDLE || mevcutDurum == SOLA_BAK || mevcutDurum == SAGA_BAK) {
    float hX = constrain(accX / 400.0f, -40.0f, 40.0f);
    float hY = constrain(accY / 500.0f, -25.0f, 25.0f);
    egilimX += (hX - egilimX) * 0.1f;
    egilimY += (hY - egilimY) * 0.1f;
  } else {
    egilimX *= 0.9f;
    egilimY *= 0.9f;
  }
}

void mikSesDinle() {
  unsigned long simdi = millis();
  if (sesSeviyesi > SES_ESIGI) {
    sonSesZamani = simdi;
    if (mevcutDurum != DINLIYOR && mevcutDurum != MUTLU) {
      mevcutDurum = DINLIYOR;
      sonDurumDegisimi = simdi;
    }
  } else if (mevcutDurum == DINLIYOR && simdi - sonSesZamani > SES_BITIS_SURESI) {
    mevcutDurum = IDLE;
    sonDurumDegisimi = simdi;
    beklemeSuresi = 3000;
  }
}

void loop() {
  mpuGuncelle();
  mikSesDinle();
  dokunmaSensoruKontrol();
  durumMakinesiGuncelle();
  animasyonlariHesapla();
  cizimiGuncelle();
  sesKontrol();
  delay(16); // Yaklaşık 60 FPS için bekleme, loop'u çok hızlı dönmekten korur
}