import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FeatureExperience } from './FeatureExperiences';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'features' | 'modes' | 'pet' | 'settings';
type Theme = 'light' | 'dark';
type PetProfile = { connected: boolean; name: string };
type PetExpression = 'blink' | 'curious' | 'sparkle' | 'sleepy' | 'love' | 'excited' | 'shy' | 'focused' | 'cheerful' | 'calm';
type PetMotion = 'still' | 'soft' | 'dance' | 'bounce' | 'sway' | 'pulse';
type AmbientSound = 'none' | 'rain' | 'fire';
type PetStats = { happiness: number; energy: number; battery: number };
type AppPreferences = {
  notifications: boolean;
  autoConnect: boolean;
  haptics: boolean;
  appSounds: boolean;
  reduceMotion: boolean;
  language: 'Türkçe' | 'English';
};

type Feature = {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  headline: string;
  sample: string;
  action: string;
};

const expressionVisuals: Record<PetExpression, { label: string; icon: IconName; color: string }> = {
  blink: { label: 'NEŞELİ', icon: 'happy', color: '#00A8CA' },
  curious: { label: 'MERAKLI', icon: 'search', color: '#7C5CE5' },
  sparkle: { label: 'PARILTI', icon: 'sparkles', color: '#A45DE1' },
  sleepy: { label: 'UYKULU', icon: 'moon', color: '#5367B8' },
  love: { label: 'SEVGİ DOLU', icon: 'heart', color: '#E65C87' },
  excited: { label: 'HEYECANLI', icon: 'flash', color: '#EF9737' },
  shy: { label: 'UTANGAÇ', icon: 'flower', color: '#D66BAA' },
  focused: { label: 'ODAKLI', icon: 'scan', color: '#258E9C' },
  cheerful: { label: 'KAHKAHA', icon: 'happy-outline', color: '#21A978' },
  calm: { label: 'HUZURLU', icon: 'leaf', color: '#4C9B76' },
};

const featureData: Feature[] = [
  { title: 'Lumina AI', subtitle: 'Her konuda yanında', icon: 'sparkles', color: '#00BDE8', headline: 'Aklındaki her şeyi sor', sample: 'Bugünkü planını hazırlamaya hazırım.', action: 'Sohbeti başlat' },
  { title: 'Çevirmen', subtitle: 'Anında 40+ dil', icon: 'language', color: '#7C5CE5', headline: 'Konuş, anında çevireyim', sample: '“Günaydın” → “Good morning”', action: 'Çevirmeye başla' },
  { title: 'Müzik kutusu', subtitle: 'Ruh haline göre', icon: 'musical-notes', color: '#FF709D', headline: 'Milo ile ritmi yakala', sample: 'Şu an: Morning Energy Mix', action: 'Müziği oynat' },
  { title: 'Not defteri', subtitle: 'Sesli not & bağlantı', icon: 'mic', color: '#F29B38', headline: 'Söyle, senin için kaydedeyim', sample: '3 not bugün seni bekliyor.', action: 'Yeni sesli not' },
  { title: 'Saat & alarm', subtitle: 'Akıllı rutinler', icon: 'alarm', color: '#4D8CF5', headline: 'Rutinlerin hep zamanında', sample: 'Sonraki alarm: 07:30 · Hafta içi', action: 'Alarm oluştur' },
  { title: 'Telefon', subtitle: 'Eller serbest konuş', icon: 'call', color: '#22B98A', headline: 'Sevdiklerin bir komut uzakta', sample: 'Favori kişiler aramaya hazır.', action: 'Kişi seç' },
  { title: 'Akıllı lamba', subtitle: 'Ortamını aydınlat', icon: 'bulb', color: '#F1B830', headline: 'Işığı ruh haline uyarla', sample: 'Salon · %65 · Sıcak beyaz', action: 'Lambayı yönet' },
  { title: 'IoT merkezi', subtitle: 'Evin tek dokunuşta', icon: 'home', color: '#00A7A5', headline: 'Akıllı evin tek merkezde', sample: '5 cihaz çevrimiçi ve hazır.', action: 'Cihazları aç' },
  { title: 'Mini oyunlar', subtitle: 'Birlikte eğlenin', icon: 'game-controller', color: '#8E65EA', headline: 'Milo sana meydan okuyor', sample: 'Bugünün oyunu: Renk Avı', action: 'Oyuna başla' },
  { title: 'Akıllı ayna', subtitle: 'Güne iyi başla', icon: 'scan-circle', color: '#EE6A9A', headline: 'Günün özeti karşında', sample: 'Takvim, hava ve bakım önerileri hazır.', action: 'Aynayı aç' },
  { title: 'Hatırlatıcı', subtitle: 'Hiçbir şeyi unutma', icon: 'notifications', color: '#EF7B45', headline: 'Doğru anda yanında', sample: '18:00 · Milo’nun şarjını kontrol et', action: 'Hatırlatıcı ekle' },
  { title: 'Hava durumu', subtitle: 'Bugün 24° · Açık', icon: 'partly-sunny', color: '#4D9AE8', headline: 'Bugünün havası: 24°', sample: 'İstanbul · Açık · Yağış olasılığı %10', action: 'Haftalık tahmin' },
  { title: 'Ses kaydı', subtitle: 'Anıları yakala', icon: 'radio', color: '#DB597E', headline: 'Önemli anları yakala', sample: 'Son kayıt: Bugün · 00:42', action: 'Kaydı başlat' },
  { title: 'Adım sayar', subtitle: 'Bugün 6.240 adım', icon: 'footsteps', color: '#28B97A', headline: 'Hedefin %78’i tamam', sample: '6.240 / 8.000 adım · 4,7 km', action: 'Aktiviteyi gör' },
];

const modeData: { title: string; desc: string; icon: IconName; colors: [string, string]; badge?: string }[] = [
  { title: 'Pet modu', desc: 'Oyun, bakım ve duygusal bağ', icon: 'paw', colors: ['#00B7D7', '#397BE8'], badge: 'AKTİF' },
  { title: 'Asistan modu', desc: 'Planla, sor ve üretken kal', icon: 'sparkles', colors: ['#7255D9', '#9B6DE7'] },
  { title: 'Atmosfer modu', desc: 'Yağmur, şömine ve odak sesleri', icon: 'flame', colors: ['#D36A38', '#7D4DAD'], badge: 'SES' },
  { title: 'Çocuk modu', desc: 'Çocuklar için güvenli ve sade alan', icon: 'shield-checkmark', colors: ['#E98E35', '#DE5E82'] },
];

type ModeItem = (typeof modeData)[number];

const tabs: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'features', label: 'Özellikler', icon: 'apps' },
  { key: 'modes', label: 'Modlar', icon: 'compass' },
  { key: 'pet', label: 'Petim', icon: 'paw' },
  { key: 'settings', label: 'Hesabım', icon: 'person-circle' },
];

const light = { bg: '#F4F8FA', card: 'rgba(255,255,255,0.82)', cardSolid: '#FFFFFF', text: '#172126', muted: '#68777D', line: 'rgba(108,121,127,0.14)', nav: 'rgba(252,254,255,0.94)', input: '#EDF3F5', cyanSoft: '#DDF8FF' };
const dark = { bg: '#071116', card: 'rgba(17,31,38,0.94)', cardSolid: '#102129', text: '#F3FAFC', muted: '#8FA8B2', line: 'rgba(129,205,226,0.13)', nav: 'rgba(8,22,28,0.97)', input: '#192D35', cyanSoft: '#0B3541' };

function GlassCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.98 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={style}>{children}</View>;
}

function PetFace({ size = 124, eyeColor = '#17353E', expression = 'blink', motion = 'soft' }: { size?: number; eyeColor?: string; expression?: PetExpression; motion?: PetMotion }) {
  const floatValue = useRef(new Animated.Value(0)).current;
  const blinkValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = motion === 'bounce' ? 12 : motion === 'dance' ? 8 : motion === 'pulse' || motion === 'sway' ? 4 : motion === 'soft' ? 3 : 0;
    const duration = motion === 'bounce' ? 430 : motion === 'dance' ? 260 : motion === 'sway' ? 680 : motion === 'pulse' ? 820 : 1200;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, { toValue: distance, duration, useNativeDriver: true }),
        Animated.timing(floatValue, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    if (motion !== 'still') animation.start();
    return () => animation.stop();
  }, [floatValue, motion]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(expression === 'curious' ? 1200 : 2200),
        Animated.timing(blinkValue, { toValue: 1, duration: 90, useNativeDriver: false }),
        Animated.timing(blinkValue, { toValue: 0, duration: 110, useNativeDriver: false }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [blinkValue, expression]);

  const baseEyeHeight = expression === 'sleepy' ? 8 : expression === 'calm' ? 12 : expression === 'excited' ? 26 : expression === 'shy' ? 17 : 22;
  const eyeHeight = blinkValue.interpolate({ inputRange: [0, 1], outputRange: [baseEyeHeight, 3] });
  const motionDistance = motion === 'bounce' ? 12 : motion === 'dance' ? 8 : 4;
  const rotate = motion === 'dance' || motion === 'sway'
    ? floatValue.interpolate({ inputRange: [0, motionDistance], outputRange: [motion === 'sway' ? '-7deg' : '-3deg', motion === 'sway' ? '7deg' : '3deg'] })
    : '0deg';
  const scale = motion === 'pulse'
    ? floatValue.interpolate({ inputRange: [0, 4], outputRange: [1, 1.055] })
    : 1;

  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: floatValue }, { rotate }, { scale }] }}>
      <View style={[styles.ear, { left: size * 0.12, transform: [{ rotate: '-22deg' }], width: size * 0.34, height: size * 0.4 }]} />
      <View style={[styles.ear, { right: size * 0.12, transform: [{ rotate: '22deg' }], width: size * 0.34, height: size * 0.4 }]} />
      <LinearGradient colors={['#F2FBFF', '#BDEFFF']} style={[styles.petHead, { width: size * 0.78, height: size * 0.68, borderRadius: size * 0.3 }]}>
        {expression === 'love' ? (
          <View style={styles.eyeRow}>
            <Ionicons name="heart" size={24} color={eyeColor} />
            <Ionicons name="heart" size={24} color={eyeColor} />
          </View>
        ) : expression === 'cheerful' ? (
          <View style={styles.eyeRow}>
            <View style={[styles.cheerfulEye, { borderColor: eyeColor }]} />
            <View style={[styles.cheerfulEye, { borderColor: eyeColor }]} />
          </View>
        ) : (
          <View style={styles.eyeRow}>
            <Animated.View style={[styles.eye, { backgroundColor: eyeColor, height: eyeHeight, transform: [{ rotate: expression === 'focused' ? '8deg' : expression === 'shy' ? '-5deg' : '0deg' }] }]}>
              <View style={[styles.eyeGlint, expression === 'shy' && { alignSelf: 'flex-start' }]} />
            </Animated.View>
            <Animated.View style={[styles.eye, { backgroundColor: eyeColor, height: expression === 'curious' ? 15 : eyeHeight, transform: [{ rotate: expression === 'curious' || expression === 'focused' ? '-8deg' : expression === 'shy' ? '5deg' : '0deg' }] }]}>
              <View style={styles.eyeGlint} />
            </Animated.View>
          </View>
        )}
        <View style={[styles.mouth, expression === 'sleepy' && styles.sleepyMouth, expression === 'excited' && styles.excitedMouth]}>
          <View style={styles.tongue} />
        </View>
        {expression === 'sparkle' || expression === 'excited' ? (
          <View style={styles.sparkleBadge}>
            <Ionicons name="sparkles" size={12} color="#8B62E8" />
          </View>
        ) : null}
      </LinearGradient>
      <View style={[styles.petGlow, { width: size * 0.7, height: size * 0.15 }]} />
    </Animated.View>
  );
}

function PetMoodAura({ color, expression }: { color: string; expression: PetExpression }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const visual = expressionVisuals[expression];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: expression === 'excited' ? 700 : 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: expression === 'excited' ? 700 : 1500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [expression, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.16] });
  return (
    <View pointerEvents="none" style={styles.petAuraWrap}>
      <Animated.View style={[styles.petAuraOuter, { borderColor: `${visual.color}55`, opacity, transform: [{ scale }] }]} />
      <View style={[styles.petAuraMiddle, { borderColor: `${color}42`, backgroundColor: `${color}0B` }]} />
      <LinearGradient colors={[`${visual.color}1C`, `${color}10`, 'rgba(255,255,255,0)']} style={styles.petAuraCore} />
      <View style={[styles.petAuraSpark, styles.petAuraSparkOne, { backgroundColor: visual.color }]} />
      <View style={[styles.petAuraSpark, styles.petAuraSparkTwo, { backgroundColor: color }]} />
    </View>
  );
}

function MiniPetGlyph({ selected = false, size = 24 }: { selected?: boolean; size?: number }) {
  const head = selected ? '#FFFFFF' : '#DDF7FF';
  const detail = selected ? '#087DA9' : '#168FB9';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.miniPetEar, { width: size * 0.34, height: size * 0.34, left: size * 0.08, backgroundColor: head }]} />
      <View style={[styles.miniPetEar, styles.miniPetEarRight, { width: size * 0.34, height: size * 0.34, right: size * 0.08, backgroundColor: head }]} />
      <View style={[styles.miniPetHead, { width: size * 0.82, height: size * 0.68, borderRadius: size * 0.28, backgroundColor: head }]}>
        <View style={[styles.miniPetEye, { backgroundColor: detail }]} />
        <View style={[styles.miniPetEye, { backgroundColor: detail }]} />
      </View>
    </View>
  );
}

function NavGlyph({ item, selected, dark = false, size = 22 }: { item: typeof tabs[number]; selected: boolean; dark?: boolean; size?: number }) {
  if (item.key === 'pet') return <MiniPetGlyph selected={selected} size={size + 2} />;
  return <Ionicons name={selected ? item.icon : `${item.icon}-outline` as IconName} size={size} color={selected ? '#fff' : dark ? '#B9D3DE' : '#688493'} />;
}

function ThemeButton({ c, theme, toggleTheme }: { c: typeof light; theme: Theme; toggleTheme: () => void }) {
  return (
    <Pressable onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: c.card }]}>
      <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color={c.text} />
    </Pressable>
  );
}

function Login({ onDone, theme, toggleTheme }: { onDone: () => void; theme: Theme; toggleTheme: () => void }) {
  const c = theme === 'dark' ? dark : light;
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
        <View style={styles.authTop}>
          <View style={styles.logoMark}>
            <Ionicons name="paw" size={20} color="#fff" />
          </View>
          <Text style={[styles.brand, { color: c.text }]}>Lumina</Text>
          <ThemeButton c={c} theme={theme} toggleTheme={toggleTheme} />
        </View>
        <View style={styles.authPet}>
          <PetFace size={150} />
          <View style={[styles.helloBubble, { backgroundColor: c.cardSolid }]}>
            <Text style={{ fontSize: 20 }}>👋</Text>
            <Text style={[styles.helloText, { color: c.text }]}>Merhaba!</Text>
          </View>
        </View>
        <View style={styles.authHeading}>
          <Text style={[styles.authTitle, { color: c.text }]}>{forgot ? 'Şifreni yenile' : 'Dostun seni bekliyor'}</Text>
          <Text style={[styles.authSubtitle, { color: c.muted }]}>{forgot ? 'E-posta adresine yenileme bağlantısı gönderelim.' : 'Lumina ile daha akıllı, daha eğlenceli bir güne başla.'}</Text>
        </View>
        <View style={[styles.authCard, { backgroundColor: c.card, borderColor: theme === 'dark' ? c.line : '#fff' }]}>
          <View style={[styles.inputWrap, { backgroundColor: c.input }]}>
            <Ionicons name="mail-outline" size={20} color={c.muted} />
            <TextInput value={email} onChangeText={setEmail} placeholder="E-posta adresi" placeholderTextColor={c.muted} autoCapitalize="none" style={[styles.input, { color: c.text }]} />
          </View>
          {!forgot ? (
            <View style={[styles.inputWrap, { backgroundColor: c.input }]}>
              <Ionicons name="lock-closed-outline" size={20} color={c.muted} />
              <TextInput value={password} onChangeText={setPassword} placeholder="Şifre" placeholderTextColor={c.muted} secureTextEntry={!show} style={[styles.input, { color: c.text }]} />
              <Pressable onPress={() => setShow(!show)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.muted} />
              </Pressable>
            </View>
          ) : null}
          {!forgot ? (
            <Pressable onPress={() => setForgot(true)}>
              <Text style={styles.forgot}>Şifremi unuttum</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={forgot ? () => setForgot(false) : onDone}>
            <LinearGradient colors={['#00D2FF', '#0089B7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{forgot ? 'Bağlantı gönder' : 'Giriş yap'}</Text>
              <Ionicons name="arrow-forward" size={19} color="#fff" />
            </LinearGradient>
          </Pressable>
          {forgot ? (
            <Pressable onPress={() => setForgot(false)}>
              <Text style={[styles.backLogin, { color: c.muted }]}>Giriş ekranına dön</Text>
            </Pressable>
          ) : (
            <View>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: c.line }]} />
                <Text style={[styles.orText, { color: c.muted }]}>veya</Text>
                <View style={[styles.dividerLine, { backgroundColor: c.line }]} />
              </View>
              <View style={styles.socialRow}>
                <Pressable onPress={onDone} style={[styles.socialButton, { backgroundColor: c.cardSolid, borderColor: c.line }]}>
                  <Ionicons name="logo-apple" size={23} color={c.text} />
                  <Text style={[styles.socialText, { color: c.text }]}>Apple</Text>
                </Pressable>
                <Pressable onPress={onDone} style={[styles.socialButton, { backgroundColor: c.cardSolid, borderColor: c.line }]}>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={[styles.socialText, { color: c.text }]}>Google</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        <Text style={[styles.signup, { color: c.muted }]}>Hesabın yok mu? <Text style={{ color: '#008FAE', fontWeight: '700' }}>Hemen kaydol</Text></Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PetConnect({ theme, toggleTheme, onContinue }: { theme: Theme; toggleTheme: () => void; onContinue: (pet: PetProfile) => void }) {
  const c = theme === 'dark' ? dark : light;
  const [connected, setConnected] = useState(false);
  const [searching, setSearching] = useState(false);

  const connect = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setConnected(true);
    }, 700);
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={styles.connectTop}>
        <View style={styles.logoMark}>
          <Ionicons name="paw" size={20} color="#fff" />
        </View>
        <Text style={[styles.brand, { color: c.text }]}>Lumina</Text>
        <ThemeButton c={c} theme={theme} toggleTheme={toggleTheme} />
      </View>
      <View style={styles.connectBody}>
        <Text style={[styles.connectEyebrow, { color: connected ? '#15926B' : '#0089A8' }]}>{connected ? 'PETİN HAZIR' : 'PET BAĞLANTISI'}</Text>
        <Text style={[styles.connectTitle, { color: c.text }]}>{connected ? 'Milo seni buldu!' : 'Önce dostunu bulalım'}</Text>
        <Text style={[styles.connectSubtitle, { color: c.muted }]}>{connected ? 'Petin hesabına bağlandı. Bundan sonra tüm kişiselleştirmeler Milo’ya uygulanacak.' : 'Yakındaki Lumina Pet’i bağla veya uygulamayı temsili pet ile keşfet.'}</Text>
        <View style={[styles.connectVisual, { backgroundColor: c.card, borderColor: connected ? 'rgba(20,200,132,.35)' : c.line }]}>
          <View style={styles.connectRings} />
          <PetFace size={220} motion={connected ? 'dance' : 'soft'} />
          <View style={[styles.connectionPill, { backgroundColor: connected ? '#E0F9EF' : c.input }]}>
            <View style={[styles.connectionDot, { backgroundColor: connected ? '#16BE83' : '#F1A343' }]} />
            <Text style={[styles.connectionText, { color: connected ? '#147657' : c.muted }]}>{connected ? 'Milo · Bağlı · Pil %82' : searching ? 'Yakındaki pet aranıyor…' : 'Henüz bir pet bağlı değil'}</Text>
          </View>
        </View>
        {connected ? (
          <Pressable onPress={() => onContinue({ connected: true, name: 'Milo' })} style={styles.connectPrimary}>
            <Text style={styles.connectPrimaryText}>Milo ile devam et</Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.connectActions}>
            <Pressable onPress={connect} disabled={searching} style={[styles.connectPrimary, searching && { opacity: 0.65 }]}>
              <Ionicons name="bluetooth" size={19} color="#fff" />
              <Text style={styles.connectPrimaryText}>{searching ? 'Pet aranıyor…' : 'Petimi bul ve bağla'}</Text>
            </Pressable>
            <Pressable onPress={() => onContinue({ connected: false, name: 'Lumi' })} style={[styles.connectSecondary, { borderColor: c.line }]}>
              <Text style={[styles.connectSecondaryText, { color: c.text }]}>Temsili pet ile devam et</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Header({ c, theme, toggleTheme, pet, onAccount }: { c: typeof light; theme: Theme; toggleTheme: () => void; pet: PetProfile; onAccount: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={[styles.greeting, { color: c.muted }]}>Günaydın, Berkay</Text>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>Bugün ne yapalım?</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={toggleTheme} hitSlop={8} accessibilityRole="button" accessibilityLabel="Temayı değiştir" style={[styles.iconButton, { backgroundColor: c.card }]}>
          <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color={c.text} />
        </Pressable>
        <Pressable onPress={onAccount} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hesabım ve ayarlar" style={({ pressed }) => [styles.avatar, { backgroundColor: c.cyanSoft }, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Ionicons name="person" size={21} color="#008BAA" />
          <View style={[styles.onlineDot, !pet.connected && { backgroundColor: '#F1A343' }]} />
        </Pressable>
      </View>
    </View>
  );
}

function Features({ c, wide, onSelect }: { c: typeof light; wide: boolean; onSelect: (feature: Feature) => void }) {
  return (
    <View>
      <View style={styles.hero}>
        <LinearGradient colors={['#D9F8FF', '#F0E9FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
          <View style={styles.heroCopy}>
            <View style={styles.onlineChip}>
              <View style={styles.pulseDot} />
              <Text style={styles.onlineText}>LUMINA ÇEVRİMİÇİ</Text>
            </View>
            <Text style={styles.heroTitle}>Merhaba! Nasıl yardımcı olabilirim?</Text>
            <Pressable onPress={() => onSelect(featureData[0])} style={styles.talkButton}>
              <Ionicons name="mic" size={20} color="#fff" />
              <Text style={styles.talkText}>Benimle konuş</Text>
            </Pressable>
          </View>
          <PetFace size={wide ? 150 : 112} />
        </LinearGradient>
      </View>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Tüm özellikler</Text>
        <Text style={[styles.sectionMeta, { color: c.muted }]}>14 araç</Text>
      </View>
      <View style={styles.featureGrid}>
        {featureData.map((item) => (
          <GlassCard key={item.title} onPress={() => onSelect(item)} style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.line, width: wide ? '31.8%' : '48.1%' }]}>
            <View style={[styles.featureIcon, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={25} color={item.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: c.muted }]} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={c.muted} />
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

function FeatureDetail({ feature, c, onBack, onAction }: { feature: Feature; c: typeof light; onBack: () => void; onAction: (title: string) => void }) {
  const [active, setActive] = useState(true);
  const [level, setLevel] = useState(2);
  return (
    <View>
      <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: c.card }]}>
        <Ionicons name="arrow-back" size={20} color={c.text} />
        <Text style={[styles.backButtonText, { color: c.text }]}>Özelliklere dön</Text>
      </Pressable>
      <LinearGradient colors={[`${feature.color}E8`, feature.color]} style={styles.featureDetailHero}>
        <View style={styles.detailHeroIcon}>
          <Ionicons name={feature.icon} size={36} color="#fff" />
        </View>
        <Text style={styles.detailEyebrow}>LUMINA ÖZELLİĞİ</Text>
        <Text style={styles.detailTitle}>{feature.title}</Text>
        <Text style={styles.detailHeadline}>{feature.headline}</Text>
      </LinearGradient>
      <View style={[styles.liveCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.liveIcon, { backgroundColor: `${feature.color}18` }]}>
          <Ionicons name={feature.icon} size={27} color={feature.color} />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.liveLabel, { color: c.muted }]}>CANLI DURUM</Text>
          <Text style={[styles.liveValue, { color: c.text }]}>{feature.sample}</Text>
        </View>
        <Switch value={active} onValueChange={setActive} trackColor={{ false: '#C8D3D7', true: feature.color }} thumbColor="#fff" />
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>HIZLI KONTROLLER</Text>
      <View style={styles.quickGrid}>
        {['Bugün', 'Otomatik', 'Favoriler'].map((label, index) => (
          <Pressable key={label} onPress={() => setLevel(index)} style={[styles.quickCard, { backgroundColor: c.card, borderColor: level === index ? feature.color : c.line }]}>
            <Ionicons name={index === 0 ? 'today' : index === 1 ? 'flash' : 'heart'} size={21} color={level === index ? feature.color : c.muted} />
            <Text style={[styles.quickLabel, { color: level === index ? feature.color : c.text }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.activityCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={styles.activityTop}>
          <View>
            <Text style={[styles.activityTitle, { color: c.text }]}>Son etkinlik</Text>
            <Text style={[styles.activitySub, { color: c.muted }]}>Milo ile senkronize edildi</Text>
          </View>
          <View style={[styles.readyPill, { backgroundColor: `${feature.color}18` }]}>
            <View style={[styles.connectionDot, { backgroundColor: feature.color }]} />
            <Text style={[styles.readyText, { color: feature.color }]}>HAZIR</Text>
          </View>
        </View>
        <View style={[styles.activityLine, { backgroundColor: c.line }]} />
        <Text style={[styles.activityMessage, { color: c.muted }]}>Bu ekran yalnızca bir tanıtım kartı değil; özellik için gereken durum, hızlı ayarlar ve ana eylem artık burada bulunuyor.</Text>
      </View>
      <Pressable onPress={() => onAction(feature.action)} style={[styles.detailAction, { backgroundColor: feature.color }]}>
        <Ionicons name={feature.icon} size={20} color="#fff" />
        <Text style={styles.detailActionText}>{feature.action}</Text>
      </Pressable>
    </View>
  );
}

function Modes({ c, onSelect }: { c: typeof light; onSelect: (title: string) => void }) {
  return (
    <View>
      <View style={styles.pageIntro}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Bir mod seç</Text>
        <Text style={[styles.pageSubtitle, { color: c.muted }]}>Lumina, günün her anına seninle uyum sağlar.</Text>
      </View>
      <View style={styles.modeList}>
        {modeData.map((mode) => (
          <Pressable key={mode.title} onPress={() => onSelect(mode.title)} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
            <LinearGradient colors={mode.colors} style={styles.modeCard}>
              <View style={styles.modeIcon}>
                <Ionicons name={mode.icon} size={28} color="#fff" />
              </View>
              <View style={styles.flexOne}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeTitle}>{mode.title}</Text>
                  {mode.badge ? (
                    <View style={styles.modeBadge}>
                      <Text style={styles.modeBadgeText}>{mode.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,.8)" />
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ModeDetail({
  mode,
  c,
  onBack,
  expression,
  onExpressionChange,
  ambientSound,
  onAmbientSound,
}: {
  mode: ModeItem;
  c: typeof light;
  onBack: () => void;
  expression: PetExpression;
  onExpressionChange: (value: PetExpression) => void;
  ambientSound: AmbientSound;
  onAmbientSound: (value: AmbientSound) => void;
}) {
  const [enabled, setEnabled] = useState(mode.title === 'Pet modu');
  const [smartResponses, setSmartResponses] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [autoRoutine, setAutoRoutine] = useState(false);
  const [intensity, setIntensity] = useState<'Sakin' | 'Dengeli' | 'Aktif'>('Dengeli');
  const [saved, setSaved] = useState(false);
  const copy: Record<string, { headline: string; status: string; routine: string }> = {
    'Pet modu': { headline: 'Milo daha oyuncu, ilgili ve sosyal davranır.', status: 'Oyun ve etkileşim davranışları', routine: 'Her gün 18:30 · Oyun zamanı' },
    'Asistan modu': { headline: 'Planlarını düzenler ve odaklanmana yardım eder.', status: 'Üretkenlik ve sesli asistan', routine: 'Hafta içi 09:00 · Gün planı' },
    'Atmosfer modu': { headline: 'Yağmur ve şömine sesleri robotun göz ritmiyle senkron çalışır.', status: 'Ortam sesi ve göz animasyonu', routine: 'Her gün 21:30 · Sakinleşme zamanı' },
    'Çocuk modu': { headline: 'İçerik ve komutları çocuklar için güvenli ve anlaşılır tutar.', status: 'Güvenli içerik ve süre sınırı', routine: 'Her gün 20:00 · Dinlenme zamanı' },
  };
  const detail = copy[mode.title];
  const behaviorCopy: Record<string, { title: string; sub: string; icon: IconName }[]> = {
    'Pet modu': [
      { title: 'Duygusal tepkiler', sub: 'Bakım ve oyuna yüz ifadesiyle karşılık verir', icon: 'happy' },
      { title: 'Sesli geri bildirim', sub: 'Besleme ve oyun seslerini oynatır', icon: 'volume-high' },
      { title: 'Otomatik oyun', sub: 'Enerjisi yüksekken oyun önerir', icon: 'game-controller' },
    ],
    'Asistan modu': [
      { title: 'Akıllı özetler', sub: 'Plan ve notlardan kısa özet çıkarır', icon: 'sparkles' },
      { title: 'Sesli yanıtlar', sub: 'Komutlardan sonra kısa yanıt verir', icon: 'mic' },
      { title: 'Odak rutini', sub: 'Takvimine göre sessiz odak açar', icon: 'timer' },
    ],
    'Atmosfer modu': [
      { title: 'Göz senkronu', sub: 'Gözler ortam sesinin ritmine eşlik eder', icon: 'eye' },
      { title: 'Yumuşak geçiş', sub: 'Sesler açılıp kapanırken yavaşça geçiş yapar', icon: 'pulse' },
      { title: 'Otomatik rutin', sub: 'Belirlenen saatte ortamı hazırlar', icon: 'time' },
    ],
    'Çocuk modu': [
      { title: 'Güvenli yanıtlar', sub: 'Yaşa uygun içerik ve açıklamalar kullanır', icon: 'shield-checkmark' },
      { title: 'Ses sınırı', sub: 'Maksimum ses seviyesini korur', icon: 'volume-low' },
      { title: 'Süre yönetimi', sub: 'Günlük kullanım süresini takip eder', icon: 'hourglass' },
    ],
  };
  const behaviorRows = behaviorCopy[mode.title];
  const save = () => {
    setSaved(true);
  };
  const changeAmbient = (sound: AmbientSound) => {
    setEnabled(sound !== 'none');
    onAmbientSound(sound);
    onExpressionChange(sound === 'fire' ? 'sparkle' : sound === 'rain' ? 'curious' : 'blink');
  };
  return (
    <View>
      <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: c.card }]}>
        <Ionicons name="arrow-back" size={20} color={c.text} />
        <Text style={[styles.backButtonText, { color: c.text }]}>Modlara dön</Text>
      </Pressable>
      <LinearGradient colors={mode.colors} style={styles.modeDetailHero}>
        <View style={styles.modeDetailTop}>
          <View style={styles.modeDetailIcon}>
            <Ionicons name={mode.icon} size={31} color="#fff" />
          </View>
          <View style={[styles.modeLivePill, { backgroundColor: enabled ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.14)' }]}>
            <View style={[styles.connectionDot, { backgroundColor: enabled ? '#FFFFFF' : 'rgba(255,255,255,.55)' }]} />
            <Text style={styles.modeLiveText}>{enabled ? 'AKTİF' : 'KAPALI'}</Text>
          </View>
        </View>
        <View style={styles.modeHeroContent}>
          <View style={styles.modeHeroCopy}>
            <Text style={styles.modeDetailTitle}>{mode.title}</Text>
            <Text style={styles.modeDetailHeadline}>{detail.headline}</Text>
          </View>
          <View style={styles.modePetPreview}>
            <PetFace size={102} expression={expression} motion={mode.title === 'Pet modu' ? 'dance' : 'soft'} eyeColor="#17495A" />
          </View>
        </View>
      </LinearGradient>
      <View style={[styles.modeMasterCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.settingIcon, { backgroundColor: `${mode.colors[0]}18` }]}>
          <Ionicons name="power" size={21} color={mode.colors[0]} />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.settingTitle, { color: c.text }]}>{mode.title}</Text>
          <Text style={[styles.settingSub, { color: c.muted }]}>{detail.status}</Text>
        </View>
        <View style={styles.settingControl}>
          <Switch value={enabled} onValueChange={(value) => { setEnabled(value); if (!value && mode.title === 'Atmosfer modu') changeAmbient('none'); }} trackColor={{ false: '#C8D3D7', true: mode.colors[0] }} thumbColor="#fff" />
        </View>
      </View>
      {mode.title === 'Atmosfer modu' ? (
        <>
          <Text style={[styles.settingLabel, { color: c.muted }]}>ORTAM SESİ & GÖZ SENKRONU</Text>
          <View style={styles.ambientGrid}>
            {[
              { key: 'rain' as AmbientSound, title: 'Yağmur', sub: 'Yavaş göz kırpma', icon: 'rainy' as IconName, color: '#3E91DF' },
              { key: 'fire' as AmbientSound, title: 'Şömine', sub: 'Sıcak parıltı', icon: 'flame' as IconName, color: '#EA7436' },
              { key: 'none' as AmbientSound, title: 'Sessizlik', sub: 'Doğal ifade', icon: 'volume-mute' as IconName, color: '#72858C' },
            ].map((sound) => {
              const active = ambientSound === sound.key;
              return (
                <Pressable key={sound.key} onPress={() => changeAmbient(sound.key)} style={[styles.ambientCard, { backgroundColor: c.card, borderColor: active ? sound.color : c.line }]}>
                  <View style={[styles.ambientIcon, { backgroundColor: `${sound.color}18` }]}>
                    <Ionicons name={sound.icon} size={25} color={sound.color} />
                  </View>
                  <Text style={[styles.ambientTitle, { color: c.text }]}>{sound.title}</Text>
                  <Text style={[styles.ambientSub, { color: c.muted }]}>{sound.sub}</Text>
                  {active ? <View style={[styles.ambientActive, { backgroundColor: sound.color }]}><Ionicons name="checkmark" size={11} color="#fff" /></View> : null}
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
      <Text style={[styles.settingLabel, { color: c.muted }]}>MOD DAVRANIŞLARI</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        {behaviorRows.map((row, index, rows) => {
          const values = [smartResponses, voiceFeedback, autoRoutine];
          const setters = [setSmartResponses, setVoiceFeedback, setAutoRoutine];
          return (
          <View key={row.title} style={[styles.settingRow, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${mode.colors[0]}18` }]}>
              <Ionicons name={row.icon} size={21} color={mode.colors[0]} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{row.title}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{row.sub}</Text>
            </View>
            <View style={styles.settingControl}>
              <Switch value={values[index]} onValueChange={setters[index]} trackColor={{ false: '#C8D3D7', true: mode.colors[0] }} thumbColor="#fff" />
            </View>
          </View>
          );
        })}
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>ETKİLEŞİM YOĞUNLUĞU</Text>
      <View style={[styles.modeSegment, { backgroundColor: c.input }]}>
        {(['Sakin', 'Dengeli', 'Aktif'] as const).map((item) => (
          <Pressable key={item} onPress={() => setIntensity(item)} style={[styles.modeSegmentOption, intensity === item && { backgroundColor: mode.colors[0] }]}>
            <Text style={[styles.modeSegmentText, { color: intensity === item ? '#fff' : c.muted }]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.routineCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.routineIcon, { backgroundColor: `${mode.colors[0]}18` }]}>
          <Ionicons name="calendar" size={22} color={mode.colors[0]} />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.settingTitle, { color: c.text }]}>Planlanan rutin</Text>
          <Text style={[styles.settingSub, { color: c.muted }]}>{detail.routine}</Text>
        </View>
        <Pressable onPress={() => setAutoRoutine(!autoRoutine)} style={[styles.smallEditButton, { backgroundColor: c.input }]}>
          <Ionicons name="create-outline" size={17} color={c.text} />
        </Pressable>
      </View>
      <Pressable onPress={save} style={[styles.modeSaveButton, { backgroundColor: mode.colors[0] }]}>
        <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={20} color="#fff" />
        <Text style={styles.detailActionText}>{saved ? 'Ayarlar kaydedildi' : 'Mod ayarlarını kaydet'}</Text>
      </Pressable>
    </View>
  );
}

type Choice = { title: string; value: string; color?: string; premium?: boolean; icon?: IconName };

function ChoiceRow({ title, choices, selected, c, onChange, onPremium }: { title: string; choices: Choice[]; selected: string; c: typeof light; onChange: (value: string) => void; onPremium: (title: string) => void }) {
  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.settingLabel, { color: c.muted }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceScroll}>
        {choices.map((choice) => {
          const isSelected = selected === choice.value;
          return (
            <Pressable key={choice.value} onPress={() => choice.premium ? onPremium(choice.title) : onChange(choice.value)} style={[styles.choiceCard, { backgroundColor: c.card, borderColor: isSelected ? '#00A8CA' : c.line }]}>
              {choice.color ? <View style={[styles.colorDot, { backgroundColor: choice.color }]} /> : <Ionicons name={choice.icon ?? 'sparkles'} size={23} color={isSelected ? '#00A8CA' : c.muted} />}
              <Text style={[styles.choiceTitle, { color: c.text }]}>{choice.title}</Text>
              {choice.premium ? (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={10} color="#7A55CC" />
                  <Text style={styles.lockText}>PLUS</Text>
                </View>
              ) : (
                <Text style={[styles.freeText, { color: isSelected ? '#0086A4' : c.muted }]}>{isSelected ? 'SEÇİLİ' : 'FREE'}</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type VoiceProfile = {
  id: string;
  title: string;
  group: 'Kadın' | 'Erkek' | 'Karakter';
  desc: string;
  icon: IconName;
  color: string;
};

const voiceProfiles: VoiceProfile[] = [
  { id: 'lila', title: 'Lila', group: 'Kadın', desc: 'Doğal Türkçe · sıcak', icon: 'woman', color: '#E95D91' },
  { id: 'ada', title: 'Ada', group: 'Kadın', desc: 'Genç · canlı ve parlak', icon: 'sparkles', color: '#A55BE0' },
  { id: 'masal', title: 'Masal', group: 'Kadın', desc: 'Yumuşak · anlatıcı', icon: 'book', color: '#D36DB1' },
  { id: 'deniz', title: 'Deniz', group: 'Kadın', desc: 'Dengeli · sakin', icon: 'woman-outline', color: '#22A77B' },
  { id: 'atlas', title: 'Atlas', group: 'Erkek', desc: 'Tok · güven veren', icon: 'man', color: '#397BE8' },
  { id: 'ege', title: 'Ege', group: 'Erkek', desc: 'Derin · ağırbaşlı', icon: 'mic', color: '#24699E' },
  { id: 'mert', title: 'Mert', group: 'Erkek', desc: 'Enerjik · arkadaş canlısı', icon: 'flash', color: '#00A6A0' },
  { id: 'mini', title: 'Mini', group: 'Karakter', desc: 'Çocuk · minik ve sevimli', icon: 'happy', color: '#F08A45' },
  { id: 'robot', title: 'Robotik', group: 'Karakter', desc: 'Dijital · metalik', icon: 'hardware-chip', color: '#00A8CA' },
  { id: 'uyku', title: 'Uyku', group: 'Karakter', desc: 'Fısıltı · çok sakin', icon: 'moon', color: '#6E58B5' },
];

type VoiceAction = 'preview' | 'feed' | 'play';
type VoiceAudioSet = Record<VoiceAction, number>;

const voiceAudioSources: Record<string, VoiceAudioSet> = {
  lila: { preview: require('./assets/voices/lila-preview.wav'), feed: require('./assets/voices/lila-feed.wav'), play: require('./assets/voices/lila-play.wav') },
  ada: { preview: require('./assets/voices/ada-preview.wav'), feed: require('./assets/voices/ada-feed.wav'), play: require('./assets/voices/ada-play.wav') },
  masal: { preview: require('./assets/voices/masal-preview.wav'), feed: require('./assets/voices/masal-feed.wav'), play: require('./assets/voices/masal-play.wav') },
  deniz: { preview: require('./assets/voices/deniz-preview.wav'), feed: require('./assets/voices/deniz-feed.wav'), play: require('./assets/voices/deniz-play.wav') },
  atlas: { preview: require('./assets/voices/atlas-preview.wav'), feed: require('./assets/voices/atlas-feed.wav'), play: require('./assets/voices/atlas-play.wav') },
  ege: { preview: require('./assets/voices/ege-preview.wav'), feed: require('./assets/voices/ege-feed.wav'), play: require('./assets/voices/ege-play.wav') },
  mert: { preview: require('./assets/voices/mert-preview.wav'), feed: require('./assets/voices/mert-feed.wav'), play: require('./assets/voices/mert-play.wav') },
  mini: { preview: require('./assets/voices/mini-preview.wav'), feed: require('./assets/voices/mini-feed.wav'), play: require('./assets/voices/mini-play.wav') },
  robot: { preview: require('./assets/voices/robot-preview.wav'), feed: require('./assets/voices/robot-feed.wav'), play: require('./assets/voices/robot-play.wav') },
  uyku: { preview: require('./assets/voices/uyku-preview.wav'), feed: require('./assets/voices/uyku-feed.wav'), play: require('./assets/voices/uyku-play.wav') },
};

function VoicePicker({ c, selected, onSelect }: { c: typeof light; selected: string; onSelect: (profile: VoiceProfile) => void }) {
  return (
    <View style={styles.voiceSection}>
      <View style={styles.voiceSectionHead}>
        <View>
          <Text style={[styles.settingLabel, styles.voiceSettingLabel, { color: c.muted }]}>PET SESİ</Text>
          <Text style={[styles.voiceHint, { color: c.muted }]}>Bir profile dokunarak seç ve önizle.</Text>
        </View>
        <View style={[styles.voiceCountPill, { backgroundColor: c.cyanSoft }]}>
          <Ionicons name="volume-high" size={12} color="#008DAA" />
          <Text style={styles.voiceCountText}>10 GERÇEK SES</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceScroll}>
        {voiceProfiles.map((profile) => {
          const active = selected === profile.id;
          return (
            <Pressable key={profile.id} onPress={() => onSelect(profile)} style={[styles.voiceCard, { backgroundColor: c.card, borderColor: active ? profile.color : c.line }]}>
              <View style={styles.voiceCardTop}>
                <View style={[styles.voiceIcon, { backgroundColor: `${profile.color}18` }]}>
                  <Ionicons name={profile.icon} size={23} color={profile.color} />
                </View>
                <View style={[styles.voicePlay, { backgroundColor: active ? profile.color : c.input }]}>
                  <Ionicons name="play" size={13} color={active ? '#fff' : c.muted} />
                </View>
              </View>
              <Text style={[styles.voiceTitle, { color: c.text }]}>{profile.title}</Text>
              <Text style={[styles.voiceDesc, { color: c.muted }]} numberOfLines={1}>{profile.desc}</Text>
              <View style={[styles.voiceGroupPill, { backgroundColor: `${profile.color}14` }]}>
                <Text style={[styles.voiceGroupText, { color: profile.color }]}>{active ? 'SEÇİLİ' : profile.group.toUpperCase()}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PetCustomize({
  c,
  pet,
  stats,
  onStatsChange,
  expression,
  onExpressionChange,
  onSound,
  onPremium,
}: {
  c: typeof light;
  pet: PetProfile;
  stats: PetStats;
  onStatsChange: (next: PetStats) => void;
  expression: PetExpression;
  onExpressionChange: (value: PetExpression) => void;
  onSound: (sound: 'tap' | 'play') => void;
  onPremium: (title: string) => void;
}) {
  const [eyeColor, setEyeColor] = useState('#17353E');
  const [motion, setMotion] = useState<PetMotion>('soft');
  const [voiceProfile, setVoiceProfile] = useState('deniz');
  const [lastAction, setLastAction] = useState('Seni gördüğü için mutlu');
  const voicePlayer = useAudioPlayer(null);
  const moodVisual = expressionVisuals[expression];
  const eyeChoices: Choice[] = [
    { title: 'Klasik', value: '#17353E', color: '#17353E' },
    { title: 'Okyanus', value: '#008FB5', color: '#00A9D5' },
    { title: 'Menekşe', value: '#7C4FE0', color: '#8B62E8' },
    { title: 'Kehribar', value: '#E58B29', color: '#F2A23B' },
    { title: 'Zümrüt', value: '#138B69', color: '#20B987' },
    { title: 'Mercan', value: '#E95372', color: '#F16C89' },
    { title: 'Buz mavisi', value: '#4E91F5', color: '#76B8FF' },
    { title: 'Gece', value: '#29396F', color: '#344C91' },
    { title: 'Lavanta', value: '#A476DE', color: '#B992EA' },
    { title: 'Limon', value: '#B79512', color: '#E3C32E' },
    { title: 'Gül', value: '#CB4F8B', color: '#E86BA5' },
    { title: 'Galaksi', value: '#5B46C8', color: '#6B55E5' },
  ];
  const expressionChoices: Choice[] = [
    { title: 'Doğal kırpma', value: 'blink', icon: 'eye' },
    { title: 'Meraklı bakış', value: 'curious', icon: 'happy' },
    { title: 'Yıldız göz', value: 'sparkle', icon: 'sparkles' },
    { title: 'Uykulu', value: 'sleepy', icon: 'moon' },
    { title: 'Kalp göz', value: 'love', icon: 'heart' },
    { title: 'Heyecanlı', value: 'excited', icon: 'flash' },
    { title: 'Utangaç', value: 'shy', icon: 'flower' },
    { title: 'Odaklı', value: 'focused', icon: 'scan' },
    { title: 'Kahkaha', value: 'cheerful', icon: 'happy-outline' },
    { title: 'Huzurlu', value: 'calm', icon: 'leaf' },
  ];
  const motionChoices: Choice[] = [
    { title: 'Sakin', value: 'still', icon: 'remove-circle-outline' },
    { title: 'Yumuşak titreşim', value: 'soft', icon: 'pulse' },
    { title: 'Dans titreşimi', value: 'dance', icon: 'musical-notes' },
    { title: 'Zıplama', value: 'bounce', icon: 'arrow-up-circle' },
    { title: 'Sağa sola', value: 'sway', icon: 'swap-horizontal' },
    { title: 'Nefes efekti', value: 'pulse', icon: 'heart-circle' },
  ];
  const sensors: { title: string; sub: string; icon: IconName; premium: boolean }[] = [
    { title: 'Dokunma tepkisi', sub: 'Başına dokununca göz kırpar', icon: 'hand-left', premium: false },
    { title: 'Yakınlık sensörü', sub: 'Yaklaştığında seni selamlar', icon: 'radio', premium: false },
    { title: 'Yüz takibi', sub: 'Bakışları seni odada takip eder', icon: 'scan', premium: true },
  ];
  const playVoice = (profileId: string, action: VoiceAction) => {
    const source = voiceAudioSources[profileId]?.[action];
    if (!source) return;
    voicePlayer.pause();
    voicePlayer.replace(source);
    voicePlayer.play();
  };
  const interact = (kind: 'feed' | 'play') => {
    const happiness = Math.min(100, stats.happiness + 15);
    const energy = kind === 'feed' ? Math.min(100, stats.energy + 10) : Math.max(0, stats.energy - 8);
    onStatsChange({ ...stats, happiness, energy });
    onExpressionChange(kind === 'feed' ? 'curious' : 'sparkle');
    setMotion(kind === 'play' ? 'dance' : 'soft');
    setLastAction(kind === 'feed' ? 'Mmm! Teşekkürler, çok lezzetliydi.' : 'Harika oyundu! Bir tur daha?');
    playVoice(voiceProfile, kind);
    Haptics.impactAsync(kind === 'feed' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };
  const selectVoice = (profile: VoiceProfile) => {
    setVoiceProfile(profile.id);
    setLastAction(`${profile.title} gerçek ses profili seçildi`);
    playVoice(profile.id, 'preview');
    Haptics.selectionAsync().catch(() => undefined);
  };
  return (
    <View>
      <View style={[styles.petStage, { backgroundColor: c.card, borderColor: c.line }]}>
        <PetMoodAura color={eyeColor} expression={expression} />
        <View style={[styles.moodChip, { backgroundColor: `${moodVisual.color}16`, borderColor: `${moodVisual.color}32` }]}>
          <Ionicons name={moodVisual.icon} size={12} color={moodVisual.color} />
          <Text style={[styles.moodChipText, { color: moodVisual.color }]}>{moodVisual.label}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: pet.connected ? 'rgba(20,200,132,.1)' : 'rgba(241,163,67,.12)' }]}>
          <View style={[styles.pulseDot, { backgroundColor: pet.connected ? '#12C884' : '#F1A343' }]} />
          <Text style={[styles.statusText, { color: pet.connected ? '#16946A' : '#B27827' }]}>{pet.connected ? 'BAĞLI · %82' : 'DEMO PET'}</Text>
        </View>
        <Pressable onPress={() => { onExpressionChange(expression === 'blink' ? 'curious' : 'blink'); onSound('tap'); }}>
          <PetFace size={190} eyeColor={eyeColor} expression={expression} motion={motion} />
        </Pressable>
        <Text style={[styles.petName, { color: c.text }]}>{pet.name}</Text>
        <Text style={[styles.petMood, { color: c.muted }]}>{lastAction}</Text>
        <View style={[styles.robotSyncPill, { backgroundColor: c.cyanSoft }]}>
          <Ionicons name="sync" size={12} color="#008CAA" />
          <Text style={styles.robotSyncText}>ROBOT YÜZÜYLE CANLI SENKRON</Text>
        </View>
      </View>
      <View style={styles.petStatsGrid}>
        {[
          { title: 'Mutluluk', value: stats.happiness, icon: 'heart' as IconName, color: '#EE658D' },
          { title: 'Enerji', value: stats.energy, icon: 'flash' as IconName, color: '#F1A13C' },
          { title: 'Batarya', value: stats.battery, icon: 'battery-half' as IconName, color: '#20B987' },
        ].map((stat) => (
          <View key={stat.title} style={[styles.petStatCard, { backgroundColor: c.card, borderColor: c.line }]}>
            <View style={styles.petStatTop}>
              <Ionicons name={stat.icon} size={17} color={stat.color} />
              <Text style={[styles.petStatValue, { color: c.text }]}>{stat.value}%</Text>
            </View>
            <Text style={[styles.petStatLabel, { color: c.muted }]}>{stat.title}</Text>
            <View style={[styles.petStatTrack, { backgroundColor: c.input }]}>
              <View style={[styles.petStatFill, { backgroundColor: stat.color, width: `${stat.value}%` }]} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.petActionRow}>
        <Pressable onPress={() => interact('feed')} style={({ pressed }) => [styles.petActionCard, { backgroundColor: c.card, borderColor: '#F1A13C' }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.petActionIcon, { backgroundColor: '#F1A13C18' }]}><Ionicons name="restaurant" size={27} color="#F1A13C" /></View>
          <View style={styles.flexOne}><Text style={[styles.petActionTitle, { color: c.text }]}>Besle</Text><Text style={[styles.petActionSub, { color: c.muted }]}>+15 mutluluk · +10 enerji</Text></View>
        </Pressable>
        <Pressable onPress={() => interact('play')} style={({ pressed }) => [styles.petActionCard, { backgroundColor: c.card, borderColor: '#7658DF' }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.petActionIcon, { backgroundColor: '#7658DF18' }]}><Ionicons name="game-controller" size={27} color="#7658DF" /></View>
          <View style={styles.flexOne}><Text style={[styles.petActionTitle, { color: c.text }]}>Oyna</Text><Text style={[styles.petActionSub, { color: c.muted }]}>+15 mutluluk · -8 enerji</Text></View>
        </Pressable>
      </View>
      <View style={styles.personalizeHead}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Petini kişiselleştir</Text>
          <Text style={[styles.personalizeSub, { color: c.muted }]}>Göz, animasyon, hareket ve ses karakterini seç.</Text>
        </View>
        <View style={styles.plusPill}>
          <Ionicons name="sparkles" size={12} color="#704BBE" />
          <Text style={styles.plusPillText}>PLUS</Text>
        </View>
      </View>
      <ChoiceRow title="GÖZ RENGİ" choices={eyeChoices} selected={eyeColor} c={c} onChange={setEyeColor} onPremium={onPremium} />
      <ChoiceRow title="GÖZ ANİMASYONU" choices={expressionChoices} selected={expression} c={c} onChange={(value) => onExpressionChange(value as PetExpression)} onPremium={onPremium} />
      <ChoiceRow title="TİTREME STİLİ" choices={motionChoices} selected={motion} c={c} onChange={(value) => setMotion(value as PetMotion)} onPremium={onPremium} />
      <VoicePicker c={c} selected={voiceProfile} onSelect={selectVoice} />
      <Text style={[styles.settingLabel, { color: c.muted }]}>SENSÖR TEPKİLERİ</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        {sensors.map((sensor, index) => (
          <Pressable key={sensor.title} onPress={() => sensor.premium ? onPremium(sensor.title) : undefined} style={[styles.sensorRow, index < sensors.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: sensor.premium ? '#EADFFF' : '#DFF8F1' }]}>
              <Ionicons name={sensor.icon} size={21} color={sensor.premium ? '#7550C4' : '#15926B'} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{sensor.title}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{sensor.sub}</Text>
            </View>
            {sensor.premium ? (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={10} color="#7A55CC" />
                <Text style={styles.lockText}>PLUS</Text>
              </View>
            ) : (
              <Switch value trackColor={{ false: '#C8D3D7', true: '#21B989' }} thumbColor="#fff" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Settings({ c, theme, toggleTheme, preferences, onPreferencesChange, onLogout, onSelect }: { c: typeof light; theme: Theme; toggleTheme: () => void; preferences: AppPreferences; onPreferencesChange: (next: AppPreferences) => void; onLogout: () => void; onSelect: (title: string) => void }) {
  const accountRows: { title: string; sub: string; icon: IconName; color: string }[] = [
    { title: 'Şifre ve giriş', sub: 'Şifreni ve giriş yöntemlerini yönet', icon: 'key', color: '#7B5DDE' },
    { title: 'Gizlilik ve güvenlik', sub: 'PIN, izinler ve veri tercihleri', icon: 'shield-checkmark', color: '#22AE7D' },
    { title: 'Lumina Plus', sub: 'Plan, ödeme ve satın alımları geri yükle', icon: 'diamond', color: '#E36191' },
  ];
  const supportRows: { title: string; sub: string; icon: IconName; color: string }[] = [
    { title: 'Yardım merkezi', sub: 'Kurulum ve sık sorulan sorular', icon: 'help-buoy', color: '#4D8CF5' },
    { title: 'Sorun bildir', sub: 'Tanılama bilgileriyle destek iste', icon: 'chatbubble-ellipses', color: '#EF8C3D' },
    { title: 'Uygulama hakkında', sub: 'Lisanslar, koşullar ve sürüm notları', icon: 'information-circle', color: '#00A7A5' },
  ];
  const toggleRows: { key: 'notifications' | 'autoConnect' | 'haptics' | 'appSounds'; title: string; sub: string; icon: IconName; color: string }[] = [
    { key: 'notifications', title: 'Bildirimler', sub: 'Hatırlatıcı ve pet durumu uyarıları', icon: 'notifications', color: '#4D8CF5' },
    { key: 'autoConnect', title: 'Otomatik bağlantı', sub: 'Pet yakındayken otomatik bağlan', icon: 'bluetooth', color: '#00A9C9' },
    { key: 'haptics', title: 'Dokunsal geri bildirim', sub: 'Kontrollerde hafif titreşim kullan', icon: 'phone-portrait', color: '#7C5CE5' },
    { key: 'appSounds', title: 'Uygulama sesleri', sub: 'Menü ve işlem seslerini oynat', icon: 'volume-high', color: '#EF8C3D' },
  ];
  return (
    <View>
      <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.profileAvatar, { backgroundColor: c.cyanSoft }]}>
          <Ionicons name="person" size={38} color="#008DAA" />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.profileName, { color: c.text }]}>Berkay Ünsal</Text>
          <Text style={[styles.profileMail, { color: c.muted }]}>berkay@lumina.pet</Text>
          <View style={styles.premiumChip}>
            <Ionicons name="sparkles" size={12} color="#6C49B3" />
            <Text style={styles.premiumText}>Lumina Plus</Text>
          </View>
        </View>
        <Pressable onPress={() => onSelect('Profili düzenle')}>
          <Ionicons name="create-outline" size={22} color={c.muted} />
        </Pressable>
      </View>
      <View style={styles.settingsTitleRow}>
        <View style={styles.settingsTitleCopy}>
          <Text style={[styles.sectionTitle, styles.settingsDashboardTitle, { color: c.text }]}>Kontrol paneli</Text>
          <Text style={[styles.settingsDashboardSub, { color: c.muted }]}>Lumina ve robot durumuna hızlı bakış</Text>
        </View>
        <Pressable onPress={() => onSelect('Kontrol paneli')} style={[styles.settingsManageButton, { backgroundColor: c.cyanSoft }]}>
          <Ionicons name="options" size={18} color="#00A0BF" />
        </Pressable>
      </View>
      <View style={styles.settingsStats}>
        {[
          { label: 'ROBOT', value: 'Bağlı', icon: 'hardware-chip' as IconName, color: '#20B987' },
          { label: 'BATARYA', value: '%82', icon: 'battery-half' as IconName, color: '#00A9C9' },
          { label: 'RUTİNLER', value: '4 aktif', icon: 'timer' as IconName, color: '#7B5DDE' },
        ].map((stat) => (
          <Pressable key={stat.label} onPress={() => onSelect('Kontrol paneli')} style={[styles.settingsStatCard, { backgroundColor: c.card, borderColor: c.line }]}>
            <Ionicons name={stat.icon} size={21} color={stat.color} />
            <View style={styles.settingsStatCopy}>
              <Text style={[styles.settingsStatValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={[styles.settingsStatLabel, { color: c.muted }]} numberOfLines={1} adjustsFontSizeToFit>{stat.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>GÖRÜNÜM</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: c.line }]}>
          <View style={[styles.settingIcon, { backgroundColor: '#4D8CF518' }]}>
            <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={21} color="#4D8CF5" />
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.settingTitle, { color: c.text }]}>Koyu tema</Text>
            <Text style={[styles.settingSub, { color: c.muted }]}>{theme === 'dark' ? 'Açık' : 'Kapalı'}</Text>
          </View>
          <View style={styles.settingControl}>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#C8D3D7', true: '#00A9C9' }} thumbColor="#fff" />
          </View>
        </View>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#00A9C918' }]}>
            <Ionicons name="accessibility" size={21} color="#00A9C9" />
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.settingTitle, { color: c.text }]}>Hareketi azalt</Text>
            <Text style={[styles.settingSub, { color: c.muted }]}>Yoğun geçiş animasyonlarını sınırla</Text>
          </View>
          <View style={styles.settingControl}>
            <Switch value={preferences.reduceMotion} onValueChange={(value) => onPreferencesChange({ ...preferences, reduceMotion: value })} trackColor={{ false: '#C8D3D7', true: '#00A9C9' }} thumbColor="#fff" />
          </View>
        </View>
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>BAĞLANTI & BİLDİRİMLER</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        {toggleRows.map((row, index) => (
          <View key={row.key} style={[styles.settingRow, index < toggleRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${row.color}18` }]}>
              <Ionicons name={row.icon} size={21} color={row.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{row.title}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{row.sub}</Text>
            </View>
            <View style={styles.settingControl}>
              <Switch value={preferences[row.key]} onValueChange={(value) => onPreferencesChange({ ...preferences, [row.key]: value })} trackColor={{ false: '#C8D3D7', true: '#00A9C9' }} thumbColor="#fff" />
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>UYGULAMA DİLİ</Text>
      <View style={[styles.languageCard, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={styles.languageCopy}>
          <View style={[styles.settingIcon, { backgroundColor: '#22AE7D18' }]}>
            <Ionicons name="language" size={21} color="#22AE7D" />
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.settingTitle, { color: c.text }]}>Dil tercihi</Text>
            <Text style={[styles.settingSub, { color: c.muted }]}>Arayüz ve pet yanıt dili</Text>
          </View>
        </View>
        <View style={[styles.languageSegment, { backgroundColor: c.input }]}>
          {(['Türkçe', 'English'] as const).map((language) => {
            const selected = preferences.language === language;
            return (
              <Pressable key={language} onPress={() => onPreferencesChange({ ...preferences, language })} style={[styles.languageOption, selected && styles.languageOptionSelected]}>
                <Text style={[styles.languageOptionText, { color: selected ? '#FFFFFF' : c.muted }]}>{language}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>HESAP & GÜVENLİK</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        {accountRows.map((row, index) => (
          <Pressable key={row.title} onPress={() => onSelect(row.title)} style={[styles.settingRow, index < accountRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${row.color}18` }]}>
              <Ionicons name={row.icon} size={21} color={row.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{row.title}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{row.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.settingLabel, { color: c.muted }]}>DESTEK</Text>
      <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
        {supportRows.map((row, index) => (
          <Pressable key={row.title} onPress={() => onSelect(row.title)} style={[styles.settingRow, index < supportRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${row.color}18` }]}>
              <Ionicons name={row.icon} size={21} color={row.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{row.title}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{row.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onLogout} style={[styles.logout, { backgroundColor: c.card, borderColor: c.line }]}>
        <Ionicons name="log-out-outline" size={21} color="#E34F64" />
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </Pressable>
      <Text style={[styles.version, { color: c.muted }]}>Lumina Pet · Sürüm 1.0.0</Text>
    </View>
  );
}

function SettingDetail({ title, c, onBack }: { title: string; c: typeof light; onBack: () => void }) {
  const [firstValue, setFirstValue] = useState(title === 'Profili düzenle' ? 'Berkay Ünsal' : '');
  const [secondValue, setSecondValue] = useState(title === 'Profili düzenle' ? 'berkay@lumina.pet' : '');
  const [thirdValue, setThirdValue] = useState('');
  const [primaryToggle, setPrimaryToggle] = useState(true);
  const [secondaryToggle, setSecondaryToggle] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Uygulama');
  const [saved, setSaved] = useState(false);
  const config: Record<string, { icon: IconName; color: string; desc: string }> = {
    'Profili düzenle': { icon: 'person-circle', color: '#00A9C9', desc: 'Adını, e-posta adresini ve profil bilgilerini düzenle.' },
    'Kontrol paneli': { icon: 'options', color: '#00A9C9', desc: 'Bağlı cihazları, pil durumunu ve senkronizasyonu yönet.' },
    'Şifre ve giriş': { icon: 'key', color: '#7B5DDE', desc: 'Şifreni güncelle ve hesabının giriş güvenliğini yönet.' },
    'Gizlilik ve güvenlik': { icon: 'shield-checkmark', color: '#22AE7D', desc: 'Biyometrik doğrulama, komut güvenliği ve veri tercihleri.' },
    'Lumina Plus': { icon: 'diamond', color: '#E36191', desc: 'Aktif planını, ödeme bilgilerini ve Plus özelliklerini yönet.' },
    'Yardım merkezi': { icon: 'help-buoy', color: '#4D8CF5', desc: 'Kurulum, pet bağlantısı ve uygulama kullanımı için hızlı yardım.' },
    'Sorun bildir': { icon: 'chatbubble-ellipses', color: '#EF8C3D', desc: 'Yaşadığın sorunu ayrıntılarıyla destek ekibine gönder.' },
    'Uygulama hakkında': { icon: 'information-circle', color: '#00A7A5', desc: 'Sürüm, yasal bilgiler, lisanslar ve uygulama durumu.' },
  };
  const detail = config[title] ?? config['Kontrol paneli'];
  const markSaved = () => setSaved(true);

  const renderContent = () => {
    if (title === 'Profili düzenle') {
      return (
        <View style={[styles.detailFormCard, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[styles.formLabel, { color: c.muted }]}>AD SOYAD</Text>
          <TextInput value={firstValue} onChangeText={setFirstValue} placeholder="Ad soyad" placeholderTextColor={c.muted} style={[styles.detailInput, { color: c.text, backgroundColor: c.input }]} />
          <Text style={[styles.formLabel, { color: c.muted }]}>E-POSTA</Text>
          <TextInput value={secondValue} onChangeText={setSecondValue} placeholder="E-posta" placeholderTextColor={c.muted} autoCapitalize="none" style={[styles.detailInput, { color: c.text, backgroundColor: c.input }]} />
          <Pressable onPress={markSaved} style={[styles.settingPrimaryButton, { backgroundColor: detail.color }]}>
            <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={19} color="#fff" />
            <Text style={styles.settingPrimaryText}>{saved ? 'Profil kaydedildi' : 'Profili kaydet'}</Text>
          </Pressable>
        </View>
      );
    }
    if (title === 'Şifre ve giriş') {
      return (
        <View style={[styles.detailFormCard, { backgroundColor: c.card, borderColor: c.line }]}>
          {[
            { label: 'MEVCUT ŞİFRE', value: firstValue, set: setFirstValue },
            { label: 'YENİ ŞİFRE', value: secondValue, set: setSecondValue },
            { label: 'YENİ ŞİFRE TEKRAR', value: thirdValue, set: setThirdValue },
          ].map((field) => (
            <View key={field.label}>
              <Text style={[styles.formLabel, { color: c.muted }]}>{field.label}</Text>
              <View style={[styles.detailInputWithIcon, { backgroundColor: c.input }]}>
                <Ionicons name="lock-closed-outline" size={18} color={c.muted} />
                <TextInput value={field.value} onChangeText={field.set} secureTextEntry placeholder="••••••••" placeholderTextColor={c.muted} style={[styles.detailInputFlex, { color: c.text }]} />
              </View>
            </View>
          ))}
          <Pressable onPress={markSaved} style={[styles.settingPrimaryButton, { backgroundColor: detail.color }]}>
            <Ionicons name={saved ? 'checkmark-circle' : 'shield-checkmark'} size={19} color="#fff" />
            <Text style={styles.settingPrimaryText}>{saved ? 'Şifre güncellendi' : 'Şifreyi güncelle'}</Text>
          </Pressable>
        </View>
      );
    }
    if (title === 'Sorun bildir') {
      return (
        <View style={[styles.detailFormCard, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[styles.formLabel, { color: c.muted }]}>KATEGORİ</Text>
          <View style={styles.categoryRow}>
            {['Uygulama', 'Pet', 'Hesap'].map((category) => (
              <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.categoryChip, { backgroundColor: selectedCategory === category ? detail.color : c.input }]}>
                <Text style={[styles.categoryChipText, { color: selectedCategory === category ? '#fff' : c.muted }]}>{category}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.formLabel, { color: c.muted }]}>AÇIKLAMA</Text>
          <TextInput value={firstValue} onChangeText={setFirstValue} multiline numberOfLines={5} textAlignVertical="top" placeholder="Sorunu ve izlediğin adımları anlat..." placeholderTextColor={c.muted} style={[styles.detailTextarea, { color: c.text, backgroundColor: c.input }]} />
          <Pressable onPress={markSaved} style={[styles.settingPrimaryButton, { backgroundColor: detail.color }]}>
            <Ionicons name={saved ? 'checkmark-circle' : 'send'} size={19} color="#fff" />
            <Text style={styles.settingPrimaryText}>{saved ? 'Destek talebi oluşturuldu' : 'Raporu gönder'}</Text>
          </Pressable>
        </View>
      );
    }
    if (title === 'Yardım merkezi') {
      return (
        <View>
          <View style={[styles.helpSearch, { backgroundColor: c.input }]}>
            <Ionicons name="search" size={20} color={c.muted} />
            <TextInput value={firstValue} onChangeText={setFirstValue} placeholder="Yardım konularında ara" placeholderTextColor={c.muted} style={[styles.detailInputFlex, { color: c.text }]} />
          </View>
          <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
            {['Petimi nasıl bağlarım?', 'Modları nasıl planlarım?', 'Plus özelliklerini nasıl açarım?', 'Hesabımı nasıl güvende tutarım?'].map((question, index, rows) => (
              <Pressable key={question} onPress={() => setSecondValue(question)} style={[styles.helpRow, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
                <View style={[styles.helpNumber, { backgroundColor: `${detail.color}18` }]}>
                  <Text style={[styles.helpNumberText, { color: detail.color }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.helpQuestion, { color: c.text }]}>{question}</Text>
                <Ionicons name="chevron-forward" size={17} color={c.muted} />
              </Pressable>
            ))}
          </View>
          {secondValue ? <View style={[styles.answerCard, { backgroundColor: c.cyanSoft }]}><Text style={[styles.settingTitle, { color: c.text }]}>{secondValue}</Text><Text style={[styles.answerText, { color: c.muted }]}>İlgili adımları ekrandaki yönlendirmeleri izleyerek tamamlayabilirsin. Seçimlerin anında hesabına uygulanır.</Text></View> : null}
        </View>
      );
    }
    if (title === 'Uygulama hakkında') {
      return (
        <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
          {[
            ['Sürüm', '1.0.0 (100)'],
            ['Expo SDK', '54'],
            ['Gizlilik politikası', 'Görüntüle'],
            ['Kullanım koşulları', 'Görüntüle'],
            ['Açık kaynak lisansları', 'Görüntüle'],
          ].map(([label, value], index, rows) => (
            <Pressable key={label} onPress={() => setSaved(true)} style={[styles.aboutRow, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{label}</Text>
              <View style={styles.aboutValueWrap}>
                <Text style={[styles.aboutValue, { color: c.muted }]}>{value}</Text>
                {value === 'Görüntüle' ? <Ionicons name="open-outline" size={15} color={c.muted} /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      );
    }
    const isPlus = title === 'Lumina Plus';
    const isSecurity = title === 'Gizlilik ve güvenlik';
    return (
      <View>
        {isPlus ? (
          <LinearGradient colors={['#8E65EA', '#E36191']} style={styles.planCard}>
            <Ionicons name="diamond" size={30} color="#fff" />
            <View style={styles.flexOne}>
              <Text style={styles.planTitle}>Lumina Plus</Text>
              <Text style={styles.planSub}>Aylık plan · Sonraki yenileme 13 Ağustos</Text>
            </View>
            <Text style={styles.planPrice}>₺149</Text>
          </LinearGradient>
        ) : null}
        <View style={[styles.settingGroup, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${detail.color}18` }]}>
              <Ionicons name={isSecurity ? 'finger-print' : isPlus ? 'card' : 'sync'} size={21} color={detail.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{isSecurity ? 'Biyometrik doğrulama' : isPlus ? 'Otomatik yenileme' : 'Otomatik senkronizasyon'}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{primaryToggle ? 'Açık' : 'Kapalı'}</Text>
            </View>
            <View style={styles.settingControl}><Switch value={primaryToggle} onValueChange={setPrimaryToggle} trackColor={{ false: '#C8D3D7', true: detail.color }} thumbColor="#fff" /></View>
          </View>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: `${detail.color}18` }]}>
              <Ionicons name={isSecurity ? 'analytics' : isPlus ? 'receipt' : 'battery-half'} size={21} color={detail.color} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.settingTitle, { color: c.text }]}>{isSecurity ? 'Anonim analiz paylaşımı' : isPlus ? 'Fatura bildirimleri' : 'Akıllı pil koruması'}</Text>
              <Text style={[styles.settingSub, { color: c.muted }]}>{secondaryToggle ? 'Açık' : 'Kapalı'}</Text>
            </View>
            <View style={styles.settingControl}><Switch value={secondaryToggle} onValueChange={setSecondaryToggle} trackColor={{ false: '#C8D3D7', true: detail.color }} thumbColor="#fff" /></View>
          </View>
        </View>
        <Pressable onPress={markSaved} style={[styles.settingPrimaryButton, { backgroundColor: detail.color }]}>
          <Ionicons name={saved ? 'checkmark-circle' : isPlus ? 'card-outline' : 'save-outline'} size={19} color="#fff" />
          <Text style={styles.settingPrimaryText}>{saved ? 'Değişiklikler kaydedildi' : isPlus ? 'Ödeme yöntemlerini yönet' : 'Ayarları kaydet'}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View>
      <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: c.card }]}>
        <Ionicons name="arrow-back" size={20} color={c.text} />
        <Text style={[styles.backButtonText, { color: c.text }]}>Hesabıma dön</Text>
      </Pressable>
      <View style={[styles.settingDetailHero, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.settingDetailIcon, { backgroundColor: `${detail.color}18` }]}>
          <Ionicons name={detail.icon} size={31} color={detail.color} />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.settingDetailTitle, { color: c.text }]}>{title}</Text>
          <Text style={[styles.settingDetailDesc, { color: c.muted }]}>{detail.desc}</Text>
        </View>
      </View>
      {renderContent()}
    </View>
  );
}

const radialPositions = [
  { left: 98, top: 11 },
  { left: 185, top: 98 },
  { left: 98, top: 185 },
  { left: 11, top: 98 },
];

function RadialNav({ tab, setTab, theme, reduceMotion }: { tab: Tab | null; setTab: (tab: Tab) => void; theme: Theme; reduceMotion: boolean }) {
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const activeItem = tabs.find((item) => item.key === tab);
  const isDark = theme === 'dark';

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (reduceMotion) {
      progress.setValue(nextOpen ? 1 : 0);
      return;
    }
    Animated.spring(progress, {
      toValue: nextOpen ? 1 : 0,
      friction: 8,
      tension: 72,
      useNativeDriver: true,
    }).start();
  };

  const choose = (nextTab: Tab) => {
    setTab(nextTab);
    changeOpen(false);
  };

  const menuScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const menuTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [95, 0] });
  const menuRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-22deg', '0deg'] });
  const buttonRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={styles.radialLayer} pointerEvents="box-none">
      {open ? <Pressable style={styles.radialBackdrop} onPress={() => changeOpen(false)} /> : null}
      <View style={styles.radialDock} pointerEvents="box-none">
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.radialMenuWrap,
            {
              opacity: progress,
              transform: [{ translateY: menuTranslate }, { scale: menuScale }, { rotate: menuRotate }],
            },
          ]}
        >
          <BlurView intensity={Platform.OS === 'web' ? 35 : 72} tint={theme} style={[styles.radialMenu, isDark && styles.radialMenuDark]}>
            <View style={[styles.radialOrbitOuter, isDark && styles.radialOrbitOuterDark]} />
            <View style={[styles.radialOrbitInner, isDark && styles.radialOrbitInnerDark]} />
            <LinearGradient colors={isDark ? ['#213E4A', '#172D37'] : ['#F8FCFE', '#EAF6FB']} style={[styles.radialHub, isDark && styles.radialHubDark]}>
              <View style={styles.radialHubDot} />
              {activeItem?.key === 'pet' ? <MiniPetGlyph size={28} /> : <Ionicons name={activeItem?.icon ?? 'home'} size={25} color={isDark ? '#72D1E8' : '#00A0C1'} />}
              <Text style={[styles.radialHubText, isDark && styles.radialHubTextDark]}>{activeItem?.label ?? 'Menü'}</Text>
            </LinearGradient>
            {tabs.map((item, index) => {
              const selected = item.key === tab;
              const position = radialPositions[index];
              return (
                <Pressable key={item.key} onPress={() => choose(item.key)} style={[styles.radialItemSlot, position]}>
                  <View style={[styles.radialItem, isDark && styles.radialItemDark, selected && styles.radialItemSelected]}>
                    <NavGlyph item={item} selected={selected} dark={isDark} />
                  </View>
                  <Text style={[styles.radialItemLabel, isDark && styles.radialItemLabelDark, selected && styles.radialItemLabelSelected, selected && isDark && styles.radialItemLabelSelectedDark]} numberOfLines={1}>{item.label}</Text>
                </Pressable>
              );
            })}
          </BlurView>
        </Animated.View>
        <Pressable onPress={() => changeOpen(!open)} style={({ pressed }) => [styles.homeButtonOuter, isDark && styles.homeButtonOuterDark, open && styles.homeButtonOuterOpen, pressed && { transform: [{ scale: 0.94 }] }]}>
          <LinearGradient colors={open ? ['#27A7D6', '#0C83BA'] : isDark ? ['#203A45', '#152B35'] : ['#FFFFFF', '#EAF3F7']} style={styles.homeButtonInner}>
            <Animated.View style={{ transform: [{ rotate: buttonRotate }] }}>
              {open ? <Ionicons name="close" size={24} color="#fff" /> : activeItem?.key === 'pet' ? <MiniPetGlyph size={27} /> : <Ionicons name={activeItem?.icon ?? 'home'} size={24} color={isDark ? '#72D1E8' : '#008EAC'} />}
            </Animated.View>
          </LinearGradient>
          <View style={[styles.homeButtonIndicator, { backgroundColor: open ? '#0E6FA8' : '#1688C1' }]} />
        </Pressable>
      </View>
    </View>
  );
}

function WelcomeHome({ c, pet, compact, onNavigate }: { c: typeof light; pet: PetProfile; compact: boolean; onNavigate: (tab: Tab) => void }) {
  return (
    <View style={styles.welcomeHome}>
      <LinearGradient colors={['#DDF8FF', '#F1ECFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.welcomeHero, compact && styles.welcomeHeroCompact]}>
        <View style={styles.welcomeCopy}>
          <View style={styles.welcomeChip}>
            <View style={styles.pulseDot} />
            <Text style={styles.welcomeChipText}>{pet.connected ? `${pet.name.toUpperCase()} BAĞLI` : 'DEMO PET HAZIR'}</Text>
          </View>
          <Text style={[styles.welcomeTitle, compact && styles.welcomeTitleCompact]}>Lumina dünyasına hoş geldin</Text>
          <Text style={styles.welcomeText}>Dostun hazır. Keşfetmek istediğin alanı seçerek başlayabilirsin.</Text>
          <Pressable onPress={() => onNavigate('features')} style={styles.welcomePrimary}>
            <Text style={styles.welcomePrimaryText}>Özellikleri keşfet</Text>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </Pressable>
        </View>
        <View style={[styles.welcomePetWrap, compact && styles.welcomePetWrapCompact]}>
          <PetFace size={compact ? 112 : 140} motion="dance" />
        </View>
      </LinearGradient>
      <View style={styles.welcomeSectionHead}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Hızlı başlangıç</Text>
          <Text style={[styles.welcomeSectionSub, { color: c.muted }]}>Sık kullandığın alanlara ulaş.</Text>
        </View>
        <Ionicons name="sparkles" size={19} color="#00A8CA" />
      </View>
      <View style={styles.welcomeQuickRow}>
        <Pressable onPress={() => onNavigate('modes')} style={({ pressed }) => [styles.welcomeQuickCard, { backgroundColor: c.card, borderColor: c.line }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.welcomeQuickIcon, { backgroundColor: '#E8E1FF' }]}>
            <Ionicons name="compass" size={24} color="#7C5CE5" />
          </View>
          <Text style={[styles.welcomeQuickTitle, { color: c.text }]}>Modunu seç</Text>
          <Text style={[styles.welcomeQuickSub, { color: c.muted }]}>Gününe uyum sağla</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#7C5CE5" />
        </Pressable>
        <Pressable onPress={() => onNavigate('pet')} style={({ pressed }) => [styles.welcomeQuickCard, { backgroundColor: c.card, borderColor: c.line }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.welcomeQuickIcon, { backgroundColor: c.cyanSoft }]}>
            <MiniPetGlyph size={29} />
          </View>
          <Text style={[styles.welcomeQuickTitle, { color: c.text }]}>Petini düzenle</Text>
          <Text style={[styles.welcomeQuickSub, { color: c.muted }]}>Göz ve hareketler</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#00A8CA" />
        </Pressable>
      </View>
      <View style={[styles.welcomeStatus, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={[styles.welcomeStatusIcon, { backgroundColor: pet.connected ? '#DFF8F1' : c.input }]}>
          <Ionicons name={pet.connected ? 'battery-half' : 'hardware-chip-outline'} size={23} color={pet.connected ? '#19A777' : '#00A8CA'} />
        </View>
        <View style={styles.flexOne}>
          <Text style={[styles.welcomeStatusTitle, { color: c.text }]}>{pet.connected ? `${pet.name} kullanıma hazır` : 'Temsili pet etkin'}</Text>
          <Text style={[styles.welcomeStatusSub, { color: c.muted }]}>{pet.connected ? 'Pil %82 · Bağlantı güçlü · Son senkronizasyon şimdi' : 'Gerçek petini daha sonra Ayarlar’dan bağlayabilirsin.'}</Text>
        </View>
        <View style={styles.welcomeReadyDot} />
      </View>
    </View>
  );
}

function AppShell({ onLogout, theme, setTheme, pet }: { onLogout: () => void; theme: Theme; setTheme: (theme: Theme) => void; pet: PetProfile }) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeItem | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [modal, setModal] = useState<{ title: string; premium?: boolean } | null>(null);
  const [robotExpression, setRobotExpression] = useState<PetExpression>('blink');
  const [petStats, setPetStats] = useState<PetStats>({ happiness: 72, energy: 64, battery: 82 });
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [preferences, setPreferences] = useState<AppPreferences>({
    notifications: true,
    autoConnect: true,
    haptics: true,
    appSounds: true,
    reduceMotion: false,
    language: 'Türkçe',
  });
  const tapPlayer = useAudioPlayer(require('./assets/sounds/tap.wav'));
  const playPlayer = useAudioPlayer(require('./assets/sounds/play.wav'));
  const rainPlayer = useAudioPlayer(require('./assets/sounds/rain.wav'));
  const firePlayer = useAudioPlayer(require('./assets/sounds/fire.wav'));
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    rainPlayer.loop = true;
    firePlayer.loop = true;
  }, [firePlayer, rainPlayer]);
  useEffect(() => {
    if (ambientSound === 'rain') {
      firePlayer.pause();
      rainPlayer.play();
    } else if (ambientSound === 'fire') {
      rainPlayer.pause();
      firePlayer.play();
    } else {
      rainPlayer.pause();
      firePlayer.pause();
    }
  }, [ambientSound, firePlayer, rainPlayer]);
  const playSound = (sound: 'tap' | 'play') => {
    if (!preferences.appSounds) return;
    const player = sound === 'tap' ? tapPlayer : playPlayer;
    player.seekTo(0).then(() => player.play()).catch(() => undefined);
  };
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const compact = width < 390;
  const c = theme === 'dark' ? dark : light;
  const title = tab ? { features: 'Özellikler', modes: 'Modlar', pet: 'Pet kişiselleştir', settings: 'Ayarlar & profil' }[tab] : '';
  const chooseTab = (nextTab: Tab) => {
    setSelectedFeature(null);
    setSelectedMode(null);
    setSelectedSetting(null);
    setTab(nextTab);
  };
  const content = () => {
    if (!tab) return <WelcomeHome c={c} pet={pet} compact={compact} onNavigate={chooseTab} />;
    if (tab === 'features' && selectedFeature) return <FeatureExperience feature={selectedFeature} c={c} onBack={() => setSelectedFeature(null)} onToast={(message) => setModal({ title: message })} onRobotExpression={setRobotExpression} onSound={playSound} />;
    if (tab === 'features') return <Features c={c} wide={wide} onSelect={setSelectedFeature} />;
    if (tab === 'modes' && selectedMode) return <ModeDetail mode={selectedMode} c={c} onBack={() => setSelectedMode(null)} expression={robotExpression} onExpressionChange={setRobotExpression} ambientSound={ambientSound} onAmbientSound={setAmbientSound} />;
    if (tab === 'modes') return <Modes c={c} onSelect={(modeTitle) => setSelectedMode(modeData.find((mode) => mode.title === modeTitle) ?? null)} />;
    if (tab === 'pet') return <PetCustomize c={c} pet={pet} stats={petStats} onStatsChange={setPetStats} expression={robotExpression} onExpressionChange={setRobotExpression} onSound={playSound} onPremium={(item) => setModal({ title: item, premium: true })} />;
    if (selectedSetting) return <SettingDetail title={selectedSetting} c={c} onBack={() => setSelectedSetting(null)} />;
    return <Settings c={c} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} preferences={preferences} onPreferencesChange={setPreferences} onLogout={onLogout} onSelect={setSelectedSetting} />;
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={[styles.appFrame, wide && styles.appFrameWide]}>
        {wide ? (
          <View style={[styles.sideNav, { backgroundColor: c.nav, borderColor: c.line }]}>
            <View style={styles.sideBrand}>
              <View style={styles.logoMark}>
                <Ionicons name="paw" size={19} color="#fff" />
              </View>
              <Text style={[styles.sideBrandText, { color: c.text }]}>Lumina</Text>
            </View>
            {tabs.map((item) => (
              <Pressable key={item.key} onPress={() => chooseTab(item.key)} style={[styles.sideItem, tab === item.key && { backgroundColor: c.cyanSoft }]}>
                <Ionicons name={tab === item.key ? item.icon : `${item.icon}-outline` as IconName} size={21} color={tab === item.key ? '#008BAA' : c.muted} />
                <Text style={[styles.sideLabel, { color: tab === item.key ? '#007C98' : c.muted }]}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.flexOne} />
            <View style={[styles.connectedCard, { backgroundColor: c.card }]}>
              <View style={[styles.pulseDot, { backgroundColor: pet.connected ? '#12C884' : '#F1A343' }]} />
              <View>
                <Text style={[styles.connectedTitle, { color: c.text }]}>{pet.connected ? `${pet.name} bağlı` : 'Demo pet'}</Text>
                <Text style={[styles.connectedSub, { color: c.muted }]}>{pet.connected ? `Pil %${petStats.battery}` : 'Bağlantı yok'}</Text>
              </View>
            </View>
          </View>
        ) : null}
        <View style={styles.mainColumn}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page, wide && styles.pageWide]}>
            <Header c={c} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} pet={pet} onAccount={() => chooseTab('settings')} />
            {wide && tab && !selectedFeature && !selectedMode && !selectedSetting ? <Text style={[styles.desktopPageLabel, { color: c.text }]}>{title}</Text> : null}
            {content()}
          </ScrollView>
          {!wide ? <RadialNav tab={tab} setTab={chooseTab} theme={theme} reduceMotion={preferences.reduceMotion} /> : null}
        </View>
      </View>
      <Modal visible={Boolean(modal)} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.cardSolid }]} onPress={() => undefined}>
            <View style={[styles.modalIcon, { backgroundColor: modal?.premium ? '#EADFFF' : c.cyanSoft }]}>
              <Ionicons name={modal?.premium ? 'lock-closed' : 'checkmark-circle'} size={30} color={modal?.premium ? '#7650C5' : '#00A8CA'} />
            </View>
            <Text style={[styles.modalTitle, { color: c.text }]}>{modal?.title}</Text>
            <Text style={[styles.modalText, { color: c.muted }]}>{modal?.premium ? 'Bu stil Lumina Plus paketine özel. Plus planını seçerek kilidi açabilir ve hemen kullanabilirsin.' : 'Seçimin kaydedildi ve ilgili ayarlar hesabına uygulandı.'}</Text>
            <Pressable onPress={() => setModal(null)} style={[styles.modalButton, modal?.premium && { backgroundColor: '#7650C5' }]}>
              <Text style={styles.modalButtonText}>{modal?.premium ? 'Plus’ı keşfet' : 'Tamam'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  const system = useColorScheme();
  const [logged, setLogged] = useState(false);
  const [theme, setTheme] = useState<Theme>(system === 'dark' ? 'dark' : 'light');
  const [pet, setPet] = useState<PetProfile | null>(null);
  const logout = () => {
    setLogged(false);
    setPet(null);
  };
  return (
    <SafeAreaProvider>
      {!logged ? (
        <Login onDone={() => setLogged(true)} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      ) : !pet ? (
        <PetConnect theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onContinue={setPet} />
      ) : (
        <AppShell onLogout={logout} theme={theme} setTheme={setTheme} pet={pet} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flexOne: { flex: 1 },
  orbOne: { position: 'absolute', width: 330, height: 330, borderRadius: 999, backgroundColor: 'rgba(0,210,255,.08)', top: -130, left: -130 },
  orbTwo: { position: 'absolute', width: 380, height: 380, borderRadius: 999, backgroundColor: 'rgba(180,144,254,.07)', bottom: -180, right: -150 },
  appFrame: { flex: 1 },
  appFrameWide: { flexDirection: 'row', maxWidth: 1240, width: '100%', alignSelf: 'center' },
  mainColumn: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 128, maxWidth: 760, width: '100%', alignSelf: 'center' },
  pageWide: { paddingHorizontal: 36, paddingBottom: 50, maxWidth: 950 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: { fontFamily: 'System', fontSize: 13, fontWeight: '500' },
  headerTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#20D58A', right: -1, bottom: 2, borderWidth: 2, borderColor: '#fff' },
  hero: { borderRadius: 32, overflow: 'hidden', marginBottom: 30, shadowColor: '#00677F', shadowOpacity: 0.12, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }, elevation: 3 },
  heroGradient: { minHeight: 204, padding: 22, flexDirection: 'row', alignItems: 'center' },
  heroCopy: { flex: 1, zIndex: 2 },
  onlineChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.72)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#12C884' },
  onlineText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#27727F' },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: '#17343B', letterSpacing: -0.5, maxWidth: 310, marginVertical: 15 },
  talkButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#008FAE', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 99 },
  talkText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  ear: { position: 'absolute', top: 15, backgroundColor: '#7DE1F7', borderRadius: 30, zIndex: 0 },
  petHead: { zIndex: 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,.8)', shadowColor: '#00BDE8', shadowOpacity: 0.2, shadowRadius: 15 },
  eyeRow: { flexDirection: 'row', gap: 23, height: 23, alignItems: 'center' },
  eye: { width: 15, borderRadius: 10, alignItems: 'flex-end', padding: 3, overflow: 'hidden' },
  eyeGlint: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  cheerfulEye: { width: 22, height: 12, borderTopWidth: 4, borderRadius: 12, transform: [{ rotate: '180deg' }] },
  mouth: { width: 25, height: 13, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: '#17353E', marginTop: 10, alignItems: 'center', overflow: 'hidden' },
  sleepyMouth: { width: 15, height: 6, borderRadius: 6, backgroundColor: '#46626B' },
  excitedMouth: { width: 31, height: 18 },
  tongue: { width: 12, height: 7, borderRadius: 7, backgroundColor: '#FF7899', marginTop: 7 },
  sparkleBadge: { position: 'absolute', top: 12, right: 12 },
  petGlow: { position: 'absolute', bottom: 3, borderRadius: 99, backgroundColor: 'rgba(0,189,232,.18)', transform: [{ scaleY: 0.4 }] },
  miniPetEar: { position: 'absolute', top: 2, borderRadius: 5, transform: [{ rotate: '-24deg' }] },
  miniPetEarRight: { transform: [{ rotate: '24deg' }] },
  miniPetHead: { zIndex: 2, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(22,143,185,.16)' },
  miniPetEye: { width: 3.5, height: 5, borderRadius: 3 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  sectionMeta: { fontSize: 13, fontWeight: '600' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { minHeight: 92, borderRadius: 23, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 10.5, fontWeight: '500' },
  radialLayer: { ...StyleSheet.absoluteFillObject },
  radialBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,54,72,.12)' },
  radialDock: { position: 'absolute', width: 280, height: 372, left: '50%', marginLeft: -140, bottom: Platform.OS === 'ios' ? 9 : 7, alignItems: 'center' },
  radialMenuWrap: { position: 'absolute', width: 260, height: 260, left: 10, bottom: 86, shadowColor: '#0B5672', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  radialMenu: { width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: '#D9EAF1', backgroundColor: 'rgba(255,255,255,.96)', overflow: 'hidden' },
  radialMenuDark: { borderColor: '#31505D', backgroundColor: 'rgba(19,37,45,.97)' },
  radialOrbitOuter: { position: 'absolute', width: 204, height: 204, borderRadius: 102, borderWidth: 1, borderColor: '#D9EDF5', left: 27, top: 27 },
  radialOrbitOuterDark: { borderColor: '#31515E' },
  radialOrbitInner: { position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 1, borderColor: '#CBE5F0', left: 65, top: 65 },
  radialOrbitInnerDark: { borderColor: '#3B6271' },
  radialHub: { position: 'absolute', width: 92, height: 92, borderRadius: 46, left: 83, top: 83, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#168EBB', shadowOpacity: 0.13, shadowRadius: 11 },
  radialHubDark: { borderColor: '#294B59' },
  radialHubDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#1596C5', top: 11 },
  radialHubText: { color: '#6A8290', fontSize: 8, fontWeight: '800', marginTop: 3, maxWidth: 72, textAlign: 'center' },
  radialHubTextDark: { color: '#C1D5DE' },
  radialItemSlot: { position: 'absolute', width: 64, minHeight: 64, alignItems: 'center', zIndex: 4 },
  radialItem: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#DCEAF0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#18566C', shadowOpacity: 0.1, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  radialItemDark: { borderColor: '#395762', backgroundColor: '#20353E', shadowColor: '#000000', shadowOpacity: 0.2 },
  radialItemSelected: { backgroundColor: '#1596C5', borderColor: '#FFFFFF', shadowColor: '#1596C5', shadowOpacity: 0.3, shadowRadius: 9, transform: [{ scale: 1.06 }] },
  radialItemLabel: { color: '#688493', backgroundColor: '#FFFFFF', fontSize: 8, fontWeight: '800', marginTop: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', minWidth: 58, maxWidth: 82, textAlign: 'center' },
  radialItemLabelDark: { color: '#C2D4DC', backgroundColor: '#20353E' },
  radialItemLabelSelected: { color: '#087DA9' },
  radialItemLabelSelectedDark: { color: '#7EDCF0' },
  homeButtonOuter: { position: 'absolute', width: 76, height: 76, borderRadius: 38, bottom: 4, left: 102, borderWidth: 1.5, borderColor: '#D6E7EE', backgroundColor: '#FFFFFF', padding: 7, alignItems: 'center', justifyContent: 'center', shadowColor: '#0B526D', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 14 },
  homeButtonOuterDark: { borderColor: '#3C5964', backgroundColor: '#172B34', shadowColor: '#000000', shadowOpacity: 0.32 },
  homeButtonOuterOpen: { borderColor: '#1596C5' },
  homeButtonInner: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.62)' },
  homeButtonIndicator: { position: 'absolute', width: 7, height: 7, borderRadius: 4, bottom: 6 },
  sideNav: { width: 230, borderRightWidth: 1, padding: 24, paddingTop: 34 },
  sideBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  logoMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#00A9C9', alignItems: 'center', justifyContent: 'center', shadowColor: '#00A9C9', shadowOpacity: 0.25, shadowRadius: 9 },
  sideBrandText: { fontSize: 22, fontWeight: '800' },
  sideItem: { height: 50, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12, marginBottom: 7 },
  sideLabel: { fontSize: 13, fontWeight: '700' },
  connectedCard: { padding: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectedTitle: { fontSize: 12, fontWeight: '700' },
  connectedSub: { fontSize: 10, marginTop: 2 },
  desktopPageLabel: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 20 },
  welcomeHome: { width: '100%' },
  welcomeHero: { minHeight: 242, borderRadius: 31, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 27, shadowColor: '#00677F', shadowOpacity: 0.1, shadowRadius: 21, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  welcomeHeroCompact: { minHeight: 230, padding: 17 },
  welcomeCopy: { flex: 1, zIndex: 2 },
  welcomeChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,.78)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  welcomeChipText: { color: '#267180', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  welcomeTitle: { color: '#17343B', fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.7, maxWidth: 330, marginTop: 14 },
  welcomeTitleCompact: { fontSize: 21, lineHeight: 26 },
  welcomeText: { color: '#587078', fontSize: 11.5, lineHeight: 17, maxWidth: 295, marginTop: 7 },
  welcomePrimary: { alignSelf: 'flex-start', height: 42, borderRadius: 15, backgroundColor: '#008FAE', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 },
  welcomePrimaryText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },
  welcomePetWrap: { width: 140, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  welcomePetWrapCompact: { width: 104, marginRight: -12 },
  welcomeSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  welcomeSectionSub: { fontSize: 11, marginTop: 3 },
  welcomeQuickRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  welcomeQuickCard: { flex: 1, minHeight: 148, borderWidth: 1, borderRadius: 24, padding: 14, alignItems: 'flex-start' },
  welcomeQuickIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  welcomeQuickTitle: { fontSize: 13, fontWeight: '800' },
  welcomeQuickSub: { flex: 1, fontSize: 9.5, marginTop: 3 },
  welcomeStatus: { minHeight: 78, borderWidth: 1, borderRadius: 23, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeStatusIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  welcomeStatusTitle: { fontSize: 12.5, fontWeight: '800' },
  welcomeStatusSub: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  welcomeReadyDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#1FC688', marginRight: 2 },
  pageIntro: { marginBottom: 25 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  pageSubtitle: { fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 470 },
  modeList: { gap: 14 },
  modeCard: { minHeight: 105, borderRadius: 27, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#1E768A', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modeIcon: { width: 56, height: 56, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modeDesc: { fontSize: 12.5, color: 'rgba(255,255,255,.78)', marginTop: 5 },
  modeBadge: { backgroundColor: 'rgba(255,255,255,.2)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  modeBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.7 },
  modeDetailHero: { minHeight: 225, borderRadius: 31, padding: 21, justifyContent: 'flex-end', marginBottom: 18, shadowColor: '#1E768A', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 9 } },
  modeDetailTop: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeDetailIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)', alignItems: 'center', justifyContent: 'center' },
  modeLivePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  modeLiveText: { color: '#fff', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.7 },
  modeHeroContent: { flexDirection: 'row', alignItems: 'flex-end' },
  modeHeroCopy: { flex: 1, zIndex: 2 },
  modePetPreview: { width: 108, height: 98, alignItems: 'center', justifyContent: 'center', marginRight: -5, marginBottom: -5 },
  modeDetailTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  modeDetailHeadline: { color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 19, marginTop: 5, maxWidth: 420 },
  modeMasterCard: { minHeight: 79, borderWidth: 1, borderRadius: 23, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 21 },
  modeSegment: { height: 50, borderRadius: 17, padding: 4, flexDirection: 'row', marginBottom: 19 },
  modeSegmentOption: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeSegmentText: { fontSize: 11, fontWeight: '800' },
  ambientGrid: { flexDirection: 'row', gap: 9, marginBottom: 21 },
  ambientCard: { flex: 1, minHeight: 132, borderWidth: 1.5, borderRadius: 22, padding: 12, alignItems: 'center' },
  ambientIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  ambientTitle: { fontSize: 11.5, fontWeight: '800' },
  ambientSub: { fontSize: 8.5, lineHeight: 12, textAlign: 'center', marginTop: 3 },
  ambientActive: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routineCard: { minHeight: 78, borderWidth: 1, borderRadius: 23, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 17 },
  routineIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  smallEditButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeSaveButton: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  petStage: { borderWidth: 1, borderRadius: 32, minHeight: 310, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 28 },
  stageGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 150, backgroundColor: 'rgba(0,210,255,.08)' },
  petAuraWrap: { position: 'absolute', width: 278, height: 278, alignItems: 'center', justifyContent: 'center' },
  petAuraOuter: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1.5 },
  petAuraMiddle: { position: 'absolute', width: 218, height: 218, borderRadius: 109, borderWidth: 1 },
  petAuraCore: { width: 190, height: 190, borderRadius: 95 },
  petAuraSpark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, opacity: .7 },
  petAuraSparkOne: { top: 34, right: 52 },
  petAuraSparkTwo: { bottom: 52, left: 35, width: 4, height: 4 },
  moodChip: { position: 'absolute', top: 18, left: 18, minHeight: 30, borderRadius: 99, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  moodChipText: { fontSize: 8, fontWeight: '900', letterSpacing: .65 },
  statusChip: { position: 'absolute', top: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  petName: { fontSize: 21, fontWeight: '800', marginTop: -8 },
  petMood: { fontSize: 12, marginTop: 4 },
  robotSyncPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, marginTop: 10 },
  robotSyncText: { color: '#008CAA', fontSize: 7.5, fontWeight: '900', letterSpacing: .55 },
  petStatsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  petStatCard: { flex: 1, minHeight: 98, borderWidth: 1, borderRadius: 20, padding: 11 },
  petStatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  petStatValue: { fontSize: 15, fontWeight: '900' },
  petStatLabel: { fontSize: 9, fontWeight: '700', marginTop: 8 },
  petStatTrack: { height: 5, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  petStatFill: { height: 5, borderRadius: 4 },
  petActionRow: { gap: 10, marginBottom: 27 },
  petActionCard: { minHeight: 82, borderWidth: 1.5, borderRadius: 23, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  petActionIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  petActionTitle: { fontSize: 15, fontWeight: '900' },
  petActionSub: { fontSize: 9.5, marginTop: 4 },
  personalizeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  personalizeSub: { fontSize: 12, marginTop: 4 },
  plusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EADFFF', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  plusPillText: { fontSize: 9, fontWeight: '900', color: '#704BBE', letterSpacing: 0.7 },
  choiceSection: { marginBottom: 22 },
  choiceScroll: { gap: 10, paddingRight: 20 },
  choiceCard: { width: 128, minHeight: 116, borderWidth: 1.5, borderRadius: 23, padding: 13, justifyContent: 'center', alignItems: 'center' },
  colorDot: { width: 31, height: 31, borderRadius: 16, borderWidth: 4, borderColor: 'rgba(255,255,255,.8)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5 },
  choiceTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 9, minHeight: 28 },
  lockBadge: { flexDirection: 'row', gap: 3, alignItems: 'center', backgroundColor: '#EADFFF', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99 },
  lockText: { fontSize: 7.5, fontWeight: '900', color: '#7550C4', letterSpacing: 0.5 },
  freeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  voiceSection: { marginBottom: 23 },
  voiceSectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 },
  voiceSettingLabel: { marginLeft: 0, marginBottom: 2, marginTop: 0 },
  voiceHint: { fontSize: 9.5, lineHeight: 14 },
  voiceCountPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 99 },
  voiceCountText: { color: '#008DAA', fontSize: 7.5, fontWeight: '900', letterSpacing: .6 },
  voiceScroll: { gap: 10, paddingRight: 20 },
  voiceCard: { width: 144, minHeight: 154, borderWidth: 1.5, borderRadius: 23, padding: 13 },
  voiceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voiceIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  voicePlay: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  voiceTitle: { fontSize: 13, fontWeight: '900', marginTop: 11 },
  voiceDesc: { fontSize: 9.5, marginTop: 3 },
  voiceGroupPill: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 99, marginTop: 10 },
  voiceGroupText: { fontSize: 7.5, fontWeight: '900', letterSpacing: .55 },
  sensorRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 13 },
  profileCard: { borderWidth: 1, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 27 },
  profileAvatar: { width: 66, height: 66, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileMail: { fontSize: 11.5, marginTop: 4 },
  premiumChip: { alignSelf: 'flex-start', flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#EADFFF', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 99, marginTop: 7 },
  premiumText: { fontSize: 9, fontWeight: '800', color: '#6C49B3' },
  settingsTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 13 },
  settingsTitleCopy: { flex: 1, minWidth: 0 },
  settingsDashboardTitle: { marginBottom: 0 },
  settingsDashboardSub: { fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  settingsManageButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingsStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 24 },
  settingsStatCard: { flexGrow: 1, flexBasis: '47%', minHeight: 84, borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsStatCopy: { flex: 1, minWidth: 0 },
  settingsStatValue: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  settingsStatLabel: { fontSize: 7.5, lineHeight: 11, fontWeight: '900', letterSpacing: .55, marginTop: 2 },
  settingLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 5, marginBottom: 9, marginTop: 4 },
  settingGroup: { borderWidth: 1, borderRadius: 25, overflow: 'hidden', marginBottom: 22 },
  settingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 9, gap: 13 },
  settingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 13.5, fontWeight: '700' },
  settingSub: { fontSize: 10.5, marginTop: 3 },
  settingControl: { width: 58, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  languageCard: { borderWidth: 1, borderRadius: 25, padding: 14, marginBottom: 22 },
  languageCopy: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 13 },
  languageSegment: { height: 44, borderRadius: 15, padding: 4, flexDirection: 'row' },
  languageOption: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  languageOptionSelected: { backgroundColor: '#00A9C9' },
  languageOptionText: { fontSize: 11.5, fontWeight: '800' },
  settingDetailHero: { minHeight: 112, borderWidth: 1, borderRadius: 27, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  settingDetailIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settingDetailTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  settingDetailDesc: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  detailFormCard: { borderWidth: 1, borderRadius: 26, padding: 16 },
  formLabel: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.9, marginLeft: 3, marginBottom: 7, marginTop: 7 },
  detailInput: { height: 52, borderRadius: 16, paddingHorizontal: 14, fontSize: 12.5, marginBottom: 9 },
  detailInputWithIcon: { height: 52, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  detailInputFlex: { flex: 1, fontSize: 12.5 },
  detailTextarea: { minHeight: 126, borderRadius: 17, padding: 14, fontSize: 12.5, lineHeight: 19, marginBottom: 13 },
  settingPrimaryButton: { height: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 11 },
  settingPrimaryText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  categoryChip: { flex: 1, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  categoryChipText: { fontSize: 10.5, fontWeight: '800' },
  helpSearch: { height: 52, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 15 },
  helpRow: { minHeight: 67, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  helpNumber: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  helpNumberText: { fontSize: 11, fontWeight: '900' },
  helpQuestion: { flex: 1, fontSize: 12, fontWeight: '700' },
  answerCard: { borderRadius: 20, padding: 15, marginTop: -7, marginBottom: 17 },
  answerText: { fontSize: 11, lineHeight: 17, marginTop: 6 },
  aboutRow: { minHeight: 63, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  aboutValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aboutValue: { fontSize: 10.5, fontWeight: '600' },
  planCard: { minHeight: 102, borderRadius: 25, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 17 },
  planTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  planSub: { color: 'rgba(255,255,255,.78)', fontSize: 9.5, marginTop: 4 },
  planPrice: { color: '#fff', fontSize: 18, fontWeight: '900' },
  logout: { height: 54, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 13, fontWeight: '700', color: '#E34F64' },
  version: { textAlign: 'center', fontSize: 10, marginTop: 15 },
  authWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 35, maxWidth: 520, width: '100%', alignSelf: 'center', minHeight: Dimensions.get('window').height },
  authTop: { height: 55, flexDirection: 'row', alignItems: 'center', gap: 9 },
  brand: { fontSize: 21, fontWeight: '800' },
  themeButton: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  authPet: { height: 185, alignItems: 'center', justifyContent: 'center' },
  helloBubble: { position: 'absolute', top: 16, right: '20%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, shadowColor: '#00677F', shadowOpacity: 0.1, shadowRadius: 10 },
  helloText: { fontSize: 12, fontWeight: '700' },
  authHeading: { alignItems: 'center', marginBottom: 20 },
  authTitle: { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  authSubtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7, maxWidth: 390 },
  authCard: { borderWidth: 1, borderRadius: 30, padding: 18, shadowColor: '#00677F', shadowOpacity: 0.08, shadowRadius: 25, shadowOffset: { width: 0, height: 10 } },
  inputWrap: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 13, fontWeight: '500', outlineStyle: 'none' } as any,
  forgot: { color: '#008EAC', fontSize: 11.5, fontWeight: '700', textAlign: 'right', marginTop: -2, marginBottom: 14 },
  primaryButton: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#00A8CA', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 17 },
  dividerLine: { height: 1, flex: 1 },
  orText: { fontSize: 10 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, height: 50, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialText: { fontSize: 12.5, fontWeight: '700' },
  googleG: { fontSize: 20, fontWeight: '900', color: '#4285F4' },
  signup: { fontSize: 11.5, textAlign: 'center', marginTop: 18 },
  backLogin: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 15 },
  connectTop: { height: 70, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 22 },
  connectBody: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  connectEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  connectTitle: { fontSize: 29, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  connectSubtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 410, marginTop: 8, marginBottom: 22 },
  connectVisual: { width: '100%', minHeight: 310, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20 },
  connectRings: { position: 'absolute', width: 265, height: 265, borderRadius: 140, borderWidth: 28, borderColor: 'rgba(0,189,232,.07)' },
  connectionPill: { position: 'absolute', bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  connectionDot: { width: 7, height: 7, borderRadius: 4 },
  connectionText: { fontSize: 10.5, fontWeight: '800' },
  connectActions: { width: '100%', gap: 10 },
  connectPrimary: { width: '100%', height: 55, borderRadius: 19, backgroundColor: '#00A8CA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  connectPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  connectSecondary: { width: '100%', height: 52, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  connectSecondaryText: { fontSize: 13, fontWeight: '700' },
  backButton: { alignSelf: 'flex-start', height: 42, paddingHorizontal: 13, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  backButtonText: { fontSize: 12, fontWeight: '700' },
  featureDetailHero: { minHeight: 230, borderRadius: 32, padding: 22, justifyContent: 'flex-end', marginBottom: 18 },
  detailHeroIcon: { width: 62, height: 62, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  detailEyebrow: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,.75)', letterSpacing: 1.2 },
  detailTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4 },
  detailHeadline: { color: 'rgba(255,255,255,.84)', fontSize: 14, marginTop: 5 },
  liveCard: { minHeight: 88, borderWidth: 1, borderRadius: 24, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  liveIcon: { width: 49, height: 49, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  liveLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  liveValue: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: { flex: 1, height: 86, borderWidth: 1.5, borderRadius: 21, alignItems: 'center', justifyContent: 'center', gap: 8 },
  quickLabel: { fontSize: 10.5, fontWeight: '800' },
  activityCard: { borderWidth: 1, borderRadius: 24, padding: 17, marginBottom: 18 },
  activityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityTitle: { fontSize: 14, fontWeight: '800' },
  activitySub: { fontSize: 10.5, marginTop: 3 },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  readyText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  activityLine: { height: 1, marginVertical: 14 },
  activityMessage: { fontSize: 11.5, lineHeight: 18 },
  detailAction: { height: 55, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  detailActionText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,15,18,.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 390, borderRadius: 30, padding: 25, alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginTop: 15, textAlign: 'center' },
  modalText: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  modalButton: { height: 48, borderRadius: 17, backgroundColor: '#00A8CA', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  modalButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
