'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  Users,
  ClipboardList,
  Activity,
  MapPin,
  ArrowLeft,
  CloudRain,
  Thermometer,
  Wind,
  CheckCircle2,
  Lock,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DistrictDetails {
  name: string;
  division: string;
  lat: number;
  lng: number;
  risk_override_level?: string | null;
}

interface RiskAssessment {
  district: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  computedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  rawScore: number;
  subscores: {
    caseRate: number;
    trendSlope: number;
    vaccGap: number;
    weatherVector: number;
    neighborSpillover: number;
  };
  weights: {
    caseRate: number;
    trendSlope: number;
    vaccGap: number;
    weatherVector: number;
    neighborSpillover: number;
  };
  percentileRank: number;
  activeCaseCount: number;
  criticalCaseCount: number;
  registeredAnimals: number;
  vaccinatedAnimals: number;
  weatherSummary: string;
  isOverride: boolean;
  overrideLevel?: string | null;
  overrideLabel?: string;
}

interface StaffAssignment {
  id: string;
  district_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone?: string;
  } | null;
}

interface AdminAction {
  id: string;
  district_id: string;
  admin_id: string;
  action_type: 'intervention' | 'risk_override';
  notes: string;
  override_level?: string | null;
  created_at: string;
  admin?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface AvailableUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  district?: string;
}

export default function DistrictManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const districtId = params?.id ? decodeURIComponent(params.id as string) : '';

  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState<DistrictDetails | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);

  // Staff assignment form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [staffRole, setStaffRole] = useState('Field Veterinarian');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Admin action form state
  const [actionType, setActionType] = useState<'intervention' | 'risk_override'>('intervention');
  const [actionNotes, setActionNotes] = useState('');
  const [overrideLevel, setOverrideLevel] = useState<string>('high');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDistrictData = useCallback(async () => {
    if (!districtId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/districts/${encodeURIComponent(districtId)}/management`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        toast.error('Authentication required to access district administration');
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        toast.error('Access restricted to District Administrators and Veterinarians');
        router.push('/dashboard');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load district data');
      }

      const json = await res.json();
      if (json.data) {
        setDistrict(json.data.district);
        setRiskAssessment(json.data.riskAssessment);
        setStaffAssignments(json.data.staffAssignments || []);
        setAdminActions(json.data.adminActions || []);
        setAvailableUsers(json.data.availableUsers || []);
        if (json.data.availableUsers?.length > 0 && !selectedUserId) {
          setSelectedUserId(json.data.availableUsers[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error loading district');
    } finally {
      setLoading(false);
    }
  }, [districtId, token, router, selectedUserId]);

  useEffect(() => {
    if (!authLoading) {
      fetchDistrictData();
    }
  }, [authLoading, fetchDistrictData]);

  // Handle assigning staff
  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a staff member');
      return;
    }

    setSubmittingStaff(true);
    try {
      const res = await fetch(`/api/districts/${encodeURIComponent(districtId)}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: staffRole,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to assign staff');
      }

      toast.success(json.message || 'Staff assigned successfully');
      fetchDistrictData();
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Handle submitting admin action / override
  const handleRecordAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionNotes.trim() || actionNotes.trim().length < 3) {
      toast.error('Please provide detailed notes (minimum 3 characters)');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/districts/${encodeURIComponent(districtId)}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action_type: actionType,
          notes: actionNotes.trim(),
          override_level: actionType === 'risk_override' ? (overrideLevel === 'none' ? null : overrideLevel) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to record action');
      }

      toast.success(json.message || 'Action recorded successfully');
      setActionNotes('');
      fetchDistrictData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-600 text-white font-semibold">Critical Risk (अति-धोका)</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white font-semibold">High Risk (उच्च)</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white font-semibold">Medium Risk (मध्यम)</Badge>;
      case 'low':
      default:
        return <Badge className="bg-emerald-600 text-white font-semibold">Low Risk (कमी)</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="font-medium">Loading district command telemetry...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!district) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">District Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            The requested district &quot;{districtId}&quot; is not recognized in the Maharashtra administrative registry.
          </p>
          <Link href="/heatmap" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Surveillance Map
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sub = riskAssessment?.subscores;
  const weights = riskAssessment?.weights;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/heatmap"
            className="inline-flex items-center text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to GIS Surveillance Heatmap
          </Link>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Authorized Authority Command Session</span>
          </div>
        </div>

        {/* District Hero Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                {district.name} District
              </h1>
              {getRiskBadge(riskAssessment?.riskLevel || 'low')}
              {riskAssessment?.isOverride && (
                <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/40">
                  ⚡ Administrative Override
                </Badge>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Division: <strong>{district.division}</strong></span>
              <span>•</span>
              <span>Coordinates: {district.lat.toFixed(2)}°N, {district.lng.toFixed(2)}°E</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {riskAssessment?.riskScore ?? 0}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">Composite Score</div>
            </div>
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-black text-emerald-600">
                {riskAssessment?.percentileRank ?? 0}
                <span className="text-xs font-normal text-slate-500">th</span>
              </div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">State Percentile</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-black text-amber-600">
                {riskAssessment?.activeCaseCount ?? 0}
              </div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">Active Cases (14d)</div>
            </div>
          </div>
        </div>

        {/* 3-Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: 5-Factor Mathematical Risk Breakdown */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-600" />
                  5-Factor Risk Formula Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                {/* 1. Case Rate */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      1. Outbreak Case Rate (30%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {(sub?.caseRate ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (sub?.caseRate ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Normalized frequency of active outbreak reports in past 14 days.
                  </p>
                </div>

                {/* 2. Trend Slope */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      2. 14-Day Regression Trend (20%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {(sub?.trendSlope ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (sub?.trendSlope ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Linear progression rate over 14 days across the district.
                  </p>
                </div>

                {/* 3. Vaccination Gap */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      3. Vaccination Gap (15%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {(sub?.vaccGap ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (sub?.vaccGap ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Unvaccinated cattle ratio based on Bharat Pashudhan registry.
                  </p>
                </div>

                {/* 4. Weather Vector */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      4. Weather Vector Multiplier (20%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {(sub?.weatherVector ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (sub?.weatherVector ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Open-Meteo telemetry: {riskAssessment?.weatherSummary || 'Ambient climate telemetry active'}
                  </p>
                </div>

                {/* 5. Neighbor Spillover */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      5. Neighbor Spillover (15%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {(sub?.neighborSpillover ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (sub?.neighborSpillover ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Haversine-weighted transmission risk from adjacent districts within 150 km.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 font-mono">
                  Formula: 0.30·CR + 0.20·TS + 0.15·VG + 0.20·WV + 0.15·NS
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Staff Roster & Assignment */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Assigned Personnel Roster ({staffAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {staffAssignments.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                    No dedicated field officers assigned to {district.name} yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffAssignments.map((staff) => (
                      <div
                        key={staff.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {staff.user?.full_name || 'Staff Officer'}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {staff.role}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {staff.user?.email || staff.user_id}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignment Form */}
                <form onSubmit={handleAssignStaff} className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                    Assign New Staff Officer
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Select Personnel
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                    >
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role.toUpperCase()} — {u.district || 'State Pool'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Assigned District Role
                    </label>
                    <input
                      type="text"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      placeholder="e.g. Field Epidemiologist, Nodal Officer"
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingStaff}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    {submittingStaff ? 'Assigning...' : 'Assign to District'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Admin Interventions & Risk Override */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-600" />
                  Interventions & Risk Override
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActionType('intervention')}
                    className={`text-xs py-1.5 px-2 rounded-md font-medium transition ${
                      actionType === 'intervention'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Record Intervention
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('risk_override')}
                    className={`text-xs py-1.5 px-2 rounded-md font-medium transition ${
                      actionType === 'risk_override'
                        ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Override Risk Score
                  </button>
                </div>

                <form onSubmit={handleRecordAction} className="space-y-3">
                  {actionType === 'risk_override' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Manual Risk Level Override
                      </label>
                      <select
                        value={overrideLevel}
                        onChange={(e) => setOverrideLevel(e.target.value)}
                        className="w-full text-xs rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-700 p-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="critical">🔴 Critical Risk (Emergency Zone)</option>
                        <option value="high">🟠 High Risk (Containment Active)</option>
                        <option value="medium">🟡 Medium Risk (Surveillance)</option>
                        <option value="low">🟢 Low Risk (Normal Patrol)</option>
                        <option value="none">⚪ Reset to Automated Computed Score</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {actionType === 'intervention'
                        ? 'Intervention Details / Operation Order'
                        : 'Administrative Justification for Override'}
                    </label>
                    <textarea
                      rows={3}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder={
                        actionType === 'intervention'
                          ? 'e.g. Ring vaccination initiated in 15 border villages; quarantine checkpoint established.'
                          : 'e.g. Unofficial local reports indicate sudden increase in cattle lesions near market.'
                      }
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingAction}
                    className={`w-full text-xs h-8 text-white ${
                      actionType === 'risk_override'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {submittingAction
                      ? 'Submitting...'
                      : actionType === 'risk_override'
                      ? 'Apply Risk Override'
                      : 'Record Field Action'}
                  </Button>
                </form>

                {/* Audit Timeline */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Recent Administrative Actions Log ({adminActions.length})
                  </div>
                  {adminActions.length === 0 ? (
                    <div className="text-center text-[11px] text-slate-500 py-3">
                      No administrative actions logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {adminActions.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                act.action_type === 'risk_override'
                                  ? 'border-purple-400 text-purple-600 bg-purple-50 dark:bg-purple-950/40'
                                  : 'border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                              }`}
                            >
                              {act.action_type === 'risk_override'
                                ? `Override: ${act.override_level || 'Reset'}`
                                : 'Intervention'}
                            </Badge>
                            <span className="text-[10px] text-slate-500">
                              {new Date(act.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {act.notes}
                          </p>
                          <div className="text-[10px] text-slate-500">
                            By: {act.admin?.full_name || 'Admin Officer'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

