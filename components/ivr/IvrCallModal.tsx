'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  X,
  Radio,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IvrCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'mr' | 'hi' | 'en';
}

function playDtmfTone(key: string) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
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

export function IvrCallModal({ isOpen, onClose, language = 'mr' }: IvrCallModalProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [ivrStep, setIvrStep] = useState<'menu' | 'fmd' | 'lsd' | 'emergency'>('menu');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call timer
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

  // Clean up speech synthesis when modal closes
  useEffect(() => {
    if (!isOpen) {
      hangUpIvrCall();
    }
  }, [isOpen]);

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
  }[language] || {
    welcome: 'Welcome to Pashudhan Kavach Voice Helpline. Press 1 for FMD, 2 for LSD, 3 for Emergency.',
    fmd: 'FMD Guidance: Watch for mouth blisters, excessive salivation, and foot lesions.',
    lsd: 'LSD Guidance: Watch for skin nodules, fever, and enlarged lymph nodes.',
    emergency: 'Critical Emergency Warning! Call emergency helpline 1962 immediately.',
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <PhoneCall className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {language === 'mr'
                  ? '१९६२ आयव्हीआर हेल्पलाइन सिम्युलेटर'
                  : language === 'hi'
                  ? '1962 आईवीआर हेल्पलाइन सिम्युलेटर'
                  : '1962 IVR Voice Helpline Simulator'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'mr'
                  ? 'साध्या फोनवरील कॉल डेमो (Web Speech & Audio API)'
                  : language === 'hi'
                  ? 'साधारण फोन पर वॉयस कॉल का लाइव अनुभव'
                  : 'Zero-internet feature phone voice demo'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              hangUpIvrCall();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Smartphone Call Display Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Status Badge & Caller Info */}
          <div className="text-center space-y-2 py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors bg-slate-800/90 border-slate-700">
              {isCallActive ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-emerald-400 font-mono">
                    {language === 'mr' ? 'कॉल सुरू आहे' : language === 'hi' ? 'कॉल चालू है' : 'Call Connected'} • {formatSeconds(callDuration)}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500 shrink-0" />
                  <span className="text-slate-400 font-medium">
                    {language === 'mr' ? '१९६२ कॉल करण्यासाठी हिरवे बटण दाबा' : language === 'hi' ? '1962 कॉल करने हेतु हरा बटन दबाएं' : 'Ready to Dial 1962'}
                  </span>
                </>
              )}
            </div>

            <div className="text-2xl font-black tracking-widest text-emerald-400 font-mono">
              1962
            </div>
            <div className="text-xs text-slate-400">
              {language === 'mr'
                ? 'महाराष्ट्र शासन — पशु आरोग्य २४x७ आपत्कालीन सेवा'
                : language === 'hi'
                ? 'महाराष्ट्र शासन — पशु स्वास्थ्य 24x7 आपातकालीन हेल्पलाइन'
                : 'Govt of Maharashtra — 24x7 Animal Health Helpline'}
            </div>
          </div>

          {/* Active Voice Prompt / Subtitles */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                {isSpeaking ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">
                      {language === 'mr' ? 'आवाज सुरू आहे (Speaking...)' : language === 'hi' ? 'बोल रहा है...' : 'Voice Speaking...'}
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                    <span>{language === 'mr' ? 'प्रणाली संदेश' : language === 'hi' ? 'सिस्टम संदेश' : 'System Prompt'}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                {language}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed min-h-[3rem]">
              {currentSpeechText || (
                <span className="text-slate-500 italic">
                  {language === 'mr'
                    ? '"कॉल सुरू करा" वर क्लिक केल्यास संगणकीय आवाज आपोआप मेनू वाचून दाखवेल...'
                    : language === 'hi'
                    ? '"कॉल शुरू करें" पर क्लिक करने पर कंप्यूटर की आवाज मेनू पढ़कर सुनाएगी...'
                    : 'Click "Start 1962 Call" to hear the automated voice menu...'}
                </span>
              )}
            </p>
          </div>

          {/* Interactive DTMF Phone Keypad */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-center text-[11px] font-semibold text-slate-400">
              {language === 'mr'
                ? 'कीपॅड दाबून पर्याय निवडा (१: FMD | २: लंपी | ३: आपत्कालीन | ४: पुन्हा)'
                : language === 'hi'
                ? 'कीपैड दबाकर विकल्प चुनें (1: FMD | 2: लंपी | 3: आपातकालीन | 4: दोहराएं)'
                : 'DTMF Keypad (1: FMD | 2: LSD | 3: Emergency | 4: Repeat)'}
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
              {[
                { num: '1', sub: 'FMD' },
                { num: '2', sub: 'LSD' },
                { num: '3', sub: 'SOS' },
                { num: '4', sub: 'REPLAY' },
                { num: '5', sub: 'JKL' },
                { num: '6', sub: 'MNO' },
                { num: '7', sub: 'PQRS' },
                { num: '8', sub: 'TUV' },
                { num: '9', sub: 'WXYZ' },
                { num: '*', sub: '' },
                { num: '0', sub: '+' },
                { num: '#', sub: '' },
              ].map((keyItem) => {
                const isSelected =
                  (keyItem.num === '1' && ivrStep === 'fmd') ||
                  (keyItem.num === '2' && ivrStep === 'lsd') ||
                  (keyItem.num === '3' && ivrStep === 'emergency') ||
                  (keyItem.num === '4' && ivrStep === 'menu' && isCallActive);

                return (
                  <button
                    key={keyItem.num}
                    onClick={() => handleKeypadPress(keyItem.num)}
                    className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all border select-none active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-900/30'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700 active:bg-slate-600'
                    }`}
                  >
                    <span className="text-lg font-bold leading-none">{keyItem.num}</span>
                    {keyItem.sub && (
                      <span className="text-[9px] text-slate-400 font-mono tracking-tighter mt-0.5">
                        {keyItem.sub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isCallActive ? (
              <Button
                onClick={startIvrCall}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl shadow-lg px-5 h-11 text-xs"
              >
                <Phone className="h-4 w-4" />
                {language === 'mr'
                  ? 'कॉल सुरू करा (Dial 1962)'
                  : language === 'hi'
                  ? 'कॉल शुरू करें (Dial 1962)'
                  : 'Start 1962 Live Call'}
              </Button>
            ) : (
              <Button
                onClick={hangUpIvrCall}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold gap-2 rounded-xl shadow-lg px-5 h-11 text-xs"
              >
                <PhoneOff className="h-4 w-4" />
                {language === 'mr' ? 'कॉल संपवा (End Call)' : language === 'hi' ? 'कॉल समाप्त करें' : 'End Call'}
              </Button>
            )}

            <a href="tel:1962" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-700 font-medium text-xs h-11 px-3"
                title="Dial real cellular helpline on mobile"
              >
                <PhoneCall className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                {language === 'mr' ? 'थेट फोन डायल (tel:1962)' : language === 'hi' ? 'फोन डायल (1962)' : 'Cellular 1962'}
              </Button>
            </a>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              hangUpIvrCall();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            {language === 'mr' ? 'बंद करा (Close)' : language === 'hi' ? 'बंद करें' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}

