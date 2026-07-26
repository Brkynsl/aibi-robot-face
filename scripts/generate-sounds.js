const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const output = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(output, { recursive: true });

function writeWav(name, seconds, sampleAt) {
  const sampleCount = Math.floor(sampleRate * seconds);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const value = Math.max(-1, Math.min(1, sampleAt(time, i, sampleCount)));
    buffer.writeInt16LE(Math.floor(value * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(output, name), buffer);
}

writeWav('tap.wav', 0.16, (time, _i, count) => {
  const envelope = Math.max(0, 1 - time / (count / sampleRate));
  return Math.sin(2 * Math.PI * (780 + time * 500) * time) * envelope * 0.32;
});

writeWav('play.wav', 0.42, (time) => {
  const note = time < 0.14 ? 523.25 : time < 0.28 ? 659.25 : 783.99;
  const local = time % 0.14;
  return Math.sin(2 * Math.PI * note * time) * Math.max(0, 1 - local / 0.14) * 0.25;
});

let rainSeed = 712367;
const randomRain = () => {
  rainSeed = (rainSeed * 16807) % 2147483647;
  return rainSeed / 2147483647;
};
let rainSmooth = 0;
writeWav('rain.wav', 8, () => {
  const noise = randomRain() * 2 - 1;
  rainSmooth = rainSmooth * 0.82 + noise * 0.18;
  return (noise * 0.11 + rainSmooth * 0.22);
});

let fireSeed = 981723;
const randomFire = () => {
  fireSeed = (fireSeed * 48271) % 2147483647;
  return fireSeed / 2147483647;
};
let fireSmooth = 0;
writeWav('fire.wav', 8, (time) => {
  const noise = randomFire() * 2 - 1;
  fireSmooth = fireSmooth * 0.965 + noise * 0.035;
  const crackle = randomFire() > 0.997 ? (randomFire() * 2 - 1) * 0.7 : 0;
  const pulse = 0.7 + Math.sin(time * 8.7) * 0.16 + Math.sin(time * 17.3) * 0.09;
  return fireSmooth * 0.8 * pulse + crackle;
});
