'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  Activity,
  HeartPulse,
  MapPin,
  BarChart3,
  LogOut,
  FlaskConical,
  Radio,
  Globe,
  Bot,
  Layers,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_FEATURES, type FeatureKey } from '@/lib/role-features';

export function Navbar() {
  const { user, logout, language, setLanguage, t } = useAuth();
  const pathname = usePathname();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'vet':
        return 'default';
      case 'lab':
        return 'secondary';
      case 'paravet':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Full feature catalog — rendered strictly filtered by ROLE_FEATURES[role].
  const featureCatalog: Record<FeatureKey, { href: string; label: string; icon: React.ElementType }> = {
    dashboard: { href: '/dashboard', label: t('nav_dashboard'), icon: Activity },
    animals: { href: '/animals', label: t('nav_registry'), icon: HeartPulse },
    'report-symptom': { href: '/report-symptom', label: t('nav_report'), icon: ShieldAlert },
    heatmap: { href: '/heatmap', label: t('nav_heatmap'), icon: MapPin },
    community: { href: '/community', label: t('nav_community'), icon: Radio },
    lab: { href: '/lab', label: t('nav_lab'), icon: FlaskConical },
    analytics: { href: '/analytics', label: t('nav_analytics'), icon: BarChart3 },
  };

  const allowedFeatures = user ? ROLE_FEATURES[user.role] ?? [] : [];
  const navLinks = allowedFeatures.map((key) => featureCatalog[key]);

  const isChatbotActive = pathname === '/chatbot';
  const isChannelsActive = pathname === '/channels';

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={isChatbotActive ? '/' : user ? '/dashboard' : '/'}
            className="flex items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-500"
          >
            <ShieldAlert className="h-6 w-6 text-emerald-600" />
            <span className="hidden sm:inline-block">{t('brand_title')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {isChatbotActive ? (
              // Clean Farmer-Facing Navigation: Dashboard nav items never leak through
              <>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/channels"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>{t('nav_channels') || 'Channels'}</span>
                </Link>
                {user && user.role !== 'farmer' && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors ml-2"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Authority Dashboard</span>
                  </Link>
                )}
              </>
            ) : (
              // Standard Authority / Role Navigation
              <>
                {user &&
                  navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950 dark:text-emerald-200'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}

                {/* Standalone Chatbot & Channels Nav Links placed next to each other */}
                <Link
                  href="/chatbot"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                    isChatbotActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Bot className="h-4 w-4 text-emerald-600" />
                  {t('nav_chatbot') || 'Chatbot'}
                </Link>

                <Link
                  href="/channels"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                    isChannelsActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>{t('nav_channels') || 'Channels'}</span>
                </Link>

                {/* Instant Frictionless Report Button */}
                <Link
                  href="/report"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    pathname === '/report'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <span>{language === 'mr' ? 'तक्रार नोंदवा' : language === 'hi' ? 'रिपोर्ट करें' : 'Report'} (1962)</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side controls & Trilingual Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40 text-xs">
            <Globe className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              EN
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-medium leading-none">{user.full_name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{user.district}</span>
              </div>
              <Badge variant={getRoleBadgeVariant(user.role) as any} className="uppercase font-semibold text-[10px] tracking-wide">
                {t(`role_${user.role}`) || user.role}
              </Badge>
              <Button variant="ghost" size="icon" onClick={logout} title={t('logout_button')} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  {t('login_button')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t('register_button')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar (Visible only on screens < md / 375px mobile viewports) */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-around py-1.5 px-2">
      <Link
        href="/"
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
          pathname === '/'
            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Home className="h-4 w-4" />
        <span>{t('nav_home')}</span>
      </Link>

      <Link
        href="/chatbot"
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
          pathname === '/chatbot'
            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Bot className="h-4 w-4" />
        <span>{t('nav_chatbot')}</span>
      </Link>

      <Link
        href="/report"
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
          pathname === '/report'
            ? 'text-red-600 dark:text-red-400 font-bold'
            : 'text-red-500 hover:text-red-700'
        }`}
      >
        <ShieldAlert className="h-4 w-4 text-red-600" />
        <span>{language === 'mr' ? 'तक्रार' : language === 'hi' ? 'रिपोर्ट' : 'Report'}</span>
      </Link>

      <Link
        href="/heatmap"
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
          pathname === '/heatmap'
            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <MapPin className="h-4 w-4" />
        <span>{t('nav_heatmap')}</span>
      </Link>

      {user ? (
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            pathname === '/dashboard'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>{t('nav_dashboard')}</span>
        </Link>
      ) : (
        <Link
          href="/login"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            pathname === '/login'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <LogOut className="h-4 w-4 rotate-180" />
          <span>{t('login_button')}</span>
        </Link>
      )}
    </nav>
    </>
  );
}
