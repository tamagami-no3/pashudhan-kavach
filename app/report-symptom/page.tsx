'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  ShieldAlert,
  Send,
  FlaskConical,
  Radio,
  Info,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { DIAGNOSTIC_SYMPTOMS, GENERAL_SYMPTOMS } from '@/lib/validation';
import { REPORT_SYMPTOM_ROLES } from '@/lib/role-features';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export default function ReportSymptomPage() {
  const { user, loading: authLoading, t } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledAnimalId = searchParams.get('animal_id');

  const [animals, setAnimals] = useState<any[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(prefilledAnimalId || '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<any | null>(null);
  const [voiceSpokenText, setVoiceSpokenText] = useState('');

  const matchSymptomsFromSpeech = (spoken: string) => {
    const text = spoken.toLowerCase();
    const matched: string[] = [];

    const symptomPatterns: Record<string, string[]> = {
      fever_high: ['ताप', 'fever', 'बुखार', 'गरम'],
      drooling: ['लाळ', 'drool', 'saliva', 'लार'],
      mouth_blisters: ['तोंडात फोड', 'जीभ', 'mouth blister', 'छाले', 'फोड'],
      hoof_blisters: ['खुर', 'hoof', 'foot', 'पायात फोड', 'खुरां'],
      lameness: ['लंगड', 'lame', 'limp', 'लंगड़ा'],
      nodular_skin_lesions: ['गाठ', 'गाठी', 'lump', 'nodule', 'लंपी', 'गांठ'],
      swollen_lymph_nodes: ['ग्रंथी', 'lymph'],
      severe_diarrhea: ['जुलाब', 'अतिसार', 'diarrhea', 'दस्त'],
      respiratory_distress: ['श्वास', 'धाप', 'breath', 'gasp', 'साँस'],
      nasal_discharge: ['शेंबूड', 'नाक', 'nasal', 'discharge'],
      unclotted_dark_blood_discharge: ['रक्त', 'blood', 'खून'],
      throat_swelling: ['गळा', 'मान', 'throat', 'swelling'],
    };

    for (const [symId, keywords] of Object.entries(symptomPatterns)) {
      if (keywords.some((kw) => text.includes(kw))) {
        matched.push(symId);
      }
    }

    if (matched.length > 0) {
      setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...matched])));
      toast.success(
        `${matched.length} लक्षणे आवाजावरून निवडली गेली (${matched.length} symptoms matched from speech)`
      );
    }
  };

  const {
    isListening,
    toggleListening,
    isSupported: voiceSupported,
  } = useVoiceInput({
    language: (user?.preferred_language as any) || 'mr',
    onTranscriptChange: (spoken) => {
      setVoiceSpokenText(spoken);
    },
    onFinalTranscript: (finalSpoken) => {
      setVoiceSpokenText(finalSpoken);
      matchSymptomsFromSpeech(finalSpoken);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    // Route guard: Report Symptoms is farmer/paravet ONLY (locked RBAC spec)
    if (user && !REPORT_SYMPTOM_ROLES.includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchUserAnimals();
    }
  }, [user, authLoading, router]);

  const fetchUserAnimals = async () => {
    try {
      const res = await fetch('/api/animals?limit=50');
      if (res.ok) {
        const d = await res.json();
        const list = d.data || [];
        setAnimals(list);
        if (!selectedAnimalId && list.length > 0) {
          setSelectedAnimalId(list[0].id);
        }
      }
    } catch (e) {
      console.warn('Error fetching animals for report:', e);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId) {
      toast.error('Please select an animal');
      return;
    }
    if (selectedSymptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    const animal = animals.find((a) => a.id === selectedAnimalId);
    const lat = animal?.gps_lat || 18.52;
    const lng = animal?.gps_lng || 73.85;

    setSubmitting(true);
    try {
      const res = await fetch('/api/symptom-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animal_id: selectedAnimalId,
          symptoms: selectedSymptoms,
          gps_lat: lat,
          gps_lng: lng,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toast.error(d.error?.message || 'Submission failed');
        return;
      }

      toast.success('Symptom report submitted and triaged!');
      setTriageResult(d.data);
    } catch (err: any) {
      toast.error(err.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const getSymptomText = (code: string) => {
    return t(`sym_${code}`) || code;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container max-w-4xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-red-700 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" />
            {t('report_page_title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('report_page_desc')}
          </p>
        </div>

        {/* Triage Output Card */}
        {triageResult && (
          <Card className="border-red-200 bg-red-50/40 dark:bg-red-950/20 shadow-md animate-in fade-in slide-in-from-top-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    triageResult.triage?.riskLevel === 'critical'
                      ? 'destructive'
                      : triageResult.triage?.riskLevel === 'high'
                      ? 'default'
                      : 'secondary'
                  }
                  className="uppercase text-xs font-bold px-3 py-1"
                >
                  Risk Level: {triageResult.triage?.riskLevel}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  Score: {triageResult.triage?.severityScore} / 100
                </span>
              </div>
              <CardTitle className="text-xl font-bold mt-2 text-foreground">
                {t('triage_result_title')} {triageResult.triage?.predictedDisease}
              </CardTitle>
              <CardDescription>
                {t('confidence_label')} {triageResult.triage?.confidencePct}% ({triageResult.triage?.matchedSymptoms?.length} symptom matches)
              </CardDescription>
            </CardHeader>

              <CardContent className="space-y-4 text-sm">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-600" />
                    {t('isolation_advice_label')}
                  </span>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {triageResult.triage?.isolationAdvice}
                  </p>
                </div>

                {/* Comprehensive First-Aid & Precaution Guidelines */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-sm">
                    <ShieldAlert className="h-4 w-4 text-emerald-600" />
                    तात्काळ प्रथमोपचार व खबरदारीची मार्गदर्शक तत्त्वे (First Aid & Precautions)
                  </h4>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4">
                    <li><strong className="text-foreground">विलगीकरण (Quarantine):</strong> आजारी जनावराला इतर निरोगी गुरांपासून किमान २० मीटर अंतरावर वेगळ्या गोठ्यात बांधा.</li>
                    <li><strong className="text-foreground">गोठा निर्जंतुकीकरण (Shed Sanitation):</strong> १% सोडियम हायपोक्लोराईट किंवा पोटॅशियम परमँगनेटच्या पाण्याने गोठा रोज धुवून स्वच्छ करा.</li>
                    <li><strong className="text-foreground">खाद्य व पाणी (Feed & Water):</strong> स्वच्छ कोमट पाणी द्या, हिरवा मऊ चारा बारीक करून द्या. आजारी गुरांचे भांडे वेगळे ठेवा.</li>
                    <li><strong className="text-foreground">कीटक व माशी नियंत्रण (Vector Control):</strong> डास व माशांचा उपद्रव टाळण्यासाठी कडुनिंबाचा धूर करा किंवा कीटकनाशक फवारणी करा.</li>
                  </ul>
                </div>

                {/* Automatic Pipeline Triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {triageResult.lab_case && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 rounded-lg flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-700 flex-shrink-0" />
                      <div>
                        <span className="font-bold block text-purple-900 dark:text-purple-200">{t('sample_created_notice')}</span>
                        <span className="font-mono text-[11px] text-purple-700">{triageResult.lab_case.sample_id}</span>
                      </div>
                    </div>
                  )}
                  {triageResult.community_post && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg flex items-center gap-2">
                      <Radio className="h-4 w-4 text-amber-700 flex-shrink-0" />
                      <div>
                        <span className="font-bold block text-amber-900 dark:text-amber-200">{t('advisory_created_notice')}</span>
                        <span className="text-[11px] text-amber-700">Advisory updated</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTriageResult(null)} className="text-xs">
                    Report Another Animal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-xs border-emerald-300 text-emerald-800 dark:text-emerald-300"
                  >
                    📄 Print / Save Advisory PDF
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => toast.success('🚨 आपातकालीन पशुवैद्यक अधिकारी यांना थेट सूचना पाठवली गेली आहे (Emergency Escalated)')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  🚨 Call Emergency Vet Officer
                </Button>
              </CardFooter>
            </Card>
          )}

        {/* Reporting Form */}
        {!triageResult && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Animal Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">{t('select_animal_label')}</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-md border bg-background font-medium"
                  required
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      TAG #{a.tag_uid} — {a.species} ({a.breed}), {a.village} [{a.health_status}]
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Diagnostic Symptoms Checklist */}
            <Card>
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-red-700 dark:text-red-400">
                    {t('diagnostic_symptoms_title')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    चेकबॉक्सेस निवडा किंवा माइक बटणावर क्लिक करून लक्षणे बोला
                  </CardDescription>
                </div>

                {/* Voice Input Trigger Button */}
                <Button
                  type="button"
                  onClick={() => toggleListening()}
                  className={`text-xs h-9 px-3.5 flex items-center gap-2 transition-all ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-2 ring-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      <span>बोलणे थांबवा (Stop)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>आवाजाद्वारे सांगा (Voice Dictate)</span>
                    </>
                  )}
                </Button>
              </CardHeader>

              {/* Spoken Voice Transcript Banner */}
              {(isListening || voiceSpokenText) && (
                <div className="mx-6 mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                      {isListening ? 'माइक सुरू आहे... (Listening to voice)' : 'आवाज टिपला गेला (Voice Captured)'}
                    </span>
                    {voiceSpokenText && (
                      <button
                        type="button"
                        onClick={() => setVoiceSpokenText('')}
                        className="text-[11px] text-muted-foreground hover:text-red-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-foreground italic bg-white dark:bg-zinc-900 p-2 rounded-lg border font-mono">
                    &quot;{voiceSpokenText || 'कृपया आपल्या जनावराची लक्षणे बोला...'}&quot;
                  </p>
                </div>
              )}
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DIAGNOSTIC_SYMPTOMS.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym.id);
                    return (
                      <label
                        key={sym.id}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-red-50/80 border-red-300 font-semibold text-red-900 dark:bg-red-950/40 dark:text-red-200'
                            : 'bg-background hover:bg-muted/40 text-foreground'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleSymptomToggle(sym.id)}
                          className="mt-0.5"
                        />
                        <span>{getSymptomText(sym.id)}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* General Signs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-muted-foreground">
                  {t('general_symptoms_title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {GENERAL_SYMPTOMS.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym);
                    return (
                      <label
                        key={sym}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-slate-100 border-slate-400 font-semibold dark:bg-zinc-800'
                            : 'bg-background hover:bg-muted/40'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleSymptomToggle(sym)}
                          className="mt-0.5"
                        />
                        <span>{getSymptomText(sym)}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Submit Action */}
            <Button
              type="submit"
              disabled={submitting || selectedSymptoms.length === 0 || !selectedAnimalId}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-md gap-2"
            >
              {submitting ? 'Processing...' : `${t('run_triage_submit')} (${selectedSymptoms.length})`}
              {!submitting && <Send className="h-5 w-5" />}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
