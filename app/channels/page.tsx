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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function ChannelsPage() {
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [isCallActive, setIsCallActive] = useState(false);
  const [ivrStep, setIvrStep] = useState<'menu' | 'fmd' | 'lsd' | 'emergency'>('menu');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentSpeechText(text);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    // Attempt language voice matching
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
    if (!isCallActive) return;

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

  const translations = {
    mr: {
      title: 'सर्वसमावेशक वितरण चॅनेल्स (Omni-Channel Access)',
      subtitle: 'वेब, मोबाइल, ऑफलाइन आणि आयव्हीआर व्हॉईस द्वारे महाराष्ट्रातील प्रत्येक पशुपालकापर्यंत पोहोच',
      langToggleLabel: 'आयव्हीआर भाषा निवडा:',
      webTitle: '१. वेब पोर्टल (Web Portal)',
      webDesc: 'पूर्ण-वैशिष्ट्यीकृत डॅशबोर्ड, ३६ जिल्ह्यांचा रोग धोका हीटमॅप, डिजिटल हेल्थ पासपोर्ट पडताळणी व लॅब व्यवस्थापन.',
      webLink: 'डॅशबोर्ड उघडा',
      mobileTitle: '२. मोबाइल वेब व PWA (Mobile App)',
      mobileDesc: 'कोणत्याही स्वतंत्र ॲप इन्स्टॉलेशनची गरज नाही — सर्व स्मार्टफोनवर थेट चालणारे इन्स्टॉलेबल प्रोग्रेसिव्ह वेब ॲप (PWA).',
      offlineTitle: '३. ऑफलाइन मोड (Offline Sync)',
      offlineDesc: 'ग्रामीण भागात इंटरनेट नसताना डेटा स्थानिकरीत्या साठवला जातो व इंटरनेट आल्यावर /api/sync/push आणि /api/sync/pull द्वारे LWW पद्धतीने आपोआप सिंक होतो.',
      ivrTitle: '४. आयव्हीआर व्हॉईस हेल्पलाइन (IVR Helpline)',
      ivrDesc: 'साध्या फीचर फोन वापरणाऱ्या शेतकऱ्यांसाठी व्हॉईस-आधारित संवाद प्रणाली. ब्राउझरमध्ये थेट व्हॉईस कॉल डेमो करून पहा.',
      callNow: 'कॉल सुरू करा (Call Now Demo)',
      hangUp: 'कॉल बंद करा (Hang Up)',
      keypadTitle: 'फोन कीपॅड (Interactive Keypad):',
      ivrDisclaimer:
        'सूचना: आयव्हीआर प्रणाली येथे थेट ब्राउझर Web Speech API द्वारे डेमो स्वरूपात कार्यरत आहे. प्रत्यक्ष उत्पादनात Twilio/Exotel टेलिफोनी गेटवे द्वारे प्रत्यक्ष फोन कॉल्स हाताळले जातील.',
    },
    hi: {
      title: 'सर्वसमावेशक वितरण चैनल्स (Omni-Channel Access)',
      subtitle: 'वेब, मोबाइल, ऑफलाइन और आईवीआर वॉइस द्वारा प्रत्येक पशुपालक तक पहुंच',
      langToggleLabel: 'आईवीआर भाषा चुनें:',
      webTitle: '१. वेब पोर्टल (Web Portal)',
      webDesc: 'फुल-फीचर्ड डैशबोर्ड, 36 जिलों का रोग हीटमैप, डिजिटल हेल्थ पासपोर्ट सत्यापन और लैब प्रबंधन।',
      webLink: 'डैशबोर्ड खोलें',
      mobileTitle: '२. मोबाइल वेब व PWA (Mobile App)',
      mobileDesc: 'अलग ऐप इंस्टॉल करने की आवश्यकता नहीं — सभी स्मार्टफोन पर काम करने वाला प्रोग्रेसिव वेब ऐप (PWA)।',
      offlineTitle: '३. ऑफलाइन मोड (Offline Sync)',
      offlineDesc: 'इंटरनेट न होने पर डेटा फोन में सुरक्षित रहता है और नेटवर्क मिलने पर /api/sync/push व /api/sync/pull द्वारा सिंक होता है।',
      ivrTitle: '४. आईवीआर वॉइस हेल्पलाइन (IVR Helpline)',
      ivrDesc: 'फीचर फोन उपयोगकर्ताओं के लिए वॉयस-आधारित इंटरएक्टिव प्रणाली। ब्राउज़र में वॉइस कॉल टेस्ट करें।',
      callNow: 'कॉल शुरू करें (Call Now Demo)',
      hangUp: 'कॉल समाप्त करें (Hang Up)',
      keypadTitle: 'फोन कीपैड (Interactive Keypad):',
      ivrDisclaimer:
        'सूचना: आईवीआर प्रणाली यहाँ ब्राउज़र Web Speech API द्वारा लाइव डेमो के रूप में दिखाई गई है। वास्तविक उत्पादन में टेलीफोनी गेटवे का उपयोग होगा।',
    },
    en: {
      title: 'Omni-Channel Delivery Architecture',
      subtitle: 'Reaching every farmer across Maharashtra via Web, Mobile PWA, Offline Store-and-Forward, and IVR Voice',
      langToggleLabel: 'Select IVR Language:',
      webTitle: '1. Web Portal',
      webDesc: 'Enterprise veterinary command center with 36-district GIS risk heatmap, digital health passports, and lab case workflow.',
      webLink: 'Open Live Dashboard',
      mobileTitle: '2. Mobile App (PWA)',
      mobileDesc: 'Fully responsive mobile-first UI functioning as an installable Progressive Web App (PWA) across all mobile devices.',
      offlineTitle: '3. Offline Sync Mode',
      offlineDesc: 'Edge-cached field reporting utilizing sync_queue_items with /api/sync/push and /api/sync/pull (Last-Write-Wins with conflict detection).',
      ivrTitle: '4. IVR Voice Helpline',
      ivrDesc: 'Dial-in voice menu designed for non-smartphone / feature phone farmers with automated disease triage and emergency advisory.',
      callNow: 'Call Now (Voice Demo)',
      hangUp: 'Hang Up Call',
      keypadTitle: 'Dialer Keypad (Interactive):',
      ivrDisclaimer:
        'Note: IVR shown here as a live browser voice demo via Web Speech API. A production deployment integrates telephony providers (e.g. Twilio/Exotel) for real phone-in access.',
    },
  }[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="container max-w-6xl mx-auto px-4 py-8 flex-1">
        {/* Header with Title & Language Switcher */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{translations.title}</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{translations.subtitle}</p>
          </div>

          {/* Standalone Language Switcher */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded-xl p-1.5 shadow-sm text-xs font-semibold self-end md:self-auto">
            <span className="text-slate-500 hidden sm:inline px-1">{translations.langToggleLabel}</span>
            <button
              onClick={() => {
                setLanguage('mr');
                if (isCallActive) hangUpIvrCall();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                language === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* 4 Channel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Card 1: Web Portal (LIVE) */}
          <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Globe className="h-5 w-5" />
                </div>
                {/* LIVE badge: Green */}
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                  LIVE
                </Badge>
              </div>
              <CardTitle className="text-base font-bold">{translations.webTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {translations.webDesc}
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50">
                  <span>{translations.webLink}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card 2: Mobile App / PWA (LIVE) */}
          <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                {/* LIVE badge: Green */}
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                  LIVE
                </Badge>
              </div>
              <CardTitle className="text-base font-bold">{translations.mobileTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {translations.mobileDesc}
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full py-1 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-md">
                ✓ PWA Ready • 100% Responsive
              </div>
            </CardFooter>
          </Card>

          {/* Card 3: Offline Mode (STUB) */}
          <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <WifiOff className="h-5 w-5" />
                </div>
                {/* STUB badge: Amber */}
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs">
                  STUB
                </Badge>
              </div>
              <CardTitle className="text-base font-bold">{translations.offlineTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
              <p>{translations.offlineDesc}</p>
              <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] text-slate-600 dark:text-slate-300">
                POST /api/sync/push<br />
                GET /api/sync/pull?since=...
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full py-1 text-center text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-md">
                LWW Conflict Resolution
              </div>
            </CardFooter>
          </Card>

          {/* Card 4: IVR Voice Helpline (MOCK browser demo) */}
          <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow ring-2 ring-emerald-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <PhoneCall className="h-5 w-5" />
                </div>
                {/* MOCK badge: Gray/Slate */}
                <Badge variant="secondary" className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs">
                  MOCK (browser demo)
                </Badge>
              </div>
              <CardTitle className="text-base font-bold">{translations.ivrTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-3">
              <p>{translations.ivrDesc}</p>

              {/* Call Controls */}
              {!isCallActive ? (
                <Button
                  onClick={startIvrCall}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-sm"
                >
                  <Phone className="h-4 w-4" />
                  <span>{translations.callNow}</span>
                </Button>
              ) : (
                <div className="space-y-3 bg-emerald-50/50 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {/* Call Status Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Call Connected (1962)</span>
                    </div>
                    {isSpeaking ? (
                      <Volume2 className="h-4 w-4 text-emerald-600 animate-bounce" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-400" />
                    )}
                  </div>

                  {/* Speech Subtitles */}
                  {currentSpeechText && (
                    <div className="p-2 bg-white dark:bg-slate-950 rounded border text-[11px] text-slate-700 dark:text-slate-300 italic max-h-20 overflow-y-auto">
                      &ldquo;{currentSpeechText}&rdquo;
                    </div>
                  )}

                  {/* On-screen Keypad Buttons 1, 2, 3, 4 */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {translations.keypadTitle}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleKeypadPress('1')}
                        className={`py-2 px-1 rounded-lg border font-bold text-sm transition-all ${
                          ivrStep === 'fmd'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-100'
                        }`}
                        title="1: FMD Symptoms"
                      >
                        1
                        <span className="block text-[8px] font-normal text-slate-400">FMD</span>
                      </button>

                      <button
                        onClick={() => handleKeypadPress('2')}
                        className={`py-2 px-1 rounded-lg border font-bold text-sm transition-all ${
                          ivrStep === 'lsd'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-100'
                        }`}
                        title="2: LSD Symptoms"
                      >
                        2
                        <span className="block text-[8px] font-normal text-slate-400">LSD</span>
                      </button>

                      <button
                        onClick={() => handleKeypadPress('3')}
                        className={`py-2 px-1 rounded-lg border font-bold text-sm transition-all ${
                          ivrStep === 'emergency'
                            ? 'bg-red-600 text-white border-red-700 shadow-sm'
                            : 'bg-white dark:bg-slate-950 text-red-600 hover:bg-red-50'
                        }`}
                        title="3: Emergency"
                      >
                        3
                        <span className="block text-[8px] font-normal text-red-400">SOS</span>
                      </button>

                      <button
                        onClick={() => handleKeypadPress('4')}
                        className={`py-2 px-1 rounded-lg border font-bold text-sm transition-all ${
                          ivrStep === 'menu'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-100'
                        }`}
                        title="4: Repeat Menu"
                      >
                        4
                        <span className="block text-[8px] font-normal text-slate-400">Repeat</span>
                      </button>
                    </div>
                  </div>

                  {/* Hang Up Button */}
                  <Button
                    onClick={hangUpIvrCall}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    <span>{translations.hangUp}</span>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 leading-tight italic">
                {translations.ivrDisclaimer}
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
