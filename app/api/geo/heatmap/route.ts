import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MAHARASHTRA_DISTRICTS, ALERT_RADIUS_KM } from '@/lib/constants/districts';
import { fetchDistrictWeather } from '@/lib/services/weatherService';
import {
  calculateAllDistrictsRisk,
  DistrictCalculationInput,
  DistrictRiskAssessment,
  RISK_WEIGHTS,
} from '@/lib/services/riskEngine';
import {
  getOutbreakFlags,
  getAnimals,
  getHealthRecordsDue7Days,
  getDistrictLatestOverride,
} from '@/lib/persistent-store';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // 1. Query outbreak flags from the past 14 days (with persistent store fallback)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    let flags: any[] = [];
    try {
      const { data, error } = await (admin.from('outbreak_flags') as any)
        .select('*')
        .gte('created_at', fourteenDaysAgo);
      if (!error && data && data.length > 0) {
        flags = data;
      }
    } catch {
      // ignore, fall back to persistent store
    }

    if (flags.length === 0) {
      const storeFlags = getOutbreakFlags();
      flags = storeFlags.filter((f) => new Date(f.created_at).getTime() >= Date.now() - 14 * 24 * 60 * 60 * 1000);
    }

    const flagsByDistrict: Record<string, any[]> = {};
    for (const flag of flags) {
      const dName = flag.district;
      if (!flagsByDistrict[dName]) {
        flagsByDistrict[dName] = [];
      }
      flagsByDistrict[dName].push(flag);
    }

    // 2. Query registered animals count and vaccinations per district
    const animalCountByDistrict: Record<string, number> = {};
    const vaccinatedCountByDistrict: Record<string, number> = {};

    try {
      const { data: animalsData } = await (admin.from('animals') as any).select('id, district');
      if (animalsData && animalsData.length > 0) {
        for (const a of animalsData) {
          animalCountByDistrict[a.district] = (animalCountByDistrict[a.district] || 0) + 1;
        }
      }
    } catch {
      // fallback to store
    }

    if (Object.keys(animalCountByDistrict).length === 0) {
      const storeAnimals = getAnimals();
      for (const a of storeAnimals) {
        animalCountByDistrict[a.district] = (animalCountByDistrict[a.district] || 0) + 1;
      }
    }

    try {
      const { data: hrData } = await (admin.from('health_records') as any)
        .select('id, animal_id, record_type, animal:animals(district)')
        .eq('record_type', 'vaccination');
      if (hrData && hrData.length > 0) {
        for (const r of hrData) {
          const d = r.animal?.district;
          if (d) {
            vaccinatedCountByDistrict[d] = (vaccinatedCountByDistrict[d] || 0) + 1;
          }
        }
      }
    } catch {
      // fallback to store
    }

    if (Object.keys(vaccinatedCountByDistrict).length === 0) {
      const storeHr = getHealthRecordsDue7Days().filter((h) => h.record_type === 'vaccination');
      const storeAnimals = getAnimals();
      const animalDistrictMap = new Map(storeAnimals.map((a) => [a.id, a.district]));
      for (const r of storeHr) {
        const d = animalDistrictMap.get(r.animal_id);
        if (d) {
          vaccinatedCountByDistrict[d] = (vaccinatedCountByDistrict[d] || 0) + 1;
        }
      }
    }

    // 3. Parallel fetch weather for the 6 division centroids
    const divisionCentroids: Record<string, { lat: number; lng: number }> = {
      Konkan: { lat: 18.96, lng: 72.82 },
      Pune: { lat: 18.52, lng: 73.85 },
      Nashik: { lat: 19.99, lng: 73.78 },
      'Chhatrapati Sambhajinagar': { lat: 19.87, lng: 75.34 },
      Amravati: { lat: 20.93, lng: 77.75 },
      Nagpur: { lat: 21.14, lng: 79.08 },
    };

    const divisionWeatherEntries = await Promise.all(
      Object.entries(divisionCentroids).map(async ([div, coord]) => {
        const w = await fetchDistrictWeather(coord.lat, coord.lng);
        return [div, w] as const;
      })
    );
    const divisionWeatherMap = Object.fromEntries(divisionWeatherEntries);

    // 4. Build calculation inputs for all 36 districts
    const calculationInputs: DistrictCalculationInput[] = MAHARASHTRA_DISTRICTS.map((dist) => {
      const recentFlags = flagsByDistrict[dist.name] || [];
      const weather = divisionWeatherMap[dist.division];
      const registered = animalCountByDistrict[dist.name] ?? 500;
      const vaccinated = vaccinatedCountByDistrict[dist.name] ?? Math.round(registered * 0.75);

      // Check admin override from persistent store
      const overrideLevel = getDistrictLatestOverride(dist.name);

      return {
        district: dist,
        flags: recentFlags,
        weather,
        registeredAnimals: registered,
        vaccinatedAnimals: vaccinated,
        adminOverrideLevel: overrideLevel,
      };
    });

    // 5. Execute comprehensive weighted calculation + percentile bucketing
    const assessments = calculateAllDistrictsRisk(calculationInputs, ALERT_RADIUS_KM);

    const heatmapResults: Array<
      DistrictRiskAssessment & {
        lat: number;
        lng: number;
        division: string;
      }
    > = assessments.map((assessment, idx) => {
      const dist = MAHARASHTRA_DISTRICTS[idx];
      return {
        ...assessment,
        lat: dist.lat,
        lng: dist.lng,
        division: dist.division,
      };
    });

    // Sort by highest risk score descending
    heatmapResults.sort((a, b) => b.riskScore - a.riskScore);

    return successResponse(heatmapResults, {
      total_districts: MAHARASHTRA_DISTRICTS.length,
      divisions_count: 6,
      alert_radius_km: ALERT_RADIUS_KM,
      formula: '0.30*CaseRate + 0.20*TrendSlope + 0.15*VaccGap + 0.20*WeatherVector + 0.15*NeighborSpillover',
      weights: RISK_WEIGHTS,
      generated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Heatmap calculation failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
