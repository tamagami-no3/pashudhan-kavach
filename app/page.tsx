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

          {/* Quick Action Buttons */}
          <div className="max-w-xl mx-auto pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6">
                <Lock className="mr-2 h-4 w-4" />
                {t('sign_in')}
              </Button>
            </Link>
            <Link href="/heatmap">
              <Button size="lg" variant="outline" className="font-semibold px-6">
                <MapPin className="mr-2 h-4 w-4" />
                {t('nav_heatmap')}
              </Button>
            </Link>
            <Link href="/community">
              <Button size="lg" variant="outline" className="font-semibold px-6">
                <Radio className="mr-2 h-4 w-4" />
                {t('nav_community')}
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
