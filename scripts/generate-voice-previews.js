const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const output = path.join(__dirname, '..', 'assets', 'voices');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumina-voices-'));
fs.mkdirSync(output, { recursive: true });

const profiles = [
  { id: 'lila', voice: 'Yelda', preview: 'Merhaba! Ben Lila. Bugün birlikte ne oynayalım?' },
  { id: 'ada', voice: 'Samantha', preview: 'Merhaba! Ben Ada. Yeni bir maceraya hazırım.' },
  { id: 'masal', voice: 'Moira', preview: 'Merhaba. Ben Masal. Sana güzel bir hikâye anlatabilirim.' },
  { id: 'atlas', voice: 'Daniel', preview: 'Merhaba, ben Atlas. Sana yardım etmeye hazırım.' },
  { id: 'ege', voice: 'Ralph', preview: 'Selam, ben Ege. Birlikte sakin bir gün geçirelim.' },
  { id: 'mert', voice: 'Fred', preview: 'Hey! Ben Mert. Hadi hemen oyuna başlayalım.' },
  { id: 'deniz', voice: 'Karen', preview: 'Merhaba, ben Deniz. Bugünkü planını birlikte hazırlayabiliriz.' },
  { id: 'mini', voice: 'Junior', preview: 'Merhaba! Ben Mini. Seni gördüğüme çok sevindim.' },
  { id: 'robot', voice: 'Zarvox', preview: 'Lumina robot sistemi aktif. Senkronizasyon tamamlandı.' },
  { id: 'uyku', voice: 'Whisper', preview: 'İyi geceler. Şimdi dinlenme ve güzel rüyalar zamanı.' },
];

const phrases = {
  feed: 'Teşekkür ederim. Bu mama çok lezzetliydi.',
  play: 'Harika bir oyundu. Bir tur daha oynayalım mı?',
};

function createAudio(id, voice, kind, text) {
  const aiff = path.join(temp, `${id}-${kind}.aiff`);
  const target = path.join(output, `${id}-${kind}.wav`);
  execFileSync('/usr/bin/say', ['-v', voice, '-r', '178', '-o', aiff, text]);
  execFileSync('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEI16@24000', aiff, target]);
}

for (const profile of profiles) {
  createAudio(profile.id, profile.voice, 'preview', profile.preview);
  createAudio(profile.id, profile.voice, 'feed', phrases.feed);
  createAudio(profile.id, profile.voice, 'play', phrases.play);
}

fs.rmSync(temp, { recursive: true, force: true });
