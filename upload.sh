#!/bin/bash
set -e

echo "=== 1. Arduino CLI İndiriliyor ==="
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh

echo "=== 2. ESP32 Çekirdekleri Yapılandırılıyor ==="
./bin/arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
./bin/arduino-cli core install esp32:esp32 --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json

echo "=== 3. Gerekli Kütüphaneler Kuruluyor (TFT_eSPI) ==="
./bin/arduino-cli lib install TFT_eSPI

echo "=== 4. Kod Derleniyor (Bu biraz zaman alabilir) ==="
./bin/arduino-cli compile --fqbn esp32:esp32:esp32 sketch_may5a.ino

echo "=== 5. Karta Yükleniyor ==="
# /dev/cu.usbserial-0001 portu tespit edildiği için oraya yüklüyoruz.
./bin/arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32 sketch_may5a.ino

echo "=== BAŞARILI! Kod ESP32'ye yüklendi. ==="
