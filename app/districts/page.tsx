'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { MAHARASHTRA_DISTRICTS, MAHARASHTRA_DIVISIONS } from '@/lib/constants/districts';
import {
  MapPin,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Search,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DistrictsDirectoryPage() {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [districtRisks, setDistrictRisks] = useState<Record<string, { riskScore: number; riskLevel: string }>>({});

  useEffect(() => {
    // Fetch current district risk scores from heatmap endpoint
    fetch('/api/geo/heatmap')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.districts) {
          const map: Record<string, { riskScore: number; riskLevel: string }> = {};
          for (const d of data.data.districts) {
            map[d.district] = {
              riskScore: d.riskScore,
              riskLevel: d.riskLevel,
            };
          }
          setDistrictRisks(map);
        }
      })
      .catch((err) => console.error('Error loading heatmap telemetry:', err));
  }, []);

  const filteredDistricts = MAHARASHTRA_DISTRICTS.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiv = selectedDivision === 'All' || d.division === selectedDivision;
    return matchesSearch && matchesDiv;
  });

  const getRiskBadge = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-600 text-white font-semibold">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white font-semibold">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white font-semibold">Medium</Badge>;
      case 'low':
      default:
        return <Badge className="bg-emerald-600 text-white font-semibold">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                <Building className="h-8 w-8 text-emerald-600" />
                Maharashtra District Command Directory
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Administrative surveillance, staff roster deployment, and 5-factor risk telemetry for all 36 districts.
              </p>
            </div>
            <Link href="/heatmap">
              <Button variant="outline" className="text-xs h-9">
                <ShieldAlert className="h-4 w-4 mr-2 text-emerald-600" />
                View GIS Live Heatmap
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district name..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedDivision('All')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedDivision === 'All'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Divisions (36)
              </button>
              {MAHARASHTRA_DIVISIONS.map((div) => (
                <button
                  key={div}
                  type="button"
                  onClick={() => setSelectedDivision(div)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedDivision === div
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* District Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDistricts.map((dist) => {
            const riskInfo = districtRisks[dist.name] || { riskScore: 0, riskLevel: 'low' };
            return (
              <Card
                key={dist.name}
                className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                      {dist.name}
                    </CardTitle>
                    {getRiskBadge(riskInfo.riskLevel)}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    <span>{dist.division} Division</span>
                    <span>•</span>
                    <span>{dist.lat.toFixed(2)}°N, {dist.lng.toFixed(2)}°E</span>
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-2 border-t border-slate-100 dark:border-slate-700/60 mb-3">
                    <span>Composite Risk Score</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {riskInfo.riskScore}/100
                    </span>
                  </div>
                  <Link href={`/districts/${encodeURIComponent(dist.name)}`}>
                    <Button
                      variant="outline"
                      className="w-full text-xs h-8 group-hover:bg-emerald-600 group-hover:text-white transition"
                    >
                      <Sliders className="h-3.5 w-3.5 mr-1.5" />
                      Open Management & Roster
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

