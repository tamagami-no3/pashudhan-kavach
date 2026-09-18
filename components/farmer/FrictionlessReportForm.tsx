'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CLINICAL_SYMPTOMS_CATALOG,
  SymptomDescriptor,
  matchSymptomsFromText,
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

  // Voice recognition hook
  const { isListening, toggleListening, stopListening } = useVoiceInput({
    language,
    onTranscriptChange: (spoken) => {
      setVoiceNotes(spoken);
      // Real-time intent matching from voice transcript
      const matched = matchSymptomsFromText(spoken);
      if (matched.length > 0) {
        setSelectedSymptomIds((prev) => {
          const combined = new Set([...prev, ...matched.map((m) => m.id)]);
          return Array.from(combined);
        });
      }
    },
    onFinalTranscript: (finalSpoken) => {
      setVoiceNotes(finalSpoken);
      const matched = matchSymptomsFromText(finalSpoken);
      if (matched.length > 0) {
        setSelectedSymptomIds((prev) => {
          const combined = new Set([...prev, ...matched.map((m) => m.id)]);
          return Array.from(combined);
        });
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
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-11 text-xs border-dashed border-2 flex items-center justify-center gap-2 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
          >
            <Camera className="h-4 w-4" />
            <span>
              {language === 'mr'
                ? 'कॅमेरा सुरू करा / गॅलरीतून फोटो निवडा'
                : 'Open Camera / Choose Photo'}
            </span>
          </Button>
        )}
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

