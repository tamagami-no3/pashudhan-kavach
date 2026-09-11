'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Truck,
  Activity,
  Filter,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function LabPortalPage() {
  const { user, loading: authLoading, t } = useAuth();
  const router = useRouter();

  const [labCases, setLabCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeCaseForFindings, setActiveCaseForFindings] = useState<any | null>(null);
  const [findingsResult, setFindingsResult] = useState('');
  const [findingsNotes, setFindingsNotes] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    // Route guard: Lab Cases is exclusive to the lab role (locked RBAC spec)
    if (user && user.role !== 'lab') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchLabCases();
    }
  }, [user, authLoading, router, statusFilter]);

  const fetchLabCases = async () => {
    setLoading(true);
    try {
      let url = '/api/lab-cases?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setLabCases(d.data || []);
      }
    } catch (e) {
      console.warn('Error fetching lab cases:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (caseId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/lab-cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        toast.success(`Sample transitioned to ${nextStatus}`);
        fetchLabCases();
      } else {
        toast.error(d.error?.message || 'Transition failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
    }
  };

  const handleSaveFindings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseForFindings || !findingsResult) {
      toast.error('Please specify diagnostic result');
      return;
    }

    setSubmittingResult(true);
    try {
      const res = await fetch(`/api/lab-cases/${activeCaseForFindings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          result: findingsResult,
          notes: findingsNotes,
        }),
      });

      const d = await res.json();
      if (res.ok && d.success) {
        toast.success('Diagnostic results saved and animal owner notified!');
        setActiveCaseForFindings(null);
        setFindingsResult('');
        setFindingsNotes('');
        fetchLabCases();
      } else {
        toast.error(d.error?.message || 'Failed to save results');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving findings');
    } finally {
      setSubmittingResult(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-600">{t('lab_status_completed')}</Badge>;
      case 'testing':
        return <Badge className="bg-purple-600">{t('lab_status_testing')}</Badge>;
      case 'received':
        return <Badge className="bg-blue-600">{t('lab_status_received')}</Badge>;
      case 'in_transit':
        return <Badge className="bg-amber-600">{t('lab_status_in_transit')}</Badge>;
      default:
        return <Badge variant="outline">{t('lab_status_collected')}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-purple-800 dark:text-purple-400">
              <FlaskConical className="h-6 w-6" />
              {t('nav_lab')} & {t('lab_subtitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('lab_desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md border bg-background"
            >
              <option value="">{t('all_statuses')}</option>
              <option value="collected">{t('lab_status_collected')}</option>
              <option value="in_transit">{t('lab_status_in_transit')}</option>
              <option value="received">{t('lab_status_received')}</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Lab Cases List */}
        {loading ? (
          <div className="text-center p-12 space-y-2">
            <Activity className="h-6 w-6 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading sample ledger...</p>
          </div>
        ) : labCases.length === 0 ? (
          <Card className="p-12 text-center bg-muted/20 border-dashed">
            <p className="text-sm text-muted-foreground">No laboratory cases match the criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {labCases.map((lc) => (
              <Card key={lc.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-purple-900 dark:text-purple-300">
                        {lc.sample_id}
                      </span>
                      {getStatusBadge(lc.status)}
                      <span className="text-xs text-muted-foreground">
                        Collected: {new Date(lc.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Livestock: <span className="font-semibold text-foreground">{lc.symptom_report?.animal?.species}</span> (Tag #{lc.symptom_report?.animal?.tag_uid}) — District: <span className="font-semibold text-foreground">{lc.symptom_report?.animal?.district}</span>
                    </p>

                    {lc.result && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                          Official Lab Finding:
                        </span>
                        <p className="text-emerald-700 dark:text-emerald-200 font-medium">{lc.result}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons based on status */}
                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    {lc.status === 'collected' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusTransition(lc.id, 'in_transit')} className="text-xs">
                        <Truck className="h-3.5 w-3.5 mr-1" />
                        Dispatch In-Transit
                      </Button>
                    )}
                    {lc.status === 'in_transit' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusTransition(lc.id, 'received')} className="text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Acknowledge Receipt
                      </Button>
                    )}
                    {lc.status === 'received' && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => handleStatusTransition(lc.id, 'testing')}>
                        <FlaskConical className="h-3.5 w-3.5 mr-1" />
                        Commence Testing
                      </Button>
                    )}
                    {lc.status === 'testing' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        onClick={() => {
                          setActiveCaseForFindings(lc);
                          setFindingsResult('');
                          setFindingsNotes('');
                        }}
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Record Findings & Complete
                      </Button>
                    )}
                    {lc.status === 'completed' && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                        Result Dispatched
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enter Findings Dialog */}
        <Dialog open={!!activeCaseForFindings} onOpenChange={(open) => !open && setActiveCaseForFindings(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Diagnostic Case — {activeCaseForFindings?.sample_id}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveFindings} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="res">Diagnostic Result / Pathogen Confirmation *</Label>
                <Input
                  id="res"
                  placeholder="e.g. Positive for Foot and Mouth Disease Virus (Serotype O) via RT-PCR"
                  value={findingsResult}
                  onChange={(e) => setFindingsResult(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Lab Technician Notes</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-md border bg-background"
                  placeholder="e.g. Serum antibody titer elevated. Bio-safety protocols verified."
                  value={findingsNotes}
                  onChange={(e) => setFindingsNotes(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={submittingResult} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {submittingResult ? 'Publishing Results...' : 'Verify & Send Notification to Farmer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

