'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  HeartPulse,
  MapPin,
  QrCode,
  FlaskConical,
  Radio,
  ArrowRight,
  Lock,
  PhoneCall,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const { t, language, setLanguage } = useAuth();


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-foreground">
      {/* Navigation */}
      <header className="border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-500">
            <HeartPulse className="h-6 w-6 text-emerald-600" />
            <span>{t('brand_name')}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs font-semibold mr-1">
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'mr'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
            </div>

            <Link href="/heatmap" className="hidden sm:inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground">
              {t('nav_heatmap')}
            </Link>
            <Link href="/community" className="hidden sm:inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground">
              {t('nav_community')}
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-sm">
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                {t('official_portal_nav') || 'अधिकारी लॉगिन'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-background dark:from-emerald-950/20 dark:via-zinc-950 dark:to-zinc-950 border-b">
        <div className="container px-4 md:px-8 max-w-5xl mx-auto text-center space-y-6">
          {/* Emergency Helpline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border border-red-200 text-xs font-semibold shadow-sm">
            <Radio className="h-3.5 w-3.5 text-red-600 animate-pulse" />
            <span>{t('emergency_helpline')}</span>
          </div>




          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {t('hero_title_line1')}
            <span className="text-emerald-600 block sm:inline mt-1 sm:mt-0">{t('hero_title_line2')}</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>

          {/* Emergency 1962 Toll-Free & Instant Frictionless Report Hero Banner */}
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-red-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
                <ShieldAlert className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {language === 'mr' ? '२४x७ शासकीय फिरते रुग्णालय (MVU)' : language === 'hi' ? '२४x७ सरकारी मोबाइल पशु चिकित्सा' : '24x7 Emergency MVU'}
                  </span>
                  <span className="text-xs text-white/95 font-mono font-bold">1962 Toll-Free</span>
                </div>
                <h2 className="text-base sm:text-lg font-black mt-0.5">
                  {language === 'mr' ? 'तातडीने जनावरांच्या आजाराची नोंद करा' : language === 'hi' ? 'पशु रोग आपातकालीन सूचना दर्ज करें' : 'Emergency Livestock Symptom Reporting'}
                </h2>
                <p className="text-xs text-white/85">
                  {language === 'mr' ? 'कोणताही लॉगिन नको • आवाजाने/फोटोने नोंदवा • ३० मिनिटांत पशुवैद्यक रवाना' : language === 'hi' ? 'लॉगिन जरूरी नहीं • फोटो या आवाज से तुरंत दर्ज करें • 30 मिनट में डॉक्टर' : 'Zero login needed • Voice & photo support • Instant 30-min SLA dispatch'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <Link href="/report" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white text-red-700 hover:bg-slate-100 font-bold text-xs sm:text-sm px-4 py-2.5 shadow-md">
                  <ShieldAlert className="mr-1.5 h-4 w-4 text-red-600" />
                  {language === 'mr' ? 'नोंदणी करा (Report)' : language === 'hi' ? 'रिपोर्ट करें' : 'Report Now'}
                </Button>
              </Link>
              <a href="tel:1962" className="shrink-0">
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 font-bold text-xs sm:text-sm px-3 py-2.5">
                  <PhoneCall className="mr-1 h-3.5 w-3.5" />
                  1962
                </Button>
              </a>
            </div>
          </div>

          {/* Two Distinct Persona Split Entry Paths: Zero-Login Farmer Hub vs Official Authority Portal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2 text-left">
            {/* 1. Farmer Hub: Zero Login Required */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-white dark:bg-zinc-900 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    {t('farmer_hub_badge') || 'No Login • 100% Free'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('farmer_hub_title') || 'Farmer Support Center'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('farmer_hub_desc') || 'Request emergency veterinary dispatch or use AI camera for visual lesion inspection.'}
                </p>
              </div>

              {/* Two Non-Overlapping Farmer Actions */}
              <div className="space-y-2 pt-1 border-t">
                {/* 1A. Emergency Vet Dispatch */}
                <Link
                  href="/report"
                  className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      {t('btn_emergency_report') || 'Emergency Doctor Dispatch (1962)'}
                    </span>
                    <p className="text-[10px] text-red-700 dark:text-red-300">
                      {t('btn_emergency_report_sub') || '30-min SLA Mobile Vet Unit dispatch'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-red-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                {/* 1B. AI Vision Scanner */}
                <Link
                  href="/chatbot"
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      {t('btn_vision_scanner') || 'AI Vision Scanner (Camera)'}
                    </span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      {t('btn_vision_scanner_sub') || 'Capture photo of wound/skin for AI disease guidance'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </div>
            </div>

            {/* 2. Official Authority Portal: Gated for Vets, Labs, Admins */}
            <div className="p-5 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                    {t('official_hub_badge') || 'Official Access'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('official_hub_title') || 'Official Authority Portal'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('official_hub_desc') || 'Dedicated command center for Veterinary Officers (LDO), Diagnostic Labs, and State Admins.'}
                </p>
              </div>

              {/* Authority Action */}
              <div className="pt-1 border-t">
                <Link
                  href="/login"
                  className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                      {t('btn_official_login') || 'Sign In to Official Dashboard'}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {t('btn_official_login_sub') || '36-district surveillance, lab pipeline & outbreak flags'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Public Explorer Navigation (Preserved Existing Routes) */}
          <div className="max-w-xl mx-auto pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/heatmap">
              <Button size="sm" variant="outline" className="text-xs font-semibold px-4">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                {t('nav_heatmap')}
              </Button>
            </Link>
            <Link href="/community">
              <Button size="sm" variant="outline" className="text-xs font-semibold px-4">
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                {t('nav_community')}
              </Button>
            </Link>
            <Link href="/channels">
              <Button size="sm" variant="outline" className="text-xs font-semibold px-4">
                {t('nav_channels') || 'Channels & IVR'}
              </Button>
            </Link>
          </div>

          {/* Live Platform Quick Stats (Interactive Links to Live Sections) */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-6 text-left">
            <Link
              href="/animals"
              className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-xs hover:border-emerald-500 transition-all group"
            >
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate group-hover:text-emerald-600">
                {t('live_registered_herd')}
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">1,420+</span>
            </Link>
            <Link
              href="/heatmap"
              className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-xs hover:border-red-500 transition-all group"
            >
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate group-hover:text-red-600">
                {t('live_active_alerts')}
              </span>
              <span className="text-xl font-bold text-red-600">4</span>
            </Link>
            <Link
              href="/lab"
              className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-xs hover:border-purple-500 transition-all group"
            >
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate group-hover:text-purple-600">
                {t('live_lab_tests')}
              </span>
              <span className="text-xl font-bold text-purple-600">38</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid (Fully Translated via translations.ts) */}
      <section className="py-16 container px-4 md:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('feature_section_title')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {t('feature_section_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-emerald-100 dark:border-emerald-950 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 w-fit rounded-xl mb-2">
                <QrCode className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <CardTitle className="text-base font-bold">
                {t('feat_passport_title') || 'QR Digital Passports'}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('feat_passport_desc') || '12-digit Pashu Aadhaar tags with tamper-evident digital immunization ledgers.'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-red-100 dark:border-red-950 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-red-100 dark:bg-red-950 w-fit rounded-xl mb-2">
                <ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
              <CardTitle className="text-base font-bold">
                {t('feat_triage_title') || 'AI Disease Triage'}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('feat_triage_desc') || 'Deterministic rule scoring for 7 contagious livestock pathogens with 30-min vet dispatch.'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 dark:border-blue-950 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 w-fit rounded-xl mb-2">
                <MapPin className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
              <CardTitle className="text-base font-bold">
                {t('feat_gis_title') || 'GIS & Climate Radar'}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('feat_gis_desc') || 'Real-time 36-district heat index incorporating Open-Meteo meteorological factors.'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-100 dark:border-purple-950 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 w-fit rounded-xl mb-2">
                <FlaskConical className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
              <CardTitle className="text-base font-bold">
                {t('feat_lab_title') || 'Lab Sample Tracking'}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('feat_lab_desc') || 'Chain of custody pipeline from field collection to PCR/ELISA confirmation.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer with Academic Disclaimer */}
      <footer className="mt-auto border-t bg-white dark:bg-zinc-900 py-8">
        <div className="container px-4 md:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              <span>{t('brand_title')}</span>
            </div>
            <p>© 2026 Department of Animal Husbandry, Government of Maharashtra</p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:underline">{t('official_portal_nav')}</Link>
              <Link href="/community" className="hover:underline">{t('nav_community')}</Link>   
              <Link href="/heatmap" className="hover:underline">{t('nav_heatmap')}</Link>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center text-[11px] text-amber-800 dark:text-amber-300">
            {t('academic_disclaimer')}
          </div>
        </div>
      </footer>
    </div>
  );
}

