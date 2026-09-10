import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';
import { fetchDistrictWeather } from '@/lib/services/weatherService';
import { calculateDistrictRisk, DistrictRiskAssessment } from '@/lib/services/riskEngine';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // Query outbreak flags from the past 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: flags, error } = await (admin.from('outbreak_flags') as any)
      .select('*')
      .gte('created_at', fourteenDaysAgo);

    if (error) {
      return errorResponse(`Failed to query outbreak flags: ${error.message}`, 'DB_ERROR', 500);
    }

    const flagsByDistrict: Record<string, any[]> = {};
    for (const flag of (flags as any[]) || []) {
      if (!flagsByDistrict[flag.district]) {
        flagsByDistrict[flag.district] = [];
      }
      flagsByDistrict[flag.district].push(flag);
    }

    // Process all 36 districts
    // Fetch sample weather for key division centroids to be performant and respect Open-Meteo rate limit
    const divisionCentroids: Record<string, { lat: number; lng: number }> = {
      Konkan: { lat: 18.96, lng: 72.82 },
      Pune: { lat: 18.52, lng: 73.85 },
      Nashik: { lat: 19.99, lng: 73.78 },
      'Chhatrapati Sambhajinagar': { lat: 19.87, lng: 75.34 },
      Amravati: { lat: 20.93, lng: 77.75 },
      Nagpur: { lat: 21.14, lng: 79.08 },
    };

    // Parallel fetch weather for the 6 division centroids
    const divisionWeatherEntries = await Promise.all(
      Object.entries(divisionCentroids).map(async ([div, coord]) => {
        const w = await fetchDistrictWeather(coord.lat, coord.lng);
        return [div, w] as const;
      })
    );
    const divisionWeatherMap = Object.fromEntries(divisionWeatherEntries);

    const heatmapResults: Array<
      DistrictRiskAssessment & {
        lat: number;
        lng: number;
        division: string;
      }
    > = [];

    for (const dist of MAHARASHTRA_DISTRICTS) {
      const recentFlags = flagsByDistrict[dist.name] || [];
      const weather = divisionWeatherMap[dist.division];

      const assessment = calculateDistrictRisk(dist.name, recentFlags, weather);
      heatmapResults.push({
        ...assessment,
        lat: dist.lat,
        lng: dist.lng,
        division: dist.division,
      });
    }

    // Sort by highest risk score descending
    heatmapResults.sort((a, b) => b.riskScore - a.riskScore);

    return successResponse(heatmapResults, {
      total_districts: MAHARASHTRA_DISTRICTS.length,
      divisions_count: 6,
      generated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Heatmap calculation failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

