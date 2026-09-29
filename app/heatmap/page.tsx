'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ShieldAlert,
  CloudRain,
  Activity,
  AlertTriangle,
  Flame,
  Info,
  Layers,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Syringe,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MAHARASHTRA_DIVISIONS } from '@/lib/constants/districts';

export default function HeatmapPage() {
  const { t } = useAuth();
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchHeatmap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize Leaflet map with district risk markers & breakdown tooltips
  useEffect(() => {
    if (!heatmapData || heatmapData.length === 0 || !mapContainerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapContainerRef.current) return;
      if (mapRef.current) mapRef.current.remove();

      const map = L.map(mapContainerRef.current, {
        center: [19.75, 75.7],
        zoom: 6,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const riskColor = (level: string) => {
        if (level === 'critical') return '#dc2626';
        if (level === 'high') return '#f59e0b';
        if (level === 'medium') return '#eab308';
        return '#10b981';
      };

      for (const d of heatmapData) {
        const color = riskColor(d.riskLevel);
        const radius = Math.max(8, Math.min(24, 6 + (d.riskScore || 0) / 5));
        const sub = d.subscores || {
          caseRate: 0,
          trendSlope: 0,
          vaccGap: 0,
          weatherVector: 0,
          neighborSpillover: 0,
        };

        const marker = L.circleMarker([d.lat, d.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.75,
          weight: 2,
        }).addTo(map);

        // Hover tooltip with quick breakdown
        const tooltipHtml = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 2px;">
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${d.district}</div>
            <div style="font-size: 11px; margin-bottom: 4px; color: ${color}; font-weight: 600;">
              ${d.isOverride ? `⚠️ Admin override: ${d.riskLevel.toUpperCase()}` : `${d.riskLevel.toUpperCase()} Tier (Pct: ${d.percentileRank ?? 0}%)`}
            </div>
            <div style="font-size: 11px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
              Score: ${d.riskScore} / 100
            </div>
            <div style="font-size: 10px; color: #475569; margin-top: 4px; line-height: 1.3;">
              • Case Rate (30%): ${(sub.caseRate * 100).toFixed(0)}%<br/>
              • 14d Trend (20%): ${(sub.trendSlope * 100).toFixed(0)}%<br/>
              • Vacc Gap (15%): ${(sub.vaccGap * 100).toFixed(0)}%<br/>
              • Weather (20%): ${(sub.weatherVector * 100).toFixed(0)}%<br/>
              • Spillover (15%): ${(sub.neighborSpillover * 100).toFixed(0)}%
            </div>
          </div>
        `;
        marker.bindTooltip(tooltipHtml, { sticky: true, opacity: 0.95 });

        // Click popup with full detail table
        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 220px; font-size: 12px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${d.district}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${d.division} Division</div>
            ${
              d.isOverride
                ? `<div style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 6px; font-weight: 600; font-size: 11px; margin-bottom: 6px;">
                     ${d.overrideLabel || `Admin override — computed score: ${d.riskScore}`}
                   </div>`
                : `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; font-weight: 600; font-size: 11px; margin-bottom: 6px;">
                     Percentile Tier: <span style="color: ${color}; text-transform: uppercase;">${d.riskLevel}</span> (Rank: ${d.percentileRank}%)
                   </div>`
            }
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">Computed Risk: ${d.riskScore} / 100</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 0;">Case Rate (30%):</td><td style="text-align: right; font-weight: 600;">${sub.caseRate.toFixed(2)}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 0;">Trend Slope (20%):</td><td style="text-align: right; font-weight: 600;">${sub.trendSlope.toFixed(2)}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 0;">Vacc Gap (15%):</td><td style="text-align: right; font-weight: 600;">${sub.vaccGap.toFixed(2)}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 0;">Weather Vector (20%):</td><td style="text-align: right; font-weight: 600;">${sub.weatherVector.toFixed(2)}</td></tr>
              <tr><td style="padding: 2px 0;">Neighbor Spillover (15%):</td><td style="text-align: right; font-weight: 600;">${sub.neighborSpillover.toFixed(2)}</td></tr>
            </table>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Active Cases: ${d.activeCaseCount} | Dominant: ${d.dominantDisease || 'None'}</div>
          </div>
        `;
        marker.bindPopup(popupHtml);

        marker.on('click', () => {
          setSelectedDistrict(d);
        });
      }

      try {
        map.fitBounds(heatmapData.map((d) => [d.lat, d.lng]), { padding: [30, 30] });
      } catch {
        // fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heatmapData]);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/geo/heatmap');
      if (res.ok) {
        const d = await res.json();
        setHeatmapData(d.data || []);
        if (d.data && d.data.length > 0) {
          setSelectedDistrict(d.data[0]);
        }
      }
    } catch (e) {
      console.warn('Error fetching heatmap:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistricts = heatmapData.filter((d) => {
    if (selectedDivision === 'All') return true;
    return d.division === selectedDivision;
  });

  const getRiskBadge = (level: string, isOverride?: boolean) => {
    if (isOverride) {
      return (
        <Badge className="bg-purple-700 text-white uppercase font-bold flex items-center gap-1">
          <Sliders className="h-3 w-3" /> Override: {level}
        </Badge>
      );
    }
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-600 uppercase font-bold">Critical (P75+)</Badge>;
      case 'high':
        return <Badge className="bg-amber-500 uppercase font-bold">High (P50-P75)</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 uppercase font-bold text-slate-900">Medium (P25-P50)</Badge>;
      default:
        return <Badge className="bg-emerald-600 uppercase font-bold">Low (&lt;P25)</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <MapPin className="h-6 w-6 text-emerald-600" />
              {t('nav_heatmap')} & {t('heatmap_title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Transparent weighted risk score: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">0.30*CaseRate + 0.20*TrendSlope + 0.15*VaccGap + 0.20*Weather + 0.15*Spillover</code>
            </p>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDivision('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedDivision === 'All'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              All (36)
            </button>
            {MAHARASHTRA_DIVISIONS.map((div) => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${
                  selectedDivision === div
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>

        {/* Geographic Map with Tooltip/Popup Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              Maharashtra Spatial Epidemiological Risk Map
            </CardTitle>
            <CardDescription className="text-xs">
              Hover over any circle marker to view the 5-factor risk formula breakdown tooltip. Click any marker to view full details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {loading ? (
              <div className="h-[400px] bg-muted/30 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                Computing multi-factor district risk index…
              </div>
            ) : (
              <div
                ref={mapContainerRef}
                id="maharashtra-risk-map"
                className="h-[400px] w-full rounded-xl overflow-hidden z-0 border"
              />
            )}
          </CardContent>
        </Card>

        {/* Legend Banner with Percentile-based Quartile Tiers */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-muted-foreground">Relative Percentile Risk Tiers (Dynamically Recomputed):</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              <span>Low (&lt;25th Percentile)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span>Medium (25th–50th Percentile)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
              <span>High (50th–75th Percentile)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-600"></span>
              <span>Critical (Top Quartile, &ge;75th)</span>
            </div>
          </div>
        </div>

        {/* Main Grid + Selected District Detail */}
        {loading ? (
          <div className="text-center p-12 space-y-2">
            <Activity className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Executing 5-factor regression and spatial calculations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 36 District Heat Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredDistricts.map((dist) => {
                  const isSelected = selectedDistrict?.district === dist.district;
                  return (
                    <button
                      key={dist.district}
                      onClick={() => setSelectedDistrict(dist)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all transform hover:-translate-y-0.5 shadow-sm ${
                        isSelected
                          ? 'ring-2 ring-emerald-600 ring-offset-2 bg-white dark:bg-zinc-900'
                          : 'bg-white dark:bg-zinc-900 hover:border-emerald-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate max-w-[80px]">
                            {dist.division}
                          </span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              dist.riskLevel === 'critical'
                                ? 'bg-red-600 animate-ping'
                                : dist.riskLevel === 'high'
                                ? 'bg-amber-500'
                                : dist.riskLevel === 'medium'
                                ? 'bg-yellow-400'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm leading-tight text-foreground line-clamp-1">
                          {dist.district}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold">
                          Score: {dist.riskScore}
                        </span>
                        {dist.isOverride ? (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/50 px-1 py-0.5 rounded">
                            Override
                          </span>
                        ) : dist.activeCaseCount > 0 ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                            {dist.activeCaseCount} cases
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected District Detail Card with 5-Subscore Breakdown */}
            {selectedDistrict && (
              <Card className="border-emerald-200 dark:border-emerald-900 shadow-md">
                <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        {selectedDistrict.division} Division
                      </span>
                      <CardTitle className="text-xl font-bold mt-0.5">
                        {selectedDistrict.district}
                      </CardTitle>
                    </div>
                    {getRiskBadge(selectedDistrict.riskLevel, selectedDistrict.isOverride)}
                  </div>

                  {/* Admin Override Alert Banner */}
                  {selectedDistrict.isOverride && (
                    <div className="mt-2 p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-lg text-xs flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-purple-600 shrink-0" />
                      <div>
                        <strong>{selectedDistrict.overrideLabel || `Admin override — computed score: ${selectedDistrict.riskScore}`}</strong>
                        <span className="block text-[10px] text-purple-700 dark:text-purple-300">
                          Raw percentile tier: {selectedDistrict.computedRiskLevel?.toUpperCase()} (Percentile: {selectedDistrict.percentileRank}%)
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-sm">
                  {/* Score Gauge */}
                  <div className="p-3 bg-muted/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Weighted Risk Score</span>
                      <span className="text-2xl font-bold font-mono">{selectedDistrict.riskScore} / 100</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Dataset Percentile Rank: {selectedDistrict.percentileRank}%
                      </span>
                    </div>
                    <Flame className={`h-8 w-8 ${selectedDistrict.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`} />
                  </div>

                  {/* 5-Factor Weighted Subscores Breakdown Panel */}
                  <div className="space-y-2 pt-1 border-t">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Formula Factor Breakdown</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Weight / Value</span>
                    </div>

                    {selectedDistrict.subscores && (
                      <div className="space-y-2 text-xs">
                        {/* 1. Case Rate */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Activity className="h-3 w-3 text-red-500" /> Case Rate (Cases / Animals)
                            </span>
                            <span className="font-mono font-bold">
                              Weight: 30% | {(selectedDistrict.subscores.caseRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, selectedDistrict.subscores.caseRate * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. Trend Slope */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-amber-500" /> 14-Day Regression Trend Slope
                            </span>
                            <span className="font-mono font-bold">
                              Weight: 20% | {(selectedDistrict.subscores.trendSlope * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, selectedDistrict.subscores.trendSlope * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 3. Vaccination Gap */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Syringe className="h-3 w-3 text-emerald-500" /> Vaccination Gap (1 - VaccRate)
                            </span>
                            <span className="font-mono font-bold">
                              Weight: 15% | {(selectedDistrict.subscores.vaccGap * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, selectedDistrict.subscores.vaccGap * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 4. Weather Vector */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CloudRain className="h-3 w-3 text-blue-500" /> Meteorological Vector
                            </span>
                            <span className="font-mono font-bold">
                              Weight: 20% | {(selectedDistrict.subscores.weatherVector * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, selectedDistrict.subscores.weatherVector * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 5. Neighbor Spillover */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Compass className="h-3 w-3 text-indigo-500" /> Haversine Neighbor Spillover (&le;150km)
                            </span>
                            <span className="font-mono font-bold">
                              Weight: 15% | {(selectedDistrict.subscores.neighborSpillover * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, selectedDistrict.subscores.neighborSpillover * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Epidemiological Summary */}
                  <div className="space-y-1.5 text-xs pt-2 border-t">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Active Outbreak Flags (14d):</span>
                      <span className="font-bold text-foreground">{selectedDistrict.activeCaseCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Critical Lethality Alerts:</span>
                      <span className="font-bold text-red-600">{selectedDistrict.criticalCaseCount}</span>
                    </div>
                    {selectedDistrict.dominantDisease && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Dominant Pathogen:</span>
                        <span className="font-bold text-foreground">{selectedDistrict.dominantDisease}</span>
                      </div>
                    )}
                  </div>

                  {/* Weather Risk Note */}
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-xl space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                      <CloudRain className="h-3.5 w-3.5 text-blue-600" />
                      Weather Telemetry Assessment
                    </div>
                    <p className="text-[11px] text-blue-800 dark:text-blue-200">
                      {selectedDistrict.weatherSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link href={`/report-symptom`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                        Submit Case
                      </Button>
                    </Link>
                    <Link href={`/districts/${encodeURIComponent(selectedDistrict.district)}`}>
                      <Button variant="outline" className="w-full text-xs">
                        <Sliders className="h-3.5 w-3.5 mr-1" />
                        Manage District
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
