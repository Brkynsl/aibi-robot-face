// ============================================================================
//  AIBI ROBOT YUZU — ESP32 + ILI9341 TFT
//  Pinler ve ayarlar: config.h | WiFi bilgileri: wifi_config.h
// ============================================================================

#include "config.h"

#include <TFT_eSPI.h>
#include <SPI.h>
#include <Wire.h>
#include <driver/i2s.h>
#include <esp_system.h>

#if TTS_AKTIF
#include <WiFi.h>
#include <esp_task_wdt.h>
#include "AudioGeneratorMP3.h"
#include "AudioFileSourceHTTPStream.h"
#include "AudioOutputI2S.h"
#include "wifi_config.h"
#endif

TFT_eSPI tft = TFT_eSPI();
TFT_eSprite spr = TFT_eSprite(&tft);

// --- Sensor durumlari ---
bool mpuVar = false;  // I2C taramasinda MPU6050 bulunursa true olur

int16_t accX = 0, accY = 0, accZ = 0;
float egilimX = 0, egilimY = 0;
unsigned long sonMpuOkuma    = 0;
unsigned long sonSarsmaZamani = 0;

volatile int32_t sesSeviyesi = 0;
unsigned long sonSesZamani   = 0;

// --- Goz Yapisi ve Degiskenleri ---
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
    // Linear Interpolation (Yumusak gecis)
    float hiz = 0.15; // Deger 1'e ne kadar yakinsa o kadar hizli
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

// Bosta canlanma: bir sonraki kendiliginden duyguya kalan bekleme
unsigned long idleSonrakiBekleme = IDLE_MIN_BEKLEME_MS;

// Goz Kirpma Zamanlayicilari
unsigned long sonGozKirpma = 0;
bool gozKirpiyorMu = false;

// Kafa Sallama Degiskenleri
int kafaSallaAsama = 0;
unsigned long sonKafaSallaZaman = 0;

// Ses Degiskenleri
unsigned long sesBitisZamani = 0;
bool sesAktifMi = false;

// Gulme Ses Dizisi
struct TonAdim { int frekans; int sure; };
const TonAdim GULME_SIRASI[] = {
  {650, 60}, {950, 70}, {0, 45},
  {650, 60}, {950, 70}, {0, 45},
  {700, 65}, {1000, 90}, {0, 0}
};
const int GULME_ADIM_SAYISI = 9;
int aktifAdim = -1;
unsigned long adimBitisZamani = 0;

// Dokunma Sensoru
bool oncekiDokunmaDurumu = false;
unsigned long sonDokunmaZamani = 0;

// TTS
volatile bool ttsCal = false;
volatile bool ttsAktif = false;

// ============================================================================
//  SES (BUZZER)
// ============================================================================

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

// ============================================================================
//  TTS (WiFi uzerinden, TTS_AKTIF=1 ise)
// ============================================================================

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

// ============================================================================
//  MIKROFON
// ============================================================================

#if MODUL_MIK
void mikGorev(void* param) {
  int32_t samples[128];
  size_t bytes_read;
  while (true) {
    i2s_read(MIC_I2S_PORT, samples, sizeof(samples), &bytes_read, portMAX_DELAY);
    int count = bytes_read / sizeof(int32_t);
    if (count == 0) { vTaskDelay(1); continue; }
    // Pencere ortalamasi: tek tik/catirti yerine surekli sesi yakalar
    int64_t toplam = 0;
    for (int i = 0; i < count; i++) {
      toplam += abs(samples[i] >> 8);
    }
    sesSeviyesi = (int32_t)(toplam / count);
    vTaskDelay(1);
  }
}
#endif // MODUL_MIK

// ============================================================================
//  KURULUM
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n--- Aibi Gelismis Animasyon Sistemi Baslatiliyor ---");

  randomSeed(esp_random());

  ledcAttach(HOPARLOR_PIN, 2000, LEDC_COZUNURLUK);
  pinMode(DOKUNMA_PIN, INPUT);

  // I2C baslat ve tarama yap
  Wire.begin(MPU_SDA, MPU_SCL);
  Serial.println("I2C tarama basliyor...");
  int bulunan = 0;
  for (byte adres = 1; adres < 127; adres++) {
    Wire.beginTransmission(adres);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Cihaz bulundu: 0x%02X\n", adres);
      if (adres == MPU_ADRES && MODUL_MPU) mpuVar = true;
      bulunan++;
    }
  }
  if (bulunan == 0) Serial.println("Hicbir I2C cihazi bulunamadi!");

  if (mpuVar) {
    Wire.beginTransmission(MPU_ADRES);
    Wire.write(0x6B);
    Wire.write(0x00); // Uyku modundan cik
    Wire.endTransmission(true);
    Serial.println("MPU6050 hazir.");
  } else {
    Serial.println("MPU6050 bulunamadi — sarsma/egim tespiti devre disi.");
  }

#if MODUL_MIK
  // Mikrofon I2S baslat
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
#endif // MODUL_MIK

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

  // Sprite olustur (8-bit renk derinligi - RAM'den %50 tasarruf eder)
  spr.setColorDepth(8);
  void* spritePtr = spr.createSprite(EKRAN_GENISLIK, EKRAN_YUKSEKLIK);

  if (spritePtr == nullptr) {
    Serial.println("HATA: Sprite (Tuval) icin yeterli RAM bulunamadi!");
  } else {
    Serial.println("Sprite basariyla hafizada olusturuldu.");
  }

  spr.fillSprite(TFT_BLACK);
  idleSonrakiBekleme = random(IDLE_MIN_BEKLEME_MS, IDLE_MAX_BEKLEME_MS);
  Serial.println("Aibi animasyon sistemi hazir!");
  Serial.println("Seri komutlar icin 'yardim' yazin.");
}

// ============================================================================
//  DURUM MAKINESI VE DAVRANISLAR
// ============================================================================

// Tum ozellikleri hedeflere aktarir
void hedefBelirle(float sX, float sY, float sW, float sH, float sgX, float sgY, float sgW, float sgH) {
  solGoz.targetX = sX; solGoz.targetY = sY;
  solGoz.targetWidth = sW; solGoz.targetHeight = sH;

  sagGoz.targetX = sgX; sagGoz.targetY = sgY;
  sagGoz.targetWidth = sgW; sagGoz.targetHeight = sgH;
}

// Sadece pozisyonu kaydirmak icin yardimci fonksiyon
void bakisYonu(float xOffset, float yOffset) {
  hedefBelirle(70 + xOffset + egilimX, 80 + yOffset + egilimY, 40, 80,
               210 + xOffset + egilimX, 80 + yOffset + egilimY, 40, 80);
}

void durumaGec(AibiDurum yeniDurum, unsigned long sure) {
  mevcutDurum = yeniDurum;
  sonDurumDegisimi = millis();
  beklemeSuresi = sure;
  durumSesiCal(yeniDurum);
}

void dokunmaSensoruKontrol() {
#if !MODUL_DOKUNMA
  return;
#endif
  bool simdikiDurum = digitalRead(DOKUNMA_PIN);
  unsigned long simdikiZaman = millis();

  // Yukselen kenar: dokunma basladi (tekrar tetiklenme icin DOKUNMA_BEKLEME_MS bekleme)
  if (simdikiDurum && !oncekiDokunmaDurumu && (simdikiZaman - sonDokunmaZamani > DOKUNMA_BEKLEME_MS)) {
    sonDokunmaZamani = simdikiZaman;
    mevcutDurum = MUTLU;
    sonDurumDegisimi = simdikiZaman;
    beklemeSuresi = 5000;
#if TTS_AKTIF
    if (!ttsAktif) ttsCal = true;
#endif
    gulmeBaslat();
    Serial.println("Dokunma algilandi!");
  }
  oncekiDokunmaDurumu = simdikiDurum;
}

// Bosta canlanma: IDLE'da rastgele araliklarla agirlikli duygu secimi
void idleDavranisSec() {
  struct IdleSecim { AibiDurum durum; int agirlik; unsigned long sure; };
  static const IdleSecim SECIMLER[] = {
    { SOLA_BAK,  20, 2500 },
    { SAGA_BAK,  20, 2500 },
    { MERAK,     20, 3000 },
    { SUPHE,     10, 3000 },
    { KAFASALLA, 10, 2000 },
    { MUTLU,     10, 2500 },
    { UYKULU,     5, 4000 },
  };
  const int SECIM_SAYISI = sizeof(SECIMLER) / sizeof(SECIMLER[0]);

  int toplamAgirlik = 0;
  for (int i = 0; i < SECIM_SAYISI; i++) toplamAgirlik += SECIMLER[i].agirlik;

  int zar = random(toplamAgirlik);
  for (int i = 0; i < SECIM_SAYISI; i++) {
    zar -= SECIMLER[i].agirlik;
    if (zar < 0) {
      if (SECIMLER[i].durum == KAFASALLA) kafaSallaAsama = 0;
      durumaGec(SECIMLER[i].durum, SECIMLER[i].sure);
      break;
    }
  }
  idleSonrakiBekleme = random(IDLE_MIN_BEKLEME_MS, IDLE_MAX_BEKLEME_MS);
}

void durumMakinesiGuncelle() {
  unsigned long simdikiZaman = millis();

  if (mevcutDurum == IDLE) {
    // Bosta yeterince beklediyse kendiliginden bir duyguya gec
    if (simdikiZaman - sonDurumDegisimi > idleSonrakiBekleme) {
      idleDavranisSec();
    }
  }
  // KAFASALLA kendi animasyonu bitince, DINLIYOR ses kesilince IDLE'a doner
  else if (mevcutDurum != KAFASALLA && mevcutDurum != DINLIYOR
           && simdikiZaman - sonDurumDegisimi > beklemeSuresi) {
    mevcutDurum = IDLE;
    sonDurumDegisimi = simdikiZaman;
  }
}

void gozKirpmaKontrolu() {
  unsigned long simdikiZaman = millis();

  // Goz kirpma acikken (kapanmisken) 150ms sonra geri ac
  if (gozKirpiyorMu && (simdikiZaman - sonGozKirpma > 150)) {
    gozKirpiyorMu = false;
    // Hedef boyutlari duruma gore normale dondur (Bazi durumlar haric)
    if (mevcutDurum != UYKULU && mevcutDurum != SINIRLI && mevcutDurum != UZGUN && mevcutDurum != MERAK && mevcutDurum != SUPHE) {
      solGoz.targetHeight = 80;
      sagGoz.targetHeight = 80;
    }
    sonGozKirpma = simdikiZaman;
  }
  // Rastgele goz kirpma tetiklemesi (2 saniye ile 6 saniye arasi)
  else if (!gozKirpiyorMu && (simdikiZaman - sonGozKirpma > random(2000, 6000))) {
    // Belirli durumlardayken (Idle, Sola/Saga bakma vb.) goz kirp
    if (mevcutDurum == IDLE || mevcutDurum == SOLA_BAK || mevcutDurum == SAGA_BAK || mevcutDurum == MUTLU || mevcutDurum == MERAK) {
      gozKirpiyorMu = true;
      sonGozKirpma = simdikiZaman;
      // Goz yuksekliklerini aninda 2 yap (Kapanma efekti)
      solGoz.targetHeight = 2;
      sagGoz.targetHeight = 2;
    }
  }
}

void kafaSallaGuncelle() {
  unsigned long simdikiZaman = millis();
  // Her 200ms'de bir basi yukari/asagi oynat
  if (simdikiZaman - sonKafaSallaZaman > 200) {
    sonKafaSallaZaman = simdikiZaman;
    if (kafaSallaAsama == 0) { bakisYonu(0, -25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 1) { bakisYonu(0, 25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 2) { bakisYonu(0, -25); kafaSallaAsama++; }
    else if (kafaSallaAsama == 3) { bakisYonu(0, 0); mevcutDurum = IDLE; sonDurumDegisimi = simdikiZaman; kafaSallaAsama = 0; }
  }
}

// ============================================================================
//  ANIMASYON VE CIZIM
// ============================================================================

void animasyonlariHesapla() {
  switch (mevcutDurum) {
    case IDLE:
    {
      bakisYonu(0, 0);
      // NEFES ALMA (Breathing) Fizigi: Yukseklik hafifce sinus dalgasiyla degisir
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
      // Gozler kocaman olur
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
        sagGoz.targetHeight = 45; // Tek goz kisik (Sanki kas kaldirmis gibi)
      }
      break;
    case SUPHE:
    {
      // Kisik gozlerle yavasca tarama yapar
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
      // Hizli sol-sag tarama: ses kaynagini ariyor gibi
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

  // Pozisyonlari hedeflere dogru kaydir
  solGoz.update();
  sagGoz.update();
}

void cizimiGuncelle() {
  spr.fillSprite(TFT_BLACK); // Sadece arka plan tuvalini temizle

  uint16_t gozRengi = TFT_GREEN;
  if (mevcutDurum == SINIRLI)   gozRengi = TFT_RED;
  else if (mevcutDurum == UYKULU)   gozRengi = 0x03E0;   // Koyu yesil
  else if (mevcutDurum == TITREME)  gozRengi = 0x05E0;   // Hafif soluk yesil
  else if (mevcutDurum == DINLIYOR) gozRengi = TFT_YELLOW;

  // SQUASH & STRETCH (Ezilme ve Sunme Fizigi)
  // X eksenindeki hizlarina gore genisleyip basiklasirlar
  float solHizX = abs(solGoz.currentX - solGoz.previousX);
  float sagHizX = abs(sagGoz.currentX - sagGoz.previousX);

  float solCizimW = solGoz.currentWidth + (solHizX * 1.5);
  float solCizimH = solGoz.currentHeight - (solHizX * 1.0);
  if (solCizimH < 5) solCizimH = 5; // Minimum yukseklik siniri

  float sagCizimW = sagGoz.currentWidth + (sagHizX * 1.5);
  float sagCizimH = sagGoz.currentHeight - (sagHizX * 1.0);
  if (sagCizimH < 5) sagCizimH = 5;

  float solCizimX = solGoz.currentX;
  float solCizimY = solGoz.currentY;
  float sagCizimX = sagGoz.currentX;
  float sagCizimY = sagGoz.currentY;

  // TITREME / KORKU efekti (Rastgele pozisyon sapmasi)
  if (mevcutDurum == TITREME) {
    solCizimX += random(-3, 4); solCizimY += random(-3, 4);
    sagCizimX += random(-3, 4); sagCizimY += random(-3, 4);
  }

  // Temel goz cizimleri (Tam yuvarlak hap sekli)
  spr.fillRoundRect(solCizimX, solCizimY, solCizimW, solCizimH, solGoz.currentWidth / 2, gozRengi);
  spr.fillRoundRect(sagCizimX, sagCizimY, sagCizimW, sagCizimH, sagGoz.currentWidth / 2, gozRengi);

  // Duygulara ozel maskeleme kesikleri (Ucgen ve Daireler)
  if (mevcutDurum == SINIRLI && !gozKirpiyorMu) {
    spr.fillTriangle(solCizimX, solCizimY - 5,
                     solCizimX + solCizimW + 15, solCizimY - 5,
                     solCizimX + solCizimW + 15, solCizimY + 30, TFT_BLACK);

    spr.fillTriangle(sagCizimX - 15, sagCizimY - 5,
                     sagCizimX + sagCizimW, sagCizimY - 5,
                     sagCizimX - 15, sagCizimY + 30, TFT_BLACK);
  }
  else if (mevcutDurum == MUTLU && !gozKirpiyorMu) {
    // Alt kismi daireyle keserek hilal (^ ^) yap
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

  // Cizimi ekrana yolla (Titresimi onler)
  spr.pushSprite(0, 0);
}

// ============================================================================
//  SENSOR OKUMALARI
// ============================================================================

void mpuGuncelle() {
  if (!mpuVar) return;
  if (millis() - sonMpuOkuma < MPU_OKUMA_ARALIGI_MS) return;
  sonMpuOkuma = millis();

  Wire.beginTransmission(MPU_ADRES);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  if (Wire.requestFrom(MPU_ADRES, 6, true) != 6) return; // eksik veri geldiyse atla
  int16_t yX = Wire.read() << 8 | Wire.read();
  int16_t yY = Wire.read() << 8 | Wire.read();
  int16_t yZ = Wire.read() << 8 | Wire.read();
  DEBUG_LOG("accX:%d accY:%d accZ:%d egilimX:%.1f egilimY:%.1f\n", yX, yY, yZ, egilimX, egilimY);

  // Sarsma tespiti
  int32_t delta = abs(yX - accX) + abs(yY - accY) + abs(yZ - accZ);
  accX = yX; accY = yY; accZ = yZ;

  if (delta > SARSMA_ESIGI && millis() - sonSarsmaZamani > SARSMA_BEKLEME
      && mevcutDurum != DINLIYOR && mevcutDurum != MUTLU) {
    sonSarsmaZamani = millis();
    durumaGec((random(2) == 0) ? SASKIN : TITREME, 2000);
  }

  // Egim → goz yonu (sadece sakin durumlarda)
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

// ============================================================================
//  SERI KOMUT ARAYUZU (donanim testi icin)
// ============================================================================

const char* durumAdi(AibiDurum d) {
  switch (d) {
    case IDLE:      return "IDLE";
    case MUTLU:     return "MUTLU";
    case UZGUN:     return "UZGUN";
    case SASKIN:    return "SASKIN";
    case SINIRLI:   return "SINIRLI";
    case UYKULU:    return "UYKULU";
    case KAFASALLA: return "KAFASALLA";
    case SOLA_BAK:  return "SOLA_BAK";
    case SAGA_BAK:  return "SAGA_BAK";
    case MERAK:     return "MERAK";
    case SUPHE:     return "SUPHE";
    case TITREME:   return "TITREME";
    case DINLIYOR:  return "DINLIYOR";
  }
  return "?";
}

void seriKomutIsle(const String& komut) {
  if      (komut == "mutlu")   { durumaGec(MUTLU, 4000); gulmeBaslat(); }
  else if (komut == "uzgun")   durumaGec(UZGUN, 4000);
  else if (komut == "saskin")  durumaGec(SASKIN, 4000);
  else if (komut == "sinirli") durumaGec(SINIRLI, 4000);
  else if (komut == "uykulu")  durumaGec(UYKULU, 4000);
  else if (komut == "merak")   durumaGec(MERAK, 4000);
  else if (komut == "suphe")   durumaGec(SUPHE, 4000);
  else if (komut == "titre")   durumaGec(TITREME, 4000);
  else if (komut == "salla")   { kafaSallaAsama = 0; durumaGec(KAFASALLA, 4000); }
  else if (komut == "sol")     durumaGec(SOLA_BAK, 4000);
  else if (komut == "sag")     durumaGec(SAGA_BAK, 4000);
  else if (komut == "idle")    durumaGec(IDLE, 3000);
  else if (komut == "durum") {
    Serial.printf("Durum: %s | Ses seviyesi: %ld | MPU: %s | Bos heap: %u bayt\n",
                  durumAdi(mevcutDurum), (long)sesSeviyesi, mpuVar ? "var" : "yok",
                  (unsigned)ESP.getFreeHeap());
    return;
  }
  else if (komut == "cevir") {
#if MODUL_CEVIRI
    // Asama 5: ceviri modu buradan baslatilacak
#else
    Serial.println("Ceviri ozelligi Asama 5'te gelecek (MODUL_CEVIRI=0). Gereken: MAX98357A + INMP441 + OpenAI anahtari.");
#endif
    return;
  }
  else if (komut == "jest") {
#if MODUL_APDS
    // Asama 4: jest simulasyonu buradan tetiklenecek
#else
    Serial.println("Jest algisi Asama 4'te gelecek (MODUL_APDS=0). Gereken: APDS-9960 (I2C 0x39).");
#endif
    return;
  }
  else if (komut == "oksa") {
#if MODUL_OKSAMA
    // Asama 3: oksama simulasyonu buradan tetiklenecek
#else
    Serial.println("Oksama algisi Asama 3'te gelecek (MODUL_OKSAMA=0). Gereken: 2. TTP223 (GPIO16).");
#endif
    return;
  }
  else if (komut == "yardim") {
    Serial.println("Komutlar: mutlu uzgun saskin sinirli uykulu merak suphe titre salla sol sag idle durum yardim");
    Serial.println("Gelecek ozellikler: cevir (Asama 5) | jest (Asama 4) | oksa (Asama 3)");
    return;
  }
  else {
    Serial.printf("Bilinmeyen komut: '%s' ('yardim' yazin)\n", komut.c_str());
    return;
  }
  Serial.printf("Duruma gecildi: %s\n", durumAdi(mevcutDurum));
}

void seriKomutKontrol() {
  static String tampon = "";
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      tampon.trim();
      tampon.toLowerCase();
      if (tampon.length() > 0) seriKomutIsle(tampon);
      tampon = "";
    } else if (tampon.length() < 32) {
      tampon += c;
    }
  }
}

// ============================================================================
//  ANA DONGU
// ============================================================================

void loop() {
  static unsigned long sonKareZamani = 0;
#if DEBUG
  static unsigned long fpsOlcumBasi = 0;
  static int kareSayisi = 0;
#endif

  seriKomutKontrol();
  mpuGuncelle();
  mikSesDinle();
  dokunmaSensoruKontrol();
  durumMakinesiGuncelle();
  animasyonlariHesapla();
  cizimiGuncelle();
  sesKontrol();

  // Kare zamanlamasi: cizim uzun surduyse bekleme, kisa surduyse kalan kadar bekle
  unsigned long gecen = millis() - sonKareZamani;
  if (gecen < KARE_SURESI_MS) delay(KARE_SURESI_MS - gecen);
  sonKareZamani = millis();

#if DEBUG
  kareSayisi++;
  if (sonKareZamani - fpsOlcumBasi >= 1000) {
    DEBUG_LOG("FPS: %d\n", kareSayisi);
    kareSayisi = 0;
    fpsOlcumBasi = sonKareZamani;
  }
#endif
}
