'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Radio, AlertTriangle, MapPin, Activity, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';

export default function CommunityFeedPage() {
  const { t, language } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [districtFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = '/api/community-posts?limit=50';
      if (districtFilter) url += `&district=${encodeURIComponent(districtFilter)}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setPosts(d.data || []);
      }
    } catch (e) {
      console.warn('Error loading community feed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container max-w-4xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Radio className="h-6 w-6 text-amber-600 animate-pulse" />
              {t('nav_community')} & {t('community_subtitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('community_desc')}
            </p>
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="h-10 px-3 text-xs rounded-md border bg-background text-foreground"
          >
            <option value="">{t('all_districts')}</option>
            {MAHARASHTRA_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notice Items */}
        {loading ? (
          <div className="text-center p-12 space-y-2">
            <Activity className="h-6 w-6 text-amber-600 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">{t('loading')}...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center bg-muted/20 border-dashed">
            <p className="text-sm text-muted-foreground">{t('no_notices')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-amber-200 dark:border-amber-900 shadow-sm">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        {post.district}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(post.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {(language === 'en' && post.summary_en) || (language === 'hi' && post.summary_hi) || post.summary_mr || post.summary}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    {t('verified_advisory')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

