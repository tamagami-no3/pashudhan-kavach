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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const navLinks = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: Activity },
    { href: '/animals', label: t('nav_registry'), icon: HeartPulse },
    { href: '/report-symptom', label: t('nav_report'), icon: ShieldAlert },
    { href: '/heatmap', label: t('nav_heatmap'), icon: MapPin },
    { href: '/community', label: t('nav_community'), icon: Radio },
  ];

  if (user?.role === 'lab' || user?.role === 'admin') {
    navLinks.push({ href: '/lab', label: t('nav_lab'), icon: FlaskConical });
  }

  if (user?.role === 'admin' || user?.role === 'vet') {
    navLinks.push({ href: '/analytics', label: t('nav_analytics'), icon: BarChart3 });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-500">
            <ShieldAlert className="h-6 w-6 text-emerald-600" />
            <span className="hidden sm:inline-block">{t('brand_title')}</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navLinks.map((link) => {
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
            </nav>
          )}
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
  );
}
