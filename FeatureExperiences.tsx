import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type FeatureModel = {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  headline: string;
  sample: string;
  action: string;
};

export type FeaturePalette = {
  bg: string;
  card: string;
  cardSolid: string;
  text: string;
  muted: string;
  line: string;
  nav: string;
  input: string;
  cyanSoft: string;
};

type Props = {
  feature: FeatureModel;
  c: FeaturePalette;
  onBack: () => void;
  onToast: (message: string) => void;
  onRobotExpression: (expression: 'blink' | 'curious' | 'sparkle') => void;
  onSound: (sound: 'tap' | 'play') => void;
};

function ScreenHeader({ feature, c, onBack }: Pick<Props, 'feature' | 'c' | 'onBack'>) {
  return (
    <View style={s.screenHeader}>
      <Pressable onPress={onBack} style={[s.roundButton, { backgroundColor: c.card, borderColor: c.line }]}>
        <Ionicons name="arrow-back" size={20} color={c.text} />
      </Pressable>
      <View style={s.headerCopy}>
        <Text style={[s.headerTitle, { color: c.text }]}>{feature.title}</Text>
        <Text style={[s.headerSubtitle, { color: c.muted }]}>{feature.subtitle}</Text>
      </View>
      <View style={[s.onlinePill, { backgroundColor: `${feature.color}18` }]}>
        <View style={[s.onlineDot, { backgroundColor: feature.color }]} />
        <Text style={[s.onlineLabel, { color: feature.color }]}>HAZIR</Text>
      </View>
    </View>
  );
}

function Card({ c, children, style }: { c: FeaturePalette; children: React.ReactNode; style?: any }) {
  return <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }, style]}>{children}</View>;
}

function Pill({ label, active, color, c, onPress }: { label: string; active: boolean; color: string; c: FeaturePalette; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.pill, { backgroundColor: active ? color : c.input }]}>
      <Text style={[s.pillText, { color: active ? '#fff' : c.muted }]}>{label}</Text>
    </Pressable>
  );
}

function Waveform({ color, reverse = false }: { color: string; reverse?: boolean }) {
  const heights = reverse ? [8, 15, 23, 12, 20, 9, 18, 6] : [18, 8, 15, 24, 11, 19, 7, 14];
  return (
    <View style={s.waveform}>
      {heights.map((height, index) => <View key={index} style={[s.waveBar, { height, backgroundColor: color, opacity: 0.35 + (index % 3) * 0.2 }]} />)}
    </View>
  );
}

function ChatScreen(props: Props) {
  const { c, feature, onToast, onRobotExpression, onSound } = props;
  const [drawer, setDrawer] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { mine: false, text: "Merhaba! Milo'nun bugünkü rutini hakkında konuşmak ister misin?" },
    { mine: true, text: 'Evet, bugün enerjisini nasıl değerlendirebiliriz?' },
  ]);
  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { mine: true, text: input.trim() }, { mine: false, text: 'Harika! Kısa bir oyun ve ardından dinlenme planı hazırladım.' }]);
    setInput('');
    onRobotExpression('sparkle');
    onSound('tap');
  };
  return (
    <View>
      <ScreenHeader {...props} />
      <Pressable onPress={() => setDrawer(!drawer)} style={[s.historyButton, { backgroundColor: c.input }]}>
        <Ionicons name={drawer ? 'close' : 'menu'} size={18} color={feature.color} />
        <Text style={[s.historyText, { color: feature.color }]}>{drawer ? 'Geçmişi kapat' : 'Sohbet geçmişi'}</Text>
      </Pressable>
      {drawer ? (
        <Card c={c} style={s.drawer}>
          <View style={s.drawerTitleRow}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Sohbetler</Text>
            <Pressable onPress={() => onToast('Yeni sohbet açıldı')} style={[s.miniAction, { backgroundColor: feature.color }]}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.miniActionText}>Yeni</Text>
            </Pressable>
          </View>
          {["Milo'nun yürüyüşü", 'Beslenme önerileri', 'Akşam planı'].map((item, index) => (
            <View key={item} style={[s.historyRow, index === 0 && { backgroundColor: `${feature.color}12` }]}>
              <Ionicons name="chatbubble-outline" size={17} color={index === 0 ? feature.color : c.muted} />
              <Text style={[s.rowTitle, { color: index === 0 ? feature.color : c.text }]}>{item}</Text>
            </View>
          ))}
        </Card>
      ) : null}
      <View style={s.datePill}><Text style={[s.microText, { color: c.muted }]}>BUGÜN · 10:42</Text></View>
      {messages.map((message, index) => (
        <View key={`${message.text}-${index}`} style={[s.messageWrap, message.mine && { alignItems: 'flex-end' }]}>
          <View style={s.senderRow}>
            <View style={[s.senderAvatar, { backgroundColor: message.mine ? c.input : `${feature.color}22` }]}>
              <Ionicons name={message.mine ? 'person' : 'sparkles'} size={15} color={message.mine ? c.muted : feature.color} />
            </View>
            <Text style={[s.sender, { color: message.mine ? c.muted : feature.color }]}>{message.mine ? 'Sen' : 'Lumina'}</Text>
          </View>
          <Card c={c} style={[s.messageCard, message.mine && { backgroundColor: c.input }]}>
            {index < 2 ? (
              <View style={[s.audioRow, { borderBottomColor: c.line }]}>
                <Pressable onPress={() => onSound('play')} style={[s.playSmall, { backgroundColor: `${message.mine ? '#6C49B3' : feature.color}18` }]}>
                  <Ionicons name="play" size={15} color={message.mine ? '#6C49B3' : feature.color} />
                </Pressable>
                <Waveform color={message.mine ? '#6C49B3' : feature.color} reverse={message.mine} />
                <Text style={[s.microText, { color: c.muted }]}>0:0{index ? 4 : 8}</Text>
              </View>
            ) : null}
            <Text style={[s.body, { color: c.text }]}>{message.text}</Text>
          </Card>
        </View>
      ))}
      <Card c={c} style={s.composer}>
        <TextInput value={input} onChangeText={setInput} onSubmitEditing={send} placeholder="Lumina'ya bir şey sor..." placeholderTextColor={c.muted} style={[s.composerInput, { color: c.text }]} />
        <Pressable onPress={send} style={[s.sendButton, { backgroundColor: feature.color }]}>
          <Ionicons name={input ? 'arrow-up' : 'mic'} size={20} color="#fff" />
        </Pressable>
      </Card>
    </View>
  );
}

function MusicScreen(props: Props) {
  const { c, feature, onRobotExpression, onSound } = props;
  const tracks = ['Synthetic Dreams', 'Neon Paws', 'Morning Energy'];
  const [track, setTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    setPlaying(!playing);
    onRobotExpression(!playing ? 'sparkle' : 'blink');
    onSound('play');
  };
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#805EE5', '#EF6F9C']} style={s.musicHero}>
        <View style={s.albumArt}><Ionicons name="musical-notes" size={56} color="#fff" /></View>
        <Text style={s.musicEyebrow}>ŞİMDİ ÇALIYOR</Text>
        <Text style={s.musicTitle}>{tracks[track]}</Text>
        <Text style={s.musicArtist}>Lumina Sessions · Milo Mix</Text>
        <View style={s.progressTrack}><View style={[s.progressFill, { width: playing ? '58%' : '34%' }]} /></View>
        <View style={s.playerControls}>
          <Pressable onPress={() => setTrack((track + tracks.length - 1) % tracks.length)}><Ionicons name="play-skip-back" size={27} color="#fff" /></Pressable>
          <Pressable onPress={toggle} style={s.playMain}><Ionicons name={playing ? 'pause' : 'play'} size={30} color="#805EE5" /></Pressable>
          <Pressable onPress={() => setTrack((track + 1) % tracks.length)}><Ionicons name="play-skip-forward" size={27} color="#fff" /></Pressable>
        </View>
      </LinearGradient>
      <Text style={[s.sectionTitle, { color: c.text }]}>Sıradaki</Text>
      <Card c={c} style={{ paddingHorizontal: 14 }}>
        {tracks.map((item, index) => (
          <Pressable key={item} onPress={() => setTrack(index)} style={[s.trackRow, index < tracks.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[s.trackIcon, { backgroundColor: index === track ? `${feature.color}22` : c.input }]}>
              <Ionicons name={index === track && playing ? 'volume-high' : 'musical-note'} size={18} color={index === track ? feature.color : c.muted} />
            </View>
            <View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: c.text }]}>{item}</Text><Text style={[s.rowSub, { color: c.muted }]}>Lumina Sessions · 3:{21 + index * 8}</Text></View>
            <Ionicons name="ellipsis-horizontal" size={18} color={c.muted} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

function TranslatorScreen(props: Props) {
  const { c, feature, onRobotExpression, onSound } = props;
  const [from, setFrom] = useState<'Türkçe' | 'English'>('Türkçe');
  const [text, setText] = useState('');
  const [result, setResult] = useState('Good morning! Shall we go to the park?');
  const translate = () => {
    setResult(text ? (from === 'Türkçe' ? 'Great! I translated your message instantly.' : 'Harika! Mesajını anında çevirdim.') : result);
    onRobotExpression('curious');
    onSound('tap');
  };
  return (
    <View>
      <ScreenHeader {...props} />
      <Card c={c} style={s.languagePicker}>
        <Pill label={from} active color={feature.color} c={c} onPress={() => undefined} />
        <Pressable onPress={() => setFrom(from === 'Türkçe' ? 'English' : 'Türkçe')} style={[s.swapButton, { backgroundColor: `${feature.color}18` }]}>
          <Ionicons name="swap-horizontal" size={21} color={feature.color} />
        </Pressable>
        <Pill label={from === 'Türkçe' ? 'English' : 'Türkçe'} active={false} color={feature.color} c={c} onPress={() => undefined} />
      </Card>
      <View style={[s.translationBubble, { backgroundColor: c.card, borderColor: c.line }]}>
        <Text style={[s.translationLang, { color: feature.color }]}>{from}</Text>
        <TextInput multiline value={text} onChangeText={setText} placeholder="Günaydın! Parka gidelim mi?" placeholderTextColor={c.muted} style={[s.translationInput, { color: c.text }]} />
        <Pressable onPress={() => onSound('play')} style={[s.speakerButton, { backgroundColor: `${feature.color}18` }]}><Ionicons name="volume-high" size={18} color={feature.color} /></Pressable>
      </View>
      <Pressable onPress={translate} style={[s.translateButton, { backgroundColor: feature.color }]}>
        <Ionicons name="sparkles" size={19} color="#fff" /><Text style={s.actionText}>Anında çevir</Text>
      </Pressable>
      <View style={[s.translationBubble, { backgroundColor: `${feature.color}10`, borderColor: `${feature.color}30` }]}>
        <Text style={[s.translationLang, { color: feature.color }]}>{from === 'Türkçe' ? 'English' : 'Türkçe'}</Text>
        <Text style={[s.translationResult, { color: c.text }]}>{result}</Text>
      </View>
      <Text style={[s.sectionTitle, { color: c.text }]}>Görsel sözlük</Text>
      <View style={s.dictionaryRow}>
        {[['paw', 'Paw'], ['leaf', 'Park'], ['water', 'Water']].map(([icon, label]) => (
          <Card key={label} c={c} style={s.dictionaryCard}>
            <Ionicons name={icon as IconName} size={24} color={feature.color} />
            <Text style={[s.dictionaryLabel, { color: c.text }]}>{label}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

function AlarmScreen(props: Props) {
  const { c, feature, onToast, onSound } = props;
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState<'Alarmlar' | 'Zamanlayıcı'>('Alarmlar');
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const [alarms, setAlarms] = useState([{ time: '06:30', label: 'Sabah rutini', active: true }, { time: '08:00', label: 'Mama zamanı', active: false }, { time: '12:30', label: 'Kısa yürüyüş', active: false }]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#DDF8FF', '#EEE8FF']} style={s.clockHero}>
        <Ionicons name="sunny-outline" size={25} color={feature.color} />
        <Text style={[s.clock, { color: '#17343B' }]}>{time}</Text>
        <Text style={s.clockDate}>{now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </LinearGradient>
      <View style={[s.alarmTabs, { backgroundColor: c.input }]}>
        {(['Alarmlar', 'Zamanlayıcı'] as const).map((item) => (
          <Pressable key={item} onPress={() => setView(item)} style={[s.alarmTab, view === item && { backgroundColor: feature.color }]}>
            <Ionicons name={item === 'Alarmlar' ? 'alarm' : 'timer'} size={17} color={view === item ? '#fff' : c.muted} />
            <Text style={[s.alarmTabText, { color: view === item ? '#fff' : c.muted }]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {view === 'Alarmlar' ? (
        <>
          <View style={s.alarmSectionRow}>
            <Text style={[s.alarmSectionTitle, { color: c.text }]}>Alarmlarım</Text>
            <Pressable onPress={() => { setAlarms([...alarms, { time: '18:30', label: 'Oyun zamanı', active: true }]); onToast('18:30 alarmı eklendi'); onSound('tap'); }} style={[s.alarmAddButton, { backgroundColor: feature.color }]}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.alarmAddText}>Alarm ekle</Text>
            </Pressable>
          </View>
          <Card c={c} style={s.alarmListCard}>
            {alarms.map((alarm, index) => (
              <View key={`${alarm.time}-${index}`} style={[s.alarmRow, index < alarms.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
                <View style={s.alarmCopy}><Text style={[s.alarmTime, { color: alarm.active ? c.text : c.muted }]}>{alarm.time}</Text><Text style={[s.rowSub, { color: c.muted }]} numberOfLines={1}>{alarm.label} · Her gün</Text></View>
                <View style={s.alarmSwitchWrap}>
                  <Switch value={alarm.active} onValueChange={(active) => setAlarms(alarms.map((item, i) => i === index ? { ...item, active } : item))} trackColor={{ false: '#C8D3D7', true: feature.color }} thumbColor="#fff" />
                </View>
              </View>
            ))}
          </Card>
          <View style={s.alarmQuickRow}>
            <Pressable onPress={() => setAlarms(alarms.map(item => ({ ...item, active: true })))} style={[s.alarmQuickButton, { backgroundColor: c.card, borderColor: c.line }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={feature.color} /><Text style={[s.alarmQuickText, { color: c.text }]}>Tümünü aç</Text>
            </Pressable>
            <Pressable onPress={() => setAlarms(alarms.map(item => ({ ...item, active: false })))} style={[s.alarmQuickButton, { backgroundColor: c.card, borderColor: c.line }]}>
              <Ionicons name="close-circle-outline" size={18} color={c.muted} /><Text style={[s.alarmQuickText, { color: c.text }]}>Tümünü kapat</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Card c={c} style={s.timerCard}>
          <View style={[s.timerIcon, { backgroundColor: `${feature.color}18` }]}><Ionicons name="timer" size={28} color={feature.color} /></View>
          <Text style={[s.timerValue, { color: c.text }]}>{timerMinutes.toString().padStart(2, '0')}:00</Text>
          <Text style={[s.rowSub, { color: c.muted }]}>Pet bakım molası</Text>
          <View style={s.timerPresetRow}>
            {[5, 15, 30].map(value => <Pressable key={value} onPress={() => { setTimerMinutes(value); setTimerRunning(false); }} style={[s.timerPreset, { backgroundColor: timerMinutes === value ? `${feature.color}18` : c.input, borderColor: timerMinutes === value ? feature.color : 'transparent' }]}><Text style={[s.timerPresetText, { color: timerMinutes === value ? feature.color : c.muted }]}>{value} dk</Text></Pressable>)}
          </View>
          <Pressable onPress={() => { setTimerRunning(!timerRunning); onSound('tap'); }} style={[s.timerMainButton, { backgroundColor: timerRunning ? '#E35D72' : feature.color }]}>
            <Ionicons name={timerRunning ? 'pause' : 'play'} size={19} color="#fff" /><Text style={s.alarmAddText}>{timerRunning ? 'Duraklat' : 'Başlat'}</Text>
          </Pressable>
        </Card>
      )}
    </View>
  );
}

function GamesScreen(props: Props) {
  const { c, feature, onRobotExpression, onSound } = props;
  const [result, setResult] = useState(6);
  const [flipped, setFlipped] = useState('Tura');
  const playDice = () => {
    setResult(Math.floor(Math.random() * 6) + 1);
    onRobotExpression('sparkle');
    onSound('play');
  };
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#7A5BE0', '#B378F3']} style={s.gameHero}>
        <View style={s.dice}><Text style={s.diceText}>{result}</Text></View>
        <Text style={s.gameTitle}>Zar At</Text>
        <Text style={s.gameSub}>Milo ile sırayla zar at, en yüksek sayı kazansın.</Text>
        <Pressable onPress={playDice} style={s.whiteAction}><Ionicons name="dice" size={19} color="#7A5BE0" /><Text style={s.whiteActionText}>Zarı at</Text></Pressable>
      </LinearGradient>
      <Text style={[s.sectionTitle, { color: c.text }]}>Hızlı oyunlar</Text>
      <View style={s.gameGrid}>
        <Pressable onPress={() => { setFlipped(Math.random() > .5 ? 'Yazı' : 'Tura'); onSound('tap'); }} style={[s.quickGame, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={[s.gameIcon, { backgroundColor: '#FFEABF' }]}><Ionicons name="cash" size={26} color="#E29922" /></View>
          <Text style={[s.quickGameTitle, { color: c.text }]}>Yazı Tura</Text><Text style={[s.quickGameResult, { color: feature.color }]}>{flipped}</Text>
        </Pressable>
        <Pressable onPress={() => onRobotExpression('curious')} style={[s.quickGame, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={[s.gameIcon, { backgroundColor: '#DFF8F1' }]}><Ionicons name="help" size={26} color="#20A879" /></View>
          <Text style={[s.quickGameTitle, { color: c.text }]}>Sayı Tahmini</Text><Text style={[s.quickGameResult, { color: '#20A879' }]}>1–20</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PhoneScreen(props: Props) {
  const { c, feature, onToast, onSound } = props;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(0);
  const contacts = ['Ayşe Yılmaz', 'Mehmet Demir', 'Deniz Kaya', 'Selin Aksoy'];
  return (
    <View>
      <ScreenHeader {...props} />
      <View style={[s.search, { backgroundColor: c.input }]}><Ionicons name="search" size={19} color={c.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Kişilerde ara" placeholderTextColor={c.muted} style={[s.searchInput, { color: c.text }]} /></View>
      <Card c={c} style={{ paddingHorizontal: 14 }}>
        {contacts.filter(item => item.toLowerCase().includes(query.toLowerCase())).map((contact, index) => (
          <View key={contact} style={[s.contactWrap, index < contacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <Pressable onPress={() => setOpen(open === index ? -1 : index)} style={s.contactRow}>
              <View style={[s.contactAvatar, { backgroundColor: `${feature.color}18` }]}><Text style={[s.contactInitial, { color: feature.color }]}>{contact[0]}</Text></View>
              <View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: c.text }]}>{contact}</Text><Text style={[s.rowSub, { color: c.muted }]}>Mobil · Favori</Text></View>
              <Ionicons name={open === index ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
            </Pressable>
            {open === index ? (
              <View style={s.contactActions}>
                {(['call', 'chatbubble', 'videocam'] as IconName[]).map(icon => <Pressable key={icon} onPress={() => { onToast(`${contact} için işlem başlatıldı`); onSound('tap'); }} style={[s.contactAction, { backgroundColor: `${feature.color}14` }]}><Ionicons name={icon} size={19} color={feature.color} /></Pressable>)}
              </View>
            ) : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

function DeviceScreen(props: Props) {
  const { c, feature, onToast } = props;
  const [devices, setDevices] = useState([
    { name: 'Salon ışıkları', icon: 'bulb' as IconName, active: true, value: '%65' },
    { name: 'RoboVac 3000', icon: 'disc' as IconName, active: false, value: 'Dockta' },
    { name: 'Termostat', icon: 'thermometer' as IconName, active: true, value: '23°' },
    { name: 'Akıllı priz', icon: 'flash' as IconName, active: true, value: '42 W' },
  ]);
  return (
    <View>
      <ScreenHeader {...props} />
      <View style={s.deviceSummary}><View><Text style={[s.bigTitle, { color: c.text }]}>Evim</Text><Text style={[s.rowSub, { color: c.muted }]}>4 cihaz · 3 çevrimiçi</Text></View><View style={[s.homeBadge, { backgroundColor: `${feature.color}18` }]}><Ionicons name="home" size={24} color={feature.color} /></View></View>
      <View style={s.deviceGrid}>
        {devices.map((device, index) => (
          <Pressable key={device.name} onPress={() => setDevices(devices.map((item, i) => i === index ? { ...item, active: !item.active } : item))} style={[s.deviceCard, { backgroundColor: c.card, borderColor: device.active ? feature.color : c.line }]}>
            <View style={[s.deviceIcon, { backgroundColor: device.active ? `${feature.color}18` : c.input }]}><Ionicons name={device.icon} size={25} color={device.active ? feature.color : c.muted} /></View>
            <Text style={[s.deviceName, { color: c.text }]}>{device.name}</Text><Text style={[s.deviceValue, { color: device.active ? feature.color : c.muted }]}>{device.active ? device.value : 'Kapalı'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => onToast('Yeni cihaz taraması başladı')} style={[s.outlineAction, { borderColor: feature.color }]}><Ionicons name="add-circle-outline" size={19} color={feature.color} /><Text style={[s.outlineActionText, { color: feature.color }]}>Cihaz ekle</Text></Pressable>
    </View>
  );
}

function LampScreen(props: Props) {
  const { c, feature, onRobotExpression } = props;
  const [on, setOn] = useState(true);
  const [brightness, setBrightness] = useState(70);
  const [tone, setTone] = useState('Sıcak');
  return (
    <View>
      <ScreenHeader {...props} />
      <View style={[s.lampStage, { backgroundColor: on ? `${feature.color}16` : c.card, borderColor: on ? `${feature.color}44` : c.line }]}>
        <View style={[s.lampGlow, { backgroundColor: on ? `${feature.color}30` : c.input }]}><Ionicons name={on ? 'bulb' : 'bulb-outline'} size={76} color={on ? feature.color : c.muted} /></View>
        <Text style={[s.brightness, { color: c.text }]}>{on ? brightness : 0}%</Text><Text style={[s.rowSub, { color: c.muted }]}>Salon lambası · {on ? tone + ' beyaz' : 'Kapalı'}</Text>
        <Pressable onPress={() => { setOn(!on); onRobotExpression(!on ? 'sparkle' : 'blink'); }} style={[s.powerButton, { backgroundColor: on ? feature.color : c.input }]}><Ionicons name="power" size={27} color={on ? '#fff' : c.muted} /></Pressable>
      </View>
      <Text style={[s.sectionTitle, { color: c.text }]}>Parlaklık</Text>
      <View style={s.levelRow}>{[20, 40, 60, 80, 100].map(level => <Pressable key={level} onPress={() => { setBrightness(level); setOn(true); }} style={[s.levelBar, { height: 20 + level * .55, backgroundColor: brightness >= level && on ? feature.color : c.input }]} />)}</View>
      <View style={s.toneRow}>{['Sıcak', 'Doğal', 'Soğuk'].map(item => <Pill key={item} label={item} active={tone === item} color={feature.color} c={c} onPress={() => setTone(item)} />)}</View>
    </View>
  );
}

function MirrorScreen(props: Props) {
  const { c, feature, onToast } = props;
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#D7F7FF', '#F5E9FF']} style={s.mirror}>
        <View style={s.mirrorTop}><View><Text style={s.mirrorHello}>Günaydın, Berkay</Text><Text style={s.mirrorSub}>Hazır görünüyorsun ✨</Text></View><View style={s.weatherMini}><Ionicons name="sunny" size={20} color="#E9A629" /><Text style={s.weatherMiniText}>24°</Text></View></View>
        <View style={s.faceScan}><Ionicons name="scan-outline" size={120} color="rgba(0,103,127,.35)" /><View style={s.scanDot} /></View>
        <View style={s.analysisCard}><Text style={s.analysisTitle}>Cilt & Tüy Analizi</Text><Text style={s.analysisLabel}>Nem dengesi · %82</Text><View style={s.analysisTrack}><View style={[s.analysisFill, { width: '82%', backgroundColor: feature.color }]} /></View><Text style={s.analysisLabel}>Canlılık · %91</Text><View style={s.analysisTrack}><View style={[s.analysisFill, { width: '91%', backgroundColor: '#22B98A' }]} /></View></View>
      </LinearGradient>
      <View style={s.mirrorActions}>{[['camera', 'Görünümü kaydet'], ['sparkles', 'Bakım önerisi']].map(([icon, label]) => <Pressable key={label} onPress={() => onToast(`${label} hazır`)} style={[s.mirrorAction, { backgroundColor: c.card, borderColor: c.line }]}><Ionicons name={icon as IconName} size={22} color={feature.color} /><Text style={[s.mirrorActionText, { color: c.text }]}>{label}</Text></Pressable>)}</View>
    </View>
  );
}

function RecordingsScreen(props: Props) {
  const { c, feature, onSound } = props;
  const [recording, setRecording] = useState(false);
  const [open, setOpen] = useState(1);
  const recordings = [{ title: 'Sabah Yürüyüşü', meta: 'Bugün · 00:42' }, { title: 'Toplantı Notları', meta: 'Dün · 02:16' }, { title: 'Veteriner Notları', meta: '12 Tem · 01:08' }];
  return (
    <View>
      <ScreenHeader {...props} />
      <View style={s.recordHeading}><View><Text style={[s.bigTitle, { color: c.text }]}>Ses Kayıtları</Text><Text style={[s.rowSub, { color: c.muted }]}>Anıları ve fikirleri yakala</Text></View><View style={[s.countBadge, { backgroundColor: `${feature.color}18` }]}><Text style={[s.countText, { color: feature.color }]}>3 KAYIT</Text></View></View>
      {recordings.map((item, index) => (
        <Pressable key={item.title} onPress={() => { setOpen(open === index ? -1 : index); onSound('play'); }} style={[s.recordCard, { backgroundColor: c.card, borderColor: open === index ? feature.color : c.line }]}>
          <View style={[s.recordIcon, { backgroundColor: `${feature.color}18` }]}><Ionicons name={open === index ? 'pause' : 'play'} size={20} color={feature.color} /></View>
          <View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: c.text }]}>{item.title}</Text><Text style={[s.rowSub, { color: c.muted }]}>{item.meta}</Text>{open === index ? <View><Waveform color={feature.color} /><Text style={[s.transcript, { color: c.muted }]}>“Bugünkü önemli notları Lumina otomatik olarak metne dönüştürdü...”</Text></View> : null}</View>
        </Pressable>
      ))}
      <Pressable onPress={() => setRecording(!recording)} style={[s.recordMain, { backgroundColor: recording ? '#E34F64' : feature.color }]}><Ionicons name={recording ? 'stop' : 'mic'} size={30} color="#fff" /></Pressable>
      <Text style={[s.recordStatus, { color: recording ? '#E34F64' : c.muted }]}>{recording ? 'Kayıt sürüyor · 00:08' : 'Yeni kayıt için dokun'}</Text>
    </View>
  );
}

function StepsScreen(props: Props) {
  const { c, feature } = props;
  const bars = [45, 62, 78, 52, 90, 70, 84];
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#DFF8F1', '#E4F8FF']} style={s.stepsHero}>
        <View style={[s.stepRing, { borderColor: `${feature.color}30` }]}><View style={[s.stepRingInner, { borderColor: feature.color }]}><Ionicons name="footsteps" size={26} color={feature.color} /><Text style={[s.stepCount, { color: '#17343B' }]}>8.432</Text><Text style={s.stepGoal}>10.000 hedef</Text></View></View>
      </LinearGradient>
      <View style={s.statGrid}>{[['navigate', '6,4 km', 'Mesafe'], ['flame', '326', 'Kalori'], ['time', '1s 18dk', 'Süre']].map(([icon, value, label]) => <Card key={label} c={c} style={s.statCard}><Ionicons name={icon as IconName} size={20} color={feature.color} /><Text style={[s.statValue, { color: c.text }]}>{value}</Text><Text style={[s.statLabel, { color: c.muted }]}>{label}</Text></Card>)}</View>
      <Card c={c}>
        <Text style={[s.sectionTitle, { color: c.text }]}>Haftalık istikrar</Text>
        <View style={s.chart}>{bars.map((height, index) => <View key={index} style={s.chartColumn}><View style={[s.chartBar, { height, backgroundColor: index === 6 ? feature.color : `${feature.color}45` }]} /><Text style={[s.chartLabel, { color: c.muted }]}>{['P', 'S', 'Ç', 'P', 'C', 'C', 'P'][index]}</Text></View>)}</View>
      </Card>
    </View>
  );
}

function WeatherScreen(props: Props) {
  const { c, feature, onToast } = props;
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={['#56B9F4', '#7A8FE8']} style={s.weatherHero}>
        <View><Text style={s.weatherCity}>İstanbul</Text><Text style={s.weatherDegree}>24°</Text><Text style={s.weatherDesc}>Açık · Hissedilen 25°</Text></View><Ionicons name="partly-sunny" size={88} color="#fff" />
      </LinearGradient>
      <Pressable onPress={() => onToast('Öneri pet rutinine eklendi')}><Card c={c} style={s.aiWeather}><View style={[s.aiIcon, { backgroundColor: `${feature.color}18` }]}><Ionicons name="sparkles" size={22} color={feature.color} /></View><View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: c.text }]}>Lumina öneriyor</Text><Text style={[s.rowSub, { color: c.muted }]}>16:00 sonrası serinleyecek. Milo ile yürüyüş için harika.</Text></View><Ionicons name="add-circle" size={22} color={feature.color} /></Card></Pressable>
      <Text style={[s.sectionTitle, { color: c.text }]}>Saatlik</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.forecastRow}>{['Şimdi', '17:00', '18:00', '19:00', '20:00'].map((time, index) => <Card key={time} c={c} style={s.forecastCard}><Text style={[s.forecastTime, { color: c.muted }]}>{time}</Text><Ionicons name={index > 2 ? 'cloud-outline' : 'sunny-outline'} size={23} color={feature.color} /><Text style={[s.forecastTemp, { color: c.text }]}>{24 - index}°</Text></Card>)}</ScrollView>
    </View>
  );
}

function RemindersScreen(props: Props) {
  const { c, feature, onToast, onSound } = props;
  const [items, setItems] = useState([{ title: "Milo'nun maması", time: '18:00', done: false }, { title: 'Veteriner kontrolü', time: 'Yarın · 10:30', done: false }, { title: 'Haftalık plan', time: 'Pazar · 20:00', done: true }]);
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={[feature.color, '#F2A13E']} style={s.nextCard}><Text style={s.nextEyebrow}>SIRADAKİ ETKİNLİK</Text><Text style={s.nextTitle}>Milo'nun maması</Text><Text style={s.nextTime}>Bugün · 18:00 · 1 saat 12 dakika kaldı</Text><Ionicons name="notifications" size={48} color="rgba(255,255,255,.6)" style={s.nextIcon} /></LinearGradient>
      <View style={s.sectionRow}><Text style={[s.sectionTitle, { color: c.text }]}>Tüm planlar</Text><Pressable onPress={() => { setItems([...items, { title: 'Yeni sesli hatırlatıcı', time: 'Bugün · 21:00', done: false }]); onToast('Hatırlatıcı eklendi'); onSound('tap'); }} style={[s.addButton, { backgroundColor: feature.color }]}><Ionicons name="mic" size={18} color="#fff" /></Pressable></View>
      <Card c={c} style={{ paddingHorizontal: 14 }}>
        {items.map((item, index) => (
          <Pressable key={`${item.title}-${index}`} onPress={() => setItems(items.map((row, i) => i === index ? { ...row, done: !row.done } : row))} style={[s.reminderRow, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[s.checkCircle, { backgroundColor: item.done ? feature.color : c.input }]}>{item.done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}</View>
            <View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: item.done ? c.muted : c.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>{item.title}</Text><Text style={[s.rowSub, { color: c.muted }]}>{item.time}</Text></View>
            <Ionicons name="ellipsis-horizontal" size={18} color={c.muted} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

function NotesScreen(props: Props) {
  const { c, feature, onToast, onSound } = props;
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState(['Milo için yeni oyun fikirleri', 'Alışveriş listesi: mama, ödül, pil']);
  const add = () => {
    if (!note.trim()) return;
    setNotes([note.trim(), ...notes]); setNote(''); onToast('Not kaydedildi'); onSound('tap');
  };
  return (
    <View>
      <ScreenHeader {...props} />
      <Card c={c} style={s.noteComposer}><TextInput value={note} onChangeText={setNote} multiline placeholder="Bir fikir yaz veya sesle ekle..." placeholderTextColor={c.muted} style={[s.noteInput, { color: c.text }]} /><View style={s.noteActions}><Pressable onPress={() => onToast('Sesli not dinleniyor')} style={[s.noteMic, { backgroundColor: `${feature.color}18` }]}><Ionicons name="mic" size={20} color={feature.color} /></Pressable><Pressable onPress={add} style={[s.noteSave, { backgroundColor: feature.color }]}><Text style={s.actionText}>Kaydet</Text></Pressable></View></Card>
      <Text style={[s.sectionTitle, { color: c.text }]}>Son notlar</Text>
      {notes.map((item, index) => <Card key={`${item}-${index}`} c={c} style={s.noteCard}><View style={[s.noteIcon, { backgroundColor: `${feature.color}18` }]}><Ionicons name="document-text" size={20} color={feature.color} /></View><View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: c.text }]}>{item}</Text><Text style={[s.rowSub, { color: c.muted }]}>Bugün · Lumina ile senkronize</Text></View></Card>)}
    </View>
  );
}

function GenericScreen(props: Props) {
  const { c, feature, onToast, onRobotExpression } = props;
  const [active, setActive] = useState(true);
  return (
    <View>
      <ScreenHeader {...props} />
      <LinearGradient colors={[`${feature.color}E8`, feature.color]} style={s.genericHero}><View style={s.genericIcon}><Ionicons name={feature.icon} size={42} color="#fff" /></View><Text style={s.genericTitle}>{feature.headline}</Text><Text style={s.genericSub}>{feature.sample}</Text></LinearGradient>
      <Card c={c} style={s.statusCard}><View><Text style={[s.rowTitle, { color: c.text }]}>Özellik durumu</Text><Text style={[s.rowSub, { color: c.muted }]}>{active ? 'Robotla senkronize ve hazır' : 'Şu anda kapalı'}</Text></View><Switch value={active} onValueChange={setActive} trackColor={{ false: '#C8D3D7', true: feature.color }} thumbColor="#fff" /></Card>
      <Pressable onPress={() => { onToast(`${feature.action} başlatıldı`); onRobotExpression('sparkle'); }} style={[s.fullAction, { backgroundColor: feature.color }]}><Ionicons name={feature.icon} size={20} color="#fff" /><Text style={s.actionText}>{feature.action}</Text></Pressable>
    </View>
  );
}

export function FeatureExperience(props: Props) {
  const title = props.feature.title;
  if (title === 'Lumina AI') return <ChatScreen {...props} />;
  if (title === 'Müzik kutusu') return <MusicScreen {...props} />;
  if (title === 'Çevirmen') return <TranslatorScreen {...props} />;
  if (title === 'Saat & alarm') return <AlarmScreen {...props} />;
  if (title === 'Mini oyunlar') return <GamesScreen {...props} />;
  if (title === 'Telefon') return <PhoneScreen {...props} />;
  if (title === 'IoT merkezi') return <DeviceScreen {...props} />;
  if (title === 'Akıllı lamba') return <LampScreen {...props} />;
  if (title === 'Akıllı ayna') return <MirrorScreen {...props} />;
  if (title === 'Ses kaydı') return <RecordingsScreen {...props} />;
  if (title === 'Adım sayar') return <StepsScreen {...props} />;
  if (title === 'Hava durumu') return <WeatherScreen {...props} />;
  if (title === 'Hatırlatıcı') return <RemindersScreen {...props} />;
  if (title === 'Not defteri') return <NotesScreen {...props} />;
  return <GenericScreen {...props} />;
}

const s = StyleSheet.create({
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 18 },
  roundButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 10.5, marginTop: 2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 99 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineLabel: { fontSize: 7.5, fontWeight: '900', letterSpacing: .7 },
  card: { borderWidth: 1, borderRadius: 24, padding: 16, marginBottom: 15 },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginBottom: 13, letterSpacing: -.3 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  body: { fontSize: 12.5, lineHeight: 19 },
  rowTitle: { fontSize: 13, fontWeight: '800' },
  rowSub: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  microText: { fontSize: 8.5, fontWeight: '700' },
  pill: { flex: 1, minHeight: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  pillText: { fontSize: 10.5, fontWeight: '800' },
  historyButton: { alignSelf: 'flex-start', height: 38, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  historyText: { fontSize: 10.5, fontWeight: '800' },
  drawer: { padding: 13 },
  drawerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniAction: { flexDirection: 'row', gap: 4, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center' },
  miniActionText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  historyRow: { minHeight: 42, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  datePill: { alignSelf: 'center', marginVertical: 7 },
  messageWrap: { marginBottom: 15, alignItems: 'flex-start' },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  senderAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sender: { fontSize: 9.5, fontWeight: '800' },
  messageCard: { width: '92%', padding: 13, marginBottom: 0 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  playSmall: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  waveform: { flex: 1, height: 27, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  waveBar: { width: 3, borderRadius: 4 },
  composer: { minHeight: 62, padding: 8, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  composerInput: { flex: 1, fontSize: 12, paddingHorizontal: 9 },
  sendButton: { width: 45, height: 45, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  musicHero: { borderRadius: 31, padding: 22, alignItems: 'center', marginBottom: 24 },
  albumArt: { width: 130, height: 130, borderRadius: 35, backgroundColor: 'rgba(255,255,255,.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  musicEyebrow: { color: 'rgba(255,255,255,.65)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  musicTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 5 },
  musicArtist: { color: 'rgba(255,255,255,.75)', fontSize: 10.5, marginTop: 4 },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,.22)', borderRadius: 4, marginTop: 20 },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 4 },
  playerControls: { width: 190, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17 },
  playMain: { width: 57, height: 57, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  trackRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
  trackIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languagePicker: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  swapButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  translationBubble: { minHeight: 134, borderWidth: 1, borderRadius: 25, padding: 16, marginBottom: 12 },
  translationLang: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  translationInput: { minHeight: 65, fontSize: 16, lineHeight: 23, marginTop: 8, paddingRight: 45 },
  translationResult: { fontSize: 16, lineHeight: 23, marginTop: 15 },
  speakerButton: { position: 'absolute', right: 14, bottom: 14, width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  translateButton: { height: 48, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  actionText: { color: '#fff', fontSize: 12.5, fontWeight: '900' },
  dictionaryRow: { flexDirection: 'row', gap: 9 },
  dictionaryCard: { flex: 1, alignItems: 'center', padding: 12 },
  dictionaryLabel: { fontSize: 10.5, fontWeight: '800', marginTop: 7 },
  clockHero: { minHeight: 190, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  clock: { fontSize: 52, fontWeight: '900', letterSpacing: -2, marginTop: 4 },
  clockDate: { color: '#5F737B', fontSize: 11, textTransform: 'capitalize' },
  alarmTabs: { height: 50, borderRadius: 17, padding: 4, flexDirection: 'row', gap: 4, marginBottom: 20 },
  alarmTab: { flex: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  alarmTabText: { fontSize: 10.5, fontWeight: '900' },
  alarmSectionRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  alarmSectionTitle: { flex: 1, fontSize: 19, lineHeight: 25, fontWeight: '900', letterSpacing: -.3 },
  alarmAddButton: { minWidth: 112, height: 40, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  alarmAddText: { color: '#fff', fontSize: 10.5, fontWeight: '900' },
  alarmListCard: { paddingHorizontal: 14, paddingVertical: 2 },
  addButton: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  alarmRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alarmCopy: { flex: 1, minWidth: 0 },
  alarmSwitchWrap: { width: 58, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' },
  alarmTime: { fontSize: 25, fontWeight: '900' },
  alarmQuickRow: { flexDirection: 'row', gap: 9 },
  alarmQuickButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 7 },
  alarmQuickText: { fontSize: 9.5, fontWeight: '800' },
  timerCard: { minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: 20 },
  timerIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  timerValue: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, marginTop: 14 },
  timerPresetRow: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 20 },
  timerPreset: { flex: 1, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timerPresetText: { fontSize: 10.5, fontWeight: '800' },
  timerMainButton: { width: '100%', height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  gameHero: { borderRadius: 31, padding: 22, alignItems: 'center', marginBottom: 24 },
  dice: { width: 94, height: 94, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  diceText: { fontSize: 42, fontWeight: '900', color: '#7A5BE0' },
  gameTitle: { color: '#fff', fontSize: 25, fontWeight: '900', marginTop: 15 },
  gameSub: { color: 'rgba(255,255,255,.76)', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 5 },
  whiteAction: { height: 44, borderRadius: 15, backgroundColor: '#fff', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  whiteActionText: { color: '#7A5BE0', fontSize: 11.5, fontWeight: '900' },
  gameGrid: { flexDirection: 'row', gap: 11 },
  quickGame: { flex: 1, minHeight: 150, borderWidth: 1, borderRadius: 24, padding: 15 },
  gameIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickGameTitle: { fontSize: 13, fontWeight: '800', marginTop: 13 },
  quickGameResult: { fontSize: 11, fontWeight: '900', marginTop: 5 },
  search: { height: 51, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 12 },
  contactWrap: { paddingVertical: 7 },
  contactRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactAvatar: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  contactInitial: { fontSize: 17, fontWeight: '900' },
  contactActions: { flexDirection: 'row', gap: 8, marginLeft: 55, paddingBottom: 9 },
  contactAction: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  deviceSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  bigTitle: { fontSize: 27, fontWeight: '900', letterSpacing: -.7 },
  homeBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 15 },
  deviceCard: { width: '48%', minHeight: 146, borderWidth: 1.5, borderRadius: 25, padding: 15 },
  deviceIcon: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontSize: 12.5, fontWeight: '800', marginTop: 14 },
  deviceValue: { fontSize: 10.5, fontWeight: '800', marginTop: 5 },
  outlineAction: { height: 50, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  outlineActionText: { fontSize: 12, fontWeight: '800' },
  lampStage: { minHeight: 310, borderWidth: 1, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  lampGlow: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  brightness: { fontSize: 37, fontWeight: '900', marginTop: -12 },
  powerButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  levelRow: { height: 90, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 18 },
  levelBar: { width: 38, borderRadius: 12 },
  toneRow: { flexDirection: 'row', gap: 8 },
  mirror: { minHeight: 475, borderRadius: 31, padding: 17, justifyContent: 'space-between', marginBottom: 14, overflow: 'hidden' },
  mirrorTop: { flexDirection: 'row', justifyContent: 'space-between' },
  mirrorHello: { color: '#17343B', fontSize: 17, fontWeight: '900' },
  mirrorSub: { color: '#5F737B', fontSize: 10, marginTop: 3 },
  weatherMini: { flexDirection: 'row', gap: 5, backgroundColor: 'rgba(255,255,255,.65)', padding: 9, borderRadius: 15 },
  weatherMiniText: { color: '#17343B', fontWeight: '900' },
  faceScan: { alignItems: 'center', justifyContent: 'center' },
  scanDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#00D2FF' },
  analysisCard: { backgroundColor: 'rgba(255,255,255,.68)', borderRadius: 21, padding: 14 },
  analysisTitle: { color: '#17343B', fontSize: 12, fontWeight: '900', marginBottom: 8 },
  analysisLabel: { color: '#5F737B', fontSize: 9, marginTop: 5 },
  analysisTrack: { height: 5, backgroundColor: 'rgba(23,52,59,.1)', borderRadius: 4, marginTop: 4 },
  analysisFill: { height: 5, borderRadius: 4 },
  mirrorActions: { flexDirection: 'row', gap: 10 },
  mirrorAction: { flex: 1, minHeight: 85, borderWidth: 1, borderRadius: 21, padding: 13, justifyContent: 'space-between' },
  mirrorActionText: { fontSize: 10.5, fontWeight: '800' },
  recordHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  countBadge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  countText: { fontSize: 8, fontWeight: '900', letterSpacing: .6 },
  recordCard: { borderWidth: 1, borderRadius: 23, padding: 14, marginBottom: 11, flexDirection: 'row', gap: 11 },
  recordIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  transcript: { fontSize: 9.5, lineHeight: 15, marginTop: 6 },
  recordMain: { width: 72, height: 72, borderRadius: 36, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  recordStatus: { textAlign: 'center', fontSize: 10, fontWeight: '700', marginTop: 8 },
  stepsHero: { minHeight: 275, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  stepRing: { width: 210, height: 210, borderRadius: 105, borderWidth: 15, alignItems: 'center', justifyContent: 'center' },
  stepRingInner: { width: 174, height: 174, borderRadius: 87, borderWidth: 4, borderTopColor: 'transparent', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }] },
  stepCount: { fontSize: 31, fontWeight: '900', marginTop: 6 },
  stepGoal: { color: '#5F737B', fontSize: 9.5 },
  statGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 11 },
  statValue: { fontSize: 13, fontWeight: '900', marginTop: 5 },
  statLabel: { fontSize: 8.5, marginTop: 2 },
  chart: { height: 125, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 5 },
  chartColumn: { alignItems: 'center', gap: 5 },
  chartBar: { width: 20, borderRadius: 7 },
  chartLabel: { fontSize: 8 },
  weatherHero: { minHeight: 220, borderRadius: 31, padding: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weatherCity: { color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: '700' },
  weatherDegree: { color: '#fff', fontSize: 58, fontWeight: '900', letterSpacing: -3 },
  weatherDesc: { color: 'rgba(255,255,255,.78)', fontSize: 10.5 },
  aiWeather: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  aiIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  forecastRow: { gap: 8, paddingRight: 16 },
  forecastCard: { width: 72, alignItems: 'center', padding: 11 },
  forecastTime: { fontSize: 8.5 },
  forecastTemp: { fontSize: 13, fontWeight: '900', marginTop: 3 },
  nextCard: { minHeight: 180, borderRadius: 29, padding: 20, justifyContent: 'flex-end', marginBottom: 20, overflow: 'hidden' },
  nextEyebrow: { color: 'rgba(255,255,255,.7)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  nextTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 5 },
  nextTime: { color: 'rgba(255,255,255,.78)', fontSize: 10, marginTop: 4 },
  nextIcon: { position: 'absolute', right: 22, top: 22 },
  reminderRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkCircle: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  noteComposer: { minHeight: 160 },
  noteInput: { minHeight: 85, fontSize: 13, textAlignVertical: 'top' },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  noteMic: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  noteSave: { height: 42, borderRadius: 14, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  noteIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  genericHero: { minHeight: 245, borderRadius: 31, padding: 22, justifyContent: 'flex-end', marginBottom: 15 },
  genericIcon: { width: 68, height: 68, borderRadius: 23, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  genericTitle: { color: '#fff', fontSize: 25, fontWeight: '900' },
  genericSub: { color: 'rgba(255,255,255,.78)', fontSize: 11, marginTop: 6 },
  statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fullAction: { height: 53, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
