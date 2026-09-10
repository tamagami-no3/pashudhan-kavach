'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, PreferredLanguage } from '@/types/database.types';
import { translate, Language } from '@/lib/translations';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Default language set to Marathi ('mr') for local Maharashtra farmers
  const [language, setLanguageState] = useState<Language>('mr');
  const router = useRouter();

  // Save language in localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('pk_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pk_lang', lang);
  };

  const t = useCallback(
    (key: string) => {
      return translate(key, language);
    },
    [language]
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.user) {
          setUser(json.data.user);
          if (json.data.user.preferred_language) {
            setLanguage(json.data.user.preferred_language as Language);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || 'Login failed. Please verify credentials.',
        };
      }

      setUser(data.data.user);
      setToken(data.data.token);
      if (data.data.user.preferred_language) {
        setLanguage(data.data.user.preferred_language as Language);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error', e);
    }
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        language,
        setLanguage,
        t,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
