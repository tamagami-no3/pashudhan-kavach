'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  Globe,
  Smartphone,
  WifiOff,
  PhoneCall,
  Volume2,
  VolumeX,
  PhoneOff,
  Radio,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
  Phone,
  Clock,
  Mic,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

function playDtmfTone(key: string) {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const toneMap: Record<string, [number, number]> = {
      '1': [697, 1209],
      '2': [697, 1336],
      '3': [697, 1477],
      '4': [770, 1209],
      '5': [770, 1336],
      '6': [770, 1477],
      '7': [852, 1209],
      '8': [852, 1336],
      '9': [852, 1477],
      '*': [941, 1209],
      '0': [941, 1336],
      '#': [941, 1477],
    };
    const freqs = toneMap[key] || [700, 1200];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.value = 0.08;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      ctx.close();
    }, 120);
  } catch {
    // Ignore audio error
  }
}

export default function ChannelsPage() {
  const { language: authLang, setLanguage: setAuthLang } = useAuth();
  const [language, setLanguageState] = useState<'mr' | 'hi' | 'en'>(
    (authLang as 'mr' | 'hi' | 'en') || 'mr'
  );

  const setLanguage = (lang: 'mr' | 'hi' | 'en') => {
    setLanguageState(lang);
    if (setAuthLang) setAuthLang(lang);
  };

  useEffect(() => {
    if (authLang && (authLang === 'mr' || authLang === 'hi' || authLang === 'en')) {
      setLanguageState(authLang);
    }
  }, [authLang]);

  const [isCallActive, setIsCallActive] = useState(false);
  const [ivrStep, setIvrStep] = useState<'menu' | 'fmd' | 'lsd' | 'emergency'>('menu');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for call duration
  useEffect(() => {
    let timer: any;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // Stop speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech synthesis helper
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setCurrentSpeechText(text);
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentSpeechText(text);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const ivrScripts = {
    mr: {
      welcome:
        'पशुधन कवच व्हॉईस सेवेमध्ये आपले स्वागत आहे. लाळ्या खुरकूत लक्षणांसाठी १ दाबा. लंपी त्वचा रोगासाठी २ दाबा. तातडीची आपत्कालीन तक्रार नोंदवण्यासाठी ३ दाबा. मेनू पुन्हा ऐकण्यासाठी ४ दाबा.',
      fmd:
        'लाळ्या खुरकूत माहिती: तोंडात फोड येणे, लाळ गळणे, खुरांमध्ये जखमा व लंगडणे ही प्रमुख लक्षणे आहेत. बाधित जनावरास वेगळे ठेवा, तोंडातील जखमा पोटॅशियम परमँगनेटच्या पाण्याने धुवा आणि मऊ चारा द्या.',
      lsd:
        'लंपी त्वचा रोग माहिती: जनावराच्या अंगावर २ ते ५ सेंटीमीटरच्या कडक गाठी येणे, ताप व पायांना सूज येणे ही लक्षणे आहेत. गोठ्यात कडुनिंबाची धुरी करा, माशा व डासांपासून संरक्षण करा आणि गोटपॉक्स लस द्या.',
      emergency:
        'गंभीर आपत्कालीन इशारा! जर जनावराचा अचानक मृत्यू झाला असेल किंवा नैसर्गिक छिद्रांतून काळे रक्त येत असेल, तर मृतदेहाला अजिबात हात लावू नका. ताबडतोब पशु हेल्पलाइन १९६२ किंवा स्थानिक पशुवैद्यकीय अधिकाऱ्यांशी संपर्क साधा.',
    },
    hi: {
      welcome:
        'पशुधन कवच वॉयस हेल्पलाइन में आपका स्वागत है। एफएमडी लक्षणों के लिए १ दबाएं। लंपी त्वचा रोग के लिए २ दबाएं। आपातकालीन शिकायत के लिए ३ दबाएं। मेनू दोहराने के लिए ४ दबाएं।',
      fmd:
        'एफएमडी जानकारी: मुंह में छाले, लार गिरना, खुरों में घाव और लंगड़ाना इसके प्रमुख लक्षण हैं। बीमार पशु को अलग रखें और खुरों पर एंटीसेप्टिक लगाएं।',
      lsd:
        'लंपी त्वचा रोग जानकारी: त्वचा पर गांठें, तेज बुखार और पैरों में सूजन इसके लक्षण हैं। मच्छरों और मक्खियों से बचाव करें और तुरंत गोटपॉक्स टीका लगवाएं।',
      emergency:
        'आपातकालीन चेतावनी! यदि पशु की अचानक मृत्यु हुई है या खून बह रहा है, तो शरीर को न छुएं। तुरंत पशु हेल्पलाइन 1962 पर कॉल करें।',
    },
    en: {
      welcome:
        'Welcome to Pashudhan Kavach Voice Helpline. Press 1 for Foot and Mouth Disease symptoms. Press 2 for Lumpy Skin Disease symptoms. Press 3 to report an emergency. Press 4 to repeat.',
      fmd:
        'FMD Guidance: Watch for mouth blisters, excessive salivation, and foot lesions. Isolate the animal immediately and clean lesions with mild antiseptic.',
      lsd:
        'LSD Guidance: Watch for skin nodules, fever, and enlarged lymph nodes. Control flies and mosquitoes, and administer Goat Pox vaccination.',
      emergency:
        'Critical Emergency Warning! For sudden death or bleeding from natural orifices, do not touch the carcass. Isolate the area and call emergency helpline 1962 immediately.',
    },
  }[language];

  const startIvrCall = () => {
    setIsCallActive(true);
    setIvrStep('menu');
    speakText(ivrScripts.welcome);
  };

  const handleKeypadPress = (digit: string) => {
    playDtmfTone(digit);
    if (!isCallActive) {
      startIvrCall();
      return;
    }

    if (digit === '1') {
      setIvrStep('fmd');
      speakText(ivrScripts.fmd);
    } else if (digit === '2') {
      setIvrStep('lsd');
      speakText(ivrScripts.lsd);
    } else if (digit === '3') {
      setIvrStep('emergency');
      speakText(ivrScripts.emergency);
    } else if (digit === '4') {
      setIvrStep('menu');
      speakText(ivrScripts.welcome);
    }
  };

  const hangUpIvrCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsCallActive(false);
    setIsSpeaking(false);
    setCurrentSpeechText('');
    setIvrStep('menu');
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const translations = {
    mr: {
      title: 'सर्वसमावेशक वितरण चॅनेल्स (Omni-Channel Access)',
      subtitle: 'वेब, मोबाइल, ऑफलाइन आणि आयव्हीआर व्हॉईस द्वारे महाराष्ट्रातील प्रत्येक पशुपालकापर्यंत पोहोच',
      callSimulatorTitle: 'स्मार्टफोन आयव्हीआर कॉल सिम्युलेटर (1962 Interactive Call Demo)',
      callSimulatorSubtitle: 'साध्या फोनवरील व्हॉईस कॉल कसा चालतो याचा ब्राउझरमधील थेट अनुभव घ्या.',
      webTitle: '१. वेब पोर्टल (Web Portal)',
      webDesc: 'पूर्ण-वैशिष्ट्यीकृत डॅशबोर्ड, ३६ जिल्ह्यांचा रोग धोका हीटमॅप, डिजिटल हेल्थ पासपोर्ट पडताळणी व लॅब व्यवस्थापन.',
      webLink: 'डॅशबोर्ड उघडा',
      mobileTitle: '२. मोबाइल वेब व PWA (Mobile App)',
      mobileDesc: 'कोणत्याही स्वतंत्र ॲप इन्स्टॉलेशनची गरज नाही — सर्व स्मार्टफोनवर थेट चालणारे इन्स्टॉलेबल प्रोग्रेसिव्ह वेब ॲप (PWA).',
      offlineTitle: '३. ऑफलाइन मोड (Offline Sync)',
      offlineDesc: 'ग्रामीण भागात इंटरनेट नसताना डेटा स्थानिकरीत्या IndexedDB मध्ये साठवला जातो व इंटरनेट आल्यावर LWW द्वारे सिंक होतो.',
      ivrTitle: '४. आयव्हीआर व्हॉईस हेल्पलाइन (IVR Helpline)',
      ivrDesc: 'साध्या फीचर फोन वापरणाऱ्या शेतकऱ्यांसाठी व्हॉईस-आधारित संवाद प्रणाली. ब्राउझरमध्ये थेट व्हॉईस कॉल टेस्ट करा.',
      callNow: '१९६२ वर कॉल करा (Dial 1962 Demo)',
      hangUp: 'कॉल संपवा (End Call)',
      keypadTitle: 'फोन कीपॅड (DTMF Keypad)',
      callActiveStatus: 'कॉल सुरू आहे • १९६२ हेल्पलाइन',
      callIdleStatus: 'कॉल सुरू करण्यासाठी हिरवे बटण दाबा',
      disclaimer: 'सूचना: हा ब्राउझर Web Speech & Web Audio API वर आधारित थेट सिम्युलेटर डेमो आहे. उत्पादनात Twilio/Exotel टेलिफोनी गेटवे द्वारे प्रत्यक्ष जीएसएम नेटवर्कवर कॉल चालतात.',
    },
    hi: {
      title: 'सर्वसमावेशक वितरण चैनल्स (Omni-Channel Access)',
      subtitle: 'वेब, मोबाइल, ऑफलाइन और आईवीआर वॉइस द्वारा प्रत्येक पशुपालक तक पहुंच',
      callSimulatorTitle: 'स्मार्टफोन आईवीआर कॉल सिम्युलेटर (1962 Interactive Call Demo)',
      callSimulatorSubtitle: 'साधारण फोन पर वॉयस कॉल कैसे काम करती है, इसका लाइव अनुभव लें।',
      webTitle: '१. वेब पोर्टल (Web Portal)',
      webDesc: 'फुल-फीचर्ड डैशबोर्ड, 36 जिलों का रोग हीटमैप, डिजिटल हेल्थ पासपोर्ट सत्यापन और लैब प्रबंधन।',
      webLink: 'डैशबोर्ड खोलें',
      mobileTitle: '२. मोबाइल वेब व PWA (Mobile App)',
      mobileDesc: 'अलग ऐप इंस्टॉल करने की आवश्यकता नहीं — सभी स्मार्टफोन पर काम करने वाला प्रोग्रेसिव वेब ऐप (PWA)।',
      offlineTitle: '३. ऑफलाइन मोड (Offline Sync)',
      offlineDesc: 'इंटरनेट न होने पर डेटा फोन में सुरक्षित रहता है और नेटवर्क मिलने पर स्वतः सिंक होता है।',
      ivrTitle: '४. आईवीआर वॉइस हेल्पलाइन (IVR Helpline)',
      ivrDesc: 'फीचर फोन उपयोगकर्ताओं के लिए वॉयस-आधारित इंटरएक्टिव प्रणाली।',
      callNow: '1962 पर कॉल करें (Dial 1962 Demo)',
      hangUp: 'कॉल समाप्त करें (End Call)',
      keypadTitle: 'फोन कीपैड (DTMF Keypad)',
      callActiveStatus: 'कॉल चालू है • 1962 हेल्पलाइन',
      callIdleStatus: 'कॉल शुरू करने के लिए हरा बटन दबाएं',
      disclaimer: 'सूचना: यह ब्राउज़र Web Speech & Web Audio API पर आधारित लाइव डेमो है। उत्पादन में वास्तविक टेलीफोनी गेटवे का उपयोग होता है।',
    },
    en: {
      title: 'Omni-Channel Distribution & Helpline Architecture',
      subtitle: 'Reaching every livestock farmer across Maharashtra via Web, Mobile, 100% Offline Queuing, and IVR',
      callSimulatorTitle: 'Interactive Smartphone IVR Call Simulator (1962 Demo)',
      callSimulatorSubtitle: 'Experience the real automated telephone helpline directly in your browser with dial tones & voice responses.',
      webTitle: '1. Web Portal',
      webDesc: 'Enterprise operations center with 36-district epidemic heatmap, digital animal health passports, and lab workflow.',
      webLink: 'Open Dashboard',
      mobileTitle: '2. Mobile Web & PWA',
      mobileDesc: 'No bulky app store download required. Fully responsive, installable progressive web app functioning smoothly on mobile.',
      offlineTitle: '3. 100% Offline Sync',
      offlineDesc: 'Stores records in IndexedDB during rural connectivity drops, auto-reconciling via Last-Write-Wins (LWW).',
      ivrTitle: '4. IVR Voice Helpline (1962)',
      ivrDesc: 'Interactive Voice Response for non-smartphone farmers with DTMF tone support and regional speech audio.',
      callNow: 'Dial 1962 Helpline Demo',
      hangUp: 'Hang Up Call',
      keypadTitle: 'Interactive DTMF Keypad',
      callActiveStatus: 'Call Connected • 1962 Govt Animal Helpline',
      callIdleStatus: 'Press Dial 1962 to simulate an incoming voice call',
      disclaimer: 'Demo Note: This simulator runs via browser Web Speech & Web Audio synthesis. In production, this interfaces directly with telecom PRI/SIP trunks via Twilio/Exotel.',
    },
  }[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground pb-20">
      <Navbar />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header with Title & Language Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-xs uppercase">
                Architecture Spec
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Channel Resilience</span>
            </div>
            <h1 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
              {translations.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              {translations.subtitle}
            </p>
          </div>

          {/* Standalone Language Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border rounded-xl p-1 shadow-sm text-xs font-semibold self-end sm:self-auto">
            <button
              onClick={() => {
                setLanguage('mr');
                if (isCallActive) hangUpIvrCall();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                if (isCallActive) hangUpIvrCall();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => {
                setLanguage('en');
                if (isCallActive) hangUpIvrCall();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* HERO SECTION: Interactive Smartphone Call Simulator */}
        <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Context & Overview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Govt 1962 Telephony Integration</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
                {translations.callSimulatorTitle}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {translations.callSimulatorSubtitle}
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Internet Required:</strong> Works on basic Rs. 800 feature phones via 1962 toll-free voice calls.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Interactive Keypad:</strong> Press 1 for FMD, 2 for LSD, 3 for Emergency Dispatch, 4 to repeat menu.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Live Audio Synthesis:</strong> Native speech output with authentic DTMF dialer sound effects.</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link href="/report">
                  <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1 text-red-400" />
                    वेब तक्रार पोर्टल (1962 Web Report)
                  </Button>
                </Link>
                <Link href="/chatbot">
                  <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 text-xs">
                    <Smartphone className="h-3.5 w-3.5 mr-1" />
                    एआय कॅमेरा स्कॅनर (Vision AI)
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: The Smartphone Device Mock */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm bg-slate-950 border-4 border-slate-700 rounded-[2.5rem] p-5 shadow-2xl space-y-4 text-center relative ring-1 ring-white/10">
                {/* Speaker Grill & Camera Punch */}
                <div className="flex items-center justify-center gap-2 pb-1">
                  <div className="h-1.5 w-12 bg-slate-800 rounded-full" />
                  <div className="h-2 w-2 bg-slate-800 rounded-full" />
                </div>

                {/* Call Header Status */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                    {isCallActive ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 font-bold">{translations.callActiveStatus}</span>
                      </>
                    ) : (
                      <span>{translations.callIdleStatus}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-black tracking-wide text-white">
                    १९६२ (1962 Helpline)
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    {isCallActive ? formatSeconds(callDuration) : 'Toll-Free • 24x7'}
                  </div>
                </div>

                {/* Soundwave Visualizer / Avatar */}
                <div className="h-20 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {isCallActive ? (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-center gap-1 h-8">
                        {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 65].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              isSpeaking
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-700'
                            }`}
                            style={{ height: isSpeaking ? `${h}%` : '20%' }}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-mono font-semibold flex items-center justify-center gap-1">
                        <Volume2 className="h-3 w-3 animate-bounce" />
                        <span>{isSpeaking ? 'ध्वनी सुरू आहे (Speaking...)' : 'कीपॅड दाबण्याची प्रतीक्षा (Listening...)'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 text-xs">
                      <Phone className="h-6 w-6 mb-1 text-slate-600" />
                      <span>कॉल सुरू नाही</span>
                    </div>
                  )}
                </div>

                {/* Live Speech Subtitles Box */}
                {isCallActive && currentSpeechText && (
                  <div className="p-2.5 bg-slate-900 border border-emerald-900/40 rounded-xl text-left text-[11px] text-emerald-200 italic max-h-24 overflow-y-auto leading-relaxed shadow-inner">
                    &ldquo;{currentSpeechText}&rdquo;
                  </div>
                )}

                {/* 3x4 DTMF Numeric Keypad */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-left px-1">
                    {translations.keypadTitle}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { num: '1', sub: 'FMD', desc: 'लाळ्या खुरकूत' },
                      { num: '2', sub: 'LSD', desc: 'लंपी' },
                      { num: '3', sub: 'SOS', desc: 'आणीबाणी' },
                      { num: '4', sub: 'REPEAT', desc: 'पुन्हा ऐका' },
                      { num: '5', sub: 'JKL', desc: '' },
                      { num: '6', sub: 'MNO', desc: '' },
                      { num: '7', sub: 'PQRS', desc: '' },
                      { num: '8', sub: 'TUV', desc: '' },
                      { num: '9', sub: 'WXYZ', desc: '' },
                      { num: '*', sub: '', desc: '' },
                      { num: '0', sub: '+', desc: '' },
                      { num: '#', sub: '', desc: '' },
                    ].map((keyItem) => {
                      const isHighlighted =
                        (keyItem.num === '1' && ivrStep === 'fmd') ||
                        (keyItem.num === '2' && ivrStep === 'lsd') ||
                        (keyItem.num === '3' && ivrStep === 'emergency') ||
                        (keyItem.num === '4' && ivrStep === 'menu');

                      return (
                        <button
                          key={keyItem.num}
                          type="button"
                          onClick={() => handleKeypadPress(keyItem.num)}
                          className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all border font-bold ${
                            isHighlighted
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50 scale-105 ring-2 ring-emerald-300'
                              : 'bg-slate-900/90 border-slate-800 text-white hover:bg-slate-800 active:scale-95'
                          }`}
                        >
                          <span className="text-base leading-none">{keyItem.num}</span>
                          {keyItem.sub && (
                            <span className="text-[8px] font-mono text-slate-400 leading-none mt-0.5">
                              {keyItem.sub}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Call Controls: Dial vs Hangup */}
                <div className="pt-2">
                  {!isCallActive ? (
                    <Button
                      onClick={startIvrCall}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{translations.callNow}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={hangUpIvrCall}
                      variant="destructive"
                      className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <PhoneOff className="h-4 w-4" />
                      <span>{translations.hangUp}</span>
                    </Button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 italic text-center pt-1">
                  {translations.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Architectural Delivery Channels Comparison Grid */}
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>४ प्रमुख वितरण माध्यम (4 Omni-Channel Modalities)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Web Portal */}
            <Card className="flex flex-col justify-between border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                    LIVE
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold">{translations.webTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {translations.webDesc}
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50">
                    <span>{translations.webLink}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* 2. Mobile App / PWA */}
            <Card className="flex flex-col justify-between border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                    LIVE
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold">{translations.mobileTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {translations.mobileDesc}
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <div className="w-full py-1 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                  ✓ PWA Ready • 100% Responsive
                </div>
              </CardFooter>
            </Card>

            {/* 3. Offline Mode */}
            <Card className="flex flex-col justify-between border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <WifiOff className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                    OFFLINE DB
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold">{translations.offlineTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>{translations.offlineDesc}</p>
                <div className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg font-mono text-[10px] text-slate-700 dark:text-slate-300">
                  POST /api/sync/push<br />
                  GET /api/sync/pull?since=...
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <div className="w-full py-1 text-center text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                  IndexedDB + LWW Sync
                </div>
              </CardFooter>
            </Card>

            {/* 4. IVR Voice Helpline */}
            <Card className="flex flex-col justify-between border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition ring-2 ring-emerald-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-slate-200 font-bold text-[10px]">
                    SIMULATOR
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold">{translations.ivrTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {translations.ivrDesc}
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <Button
                  onClick={startIvrCall}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50"
                >
                  <Phone className="h-3.5 w-3.5 mr-1" />
                  कॉल टेस्ट करा (Test Call)
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
