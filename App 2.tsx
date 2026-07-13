import React, { useMemo, useState } from 'react';
import {
  Alert, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, useColorScheme, useWindowDimensions, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'features' | 'modes' | 'pet' | 'settings';
type Theme = 'light' | 'dark';

const featureData: { title: string; subtitle: string; icon: IconName; color: string }[] = [
  { title: 'Lumina AI', subtitle: 'Her konuda yanında', icon: 'sparkles', color: '#00BDE8' },
  { title: 'Çevirmen', subtitle: 'Anında 40+ dil', icon: 'language', color: '#7C5CE5' },
  { title: 'Müzik kutusu', subtitle: 'Ruh haline göre', icon: 'musical-notes', color: '#FF709D' },
  { title: 'Not defteri', subtitle: 'Sesli not & bağlantı', icon: 'mic', color: '#F29B38' },
  { title: 'Saat & alarm', subtitle: 'Akıllı rutinler', icon: 'alarm', color: '#4D8CF5' },
  { title: 'Telefon', subtitle: 'Eller serbest konuş', icon: 'call', color: '#22B98A' },
  { title: 'Akıllı lamba', subtitle: 'Ortamını aydınlat', icon: 'bulb', color: '#F1B830' },
  { title: 'IoT merkezi', subtitle: 'Evin tek dokunuşta', icon: 'home', color: '#00A7A5' },
  { title: 'Mini oyunlar', subtitle: 'Birlikte eğlenin', icon: 'game-controller', color: '#8E65EA' },
  { title: 'Akıllı ayna', subtitle: 'Güne iyi başla', icon: 'scan-circle', color: '#EE6A9A' },
  { title: 'Hatırlatıcı', subtitle: 'Hiçbir şeyi unutma', icon: 'notifications', color: '#EF7B45' },
  { title: 'Hava durumu', subtitle: 'Bugün 24° · Açık', icon: 'partly-sunny', color: '#4D9AE8' },
  { title: 'Ses kaydı', subtitle: 'Anıları yakala', icon: 'radio', color: '#DB597E' },
  { title: 'Adım sayar', subtitle: 'Bugün 6.240 adım', icon: 'footsteps', color: '#28B97A' },
];

const modeData: { title: string; desc: string; icon: IconName; colors: [string, string]; badge?: string }[] = [
  { title: 'Pet modu', desc: 'Oyun, bakım ve duygusal bağ', icon: 'paw', colors: ['#00C7EC', '#4E91F5'], badge: 'AKTİF' },
  { title: 'Asistan modu', desc: 'Planla, sor ve üretken kal', icon: 'sparkles', colors: ['#7D5CE5', '#AA78F2'] },
  { title: 'Gece asistanı', desc: 'Sessiz, loş ve sakin bir gece', icon: 'moon', colors: ['#263C79', '#6E58B5'] },
  { title: 'Lumina GO', desc: 'Dışarıda keşfet, dostları yakala', icon: 'navigate-circle', colors: ['#19B781', '#00A9C9'], badge: 'YENİ' },
  { title: 'Ebeveyn modu', desc: 'Çocuklar için güvenli alan', icon: 'shield-checkmark', colors: ['#F19B42', '#EB668A'] },
];

const petMoves: { title: string; icon: IconName; color: string }[] = [
  { title: 'Yanıma gel', icon: 'navigate', color: '#00BDE8' },
  { title: 'Otur', icon: 'download', color: '#7C5CE5' },
  { title: 'Takip et', icon: 'footsteps', color: '#25B989' },
  { title: 'Dans et', icon: 'musical-note', color: '#EF719A' },
  { title: 'Etrafında dön', icon: 'refresh', color: '#F2A13E' },
  { title: 'Şarj istasyonuna', icon: 'battery-charging', color: '#4B8EEA' },
];

const tabs: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'features', label: 'Özellikler', icon: 'grid' },
  { key: 'modes', label: 'Modlar', icon: 'planet' },
  { key: 'pet', label: 'Pet kontrol', icon: 'paw' },
  { key: 'settings', label: 'Ayarlar', icon: 'person' },
];

const light = { bg: '#F4F8FA', card: 'rgba(255,255,255,0.78)', cardSolid: '#FFFFFF', text: '#172126', muted: '#68777D', line: 'rgba(108,121,127,0.14)', nav: 'rgba(248,251,252,0.92)', input: '#EDF3F5', cyanSoft: '#DDF8FF' };
const dark = { bg: '#101719', card: 'rgba(29,39,43,0.88)', cardSolid: '#1B2529', text: '#F2F7F8', muted: '#9CAEB4', line: 'rgba(187,201,207,0.12)', nav: 'rgba(20,29,32,0.94)', input: '#253237', cyanSoft: '#123941' };

function GlassCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  return onPress
    ? <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { transform: [{ scale: .98 }] }]}>{children}</Pressable>
    : <View style={style}>{children}</View>;
}

function PetFace({ size = 124 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.ear, { left: size * .12, transform: [{ rotate: '-22deg' }], width: size*.34, height: size*.4 }]} />
      <View style={[styles.ear, { right: size * .12, transform: [{ rotate: '22deg' }], width: size*.34, height: size*.4 }]} />
      <LinearGradient colors={['#F2FBFF', '#BDEFFF']} style={[styles.petHead, { width: size*.78, height: size*.68, borderRadius: size*.3 }]}>
        <View style={styles.eyeRow}><View style={styles.eye}><View style={styles.eyeGlint}/></View><View style={styles.eye}><View style={styles.eyeGlint}/></View></View>
        <View style={styles.mouth}><View style={styles.tongue}/></View>
      </LinearGradient>
      <View style={[styles.petGlow, { width: size*.7, height: size*.15, bottom: 3 }]} />
    </View>
  );
}

function Login({ onDone, theme, toggleTheme }: { onDone: () => void; theme: Theme; toggleTheme: () => void }) {
  const c = theme === 'dark' ? dark : light;
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  return <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]}>
    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    <View style={styles.orbOne}/><View style={styles.orbTwo}/>
    <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
      <View style={styles.authTop}>
        <View style={styles.logoMark}><Ionicons name="paw" size={20} color="#fff"/></View>
        <Text style={[styles.brand, { color: c.text }]}>Lumina</Text>
        <Pressable onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: c.card }]}><Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color={c.text}/></Pressable>
      </View>
      <View style={styles.authPet}><PetFace size={150}/><View style={[styles.helloBubble, { backgroundColor: c.cardSolid }]}><Text style={{fontSize:20}}>👋</Text><Text style={[styles.helloText,{color:c.text}]}>Merhaba!</Text></View></View>
      <View style={styles.authHeading}>
        <Text style={[styles.authTitle, { color: c.text }]}>{forgot ? 'Şifreni yenile' : 'Dostun seni bekliyor'}</Text>
        <Text style={[styles.authSubtitle, { color: c.muted }]}>{forgot ? 'E-posta adresine yenileme bağlantısı gönderelim.' : 'Lumina ile daha akıllı, daha eğlenceli bir güne başla.'}</Text>
      </View>
      <View style={[styles.authCard, { backgroundColor: c.card, borderColor: theme === 'dark' ? c.line : '#fff' }]}>
        <View style={[styles.inputWrap, { backgroundColor: c.input }]}><Ionicons name="mail-outline" size={20} color={c.muted}/><TextInput value={email} onChangeText={setEmail} placeholder="E-posta adresi" placeholderTextColor={c.muted} autoCapitalize="none" style={[styles.input, { color: c.text }]}/></View>
        {!forgot && <View style={[styles.inputWrap, { backgroundColor: c.input }]}><Ionicons name="lock-closed-outline" size={20} color={c.muted}/><TextInput value={password} onChangeText={setPassword} placeholder="Şifre" placeholderTextColor={c.muted} secureTextEntry={!show} style={[styles.input, { color: c.text }]}/><Pressable onPress={()=>setShow(!show)}><Ionicons name={show?'eye-off-outline':'eye-outline'} size={20} color={c.muted}/></Pressable></View>}
        {!forgot && <Pressable onPress={()=>setForgot(true)}><Text style={styles.forgot}>Şifremi unuttum</Text></Pressable>}
        <Pressable onPress={forgot ? ()=>setForgot(false) : onDone}><LinearGradient colors={['#00D2FF','#0089B7']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{forgot ? 'Bağlantı gönder' : 'Giriş yap'}</Text><Ionicons name="arrow-forward" size={19} color="#fff"/></LinearGradient></Pressable>
        {forgot ? <Pressable onPress={()=>setForgot(false)}><Text style={[styles.backLogin,{color:c.muted}]}>Giriş ekranına dön</Text></Pressable> : <>
          <View style={styles.divider}><View style={[styles.dividerLine,{backgroundColor:c.line}]}/><Text style={[styles.orText,{color:c.muted}]}>veya</Text><View style={[styles.dividerLine,{backgroundColor:c.line}]}/></View>
          <View style={styles.socialRow}>
            <Pressable onPress={onDone} style={[styles.socialButton,{backgroundColor:c.cardSolid,borderColor:c.line}]}><Ionicons name="logo-apple" size={23} color={c.text}/><Text style={[styles.socialText,{color:c.text}]}>Apple</Text></Pressable>
            <Pressable onPress={onDone} style={[styles.socialButton,{backgroundColor:c.cardSolid,borderColor:c.line}]}><Text style={styles.googleG}>G</Text><Text style={[styles.socialText,{color:c.text}]}>Google</Text></Pressable>
          </View>
        </>}
      </View>
      <Text style={[styles.signup,{color:c.muted}]}>Hesabın yok mu? <Text style={{color:'#008FAE',fontWeight:'700'}}>Hemen kaydol</Text></Text>
    </ScrollView>
  </SafeAreaView>
}

function Header({ c, theme, toggleTheme }: { c: typeof light; theme: Theme; toggleTheme: () => void }) {
  return <View style={styles.header}><View><Text style={[styles.greeting,{color:c.muted}]}>Günaydın, Berkay</Text><Text style={[styles.headerTitle,{color:c.text}]}>Bugün ne yapalım?</Text></View><View style={styles.headerActions}><Pressable onPress={toggleTheme} style={[styles.iconButton,{backgroundColor:c.card}]}><Ionicons name={theme==='dark'?'sunny':'moon'} size={20} color={c.text}/></Pressable><View style={[styles.avatar,{backgroundColor:c.cyanSoft}]}><Ionicons name="person" size={21} color="#008BAA"/><View style={styles.onlineDot}/></View></View></View>
}

function Features({ c, wide, onSelect }: { c: typeof light; wide: boolean; onSelect: (s:string)=>void }) {
  return <><View style={styles.hero}>
    <LinearGradient colors={['#D9F8FF','#F0E9FF']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.heroGradient}>
      <View style={styles.heroCopy}><View style={styles.onlineChip}><View style={styles.pulseDot}/><Text style={styles.onlineText}>LUMINA ÇEVRİMİÇİ</Text></View><Text style={styles.heroTitle}>Merhaba! Nasıl yardımcı olabilirim?</Text><Pressable onPress={()=>onSelect('Lumina AI')} style={styles.talkButton}><Ionicons name="mic" size={20} color="#fff"/><Text style={styles.talkText}>Benimle konuş</Text></Pressable></View><PetFace size={wide?150:112}/>
    </LinearGradient></View>
    <View style={styles.sectionHead}><Text style={[styles.sectionTitle,{color:c.text}]}>Tüm özellikler</Text><Text style={[styles.sectionMeta,{color:c.muted}]}>14 araç</Text></View>
    <View style={styles.featureGrid}>{featureData.map((item)=><GlassCard key={item.title} onPress={()=>onSelect(item.title)} style={[styles.featureCard,{backgroundColor:c.card,borderColor:c.line,width:wide?'31.8%':'48.1%'}]}><View style={[styles.featureIcon,{backgroundColor:item.color+'18'}]}><Ionicons name={item.icon} size={25} color={item.color}/></View><View style={{flex:1}}><Text style={[styles.cardTitle,{color:c.text}]}>{item.title}</Text><Text style={[styles.cardSubtitle,{color:c.muted}]} numberOfLines={1}>{item.subtitle}</Text></View><Ionicons name="chevron-forward" size={17} color={c.muted}/></GlassCard>)}</View></>;
}

function Modes({ c, onSelect }: { c:typeof light; onSelect:(s:string)=>void }) {
  return <><View style={styles.pageIntro}><Text style={[styles.pageTitle,{color:c.text}]}>Bir mod seç</Text><Text style={[styles.pageSubtitle,{color:c.muted}]}>Lumina, günün her anına seninle uyum sağlar.</Text></View><View style={styles.modeList}>{modeData.map((m)=><Pressable key={m.title} onPress={()=>onSelect(m.title)} style={({pressed})=>[pressed&&{opacity:.85}]}><LinearGradient colors={m.colors} style={styles.modeCard}><View style={styles.modeIcon}><Ionicons name={m.icon} size={28} color="#fff"/></View><View style={{flex:1}}><View style={styles.modeTitleRow}><Text style={styles.modeTitle}>{m.title}</Text>{m.badge&&<View style={styles.modeBadge}><Text style={styles.modeBadgeText}>{m.badge}</Text></View>}</View><Text style={styles.modeDesc}>{m.desc}</Text></View><Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,.8)"/></LinearGradient></Pressable>)}</View></>;
}

function PetControl({ c, onSelect }: { c:typeof light; onSelect:(s:string)=>void }) {
  return <><View style={[styles.petStage,{backgroundColor:c.card,borderColor:c.line}]}><View style={styles.stageGlow}/><View style={styles.statusChip}><View style={styles.pulseDot}/><Text style={styles.statusText}>BAĞLI · %82</Text></View><PetFace size={190}/><Text style={[styles.petName,{color:c.text}]}>Milo</Text><Text style={[styles.petMood,{color:c.muted}]}>Mutlu ve seni dinliyor</Text></View><View style={styles.sectionHead}><Text style={[styles.sectionTitle,{color:c.text}]}>Pet hareketleri</Text><View style={[styles.voiceMini,{backgroundColor:c.cyanSoft}]}><Ionicons name="mic" size={14} color="#008BAA"/><Text style={styles.voiceMiniText}>Sesli kontrol</Text></View></View><View style={styles.moveGrid}>{petMoves.map(m=><GlassCard key={m.title} onPress={()=>onSelect(m.title)} style={[styles.moveCard,{backgroundColor:c.card,borderColor:c.line}]}><View style={[styles.moveIcon,{backgroundColor:m.color+'18'}]}><Ionicons name={m.icon} size={27} color={m.color}/></View><Text style={[styles.moveTitle,{color:c.text}]}>{m.title}</Text></GlassCard>)}</View><Pressable onPress={()=>onSelect('Acil durdur')} style={[styles.stopButton,{borderColor:'#EF6680'}]}><Ionicons name="stop-circle" size={20} color="#E54F6D"/><Text style={styles.stopText}>Hareketi durdur</Text></Pressable></>;
}

function Settings({ c, theme, toggleTheme, onLogout, onSelect }: { c:typeof light;theme:Theme;toggleTheme:()=>void;onLogout:()=>void;onSelect:(s:string)=>void }) {
  const rows:{title:string;sub:string;icon:IconName;color:string}[]=[
    {title:'Kontrol paneli',sub:'Cihazlar, kullanım ve bağlantılar',icon:'options',color:'#00A9C9'},
    {title:'Şifre',sub:'Giriş şifreni değiştir',icon:'key',color:'#7B5DDE'},
    {title:'Güvenlik',sub:'PIN, ebeveyn kilidi ve izinler',icon:'shield-checkmark',color:'#22AE7D'},
    {title:'Ses',sub:'Ses seviyesi ve Lumina sesi',icon:'volume-high',color:'#EF8C3D'},
    {title:'Görüntü',sub:'Parlaklık ve animasyonlar',icon:'color-palette',color:'#E36191'},
  ];
  return <><View style={[styles.profileCard,{backgroundColor:c.card,borderColor:c.line}]}><View style={[styles.profileAvatar,{backgroundColor:c.cyanSoft}]}><Ionicons name="person" size={38} color="#008DAA"/></View><View style={{flex:1}}><Text style={[styles.profileName,{color:c.text}]}>Berkay Ünsal</Text><Text style={[styles.profileMail,{color:c.muted}]}>berkay@lumina.pet</Text><View style={styles.premiumChip}><Ionicons name="sparkles" size={12} color="#6C49B3"/><Text style={styles.premiumText}>Lumina Plus</Text></View></View><Pressable onPress={()=>onSelect('Profili düzenle')}><Ionicons name="create-outline" size={22} color={c.muted}/></Pressable></View><Text style={[styles.settingLabel,{color:c.muted}]}>GÖRÜNÜM</Text><View style={[styles.settingGroup,{backgroundColor:c.card,borderColor:c.line}]}><View style={styles.settingRow}><View style={[styles.settingIcon,{backgroundColor:'#4D8CF518'}]}><Ionicons name={theme==='dark'?'moon':'sunny'} size={21} color="#4D8CF5"/></View><View style={{flex:1}}><Text style={[styles.settingTitle,{color:c.text}]}>Koyu tema</Text><Text style={[styles.settingSub,{color:c.muted}]}>{theme==='dark'?'Açık':'Kapalı'}</Text></View><Switch value={theme==='dark'} onValueChange={toggleTheme} trackColor={{false:'#C8D3D7',true:'#00A9C9'}} thumbColor="#fff"/></View></View><Text style={[styles.settingLabel,{color:c.muted}]}>AYARLAR</Text><View style={[styles.settingGroup,{backgroundColor:c.card,borderColor:c.line}]}>{rows.map((r,i)=><Pressable key={r.title} onPress={()=>onSelect(r.title)} style={[styles.settingRow,i<rows.length-1&&{borderBottomWidth:1,borderBottomColor:c.line}]}><View style={[styles.settingIcon,{backgroundColor:r.color+'18'}]}><Ionicons name={r.icon} size={21} color={r.color}/></View><View style={{flex:1}}><Text style={[styles.settingTitle,{color:c.text}]}>{r.title}</Text><Text style={[styles.settingSub,{color:c.muted}]}>{r.sub}</Text></View><Ionicons name="chevron-forward" size={18} color={c.muted}/></Pressable>)}</View><Pressable onPress={onLogout} style={[styles.logout,{backgroundColor:c.card,borderColor:c.line}]}><Ionicons name="log-out-outline" size={21} color="#E34F64"/><Text style={styles.logoutText}>Çıkış yap</Text></Pressable><Text style={[styles.version,{color:c.muted}]}>Lumina Pet · Sürüm 1.0.0</Text></>;
}

function AppShell({ onLogout }: { onLogout:()=>void }) {
  const system = useColorScheme();
  const [theme,setTheme]=useState<Theme>(system==='dark'?'dark':'light');
  const [tab,setTab]=useState<Tab>('features');
  const [modal,setModal]=useState<string|null>(null);
  const {width}=useWindowDimensions();
  const wide=width>=760;
  const c=theme==='dark'?dark:light;
  const title={features:'Özellikler',modes:'Modlar',pet:'Pet kontrol',settings:'Ayarlar & profil'}[tab];
  return <SafeAreaView style={[styles.fill,{backgroundColor:c.bg}]} edges={['top','left','right']}><StatusBar style={theme==='dark'?'light':'dark'}/><View style={styles.orbOne}/><View style={styles.orbTwo}/><View style={[styles.appFrame,wide&&styles.appFrameWide]}>
    {wide&&<View style={[styles.sideNav,{backgroundColor:c.nav,borderColor:c.line}]}><View style={styles.sideBrand}><View style={styles.logoMark}><Ionicons name="paw" size={19} color="#fff"/></View><Text style={[styles.sideBrandText,{color:c.text}]}>Lumina</Text></View>{tabs.map(t=><Pressable key={t.key} onPress={()=>setTab(t.key)} style={[styles.sideItem,tab===t.key&&{backgroundColor:c.cyanSoft}]}><Ionicons name={tab===t.key?t.icon:(t.icon+'-outline') as IconName} size={21} color={tab===t.key?'#008BAA':c.muted}/><Text style={[styles.sideLabel,{color:tab===t.key?'#007C98':c.muted}]}>{t.label}</Text></Pressable>)}<View style={{flex:1}}/><View style={[styles.connectedCard,{backgroundColor:c.card}]}><View style={styles.pulseDot}/><View><Text style={[styles.connectedTitle,{color:c.text}]}>Milo bağlı</Text><Text style={[styles.connectedSub,{color:c.muted}]}>Pil %82</Text></View></View></View>}
    <View style={styles.mainColumn}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page,wide&&styles.pageWide]}><Header c={c} theme={theme} toggleTheme={()=>setTheme(theme==='dark'?'light':'dark')}/>{tab!=='features'&&<Text style={[styles.desktopPageLabel,{color:c.text}]}>{title}</Text>}{tab==='features'&&<Features c={c} wide={wide} onSelect={setModal}/>} {tab==='modes'&&<Modes c={c} onSelect={setModal}/>} {tab==='pet'&&<PetControl c={c} onSelect={setModal}/>} {tab==='settings'&&<Settings c={c} theme={theme} toggleTheme={()=>setTheme(theme==='dark'?'light':'dark')} onLogout={onLogout} onSelect={setModal}/>}</ScrollView>
      {!wide&&<BlurView intensity={Platform.OS==='web'?35:65} tint={theme} style={[styles.bottomNav,{backgroundColor:c.nav,borderColor:c.line}]}>{tabs.map(t=><Pressable key={t.key} onPress={()=>setTab(t.key)} style={styles.tabItem}><View style={[styles.tabIconWrap,tab===t.key&&{backgroundColor:c.cyanSoft}]}><Ionicons name={tab===t.key?t.icon:(t.icon+'-outline') as IconName} size={22} color={tab===t.key?'#008BAA':c.muted}/></View><Text style={[styles.tabLabel,{color:tab===t.key?'#00809D':c.muted}]}>{t.label}</Text></Pressable>)}</BlurView>}
    </View></View>
    <Modal visible={!!modal} transparent animationType="fade" onRequestClose={()=>setModal(null)}><Pressable style={styles.modalBackdrop} onPress={()=>setModal(null)}><Pressable style={[styles.modalCard,{backgroundColor:c.cardSolid}]} onPress={()=>{}}><View style={[styles.modalIcon,{backgroundColor:c.cyanSoft}]}><Ionicons name="sparkles" size={30} color="#00A8CA"/></View><Text style={[styles.modalTitle,{color:c.text}]}>{modal}</Text><Text style={[styles.modalText,{color:c.muted}]}>Bu deneyim Lumina ile kullanıma hazır. Gerçek cihaz bağlantısı eklendiğinde buradaki kontrol canlı çalışacak.</Text><Pressable onPress={()=>setModal(null)} style={styles.modalButton}><Text style={styles.modalButtonText}>Harika</Text></Pressable></Pressable></Pressable></Modal>
  </SafeAreaView>
}

export default function App(){const system=useColorScheme();const [logged,setLogged]=useState(false);const [theme,setTheme]=useState<Theme>(system==='dark'?'dark':'light');return <SafeAreaProvider>{logged?<AppShell onLogout={()=>setLogged(false)}/>:<Login onDone={()=>setLogged(true)} theme={theme} toggleTheme={()=>setTheme(theme==='dark'?'light':'dark')}/>}</SafeAreaProvider>}

const styles=StyleSheet.create({
  fill:{flex:1},orbOne:{position:'absolute',width:330,height:330,borderRadius:999,backgroundColor:'rgba(0,210,255,.08)',top:-130,left:-130},orbTwo:{position:'absolute',width:380,height:380,borderRadius:999,backgroundColor:'rgba(180,144,254,.07)',bottom:-180,right:-150},
  appFrame:{flex:1},appFrameWide:{flexDirection:'row',maxWidth:1240,width:'100%',alignSelf:'center'},mainColumn:{flex:1},page:{paddingHorizontal:20,paddingTop:14,paddingBottom:116,maxWidth:760,width:'100%',alignSelf:'center'},pageWide:{paddingHorizontal:36,paddingBottom:50,maxWidth:950},
  header:{height:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},greeting:{fontFamily:'System',fontSize:13,fontWeight:'500'},headerTitle:{fontSize:21,fontWeight:'800',letterSpacing:-.5,marginTop:2},headerActions:{flexDirection:'row',gap:10},iconButton:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center'},avatar:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center'},onlineDot:{position:'absolute',width:10,height:10,borderRadius:5,backgroundColor:'#20D58A',right:-1,bottom:2,borderWidth:2,borderColor:'#fff'},
  hero:{borderRadius:32,overflow:'hidden',marginBottom:30,shadowColor:'#00677F',shadowOpacity:.12,shadowRadius:25,shadowOffset:{width:0,height:12},elevation:3},heroGradient:{minHeight:204,padding:22,flexDirection:'row',alignItems:'center'},heroCopy:{flex:1,zIndex:2},onlineChip:{alignSelf:'flex-start',backgroundColor:'rgba(255,255,255,.72)',paddingHorizontal:10,paddingVertical:6,borderRadius:99,flexDirection:'row',alignItems:'center',gap:6},pulseDot:{width:7,height:7,borderRadius:4,backgroundColor:'#12C884'},onlineText:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#27727F'},heroTitle:{fontSize:22,lineHeight:28,fontWeight:'800',color:'#17343B',letterSpacing:-.5,maxWidth:310,marginVertical:15},talkButton:{alignSelf:'flex-start',flexDirection:'row',gap:8,alignItems:'center',backgroundColor:'#008FAE',paddingHorizontal:16,paddingVertical:11,borderRadius:99},talkText:{fontSize:13,fontWeight:'700',color:'#fff'},
  ear:{position:'absolute',top:15,backgroundColor:'#7DE1F7',borderRadius:30,zIndex:0},petHead:{zIndex:2,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'rgba(255,255,255,.8)',shadowColor:'#00BDE8',shadowOpacity:.2,shadowRadius:15},eyeRow:{flexDirection:'row',gap:23},eye:{width:15,height:22,borderRadius:10,backgroundColor:'#17353E',alignItems:'flex-end',padding:3},eyeGlint:{width:5,height:5,borderRadius:3,backgroundColor:'#fff'},mouth:{width:25,height:13,borderBottomLeftRadius:14,borderBottomRightRadius:14,backgroundColor:'#17353E',marginTop:10,alignItems:'center',overflow:'hidden'},tongue:{width:12,height:7,borderRadius:7,backgroundColor:'#FF7899',marginTop:7},petGlow:{position:'absolute',bottom:0,borderRadius:99,backgroundColor:'rgba(0,189,232,.18)',transform:[{scaleY:.4}]},
  sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14},sectionTitle:{fontSize:20,fontWeight:'800',letterSpacing:-.4},sectionMeta:{fontSize:13,fontWeight:'600'},featureGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},featureCard:{minHeight:92,borderRadius:23,borderWidth:1,padding:13,flexDirection:'row',alignItems:'center',gap:10},featureIcon:{width:45,height:45,borderRadius:15,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:13.5,fontWeight:'700',marginBottom:4},cardSubtitle:{fontSize:10.5,fontWeight:'500'},
  bottomNav:{position:'absolute',bottom:0,left:0,right:0,height:88,borderTopWidth:1,flexDirection:'row',paddingTop:8,paddingBottom:Platform.OS==='ios'?18:10},tabItem:{flex:1,alignItems:'center'},tabIconWrap:{width:44,height:34,borderRadius:16,alignItems:'center',justifyContent:'center'},tabLabel:{fontSize:9.5,fontWeight:'700',marginTop:3},
  sideNav:{width:230,borderRightWidth:1,padding:24,paddingTop:34},sideBrand:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:42},logoMark:{width:38,height:38,borderRadius:13,backgroundColor:'#00A9C9',alignItems:'center',justifyContent:'center',shadowColor:'#00A9C9',shadowOpacity:.25,shadowRadius:9},sideBrandText:{fontSize:22,fontWeight:'800'},sideItem:{height:50,borderRadius:17,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:12,marginBottom:7},sideLabel:{fontSize:13,fontWeight:'700'},connectedCard:{padding:13,borderRadius:17,flexDirection:'row',alignItems:'center',gap:10},connectedTitle:{fontSize:12,fontWeight:'700'},connectedSub:{fontSize:10,marginTop:2},desktopPageLabel:{fontSize:28,fontWeight:'800',letterSpacing:-.8,marginBottom:20},
  pageIntro:{marginBottom:25},pageTitle:{fontSize:28,fontWeight:'800',letterSpacing:-.7},pageSubtitle:{fontSize:14,lineHeight:21,marginTop:6,maxWidth:470},modeList:{gap:14},modeCard:{minHeight:105,borderRadius:27,padding:18,flexDirection:'row',alignItems:'center',gap:15,shadowColor:'#1E768A',shadowOpacity:.12,shadowRadius:16,shadowOffset:{width:0,height:8}},modeIcon:{width:56,height:56,borderRadius:19,backgroundColor:'rgba(255,255,255,.18)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.2)'},modeTitleRow:{flexDirection:'row',alignItems:'center',gap:8},modeTitle:{fontSize:18,fontWeight:'800',color:'#fff'},modeDesc:{fontSize:12.5,color:'rgba(255,255,255,.78)',marginTop:5},modeBadge:{backgroundColor:'rgba(255,255,255,.2)',paddingHorizontal:7,paddingVertical:3,borderRadius:99},modeBadgeText:{fontSize:8,fontWeight:'900',color:'#fff',letterSpacing:.7},
  petStage:{borderWidth:1,borderRadius:32,minHeight:310,alignItems:'center',justifyContent:'center',overflow:'hidden',marginBottom:28},stageGlow:{position:'absolute',width:260,height:260,borderRadius:150,backgroundColor:'rgba(0,210,255,.08)'},statusChip:{position:'absolute',top:18,right:18,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(20,200,132,.1)',paddingHorizontal:9,paddingVertical:6,borderRadius:99},statusText:{fontSize:9,fontWeight:'800',letterSpacing:.6,color:'#16946A'},petName:{fontSize:21,fontWeight:'800',marginTop:-8},petMood:{fontSize:12,marginTop:4},voiceMini:{flexDirection:'row',gap:5,alignItems:'center',paddingHorizontal:9,paddingVertical:6,borderRadius:99},voiceMiniText:{fontSize:10,fontWeight:'700',color:'#00829F'},moveGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},moveCard:{width:'48.2%',minHeight:112,borderWidth:1,borderRadius:24,alignItems:'center',justifyContent:'center',padding:12},moveIcon:{width:50,height:50,borderRadius:17,alignItems:'center',justifyContent:'center',marginBottom:9},moveTitle:{fontSize:12.5,fontWeight:'700',textAlign:'center'},stopButton:{height:50,borderRadius:99,borderWidth:1,marginTop:18,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},stopText:{color:'#E34F6D',fontWeight:'700',fontSize:13},
  profileCard:{borderWidth:1,borderRadius:28,padding:18,flexDirection:'row',alignItems:'center',gap:14,marginBottom:27},profileAvatar:{width:66,height:66,borderRadius:23,alignItems:'center',justifyContent:'center'},profileName:{fontSize:18,fontWeight:'800'},profileMail:{fontSize:11.5,marginTop:4},premiumChip:{alignSelf:'flex-start',flexDirection:'row',gap:4,alignItems:'center',backgroundColor:'#EADFFF',paddingHorizontal:7,paddingVertical:4,borderRadius:99,marginTop:7},premiumText:{fontSize:9,fontWeight:'800',color:'#6C49B3'},settingLabel:{fontSize:10,fontWeight:'800',letterSpacing:1.2,marginLeft:5,marginBottom:9,marginTop:4},settingGroup:{borderWidth:1,borderRadius:25,overflow:'hidden',marginBottom:22},settingRow:{minHeight:74,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:13},settingIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},settingTitle:{fontSize:13.5,fontWeight:'700'},settingSub:{fontSize:10.5,marginTop:3},logout:{height:54,borderWidth:1,borderRadius:20,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},logoutText:{fontSize:13,fontWeight:'700',color:'#E34F64'},version:{textAlign:'center',fontSize:10,marginTop:15},
  authWrap:{paddingHorizontal:20,paddingTop:8,paddingBottom:35,maxWidth:520,width:'100%',alignSelf:'center',minHeight:Dimensions.get('window').height},authTop:{height:55,flexDirection:'row',alignItems:'center',gap:9},brand:{fontSize:21,fontWeight:'800'},themeButton:{marginLeft:'auto',width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},authPet:{height:185,alignItems:'center',justifyContent:'center'},helloBubble:{position:'absolute',top:16,right:'20%',flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:11,paddingVertical:7,borderRadius:16,shadowColor:'#00677F',shadowOpacity:.1,shadowRadius:10},helloText:{fontSize:12,fontWeight:'700'},authHeading:{alignItems:'center',marginBottom:20},authTitle:{fontSize:27,fontWeight:'800',letterSpacing:-.8,textAlign:'center'},authSubtitle:{fontSize:13,lineHeight:20,textAlign:'center',marginTop:7,maxWidth:390},authCard:{borderWidth:1,borderRadius:30,padding:18,shadowColor:'#00677F',shadowOpacity:.08,shadowRadius:25,shadowOffset:{width:0,height:10}},inputWrap:{height:54,borderRadius:18,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:10,marginBottom:12},input:{flex:1,fontSize:13,fontWeight:'500',outlineStyle:'none'} as any,forgot:{color:'#008EAC',fontSize:11.5,fontWeight:'700',textAlign:'right',marginTop:-2,marginBottom:14},primaryButton:{height:54,borderRadius:18,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,shadowColor:'#00A8CA',shadowOpacity:.25,shadowRadius:12,shadowOffset:{width:0,height:6}},primaryButtonText:{color:'#fff',fontSize:14,fontWeight:'800'},divider:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:17},dividerLine:{height:1,flex:1},orText:{fontSize:10},socialRow:{flexDirection:'row',gap:10},socialButton:{flex:1,height:50,borderRadius:17,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},socialText:{fontSize:12.5,fontWeight:'700'},googleG:{fontSize:20,fontWeight:'900',color:'#4285F4'},signup:{fontSize:11.5,textAlign:'center',marginTop:18},backLogin:{fontSize:12,fontWeight:'700',textAlign:'center',marginTop:15},
  modalBackdrop:{flex:1,backgroundColor:'rgba(5,15,18,.55)',alignItems:'center',justifyContent:'center',padding:24},modalCard:{width:'100%',maxWidth:390,borderRadius:30,padding:25,alignItems:'center'},modalIcon:{width:64,height:64,borderRadius:22,alignItems:'center',justifyContent:'center'},modalTitle:{fontSize:22,fontWeight:'800',marginTop:15},modalText:{fontSize:13,lineHeight:20,textAlign:'center',marginTop:8},modalButton:{height:48,borderRadius:17,backgroundColor:'#00A8CA',alignSelf:'stretch',alignItems:'center',justifyContent:'center',marginTop:20},modalButtonText:{color:'#fff',fontSize:13,fontWeight:'800'},
});
