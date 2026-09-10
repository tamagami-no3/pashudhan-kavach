'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Lock, Mail, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, t, language, setLanguage } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in both email and password');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } else {
      toast.error(res.error || 'Invalid email or password');
    }
  };

  const handleDemoFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('DemoPassword123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Language selector on top of login form */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-emerald-700 dark:text-emerald-500">
            <ShieldAlert className="h-8 w-8 text-emerald-600" />
            <span>{t('brand_title')}</span>
          </Link>

          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white shadow-sm text-xs">
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'mr' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'hi' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md font-bold transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-emerald-100 dark:border-emerald-950">
          <CardHeader>
            <CardTitle className="text-xl">{t('login_heading')}</CardTitle>
            <CardDescription>{t('login_subheading')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email_label')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password_label')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {loading ? 'Authenticating...' : t('sign_in_submit')}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Credentials */}
          <CardFooter className="flex flex-col space-y-3 pt-0 border-t mt-4 p-4 bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('demo_login_title')}
            </span>
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoFill('farmer.pune@pashudhan.gov.in')}
                className="h-8 text-xs font-normal"
              >
                👨‍🌾 {t('role_farmer')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoFill('vet.nashik@pashudhan.gov.in')}
                className="h-8 text-xs font-normal"
              >
                🩺 {t('role_vet')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoFill('lab.nagpur@pashudhan.gov.in')}
                className="h-8 text-xs font-normal"
              >
                🔬 {t('role_lab')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoFill('admin@pashudhan.gov.in')}
                className="h-8 text-xs font-normal"
              >
                👑 {t('role_admin')}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          {t('dont_have_account')}{' '}
          <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
            {t('register_button')}
          </Link>
        </p>
      </div>
    </div>
  );
}
