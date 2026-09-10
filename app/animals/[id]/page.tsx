'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  HeartPulse,
  QrCode,
  Calendar,
  Syringe,
  Stethoscope,
  ShieldAlert,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AnimalDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [animal, setAnimal] = useState<any>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [symptomReports, setSymptomReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Health Record modal state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState<'vaccination' | 'treatment' | 'checkup'>('vaccination');
  const [description, setDescription] = useState('');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [nextDueAt, setNextDueAt] = useState('');
  const [submittingRecord, setSubmittingRecord] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchAnimalDetails();
    }
  }, [user, authLoading, params.id, router]);

  const fetchAnimalDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/animals/${params.id}`);
      if (!res.ok) {
        toast.error('Failed to load animal health card');
        return;
      }
      const d = await res.json();
      if (d.success && d.data) {
        setAnimal(d.data.animal);
        setHealthRecords(d.data.health_records || []);
        setSymptomReports(d.data.symptom_reports || []);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error loading records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      toast.error('Please enter description or vaccine name');
      return;
    }

    setSubmittingRecord(true);
    try {
      const res = await fetch('/api/health-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animal_id: params.id,
          record_type: recordType,
          description,
          performed_at: new Date(performedAt).toISOString(),
          next_due_at: nextDueAt ? new Date(nextDueAt).toISOString() : null,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toast.error(d.error?.message || 'Failed to add health event');
        return;
      }

      toast.success('Health event recorded in digital passport!');
      setIsAddRecordOpen(false);
      setDescription('');
      setNextDueAt('');
      fetchAnimalDetails();
    } catch (err: any) {
      toast.error(err.message || 'Submission error');
    } finally {
      setSubmittingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading Health Passport...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-lg font-semibold">Animal record not found or access restricted.</p>
          <Link href="/animals">
            <Button variant="outline">Back to Registry</Button>
          </Link>
        </div>
      </div>
    );
  }

  const vaccinations = healthRecords.filter((r) => r.record_type === 'vaccination');
  const treatments = healthRecords.filter((r) => r.record_type !== 'vaccination');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/animals" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>

          {/* Add Record Button for Staff */}
          {['vet', 'paravet', 'admin'].includes(user?.role || '') && (
            <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  Add Health Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Clinical Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddHealthRecord} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Event Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['vaccination', 'treatment', 'checkup'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setRecordType(t)}
                          className={`py-2 text-xs rounded-lg font-medium border capitalize ${
                            recordType === t
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-background hover:bg-muted'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desc">Description / Vaccine Name *</Label>
                    <Input
                      id="desc"
                      placeholder="e.g. FMD Bi-Annual Booster (Raksha Ovac)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="perf">Performed Date</Label>
                      <Input
                        id="perf"
                        type="date"
                        value={performedAt}
                        onChange={(e) => setPerformedAt(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="due">Next Due Date (Booster)</Label>
                      <Input
                        id="due"
                        type="date"
                        value={nextDueAt}
                        onChange={(e) => setNextDueAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submittingRecord} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {submittingRecord ? 'Saving...' : 'Save Clinical Record'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Digital Health Passport Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Box */}
          <Card className="lg:col-span-2 border-emerald-200 dark:border-emerald-900 shadow-md">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                      Pashu Aadhaar: {animal.tag_uid}
                    </span>
                    <Badge
                      variant={
                        animal.health_status === 'healthy'
                          ? 'default'
                          : animal.health_status === 'critical'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize text-xs"
                    >
                      {animal.health_status}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mt-1">
                    {animal.species} — {animal.breed}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/report-symptom?animal_id=${animal.id}`}>
                    <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                      Report Symptoms
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Sex</span>
                <span className="font-semibold">{animal.sex}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Date of Birth</span>
                <span className="font-semibold">{animal.dob || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Village</span>
                <span className="font-semibold">{animal.village}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">District</span>
                <span className="font-semibold">{animal.district}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Owner</span>
                <span className="font-semibold">{animal.owner?.full_name || 'Registered Owner'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Registered On</span>
                <span className="font-semibold">{new Date(animal.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card className="flex flex-col items-center justify-center p-6 text-center border-emerald-200 shadow-md">
            <h3 className="font-bold text-sm mb-1 text-emerald-800 dark:text-emerald-300">
              Official Tamper-Evident QR Code
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Scan to verify vaccination passport & ownership
            </p>

            {animal.qr_code_url ? (
              <img
                src={animal.qr_code_url}
                alt={`QR Code for Tag ${animal.tag_uid}`}
                className="w-44 h-44 border rounded-xl p-2 bg-white shadow-inner mb-4"
              />
            ) : (
              <div className="w-44 h-44 border border-dashed rounded-xl flex items-center justify-center mb-4 bg-muted/20">
                <QrCode className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            <span className="font-mono text-xs font-bold text-foreground mb-3">
              TAG #{animal.tag_uid}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs w-full"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Health Passport
            </Button>
          </Card>
        </div>

        {/* Immunization & Treatment History Tabs */}
        <div className="space-y-6">
          {/* Vaccination Records */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Syringe className="h-5 w-5" />
                Vaccination & Immunization Ledger
              </CardTitle>
              <CardDescription>Verified bi-annual doses, boosters, and lifetime strain inoculations</CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No vaccination records entered yet.</p>
              ) : (
                <div className="divide-y text-sm">
                  {vaccinations.map((vac) => (
                    <div key={vac.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground">{vac.description}</span>
                        <p className="text-xs text-muted-foreground">
                          Administered by: {vac.performer?.full_name || 'Veterinary Staff'} ({vac.performer?.role || 'vet'})
                        </p>
                      </div>
                      <div className="text-right text-xs space-y-0.5">
                        <span className="text-muted-foreground">
                          Date: <span className="font-semibold text-foreground">{new Date(vac.performed_at).toLocaleDateString('en-IN')}</span>
                        </span>
                        {vac.next_due_at && (
                          <p className="text-amber-700 font-semibold">
                            Next Due: {new Date(vac.next_due_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Treatments & Checkups */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Stethoscope className="h-5 w-5" />
                Treatments & Clinical Checkups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No clinical treatment logs.</p>
              ) : (
                <div className="divide-y text-sm">
                  {treatments.map((tr) => (
                    <div key={tr.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{tr.description}</span>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {tr.record_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Attended by: {tr.performer?.full_name}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tr.performed_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Symptom Reports */}
          {symptomReports.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5" />
                  Symptom History & Triage Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y text-sm">
                  {symptomReports.map((sr) => (
                    <div key={sr.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">
                            Symptoms: {Array.isArray(sr.symptoms) ? sr.symptoms.join(', ') : 'None'}
                          </span>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {sr.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Reported: {new Date(sr.reported_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

