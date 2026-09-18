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
              <Button variant="outline" size="sm" className="text-xs">
                {t('sign_in')}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                {t('register')}
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

          {/* Two Distinct Persona Split Entry Paths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 text-left">
            {/* 1. Farmer Path: Report a Problem (Routes directly to /chatbot, no login required) */}
            <Link
              href="/chatbot"
              className="group p-5 rounded-2xl border-2 border-emerald-500/80 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl hover:border-emerald-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    Farmer Portal • शेतकरी
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  {t('farmer_entry_title') || 'Report a Problem'}
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {t('farmer_entry_subtitle') || 'No login required • AI Symptom Screening & Disease Prediction with photo upload & voice'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>Start Symptom Screening</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>

            {/* 2. Authority Path: Authority Login (Routes to role-gated dashboard) */}
            <Link
              href="/login"
              className="group p-5 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl hover:border-slate-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200">
                    <Lock className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                    Official • अधिकारी
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors flex items-center gap-1.5">
                  {t('authority_entry_title') || 'Authority Login'}
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {t('authority_entry_subtitle') || 'Veterinarians, Lab Technicians & State Officers • Access role-gated clinical dashboard'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Sign in to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
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

          {/* Live Platform Quick Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-6 text-left">
            <div className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-sm">
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate">{t('live_registered_herd')}</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">1,420+</span>
            </div>
            <div className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-sm">
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate">{t('live_active_alerts')}</span>
              <span className="text-xl font-bold text-red-600">4</span>
            </div>
            <div className="p-3 bg-white/80 dark:bg-zinc-900/80 border rounded-xl shadow-sm">
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase truncate">{t('live_lab_tests')}</span>
              <span className="text-xl font-bold text-purple-600">38</span>
            </div>
          </div>



        </div>
      </section>

      {/* Feature Grid */}
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
          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 w-fit rounded-xl mb-2">
                <QrCode className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <CardTitle className="text-base font-bold">QR Digital Passports</CardTitle>
              <CardDescription className="text-xs">
                12-digit Pashu Aadhaar tags with tamper-evident digital immunization ledgers and public authenticity verification.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-red-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-red-100 dark:bg-red-950 w-fit rounded-xl mb-2">
                <ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
              <CardTitle className="text-base font-bold">AI Disease Triage</CardTitle>
              <CardDescription className="text-xs">
                Deterministic rule scoring for 7 contagious livestock pathogens (FMD, LSD, PPR, Anthrax, BQ, HS, Brucellosis).
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 w-fit rounded-xl mb-2">
                <MapPin className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
              <CardTitle className="text-base font-bold">GIS & Climate Radar</CardTitle>
              <CardDescription className="text-xs">
                Real-time 36-district heat index incorporating Open-Meteo meteorological factors and active flag densities.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 w-fit rounded-xl mb-2">
                <FlaskConical className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
              <CardTitle className="text-base font-bold">Lab Sample Tracking</CardTitle>
              <CardDescription className="text-xs">
                Chain of custody pipeline (Collected → In Transit → Received → Testing → Completed) with auto-alerts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white dark:bg-zinc-900 py-8">
        <div className="container px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-emerald-600" />
            <span>Pashudhan Kavach Platform</span>
          </div>
          <p>© 2026 Department of Animal Husbandry, Government of Maharashtra</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Portal Sign In</Link>
            <Link href="/community" className="hover:underline">Advisories</Link>   
            <Link href="/heatmap" className="hover:underline">Surveillance Map</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
