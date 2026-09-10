'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  BarChart3,
  TrendingUp,
  Download,
  ShieldAlert,
  HeartPulse,
  Syringe,
  FlaskConical,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { user, loading: authLoading, t } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchAnalytics();
    }
  }, [user, authLoading, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, rankRes] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch('/api/analytics/district-rankings'),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.data?.summary || null);
        setDiseaseDistribution(sumData.data?.disease_distribution || {});
      }
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        setRankings(rankData.data || []);
      }
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (entity: string) => {
    window.open(`/api/analytics/export?entity=${entity}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-8">
        {/* Header & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
              {t('nav_analytics')} & {t('analytics_title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('analytics_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV('animals')}
              className="gap-1.5 text-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              {t('export_animals')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV('outbreaks')}
              className="gap-1.5 text-xs"
            >
              <Download className="h-4 w-4 text-red-600" />
              {t('export_outbreaks')}
            </Button>
          </div>
        </div>

        {/* Top-line Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>{t('registered_herd')}</span>
                  <HeartPulse className="h-4 w-4 text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_registered_livestock}</div>
                <span className="text-[11px] text-muted-foreground">{summary.total_farmers} {t('registered_farmers')}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>{t('outbreak_flags')}</span>
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.active_outbreak_flags}</div>
                <span className="text-[11px] text-muted-foreground">{summary.total_symptom_reports} {t('field_reports')}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>{t('lab_cases_stat')}</span>
                  <FlaskConical className="h-4 w-4 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {summary.completed_lab_cases} / {summary.total_lab_cases}
                </div>
                <span className="text-[11px] text-muted-foreground">{t('completed_vs_total')}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>{t('immunizations')}</span>
                  <Syringe className="h-4 w-4 text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{summary.total_vaccination_records}</div>
                <span className="text-[11px] text-muted-foreground">{t('ledger_entries')}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Disease Distribution Cards */}
        {Object.keys(diseaseDistribution).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{t('pathogen_breakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(diseaseDistribution).map(([disease, count]) => (
                  <div key={disease} className="p-3 bg-muted/30 border rounded-lg">
                    <span className="text-xs font-semibold block text-foreground truncate">{disease}</span>
                    <span className="text-lg font-bold text-emerald-700">{count} {t('active_cases')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 36-District Rankings Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            {t('district_rankings_title')}
          </h2>

          <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 font-semibold">{t('rank')}</th>
                  <th className="p-3 font-semibold">{t('district')}</th>
                  <th className="p-3 font-semibold">{t('division')}</th>
                  <th className="p-3 font-semibold">{t('risk_score')}</th>
                  <th className="p-3 font-semibold">{t('risk_tier')}</th>
                  <th className="p-3 font-semibold">{t('active_flags')}</th>
                  <th className="p-3 font-semibold">{t('critical_alerts')}</th>
                  <th className="p-3 font-semibold">{t('vaccination_pct')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankings.map((rank, index) => (
                  <tr key={rank.district} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-muted-foreground">{index + 1}</td>
                    <td className="p-3 font-bold text-foreground">{rank.district}</td>
                    <td className="p-3 text-muted-foreground">{rank.division}</td>
                    <td className="p-3 font-mono font-semibold">{rank.calculated_risk_score} / 100</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          rank.risk_tier === 'Critical'
                            ? 'destructive'
                            : rank.risk_tier === 'High'
                            ? 'default'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {rank.risk_tier}
                      </Badge>
                    </td>
                    <td className="p-3">{rank.active_outbreaks}</td>
                    <td className="p-3 font-semibold text-red-600">{rank.critical_alerts}</td>
                    <td className="p-3 font-semibold text-emerald-600">{rank.vaccination_coverage_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

