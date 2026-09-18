'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { getPendingReports, syncQueuedReportsToServer, OfflineReportItem } from '@/lib/offlineStore';
import { CLINICAL_SYMPTOMS_CATALOG } from '@/lib/constants/symptoms';
import {
  CheckCircle2,
  Clock,
  Truck,
  Stethoscope,
  PhoneCall,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  WifiOff,
  RefreshCw,
  Share2,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

interface TicketData {
  ticket_id: string;
  report_id: string;
  status: 'reported' | 'officer_assigned' | 'vet_dispatched' | 'treatment_completed';
  triage?: {
    diseaseCode?: string;
    diseaseName?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore?: number;
    recommendedAction?: string;
  };
  sla_minutes: number;
  sla_deadline: string;
  assigned_vet: {
    name: string;
    role: string;
    phone: string;
    vehicle_no: string;
    eta_minutes: number;
  };
  dispensary: {
    name: string;
    address: string;
    helpline: string;
    distance_km: number;
  };
  first_aid: string[];
  tag_uid?: string;
  symptoms: string[];
  created_at: string;
}

export default function CaseTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const ticketParam = typeof params?.id === 'string' ? decodeURIComponent(params.id) : '';

  const isOfflineMode = ticketParam.toLowerCase() === 'offline';

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [offlineItems, setOfflineItems] = useState<OfflineReportItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [etaRemainingSeconds, setEtaRemainingSeconds] = useState<number>(18 * 60);

  // Fetch ticket details or offline items
  useEffect(() => {
    if (isOfflineMode) {
      getPendingReports().then((items) => {
        setOfflineItems(items);
        setLoading(false);
      });
      return;
    }

    async function loadTicket() {
      try {
        setLoading(true);
        const res = await fetch(`/api/symptoms/triage-report?ticket_id=${encodeURIComponent(ticketParam)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTicket(json.data);
          const etaSec = (json.data.assigned_vet?.eta_minutes || 20) * 60;
          setEtaRemainingSeconds(etaSec);
        }
      } catch (err) {
        console.error('Failed to load ticket data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketParam, isOfflineMode]);

  // Live countdown timer for Doctor's ETA
  useEffect(() => {
    if (isOfflineMode || !ticket) return;

    const interval = setInterval(() => {
      setEtaRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOfflineMode, ticket]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncQueuedReportsToServer();
      if (result.synced > 0) {
        toast.success(`यशस्वी! ${result.synced} ऑफलाइन तक्रारी सर्व्हरवर सिंक झाल्या.`);
        const pending = await getPendingReports();
        setOfflineItems(pending);
        if (pending.length === 0) {
          router.push('/reports/PK-260918-4921/track');
        }
      } else {
        toast.info('सिंक करण्यासाठी कोणतीही प्रलंबित तक्रार नाही किंवा इंटरनेट बंद आहे.');
      }
    } catch (err: any) {
      toast.error('सिंक अयशस्वी: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const formatTimeRemaining = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins} मि. ${secs < 10 ? '0' : ''}${secs} से.`;
  };

  const getSymptomLabel = (id: string) => {
    const item = CLINICAL_SYMPTOMS_CATALOG.find((s) => s.id === id);
    return item ? `${item.label_mr} (${item.label_en})` : id;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground pb-20 md:pb-12">
      <Navbar />

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back Link & Title */}
        <div className="flex items-center justify-between">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>नवीन तक्रार नोंदवा (New Report)</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
              {isOfflineMode ? 'OFFLINE QUEUE' : ticket?.ticket_id || ticketParam}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CASE A: OFFLINE QUEUE VIEW                                   */}
        {/* ============================================================ */}
        {isOfflineMode ? (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                  <WifiOff className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">
                    स्थानिक ऑफलाइन रांग (IndexedDB Queue)
                  </h2>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                    तुमचे इंटरनेट कनेक्शन सध्या बंद आहे किंवा मंद आहे. तक्रार सुरक्षितपणे तुमच्या फोनवर सेव्ह केली आहे. नेटवर्क उपलब्ध होताच ही माहिती शासकीय नियंत्रण कक्षाला पाठवली जाईल.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'सिंक होत आहे...' : 'आता सिंक करा (Sync Now)'}
                </Button>
                <a href="tel:1962">
                  <Button variant="outline" className="text-xs font-bold border-amber-400">
                    <PhoneCall className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                    तातडीसाठी थेट कॉल करा: १९६२
                  </Button>
                </a>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>प्रलंबित तक्रारी ({offlineItems.length})</span>
                  <Badge variant="outline" className="text-[11px]">
                    IndexedDB Secure
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  खालील नोंदी फोनच्या मेमरीमध्ये सुरक्षित असून नेटवर्क येताच आपोआप अपलोड होतील.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {offlineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    सध्या कोणतीही प्रलंबित ऑफलाइन तक्रार नाही.
                  </div>
                ) : (
                  offlineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            टॅग: {item.tag_uid}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.queued_at).toLocaleTimeString('mr-IN')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.symptoms.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">
                              {getSymptomLabel(s)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] self-start sm:self-auto">
                        Waiting for Online
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Offline Immediate First-Aid */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-emerald-600" />
                  <span>पशुवैद्यक येईपर्यंत तातडीचे प्रथमोपचार (Emergency First-Aid)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p>• आजारी जनावराला इतर निरोगी जनावरांपासून ताबडतोब वेगळ्या गोठ्यात बांधा.</p>
                <p>• तोंडातील किंवा पायातील फोडांवर पोटॅशियम परमँगनेट (लाल औषध) चा सौम्य लेप लावा.</p>
                <p>• जनावरास पिण्यासाठी स्वच्छ कोमट पाणी व पचायला हलका मऊ चारा द्या.</p>
                <p>• माश्या व डास होऊ नयेत म्हणून कडुनिंबाचा धूर करा.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ============================================================ */
          /* CASE B: LIVE 4-PHASE CASE TRACKER VIEW                       */
          /* ============================================================ */
          <div className="space-y-6">
            {/* Top ETA & Status Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-lime-300 animate-ping" />
                    लाइव्ह केस ट्रॅकिंग (Live SLA Active)
                  </span>
                  <span className="text-xs text-white/80">
                    नोंदणी वेळ: {ticket ? new Date(ticket.created_at).toLocaleTimeString('mr-IN') : 'आत्ता'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      पशुवैद्यकीय पथक रवाना झाले आहे
                    </h1>
                    <p className="text-sm text-white/90 mt-1 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-lime-300 animate-bounce" />
                      <span>फिरते रुग्णालय (MVU) तुमच्या दिशेने येत आहे</span>
                    </p>
                  </div>

                  {/* ETA Counter Box */}
                  <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center shrink-0 min-w-[150px]">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                      अंदाजे पोहोचण्याची वेळ (ETA)
                    </div>
                    <div className="text-2xl font-black text-lime-300 font-mono mt-0.5">
                      {formatTimeRemaining(etaRemainingSeconds)}
                    </div>
                    <div className="text-[10px] text-white/75 mt-0.5">
                      SLA मर्यादा: {ticket?.sla_minutes || 60} मिनिटे
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Phase Delivery-App Visual Progress Stepper */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  प्रगती स्थिती (Live Case Progression)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-emerald-500">
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 mt-0.5 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-emerald-100 dark:ring-emerald-950">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          १. तक्रार नोंदणी पूर्ण (Report Registered)
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-mono">पूर्ण</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        तक्रार क्रमांक <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{ticket?.ticket_id || ticketParam}</span> नियंत्रण कक्षात नोंदवला गेला.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 mt-0.5 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-emerald-100 dark:ring-emerald-950">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          २. पशुवैद्यक अधिकारी नियुक्त (Officer Assigned)
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-mono">पूर्ण</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        तालुका दवाखान्याकडून <span className="font-bold text-slate-800 dark:text-slate-200">{ticket?.assigned_vet?.name || 'डॉ. विजय शिंदे'}</span> यांना केस सोपवली आहे.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 - Active In Progress */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 mt-0.5 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-emerald-300 animate-pulse">
                      <Truck className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                          <span>३. फिरते रुग्णालय रवाना (Dispatched on Field)</span>
                          <Badge className="bg-emerald-600 text-white text-[10px] animate-pulse">
                            मार्गस्थ (Active)
                          </Badge>
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          ETA {formatTimeRemaining(etaRemainingSeconds)}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                        वाहन क्र. <span className="font-mono font-bold">{ticket?.assigned_vet?.vehicle_no || 'MH-12-GV-1962'}</span> औषधे, लस व नमुना संकलन किटसह गोठ्याकडे येत आहे.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 - Pending */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 mt-0.5 h-5 w-5 rounded-full bg-slate-300 dark:bg-zinc-700 text-slate-500 flex items-center justify-center">
                      <Stethoscope className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          ४. उपचार व प्रयोगशाळा नमुना संकलन (Treatment & Sampling)
                        </h4>
                        <span className="text-[11px] text-muted-foreground">प्रतीक्षेत</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        घटनास्थळी प्रत्यक्ष तपासणी, औषधोपचार व गरज भासल्यास रक्ताचा/लाळेचा नमुना संकलन केले जाईल.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Duty Doctor Profile Card */}
            <Card className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {ticket?.assigned_vet?.name || 'डॉ. विजय शिंदे (Dr. Vijay Shinde)'}
                        </h3>
                        <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700">
                          {ticket?.assigned_vet?.role || 'पशुधन विकास अधिकारी (LDO)'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{ticket?.dispensary?.name || 'शासकीय पशुवैद्यकीय दवाखाना श्रेणी १'} ({ticket?.dispensary?.distance_km || 4.8} किमी)</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${ticket?.assigned_vet?.phone || '+919822033333'}`}
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
                        डॉक्टरांना कॉल करा
                      </Button>
                    </a>
                    <a href="tel:1962">
                      <Button variant="outline" className="text-xs font-bold border-red-300 text-red-700 hover:bg-red-50">
                        १९६२ हेल्पलाइन
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Triage & Disease Detection Summary */}
            {ticket?.triage && (
              <Card className="border shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>रोग निदान पूर्व-अंदाज (AI Triage Diagnosis)</span>
                    </CardTitle>
                    <Badge
                      className={`text-[10px] font-bold uppercase ${
                        ticket.triage.riskLevel === 'critical'
                          ? 'bg-red-600 text-white'
                          : ticket.triage.riskLevel === 'high'
                          ? 'bg-orange-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {ticket.triage.riskLevel} Risk ({ticket.triage.confidenceScore || 85}%)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border text-xs space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {ticket.triage.diseaseName || ticket.triage.diseaseCode || 'संशयित रोग तपासणी'}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      {ticket.triage.recommendedAction ||
                        'तातडीने गोठा अलगीकरण आणि लक्षणानुसार औषधोपचार आवश्यक.'}
                    </p>
                  </div>

                  {/* Reported Symptoms Badges */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      नोंदवलेली लक्षणे (Reported Symptoms):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.symptoms?.map((sId) => (
                        <Badge key={sId} variant="secondary" className="text-[11px]">
                          {getSymptomLabel(sId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinical First-Aid Instructions */}
            <Card className="border shadow-sm border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-950 dark:text-blue-200">
                  <ShieldAlert className="h-4 w-4 text-blue-600" />
                  <span>पशुवैद्यक येईपर्यंत काय करावे? (Immediate First-Aid Protocols)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {(ticket?.first_aid && ticket.first_aid.length > 0
                  ? ticket.first_aid
                  : [
                      'आजारी जनावराला इतर निरोगी जनावरांपासून ताबडतोब वेगळ्या हवेशीर गोठ्यात ठेवा.',
                      'तोंडातील किंवा पायातील फोडांवर पोटॅशियम परमँगनेट (लाल औषध) किंवा १% बोरिक ऍसिडचा सौम्य लेप लावा.',
                      'जनावरास पिण्यासाठी स्वच्छ कोमट पाणी व पचायला हलका मऊ हिरवा चारा द्या.',
                      'गोठ्यात माश्या व डास होऊ नयेत म्हणून कडुनिंबाचा धूर करा.',
                    ]
                ).map((guide, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">✓</span>
                    <span>{guide}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link href="/report" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold">
                  दुसरी तक्रार नोंदवा
                </Button>
              </Link>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `पशुधन कवच केस ट्रॅकिंग - ${ticket?.ticket_id}`,
                        text: `पशुवैद्यकीय केस ${ticket?.ticket_id} ट्रॅक करा. डॉक्टर रवाना झाले आहेत.`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('ट्रॅकिंग लिंक कॉपी झाली!');
                    }
                  }}
                  className="text-xs font-semibold"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  शेअर करा (Share)
                </Button>
                <Link href="/heatmap" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs font-semibold">
                    रोग प्रादुर्भाव नकाशा पहा
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
