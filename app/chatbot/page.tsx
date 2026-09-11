'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Send,
  Image as ImageIcon,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
  predicted_disease?: string | null;
  confidence_level?: string;
  alert_level?: 'none' | 'caution' | 'urgent';
  precautions?: string[];
  timestamp: string;
}

export default function ChatbotPage() {
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
    base64: string;
    mediaType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial welcome message per language
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMap: Record<'mr' | 'hi' | 'en', ChatMessage> = {
        mr: {
          id: 'welcome-mr',
          role: 'model',
          text: 'नमस्कार! मी "पशुधन सहायक" आहे. आपल्या जनावराची लक्षणे सांगा किंवा जखम/त्वचेचा फोटो अपलोड करा. मी प्राथमिक रोग निदान आणि आवश्यक खबरदारी सुचवीन.',
          alert_level: 'none',
          precautions: [
            'लक्षणे स्पष्ट व सविस्तर लिहा.',
            'स्पष्ट व चांगल्या प्रकाशात घेतलेला फोटो अपलोड करा.',
            'तातडीच्या प्रसंगी १९६२ वर कॉल करा.',
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        hi: {
          id: 'welcome-hi',
          role: 'model',
          text: 'नमस्ते! मैं "पशुधन सहायक" हूँ। अपने पशु के लक्षण बताएं या फोटो अपलोड करें। मैं प्राथमिक रोग पहचान और सावधानियां बताऊंगा।',
          alert_level: 'none',
          precautions: [
            'लक्षणों का विवरण स्पष्ट रूप से लिखें।',
            'साफ और अच्छी रोशनी वाली तस्वीर अपलोड करें।',
            'आपातकालीन स्थिति में 1962 पर कॉल करें।',
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        en: {
          id: 'welcome-en',
          role: 'model',
          text: 'Hello! I am "Pashudhan Sahayak", your AI livestock health assistant. Describe your animal\'s symptoms or upload a photo of lesions/skin for preliminary disease screening and precautions.',
          alert_level: 'none',
          precautions: [
            'Describe visible symptoms clearly (fever, mouth blisters, skin lumps).',
            'Upload a clear, well-lit photo of the affected area.',
            'For emergencies, call Govt Veterinary Helpline 1962 immediately.',
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
      setMessages([welcomeMap[language]]);
    }
  }, [language, messages.length]);

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
      setSelectedImage({
        file,
        preview: URL.createObjectURL(file),
        base64,
        mediaType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const currentText = inputText.trim();
    const currentImg = selectedImage;

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
      title: 'पशुधन सहायक — एआय रोग निदान चॅटबॉट',
      subtitle: 'लक्षणे व फोटोद्वारे लाळ्या-खुरकूत, लंपी, अँथ्रॅक्स व इतर रोगांचे प्राथमिक विश्लेषण',
      disclaimerTitle: 'वैद्यकीय सूचना (Medical Disclaimer)',
      disclaimer: 'हा केवळ एआय-सहाय्यित प्राथमिक अंदाज आहे. अंतिम निदानासाठी अधिकृत पशुवैद्यकीय डॉक्टरांचा सल्ला घ्या.',
      inputPlaceholder: 'जनावराची लक्षणे येथे लिहा (उदा. तोंडात फोड, अंगावर गाठी, ताप)...',
      send: 'पाठवा',
      uploadPhoto: 'फोटो जोडा',
      diseaseFound: 'संभाव्य रोग:',
      confidence: 'अंदाज अचूकता:',
      precautionsTitle: 'महत्त्वाच्या खबरदाऱ्या व उपाय:',
      urgentAlert: 'तातडीचा इशारा — तात्काळ विलगीकरण आवश्यक!',
      cautionAlert: 'सावधानता इशारा — लक्षणांवर बारीक लक्ष ठेवा',
      helpline: 'पशु आपत्कालीन मदत: १९६२',
    },
    hi: {
      title: 'पशुधन सहायक — एआई रोग निदान चैटबॉट',
      subtitle: 'लक्षणों और फोटो द्वारा एफएमडी, लंपी, एंथ्रेक्स आदि का प्राथमिक विश्लेषण',
      disclaimerTitle: 'चिकित्सीय सूचना (Medical Disclaimer)',
      disclaimer: 'यह केवल एआई-सहायता प्राप्त प्रारंभिक अनुमान है। अंतिम निदान के लिए पशु चिकित्सक से संपर्क करें।',
      inputPlaceholder: 'पशु के लक्षण यहाँ लिखें (उदा. मुंह में छाले, त्वचा पर गांठें, बुखार)...',
      send: 'भेजें',
      uploadPhoto: 'फोटो जोड़ें',
      diseaseFound: 'संभावित रोग:',
      confidence: 'सटीकता स्तर:',
      precautionsTitle: 'जरूरी सावधानियां और उपाय:',
      urgentAlert: 'गंभीर चेतावनी — तत्काल अलगाव आवश्यक!',
      cautionAlert: 'सावधानी — लक्षणों पर नजर रखें',
      helpline: 'पशु आपातकालीन हेल्पलाइन: 1962',
    },
    en: {
      title: 'Pashudhan Sahayak — AI Disease Diagnosis Chatbot',
      subtitle: 'Screening for FMD, LSD, Anthrax, PPR & Black Quarter via symptoms and image analysis',
      disclaimerTitle: 'Medical Disclaimer',
      disclaimer: 'This is a preliminary AI-assisted screening tool, not a certified lab diagnosis. Always consult a registered veterinarian.',
      inputPlaceholder: 'Describe symptoms here (e.g., mouth blisters, skin lumps, high fever)...',
      send: 'Send',
      uploadPhoto: 'Attach Photo',
      diseaseFound: 'Suspected Condition:',
      confidence: 'Confidence:',
      precautionsTitle: 'Recommended Precautions & Care:',
      urgentAlert: 'CRITICAL ALERT — Immediate Quarantine & Vet Intervention Required!',
      cautionAlert: 'CAUTION — Disease Symptoms Detected',
      helpline: 'Govt Animal Emergency Helpline: 1962',
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
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{labels.title}</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-medium text-xs">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> Gemini 2.0 Flash
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{labels.subtitle}</p>
            </div>
          </div>

          {/* Standalone Language Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border rounded-lg p-1 shadow-sm text-xs font-semibold self-end sm:self-auto">
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                language === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              English
            </button>
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

                    {/* Predicted Disease Tag */}
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
                <span>AI विश्लेषण करत आहे (Analyzing with Gemini 2.0 Flash)...</span>
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
                <p className="text-[10px] text-slate-500">{(selectedImage.file.size / 1024).toFixed(1)} KB</p>
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

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={labels.inputPlaceholder}
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

