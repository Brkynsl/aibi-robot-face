#ifndef API_CONFIG_H
#define API_CONFIG_H

// Bu dosyayi "api_config.h" adiyla kopyalayin ve kendi anahtarinizi girin.
// api_config.h .gitignore'da oldugu icin repoya yuklenmez.
// Anahtar almak icin: https://platform.openai.com/api-keys

#define OPENAI_API_KEY   "sk-BURAYA-ANAHTARINIZI-YAZIN"

// Ceviri zincirinde kullanilan modeller (Asama 5)
#define OPENAI_STT_MODEL "whisper-1"       // ses → metin (dil oto-algi)
#define OPENAI_LLM_MODEL "gpt-4o-mini"     // ceviri
#define OPENAI_TTS_MODEL "gpt-4o-mini-tts" // metin → ses
#define OPENAI_TTS_SES   "alloy"           // konusma sesi

#endif // API_CONFIG_H
