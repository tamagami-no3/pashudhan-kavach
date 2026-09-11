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

  // Initialize Leaflet map with district risk markers once real data is loaded
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
        const radius = Math.max(8, Math.min(26, 6 + (d.riskScore || 0) / 5));
        L.circleMarker([d.lat, d.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.7,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(
            `<b>${d.district}</b> — ${d.riskLevel.toUpperCase()} (${d.riskScore}/100)<br/>` +
              `Active outbreak flags (14d): ${d.activeCaseCount}<br/>` +
              `Dominant pathogen: ${d.dominantDisease || 'N/A'}<br/>` +
              `${d.weatherSummary}`
          );
      }

      try {
        map.fitBounds(heatmapData.map((d) => [d.lat, d.lng]), { padding: [30, 30] });
      } catch {
        // single-point fallback
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

  const getRiskColorClass = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700 shadow-red-200';
      case 'high':
        return 'bg-amber-500 text-white border-amber-600 shadow-amber-200';
      case 'medium':
        return 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-yellow-100';
      default:
        return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-600 uppercase">Critical (Red)</Badge>;
      case 'high':
        return <Badge className="bg-amber-500 uppercase">High (Orange)</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 uppercase">Medium (Yellow)</Badge>;
      default:
        return <Badge className="bg-emerald-600 uppercase">Low (Green)</Badge>;
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
            <p className="text-sm text-muted-foreground">
              {t('heatmap_subtitle')}
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

        {/* Actual Geographic Map (Leaflet + OpenStreetMap, no API key) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              Maharashtra District Risk Map
            </CardTitle>
            <CardDescription className="text-xs">
              36 district centroids colored by live risk index — click a marker for outbreak & weather details. Updated with real outbreak flags + Open-Meteo data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {loading ? (
              <div className="h-[400px] bg-muted/30 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                Loading district risk data…
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

        {/* Legend Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs shadow-sm">
          <span className="font-semibold text-muted-foreground">Risk Tier Indicators:</span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              <span>Low (0-19)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span>Medium (20-44)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
              <span>High (45-64)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-600"></span>
              <span>Critical (65-100 / Active High-Lethality)</span>
            </div>
          </div>
        </div>

        {/* Main Grid + Selected District Detail */}
        {loading ? (
          <div className="text-center p-12 space-y-2">
            <Activity className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Computing district epidemiological scores...</p>
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
                          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
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

                      <div className="mt-3 pt-2 border-t flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold">
                          Score: {dist.riskScore}
                        </span>
                        {dist.activeCaseCount > 0 && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                            {dist.activeCaseCount} cases
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected District Detail Card */}
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
                    {getRiskBadge(selectedDistrict.riskLevel)}
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-sm">
                  {/* Score gauge */}
                  <div className="p-3 bg-muted/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Epidemiological Risk Index</span>
                      <span className="text-2xl font-bold font-mono">{selectedDistrict.riskScore} / 100</span>
                    </div>
                    <Flame className={`h-8 w-8 ${selectedDistrict.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`} />
                  </div>

                  <div className="space-y-2 text-xs">
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
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Centroid Coordinates:</span>
                      <span className="font-mono text-muted-foreground">{selectedDistrict.lat}°N, {selectedDistrict.lng}°E</span>
                    </div>
                  </div>

                  {/* Weather Risk Note */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                      <CloudRain className="h-4 w-4 text-blue-600" />
                      Meteorological Assessment
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      {selectedDistrict.weatherSummary}
                    </p>
                  </div>

                  <Link href={`/report-symptom`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      Submit Case for {selectedDistrict.district}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
