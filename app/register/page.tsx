'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { t, language, setLanguage } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'farmer' | 'vet' | 'paravet' | 'lab'>('farmer');
  const [district, setDistrict] = useState('Pune');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'mr'>('mr');
  const [village, setVillage] = useState('');
  const [block, setBlock] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !district) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone: phone || null,
          role,
          district,
          preferred_language: preferredLanguage,
          village: village || 'Center Village',
          block: block || `${district} Block`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || 'Registration failed');
        return;
      }

      toast.success('Registration complete! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-emerald-700 dark:text-emerald-500">
            <ShieldAlert className="h-8 w-8 text-emerald-600" />
            <span>{t('brand_title')}</span>
          </Link>

          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white shadow-sm text-xs">
            <button
              onClick={() => {
                setLanguage('mr');
                setPreferredLanguage('mr');
              }}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                setPreferredLanguage('hi');
              }}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'hi' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => {
                setLanguage('en');
                setPreferredLanguage('en');
              }}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg border-emerald-100 dark:border-emerald-950">
          <CardHeader>
            <CardTitle className="text-xl">{t('register_heading')}</CardTitle>
            <CardDescription>{t('register_subheading')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>{t('select_role_label')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['farmer', 'vet', 'paravet', 'lab'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                        role === r
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {t(`role_${r}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">{t('full_name_label')}</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Ramesh Patil"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t('phone_label')}</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 9822099991"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('email_label')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('password_label')} *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* District & Preferred Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="district">{t('district_select_label')}</Label>
                  <select
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-md border bg-background text-foreground"
                    required
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.division})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lang">{t('lang_select_label')}</Label>
                  <select
                    id="lang"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as any)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-md border bg-background text-foreground"
                  >
                    <option value="mr">मराठी (MR)</option>
                    <option value="hi">हिंदी (HI)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>

              {/* Farmer Specific: Village & Block */}
              {role === 'farmer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                  <div className="space-y-1.5">
                    <Label htmlFor="village">{t('village_input_label')}</Label>
                    <Input
                      id="village"
                      placeholder="e.g. Shirur"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="block">{t('block_input_label')}</Label>
                    <Input
                      id="block"
                      placeholder="e.g. Haveli"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {loading ? 'Processing...' : t('complete_register_submit')}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            {t('login_button')}
          </Link>
        </p>
      </div>
    </div>
  );
}
