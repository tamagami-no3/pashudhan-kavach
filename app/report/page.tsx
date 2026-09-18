'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { FrictionlessReportForm } from '@/components/farmer/FrictionlessReportForm';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  PhoneCall,
  Sparkles,
  MapPin,
  Bot,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default function FrictionlessReportPage() {
  const { language, setLanguage } = useAuth();
  const [activeLang, setActiveLang] = useState<'mr' | 'hi' | 'en'>(
    (language as 'mr' | 'hi' | 'en') || 'mr'
  );

  const handleLanguageChange = (lang: 'mr' | 'hi' | 'en') => {
    setActiveLang(lang);
    if (setLanguage) setLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground pb-20 md:pb-12">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Top Emergency Action Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-red-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
              <ShieldAlert className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {activeLang === 'mr' ? '२४x७ आपत्कालीन साहाय्य' : activeLang === 'hi' ? '२४x७ आपातकालीन सहायता' : '24x7 Emergency Help'}
                </span>
                <span className="text-xs text-white/90 font-mono font-bold">1962 Toll-Free</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black mt-0.5">
                {activeLang === 'mr'
                  ? 'तातडीची लक्षण नोंदणी व पशुवैद्यक साहाय्य'
                  : activeLang === 'hi'
                  ? 'तत्काल लक्षण सूचना एवं पशु चिकित्सक सहायता'
                  : 'Instant Livestock Symptom Triage & SLA Dispatch'}
              </h1>
              <p className="text-xs text-white/85">
                {activeLang === 'mr'
                  ? 'कोणताही लॉगिन नको • आवाजाने किंवा स्पर्शाने लक्षणे निवडा • ३०-६० मिनिटांत पशुवैद्यक रवाना'
                  : activeLang === 'hi'
                  ? 'लॉगिन की आवश्यकता नहीं • बोलकर या छूकर लक्षण चुनें • 30-60 मिनट में डॉक्टर रवाना'
                  : 'Zero login required • Touch or voice detection • Rapid 30-60m field vet dispatch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <a href="tel:1962" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-red-700 hover:bg-slate-100 font-bold text-xs sm:text-sm px-4 py-2 shadow-md">
                <PhoneCall className="mr-1.5 h-4 w-4 text-red-600" />
                {activeLang === 'mr' ? 'कॉल करा १९६२' : activeLang === 'hi' ? 'कॉल करें 1962' : 'Call 1962'}
              </Button>
            </a>
          </div>
        </div>

        {/* Informational Guidance Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-zinc-900 border rounded-xl p-3 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeLang === 'mr' ? 'ध्वनी ओळख (Voice AI)' : activeLang === 'hi' ? 'आवाज से पहचान (Voice AI)' : 'Voice Symptom Detection'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeLang === 'mr' ? 'माईक दाबून बोला, आपोआप टिक होईल' : activeLang === 'hi' ? 'माइक दबाकर बोलें, लक्षण चुने जाएंगे' : 'Speak symptoms in Marathi/Hindi/English'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border rounded-xl p-3 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeLang === 'mr' ? 'गॅरंटीड SLA वेळ' : activeLang === 'hi' ? 'गारंटीड SLA समय' : 'Guaranteed SLA Window'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeLang === 'mr' ? 'अति-गंभीर: ३० मिनिटे | सामान्य: ६०-१२० मि.' : activeLang === 'hi' ? 'गंभीर: 30 मिनट | सामान्य: 60-120 मि.' : 'Critical: 30m | Standard: 60-120m'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border rounded-xl p-3 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeLang === 'mr' ? 'ऑफलाइन IndexedDB साठवण' : activeLang === 'hi' ? 'ऑफ़लाइन IndexedDB सुरक्षा' : '100% Offline Queuing'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeLang === 'mr' ? 'इंटरनेट नसतानाही तक्रार स्थानिक सेव्ह होते' : activeLang === 'hi' ? 'नेटवर्क न होने पर भी स्वतः सेव होगा' : 'Auto-syncs as soon as connection returns'}
              </div>
            </div>
          </div>
        </div>

        {/* The Core Frictionless Report Form Component */}
        <div className="mt-4">
          <FrictionlessReportForm initialLanguage={activeLang} />
        </div>

        {/* Alternative Public Farmer Pathways Footer */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {activeLang === 'mr'
                ? 'कॅमेरा व एआय द्वारे सखोल रोग निदान हवे आहे का?'
                : activeLang === 'hi'
                ? 'क्या आप कैमरा व एआई से गहन रोग निदान चाहते हैं?'
                : 'Need real-time visual AI disease diagnosis with live camera?'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chatbot">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Bot className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {activeLang === 'mr' ? 'एआय चॅटबॉट उघडा' : activeLang === 'hi' ? 'एआई चैटबॉट खोलें' : 'Open AI Chatbot'}
              </Button>
            </Link>
            <Link href="/heatmap">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                <MapPin className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                {activeLang === 'mr' ? 'जिल्हा रोग नकाशा' : activeLang === 'hi' ? 'जिला रोग नक्शा' : 'District Heatmap'}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

