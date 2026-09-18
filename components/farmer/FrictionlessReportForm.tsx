'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CLINICAL_SYMPTOMS_CATALOG,
  SymptomDescriptor,
  matchSymptomsFromText,
  detectNegatedSymptoms,
} from '@/lib/constants/symptoms';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { queueOfflineReport } from '@/lib/offlineStore';
import {
  Thermometer,
  Droplets,
  AlertCircle,
  Footprints,
  Activity,
  CircleDot,
  ShieldAlert,
  Zap,
  Flame,
  Waves,
  HeartCrack,
  Skull,
  Mic,
  MicOff,
  Camera,
  CheckCircle2,
  X,
  Send,
  Loader2,
  MapPin,
  Tag,
  WifiOff,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FrictionlessReportFormProps {
  initialLanguage?: 'mr' | 'hi' | 'en';
  onSuccess?: (ticketId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Thermometer,
  Droplets,
  AlertCircle,
  Footprints,
  Activity,
  CircleDot,
  ShieldAlert,
  Zap,
  Flame,
  Waves,
  HeartCrack,
  Skull,
};

export function FrictionlessReportForm({
  initialLanguage = 'mr',
  onSuccess,
}: FrictionlessReportFormProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>(initialLanguage);
  const [tagUid, setTagUid] = useState('999900001111');
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [voiceNotes, setVoiceNotes] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5204, lng: 73.8567 });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCameraTracks = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const stopLiveCamera = () => {
    stopCameraTracks();
    setIsCameraOpen(false);
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
  }, []);

  const startLiveCamera = async (mode = facingMode) => {
    setCameraError(null);
    stopCameraTracks();
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
        // Fallback for laptop webcams without environment lens
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
          ? 'कॅमेरा सुरू करता आला नाही. कृपया ब्राऊझर परवानगी तपासा किंवा फाइल अपलोड वापरा.'
          : 'Camera access unavailable or denied. Please check permissions or use file upload.'
      );
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  // Attach stream to video element when mounted
  useEffect(() => {
    if (isCameraOpen && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [isCameraOpen, cameraActive]);

  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setImageBase64(base64);
    setImagePreview(base64);
    stopLiveCamera();
    toast.success(
      language === 'mr' ? 'फोटो यशस्वीरीत्या जोडला गेला!' : 'Photo captured successfully!'
    );
  };

  // Acquire geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log('Geolocation note:', err.message),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Voice recognition hook with negation awareness
  const { isListening, toggleListening, stopListening } = useVoiceInput({
    language,
    onTranscriptChange: (spoken) => {
      setVoiceNotes(spoken);
      // Real-time intent matching from voice transcript
      const matched = matchSymptomsFromText(spoken);
      const negated = detectNegatedSymptoms(spoken);

      setSelectedSymptomIds((prev) => {
        let updated = [...prev];
        if (matched.length > 0) {
          updated = Array.from(new Set([...updated, ...matched.map((m) => m.id)]));
        }
        if (negated.length > 0) {
          const negIds = new Set(negated.map((n) => n.id));
          updated = updated.filter((id) => !negIds.has(id));
        }
        return updated;
      });
    },
    onFinalTranscript: (finalSpoken) => {
      setVoiceNotes(finalSpoken);
      const matched = matchSymptomsFromText(finalSpoken);
      const negated = detectNegatedSymptoms(finalSpoken);

      setSelectedSymptomIds((prev) => {
        let updated = [...prev];
        if (matched.length > 0) {
          updated = Array.from(new Set([...updated, ...matched.map((m) => m.id)]));
        }
        if (negated.length > 0) {
          const negIds = new Set(negated.map((n) => n.id));
          updated = updated.filter((id) => !negIds.has(id));
        }
        return updated;
      });

      if (matched.length > 0) {
        toast.success(
          language === 'mr'
            ? `${matched.length} लक्षणे आवाजावरून निवडली!`
            : `${matched.length} symptoms detected from voice!`
        );
      }
    },
  });

  const toggleSymptom = (id: string) => {
    setSelectedSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Image attachment handler
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission dispatcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSymptomIds.length === 0) {
      toast.error(
        language === 'mr'
          ? 'कृपया किमान एक लक्षण निवडा किंवा बोला'
          : 'Please select or speak at least one symptom'
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      tag_uid: tagUid.trim(),
      symptoms: selectedSymptomIds,
      voice_notes: voiceNotes.trim() || undefined,
      image_base64: imageBase64 || undefined,
      language,
      latitude: coords.lat,
      longitude: coords.lng,
    };

    // Check offline status
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isOffline) {
      try {
        await queueOfflineReport(payload);
        toast.warning(
          language === 'mr'
            ? 'नेटवर्क नाही — तक्रार स्थानिक IndexedDB मध्ये सेव्ह झाली! नेटवर्क येताच आपोआप सिंक होईल.'
            : 'Offline mode: Report saved locally in IndexedDB! Will sync automatically when online.'
        );
        router.push('/reports/offline/track');
        return;
      } catch (err: any) {
        toast.error('Offline storage failed: ' + err.message);
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/symptoms/triage-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || 'Submission failed');
      }

      const ticketId = json.data.ticket_id;
      toast.success(
        language === 'mr'
          ? `तक्रार नोंदवली! तिकीट: ${ticketId}`
          : `Report registered! Ticket: ${ticketId}`
      );

      if (onSuccess) {
        onSuccess(ticketId);
      } else {
        router.push(`/reports/${encodeURIComponent(ticketId)}/track`);
      }
    } catch (err: any) {
      console.warn('Network submit failed, falling back to offline IndexedDB queue:', err);
      try {
        await queueOfflineReport(payload);
        toast.info(
          language === 'mr'
            ? 'सर्व्हरशी संपर्क झाला नाही — तक्रार ऑफलाइन जतन केली गेली.'
            : 'Server unreachable — report queued locally for auto-sync.'
        );
        router.push('/reports/offline/track');
      } catch {
        toast.error(err.message || 'Submission error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Animal Tag UID Input Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-emerald-600" />
            <span>
              {language === 'mr'
                ? '१२ अंकी पशु आधार / टॅग नंबर'
                : language === 'hi'
                ? '12 अंकों का पशु आधार / टैग नंबर'
                : '12-Digit Bharat Pashudhan Tag UID'}
            </span>
          </label>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>उदा.</span>
            {['999900001111', '999900002222', '999900003333'].map((sampleTag) => (
              <button
                key={sampleTag}
                type="button"
                onClick={() => setTagUid(sampleTag)}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-mono text-[10px] transition"
              >
                #{sampleTag.slice(-4)}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          maxLength={12}
          value={tagUid}
          onChange={(e) => setTagUid(e.target.value.replace(/\D/g, ''))}
          placeholder="999900001111"
          className="w-full text-base font-mono tracking-widest font-bold px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>

      {/* 2. Voice-Guided Intent Listening Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-100 flex items-center justify-center sm:justify-start gap-1.5">
            <Mic className="h-4 w-4" />
            <span>
              {language === 'mr'
                ? 'आवाज मार्गदर्शित प्रणाली (Voice Guided)'
                : 'Voice-Guided Symptom Detection'}
            </span>
          </div>
          <h3 className="text-lg font-extrabold">
            {language === 'mr'
              ? 'माइक सुरू करा व जनावराची लक्षणे बोला'
              : 'Speak your animal symptoms naturally'}
          </h3>
          <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
            {language === 'mr'
              ? 'उदा. "गाईला खूप ताप आहे आणि तोंडातून लाळ गळत आहे" — बोलल्यास खालील लक्षणे आपोआप निवडली जातील.'
              : 'Say "Cow has high fever and excessive drooling" to auto-highlight clinical cards.'}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => toggleListening()}
          className={`h-14 px-6 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center gap-2.5 shrink-0 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-300'
              : 'bg-white hover:bg-slate-100 text-emerald-800'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              <span>थांबवा (Listening...)</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 text-emerald-600" />
              <span>आता बोला (Tap to Speak)</span>
            </>
          )}
        </Button>
      </div>

      {/* Spoken transcript visualizer pill */}
      {(isListening || voiceNotes) && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="font-mono text-slate-800 dark:text-slate-200 truncate">
              &quot;{voiceNotes || 'ऐकत आहे... (Listening...)'}&quot;
            </span>
          </div>
          {voiceNotes && (
            <button
              type="button"
              onClick={() => setVoiceNotes('')}
              className="text-[11px] text-slate-400 hover:text-red-500 shrink-0 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* 3. 48px Touch Target Visual Symptom Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {language === 'mr' ? 'लक्षणे निवडा (टॅप करा):' : 'Select Symptoms (Tap Cards):'}
          </h4>
          <span className="text-xs font-semibold text-emerald-600">
            {selectedSymptomIds.length} निवडले (Selected)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CLINICAL_SYMPTOMS_CATALOG.map((item) => {
            const isSelected = selectedSymptomIds.includes(item.id);
            const Icon = ICON_MAP[item.iconName] || AlertCircle;
            const isUrgent = item.urgency === 'urgent';

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggleSymptom(item.id)}
                className={`min-h-[5rem] p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 select-none ${
                  isSelected
                    ? isUrgent
                      ? 'border-red-500 bg-red-50/90 dark:bg-red-950/40 shadow-sm ring-1 ring-red-400'
                      : 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 transition ${
                    isSelected
                      ? isUrgent
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold leading-tight truncate ${
                        isSelected
                          ? isUrgent
                            ? 'text-red-900 dark:text-red-200'
                            : 'text-emerald-900 dark:text-emerald-200'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {language === 'mr'
                        ? item.label_mr
                        : language === 'hi'
                        ? item.label_hi
                        : item.label_en}
                    </span>
                    {isSelected && (
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          isUrgent ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {language === 'mr'
                      ? item.folk_desc_mr
                      : language === 'hi'
                      ? item.folk_desc_hi
                      : item.folk_desc_en}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Camera Photo Capture Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-emerald-600" />
            <span>
              {language === 'mr'
                ? 'जखमेचा / त्वचेचा फोटो जोडा (पर्यायी)'
                : 'Attach Photo of Lesion/Skin (Optional)'}
            </span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
        </div>

        {/* Live Camera Viewfinder Modal */}
        {isCameraOpen && (
          <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-700 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2 text-emerald-400">
                <Camera className="h-4 w-4" />
                <span>थेट कॅमेरा दृश्य (Live Viewfinder)</span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleCameraFacing}
                  className="text-xs h-7 px-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  कॅमेरा बदला
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={stopLiveCamera}
                  className="text-xs h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {cameraError ? (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
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
                <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-xl pointer-events-none" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                जनावराची जखम किंवा लक्षण चौकोनात ठेवा
              </span>
              <Button
                type="button"
                onClick={captureLiveSnapshot}
                disabled={Boolean(cameraError)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 h-8 gap-1.5 rounded-xl shadow"
              >
                <Camera className="h-3.5 w-3.5" />
                फोटो काढा (Capture)
              </Button>
            </div>
          </div>
        )}

        {imagePreview ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border">
            <img
              src={imagePreview}
              alt="Lesion preview"
              className="h-16 w-16 object-cover rounded-lg border"
            />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                फोटो जोडला गेला (Photo Attached)
              </span>
              <span className="text-[10px] text-emerald-600">Camera capture ready</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeImage}
              className="text-red-500 hover:text-red-600 text-xs"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : !isCameraOpen ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => startLiveCamera()}
              className="h-11 text-xs border-dashed border-2 flex items-center justify-center gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Camera className="h-4 w-4 text-emerald-600" />
              <span>
                {language === 'mr'
                  ? 'थेट कॅमेरा सुरू करा (Open Camera)'
                  : 'Open Live Camera'}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 text-xs border-dashed border-2 flex items-center justify-center gap-2 text-slate-600 hover:border-slate-400"
            >
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <span>
                {language === 'mr'
                  ? 'गॅलरीतून फोटो निवडा (Choose File)'
                  : 'Choose File from Gallery'}
              </span>
            </Button>
          </div>
        ) : null}
      </div>

      {/* 5. Submit Action Button */}
      <Button
        type="submit"
        disabled={submitting || selectedSymptomIds.length === 0}
        className="w-full h-13 rounded-2xl text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>नोंदणी होत आहे (Submitting Triage)...</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            <span>
              {language === 'mr'
                ? 'लक्षणे नोंदवा व तात्काळ सल्ला मिळवा (Submit)'
                : 'Submit Symptoms & Get Instant SLA Ticket'}
            </span>
          </>
        )}
      </Button>
    </form>
  );
}

