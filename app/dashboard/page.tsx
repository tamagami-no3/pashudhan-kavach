'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  HeartPulse,
  ShieldAlert,
  Calendar,
  PlusCircle,
  QrCode,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  FlaskConical,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, loading: authLoading, t } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<any[]>([]);
  const [vaccinationsDue, setVaccinationsDue] = useState<any[]>([]);
  const [symptomReports, setSymptomReports] = useState<any[]>([]);
  const [labCases, setLabCases] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [districtRankings, setDistrictRankings] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const animRes = await fetch('/api/animals?limit=6');
      if (animRes.ok) {
        const d = await animRes.json();
        setAnimals(d.data || []);
      }

      const vacRes = await fetch('/api/vaccinations/due');
      if (vacRes.ok) {
        const d = await vacRes.json();
        setVaccinationsDue(d.data || []);
      }

      const repRes = await fetch('/api/symptom-reports?limit=6');
      if (repRes.ok) {
        const d = await repRes.json();
        setSymptomReports(d.data || []);
      }

      if (['lab', 'admin', 'vet'].includes(user?.role || '')) {
        const labRes = await fetch('/api/lab-cases?limit=6');
        if (labRes.ok) {
          const d = await labRes.json();
          setLabCases(d.data || []);
        }
      }

      if (['admin', 'vet'].includes(user?.role || '')) {
        const [sumRes, rankRes] = await Promise.all([
          fetch('/api/analytics/summary'),
          fetch('/api/analytics/district-rankings'),
        ]);

        if (sumRes.ok) {
          const d = await sumRes.json();
          setAnalyticsSummary(d.data?.summary || null);
        }
        if (rankRes.ok) {
          const d = await rankRes.json();
          setDistrictRankings((d.data || []).slice(0, 6));
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLabTransition = async (caseId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/lab-cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Lab sample status updated to ${nextStatus}`);
        fetchDashboardData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Activity className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading dashboard feeds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('welcome_prefix')} {user?.full_name}
              </h1>
              <Badge variant="outline" className="capitalize text-emerald-700 dark:text-emerald-400 border-emerald-300">
                {t(`role_${user?.role}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {t('jurisdiction_label')} <span className="font-semibold text-foreground">{user?.district}</span>, Maharashtra
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/report-symptom">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5 shadow-sm">
                <ShieldAlert className="h-4 w-4" />
                {t('report_sick_action')}
              </Button>
            </Link>
            {['farmer', 'paravet', 'vet', 'admin'].includes(user?.role || '') && (
              <Link href="/animals">
                <Button variant="outline" className="gap-1.5 border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300">
                  <PlusCircle className="h-4 w-4 text-emerald-600" />
                  {t('register_animal_action')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* FARMER VIEW */}
        {user?.role === 'farmer' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-emerald-100 dark:border-emerald-950">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>{t('registered_herd_title')}</span>
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{animals.length}</div>
                </CardContent>
              </Card>

              <Card className="border-amber-100 dark:border-amber-950">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>{t('vaccine_due_7days')}</span>
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{vaccinationsDue.length}</div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 dark:border-blue-950">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>{t('active_reports_count')}</span>
                    <ShieldAlert className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{symptomReports.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Animals Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                  {t('my_animals_heading')}
                </h2>
                <Link href="/animals" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                  View All ({animals.length}) <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {animals.map((animal) => (
                  <Card key={animal.id} className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                            TAG #{animal.tag_uid}
                          </span>
                          <CardTitle className="text-base font-bold mt-0.5">
                            {animal.species} — {animal.breed}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            animal.health_status === 'healthy'
                              ? 'default'
                              : animal.health_status === 'critical'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {animal.health_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{t('village_input_label')}:</span>
                        <span className="font-semibold text-foreground">
                          {animal.village}, {animal.district}
                        </span>
                      </div>
                      <div className="pt-2 border-t flex items-center justify-between">
                        <Link href={`/animals/${animal.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-emerald-300">
                            <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                            {t('health_passport_btn')}
                          </Button>
                        </Link>
                        <Link href={`/report-symptom?animal_id=${animal.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50">
                            {t('report_issue_btn')}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VET & PARAVET VIEW */}
        {['vet', 'paravet'].includes(user?.role || '') && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Pending Triage Queue</span>
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{symptomReports.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Lab Cases Active</span>
                    <FlaskConical className="h-4 w-4 text-purple-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{labCases.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>District Sector</span>
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{user?.district}</div>
                </CardContent>
              </Card>
            </div>

            {/* Reports Queue */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Clinical Incident & Triage Queue
              </h2>
              <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm divide-y text-sm">
                {symptomReports.map((report) => (
                  <div key={report.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-foreground">
                        {report.animal?.species} (TAG #{report.animal?.tag_uid})
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Symptoms: {Array.isArray(report.symptoms) ? report.symptoms.map((s: any) => t(`sym_${s}`)).join(', ') : 'None'}
                      </p>
                    </div>
                    <Link href={`/animals/${report.animal_id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        {t('health_passport_btn')}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LAB VIEW */}
        {user?.role === 'lab' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              {t('lab_title')}
            </h2>
            <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm divide-y text-sm">
              {labCases.map((lc) => (
                <div key={lc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-700">{lc.sample_id}</span>
                    <p className="text-xs text-muted-foreground">Status: {lc.status}</p>
                  </div>
                  <Link href="/lab">
                    <Button size="sm" className="text-xs bg-purple-600 text-white">
                      Manage Sample
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN VIEW */}
        {user?.role === 'admin' && (
          <div className="space-y-8">
            {analyticsSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{t('registered_herd_title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsSummary.total_registered_livestock}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Active Outbreak Flags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{analyticsSummary.active_outbreak_flags}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Lab Cases Done</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {analyticsSummary.completed_lab_cases} / {analyticsSummary.total_lab_cases}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Vaccination Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{analyticsSummary.total_vaccination_records}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
