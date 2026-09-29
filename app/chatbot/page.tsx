'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  Send,
  Image as ImageIcon,
  Camera,
  Bot,
  User,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  PhoneCall,
  Loader2,
  Eye,
  RefreshCw,
  Mic,
  MicOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { runMobileNetInference, VisualSignal } from '@/lib/services/mobileNetClient';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
  predicted_disease?: string | null;
  confidence_level?: string;
  alert_level?: 'none' | 'caution' | 'urgent';
  precautions?: string[];
  visual_signal?: VisualSignal[];
  timestamp: string;
}

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export default function ChatbotPage() {
  const { language: authLanguage, setLanguage: setAuthLanguage } = useAuth();
  const [language, setLanguageState] = useState<'mr' | 'hi' | 'en'>(
    (authLanguage as 'mr' | 'hi' | 'en') || 'mr'
  );

  const setLanguage = (lang: 'mr' | 'hi' | 'en') => {
    setLanguageState(lang);
    if (setAuthLanguage) setAuthLanguage(lang);
  };

  useEffect(() => {
    if (authLanguage && (authLanguage === 'mr' || authLanguage === 'hi' || authLanguage === 'en')) {
      setLanguageState(authLanguage);
    }
  }, [authLanguage]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
    base64: string;
    mediaType: string;
  } | null>(null);
  const [pendingVisualSignal, setPendingVisualSignal] = useState<VisualSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  // Webcam capture state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice input recognition state for symptoms
  const {
    isListening,
    toggleListening,
    stopListening,
    isSupported: voiceSupported,
  } = useVoiceInput({
    language,
    onTranscriptChange: (spoken) => {
      setInputText(spoken);
    },
    onFinalTranscript: (finalSpoken) => {
      setInputText(finalSpoken);
      toast.success(
        language === 'mr'
          ? 'आवाज नोंदवला गेला!'
          : language === 'hi'
          ? 'आवाज रिकॉर्ड हो गया!'
          : 'Voice input captured!'
      );
    },
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const stopTracks = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const stopCamera = () => {
    stopTracks();
    setIsCameraOpen(false);
    setCameraActive(false);
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, []);

  // Reactive welcome message per language
  useEffect(() => {
    const welcomeMap: Record<'mr' | 'hi' | 'en', ChatMessage> = {
      mr: {
        id: 'welcome-mr',
        role: 'model',
        text: 'नमस्कार! मी "पशुधन एआय व्हिजन सहायक" आहे. आपल्या जनावराची लक्षणे सांगा किंवा जखम/त्वचेचा फोटो अपलोड करा किंवा थेट कॅमेऱ्याने फोटो काढा. मी तात्काळ प्राथमिक रोग निदान व खबरदारी सुचवीन.',
        alert_level: 'none',
        precautions: [
          'कॅमेऱ्याने जखम किंवा त्वचेवरील गाठींचा स्पष्ट फोटो घ्या.',
          'लक्षणे बोलून सांगा किंवा खाली टाईप करा.',
          'तातडीच्या गंभीर प्रसंगी शासकीय हेल्पलाइन १९६२ किंवा /report वापरा.',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      hi: {
        id: 'welcome-hi',
        role: 'model',
        text: 'नमस्ते! मैं "पशुधन एआई विज़न सहायक" हूँ। अपने पशु के लक्षण बताएं या त्वचा/घाव की तस्वीर कैमरे से खींचें। मैं प्राथमिक रोग पहचान व आवश्यक सावधानियां बताऊंगा।',
        alert_level: 'none',
        precautions: [
          'कैमरे से घाव या गांठों की साफ तस्वीर लें।',
          'माइक से बोलकर या लिखकर लक्षण दर्ज करें।',
          'आपातकालीन स्थिति में 1962 हेल्पलाइन या /report का उपयोग करें।',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      en: {
        id: 'welcome-en',
        role: 'model',
        text: 'Hello! I am "Pashudhan AI Vision Assistant". Describe your animal\'s symptoms or capture a photo of the lesion/skin via camera for instant preliminary AI screening and care guidance.',
        alert_level: 'none',
        precautions: [
          'Capture a clear, well-lit photo of the skin nodules or mouth/hoof lesions.',
          'Speak or type symptoms using the mic or input box below.',
          'For acute emergencies, call 1962 or dispatch a vet via /report immediately.',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };

    setMessages((prev) => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id.startsWith('welcome-'))) {
        return [welcomeMap[language]];
      }
      return prev;
    });
  }, [language]);

  // --- WEBCAM STREAM CONTROLS ---
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    stopTracks();
    setIsCameraOpen(true);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback for laptop webcams that don't support ideal facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      cameraStreamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        language === 'mr'
          ? 'कॅमेरा सुरू करता आला नाही किंवा परवानगी नाकारली. आपण गॅलरीतून फोटो जोडू शकता.'
          : 'Camera access unavailable or denied. You can still attach an image file.'
      );
    }
  };

  useEffect(() => {
    if (isCameraOpen && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [isCameraOpen, cameraActive]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    const blob = dataURLtoBlob(base64);
    const file = new File([blob], `camera-snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(blob);

    stopCamera();

    // Re-use exact same upload state
    setSelectedImage({
      file,
      preview: previewUrl,
      base64,
      mediaType: 'image/jpeg',
    });

    // Run MobileNet on captured canvas asynchronously
    setIsClassifying(true);
    runMobileNetInference(canvas)
      .then((signals) => {
        setPendingVisualSignal(signals);
      })
      .finally(() => {
        setIsClassifying(false);
      });
  };

  // --- FILE INPUT HANDLER ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage({
        file,
        preview: previewUrl,
        base64,
        mediaType: file.type,
      });

      // Run MobileNet on loaded image asynchronously in background
      setIsClassifying(true);
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        runMobileNetInference(img)
          .then((signals) => {
            setPendingVisualSignal(signals);
          })
          .finally(() => {
            setIsClassifying(false);
          });
      };
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setPendingVisualSignal([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const currentText = inputText.trim();
    const currentImg = selectedImage;
    const currentVisualSignal = pendingVisualSignal;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: currentText,
      imagePreview: currentImg?.preview,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setPendingVisualSignal([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chatbot/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentText,
          imageBase64: currentImg?.base64,
          imageMediaType: currentImg?.mediaType,
          visual_signal: currentVisualSignal,
          language,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Analysis completed.',
        predicted_disease: data.predicted_disease,
        confidence_level: data.confidence_level,
        alert_level: data.alert_level || 'none',
        precautions: data.precautions || [],
        visual_signal: currentVisualSignal.length > 0 ? currentVisualSignal : data.visual_signal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text:
          language === 'mr'
            ? 'सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा किंवा १९६२ वर कॉल करा.'
            : 'Could not connect to service. Please try again or call 1962.',
        alert_level: 'caution',
        precautions: ['तात्काळ नजीकच्या पशुवैद्यकीय डॉक्टरांचा सल्ला घ्या.'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    mr: {
      title: 'एआय व्हिजन आरोग्य स्कॅनर (AI Vision Health Scanner)',
      subtitle: 'थेट कॅमेरा किंवा फोटोद्वारे लंपी (LSD), लाळ्या खुरकूत (FMD) व इतर रोगांचे तात्काळ व्हिज्युअल विश्लेषण',
      disclaimerTitle: 'प्राथमिक व्हिज्युअल तपासणी (Preliminary Visual AI)',
      disclaimer: 'हे प्राथमिक एआय व्हिज्युअल मॉडेल आहे, प्रयोगशाळा तपासणी नाही. गंभीर आणीबाणीसाठी तात्काळ १९६२ किंवा अधिकृत डॉक्टरांशी संपर्क साधा.',
      inputPlaceholder: 'जनावराची लक्षणे येथे लिहा (उदा. तोंडात फोड, अंगावर गाठी, ताप)...',
      send: 'पाठवा',
      uploadPhoto: 'फोटो जोडा',
      openCamera: 'कॅमेरा सुरू करा',
      captureSnapshot: 'फोटो काढा',
      closeCamera: 'कॅमेरा बंद करा',
      diseaseFound: 'संभाव्य रोग:',
      confidence: 'अंदाज अचूकता:',
      precautionsTitle: 'महत्त्वाच्या खबरदाऱ्या व उपाय:',
      edgeSignalTitle: 'एज व्हिज्युअल सिग्नल (Pretrained MobileNet)',
      edgeSignalDisclaimer: '* सामान्य कॉम्प्युटर व्हिजन मॉडेल आधारित व्हिज्युअल वैशिष्ट्ये. हे प्रयोगशाळा चाचणी नाही.',
      urgentAlert: 'तातडीचा इशारा — तात्काळ विलगीकरण आवश्यक!',
      cautionAlert: 'सावधानता इशारा — लक्षणांवर बारीक लक्ष ठेवा',
      helpline: 'पशु आपत्कालीन मदत: १९६२',
      voiceInput: 'माइक द्वारे लक्षणे सांगा (Speak)',
      listening: 'बोलत रहा, ऐकत आहे... (Listening)',
      dispatchVetBtn: 'तातडीने डॉक्टर बोलवा (१९६२)',
    },
    hi: {
      title: 'एआई विज़न स्वास्थ्य स्कैनर (AI Vision Health Scanner)',
      subtitle: 'लाइव कैमरा या फोटो द्वारा लंपी (LSD), एफएमडी (FMD) व अन्य रोगों का त्वरित विज़ुअल विश्लेषण',
      disclaimerTitle: 'प्रारंभिक विज़ुअल जांच (Preliminary Visual AI)',
      disclaimer: 'यह प्रारंभिक एआई विज़ुअल मॉडल है, लैब रिपोर्ट नहीं। आपात स्थिति में तत्काल 1962 पर कॉल करें।',
      inputPlaceholder: 'पशु के लक्षण यहाँ लिखें (उदा. मुंह में छाले, त्वचा पर गांठें, बुखार)...',
      send: 'भेजें',
      uploadPhoto: 'फोटो जोड़ें',
      openCamera: 'कैमरा खोलें',
      captureSnapshot: 'फोटो लें',
      closeCamera: 'कैमरा बंद करें',
      diseaseFound: 'संभावित रोग:',
      confidence: 'सटीकता स्तर:',
      precautionsTitle: 'जरूरी सावधानियां और उपाय:',
      edgeSignalTitle: 'एज विज़ुअल सिग्नल (Pretrained MobileNet)',
      edgeSignalDisclaimer: '* सामान्य कंप्यूटर विजन मॉडल आधारित विज़ुअल विशेषताएं।',
      urgentAlert: 'गंभीर चेतावनी — तत्काल अलगाव आवश्यक!',
      cautionAlert: 'सावधानी — लक्षणों पर नजर रखें',
      helpline: 'पशु आपातकालीन हेल्पलाइन: 1962',
      voiceInput: 'माइक द्वारा लक्षण बोलें (Speak)',
      listening: 'बोलते रहें, सुन रहे हैं... (Listening)',
      dispatchVetBtn: 'तुरंत डॉक्टर बुलाएं (1962)',
    },
    en: {
      title: 'AI Vision Health Scanner & Care Assistant',
      subtitle: 'Visual lesion screening for Lumpy Skin, FMD & bovine diseases via live camera & multimodal AI',
      disclaimerTitle: 'Preliminary Visual AI Screening',
      disclaimer: 'This is a preliminary visual AI screening tool, not certified laboratory diagnosis. In critical cases, dispatch a vet immediately.',
      inputPlaceholder: 'Describe symptoms here (e.g., mouth blisters, skin lumps, high fever)...',
      send: 'Send',
      uploadPhoto: 'Attach Photo',
      openCamera: 'Open Camera',
      captureSnapshot: 'Take Snapshot',
      closeCamera: 'Close Camera',
      diseaseFound: 'Suspected Condition:',
      confidence: 'Confidence:',
      precautionsTitle: 'Recommended Precautions & Care:',
      edgeSignalTitle: 'Edge Visual Signal (Pretrained MobileNet)',
      edgeSignalDisclaimer: '* Pretrained general computer vision model for edge feature cues. Not certified lab confirmation.',
      urgentAlert: 'CRITICAL ALERT — Immediate Quarantine & Vet Intervention Required!',
      cautionAlert: 'CAUTION — Disease Symptoms Detected',
      helpline: 'Govt Animal Emergency Helpline: 1962',
      voiceInput: 'Speak symptoms via microphone',
      listening: 'Listening to symptoms (speak now)...',
      dispatchVetBtn: 'Dispatch Field Vet (1962)',
    },
  }[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* Header with Title & Language Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{labels.title}</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-medium text-xs">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> Gemini Multimodal
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{labels.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Emergency Hotline Direct Link */}
            <Link href="/report">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm h-8 px-3">
                <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                {labels.dispatchVetBtn}
              </Button>
            </Link>

            {/* Standalone Language Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border rounded-lg p-1 shadow-sm text-xs font-semibold">
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  language === 'mr' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  language === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Ribbon */}
        <div className="mt-3 py-2 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>{labels.disclaimerTitle}:</strong> {labels.disclaimer}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
            <PhoneCall className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>1962</span>
          </div>
        </div>

        {/* Live Webcam Modal */}
        {isCameraOpen && (
          <div className="my-4 p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Live Camera Viewfinder</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleCameraFacing}
                  className="text-xs h-8 px-2.5 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Flip</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={stopCamera}
                  className="text-xs h-8 px-2 text-slate-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {cameraError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-72 w-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder crosshairs overlay */}
                <div className="absolute inset-6 border border-white/40 rounded-xl pointer-events-none" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Frame the animal&apos;s skin lesions or symptoms clearly
              </span>
              <Button
                type="button"
                onClick={captureSnapshot}
                disabled={Boolean(cameraError)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 flex items-center gap-1.5 shadow-sm"
              >
                <Camera className="h-4 w-4" />
                <span>{labels.captureSnapshot}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Chat Messages Scroll Area */}
        <div className="flex-1 my-4 overflow-y-auto space-y-4 max-h-[60vh] sm:max-h-[64vh] pr-1">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-900 border text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {/* User Attached Image Thumbnail */}
                    {m.imagePreview && (
                      <div className="mb-2.5 overflow-hidden rounded-lg border border-white/20">
                        <img
                          src={m.imagePreview}
                          alt="Livestock upload"
                          className="max-h-56 w-auto object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Alert Banner for Assistant Messages */}
                    {!isUser && m.alert_level === 'urgent' && (
                      <div className="mb-3 p-3 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 rounded-xl flex items-start gap-2.5 animate-pulse">
                        <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wide">{labels.urgentAlert}</p>
                          <p className="text-xs mt-0.5 font-medium">{labels.helpline}</p>
                        </div>
                      </div>
                    )}

                    {!isUser && m.alert_level === 'caution' && (
                      <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="font-semibold text-xs">{labels.cautionAlert}</p>
                      </div>
                    )}

                    {/* Predicted Disease Tag (Primary Gemini Diagnosis) */}
                    {!isUser && m.predicted_disease && (
                      <div className="mb-2.5 pb-2 border-b flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{labels.diseaseFound}</span>
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                          {m.predicted_disease}
                        </Badge>
                        {m.confidence_level && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            ({labels.confidence} {m.confidence_level})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Main Reply Text */}
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {/* Secondary Edge Inference Signal (Pretrained MobileNet) */}
                    {!isUser && m.visual_signal && m.visual_signal.length > 0 && (
                      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <Eye className="h-3.5 w-3.5" />
                            {labels.edgeSignalTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">Edge Signal</span>
                        </div>
                        <div className="space-y-1">
                          {m.visual_signal.map((sig, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 dark:text-slate-300 font-mono truncate max-w-[220px]">
                                • {sig.className}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {Math.round(sig.probability * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic border-t pt-1">
                          {labels.edgeSignalDisclaimer}
                        </p>
                      </div>
                    )}

                    {/* Precautions List */}
                    {!isUser && m.precautions && m.precautions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {labels.precautionsTitle}
                        </p>
                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {m.precautions.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-spin">
                <Loader2 className="h-4 w-4" />
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border rounded-2xl rounded-bl-none text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>AI विश्लेषण करत आहे (Analyzing symptoms with Gemini Multimodal)...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Thumbnail Preview before sending */}
        {selectedImage && (
          <div className="mb-2 p-2 bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between w-fit gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <img
                src={selectedImage.preview}
                alt="Selected"
                className="h-12 w-12 object-cover rounded-lg border"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {selectedImage.file.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span>{(selectedImage.file.size / 1024).toFixed(1)} KB</span>
                  {isClassifying ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Edge CV...
                    </span>
                  ) : pendingVisualSignal.length > 0 ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> CV Signal Ready
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              onClick={removeSelectedImage}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active Speech Recognition Banner */}
        {isListening && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between shadow-sm text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-semibold">{labels.listening}</span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-xs font-bold text-red-600 hover:underline px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60"
            >
              थांबवा (Stop)
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-auto pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border shadow-md focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Upload Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl shrink-0"
              title={labels.uploadPhoto}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>

            {/* Camera Capture Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => (isCameraOpen ? stopCamera() : startCamera())}
              className={`hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl shrink-0 ${
                isCameraOpen ? 'text-emerald-600 bg-emerald-50 dark:bg-slate-800' : 'text-slate-500 hover:text-emerald-600'
              }`}
              title={labels.openCamera}
            >
              <Camera className="h-5 w-5" />
            </Button>

            {/* Voice Input Microphone Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggleListening(language)}
              className={`rounded-xl shrink-0 transition-all ${
                isListening
                  ? 'text-red-500 bg-red-50 dark:bg-red-950/60 ring-2 ring-red-400 animate-pulse'
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop listening' : labels.voiceInput}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? labels.listening : labels.inputPlaceholder}
              disabled={loading}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm px-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            >
              <span>{labels.send}</span>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
