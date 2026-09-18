import type { RiskLevel } from '@/types/database.types';
import { WeatherData } from './weatherService';
import { ALERT_RADIUS_KM, DistrictInfo, MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';

export interface RiskSubscores {
  caseRate: number; // normalized [0, 1]
  trendSlope: number; // normalized [0, 1]
  vaccGap: number; // [0, 1]
  weatherVector: number; // normalized [0, 1]
  neighborSpillover: number; // normalized [0, 1]
}

export interface RiskWeights {
  caseRate: number; // 0.30
  trendSlope: number; // 0.20
  vaccGap: number; // 0.15
  weatherVector: number; // 0.20
  neighborSpillover: number; // 0.15
}

export const RISK_WEIGHTS: RiskWeights = {
  caseRate: 0.30,
  trendSlope: 0.20,
  vaccGap: 0.15,
  weatherVector: 0.20,
  neighborSpillover: 0.15,
};

export interface DistrictRiskAssessment {
  district: string;
  riskLevel: RiskLevel; // Active display risk level (reflects override if present)
  computedRiskLevel: RiskLevel; // Raw computed percentile bucket
  riskScore: number; // 0 to 100
  rawScore: number; // 0 to 1
  subscores: RiskSubscores;
  weights: RiskWeights;
  percentileRank: number; // 0 to 100
  activeCaseCount: number;
  criticalCaseCount: number;
  registeredAnimals: number;
  vaccinatedAnimals: number;
  weatherElevatedRisk: boolean;
  dominantDisease?: string;
  weatherSummary: string;
  lastUpdated: string;
  isOverride: boolean;
  overrideLevel?: RiskLevel | null;
  overrideLabel?: string;
}

export interface OutbreakFlagInput {
  risk_level: RiskLevel;
  predicted_disease: string;
  created_at: string;
  district?: string;
}

/**
 * Haversine formula to calculate great-circle distance between two GPS coordinates in kilometers.
 * Reuses the canonical implementation from nearby-cases.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalizes an array of numbers using min-max scaling to [0, 1].
 * If all values are identical, returns defaultVal for all.
 */
function minMaxNormalize(values: number[], defaultVal = 0): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return values.map(() => defaultVal);
  }
  return values.map((v) => (v - min) / (max - min));
}

/**
 * Computes linear regression slope of daily case counts over 14-day window.
 * Days index: 0 (14 days ago) to 13 (today).
 */
function calculate14DayTrendSlope(flags: OutbreakFlagInput[], now = Date.now()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const dailyCounts = new Array(14).fill(0);

  for (const flag of flags) {
    const flagTime = new Date(flag.created_at).getTime();
    const daysAgo = Math.floor((now - flagTime) / dayMs);
    if (daysAgo >= 0 && daysAgo < 14) {
      // index 0 = oldest (13 days ago), index 13 = most recent (today)
      const dayIndex = 13 - daysAgo;
      dailyCounts[dayIndex]++;
    }
  }

  // Simple linear regression: x = 0..13, y = dailyCounts[x]
  const n = 14;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let x = 0; x < n; x++) {
    const y = dailyCounts[x];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Normalizes weather factors into a [0, 1] vector representing pathogen proliferation favorability.
 */
function computeWeatherVector(weather?: WeatherData): { score: number; elevated: boolean; summary: string } {
  if (!weather || weather.status !== 'available') {
    return {
      score: 0.3,
      elevated: false,
      summary: 'Climatic baseline (Weather API telemetry unavailable)',
    };
  }

  const humidity = weather.relativeHumidity ?? 50;
  const humidityScore = Math.min(1, Math.max(0, humidity / 100)); // [0, 1]

  let rainScore = 0.1;
  if (weather.isRecentRain) {
    rainScore = 0.85;
  } else if (weather.precipitation && weather.precipitation > 0) {
    rainScore = Math.min(1, Math.max(0.2, weather.precipitation / 10));
  }

  let tempScore = 0.2;
  const temp = weather.temperature ?? 28;
  if (temp > 38) {
    tempScore = 0.8; // heat stress
  } else if (temp >= 24 && temp <= 35) {
    tempScore = 0.6; // optimal mosquito / bacterial incubation
  }

  // Weighted weather vector
  const score = Math.min(1, Math.max(0, 0.45 * humidityScore + 0.35 * rainScore + 0.2 * tempScore));
  const elevated = weather.isHighHumidity || weather.isRecentRain || (temp > 38);

  let summary = 'Standard climatic risk';
  if (weather.isHighHumidity && weather.isRecentRain) {
    summary = 'Elevated vector risk (High humidity + precipitation)';
  } else if (weather.isHighHumidity) {
    summary = 'High atmospheric moisture favoring spore persistence';
  } else if (weather.isRecentRain) {
    summary = 'Recent precipitation creates standing water vectors';
  } else if (temp > 38) {
    summary = 'Severe heat stress increases herd vulnerability';
  }

  return { score, elevated, summary };
}

export interface DistrictCalculationInput {
  district: DistrictInfo;
  flags: OutbreakFlagInput[];
  weather?: WeatherData;
  registeredAnimals?: number;
  vaccinatedAnimals?: number;
  adminOverrideLevel?: RiskLevel | null;
}

/**
 * Comprehensive risk computation for all districts in Maharashtra.
 *
 * Implements the verified weighted formula:
 * RiskScore = 0.30*CaseRate + 0.20*TrendSlope + 0.15*VaccGap + 0.20*WeatherVector + 0.15*NeighborSpillover
 *
 * All 5 subscores are preserved in the response along with weights and percentile-bucketed risk tiers.
 */
export function calculateAllDistrictsRisk(
  inputs: DistrictCalculationInput[],
  alertRadiusKm = ALERT_RADIUS_KM
): DistrictRiskAssessment[] {
  const districtCount = inputs.length;
  if (districtCount === 0) return [];

  // 1. Gather raw statistics per district
  const rawCaseRates: number[] = [];
  const rawSlopes: number[] = [];
  const rawVaccGaps: number[] = [];
  const rawWeatherScores: number[] = [];
  const rawWeatherSummaries: string[] = [];
  const rawWeatherElevated: boolean[] = [];
  const activeCaseCounts: number[] = [];
  const criticalCounts: number[] = [];
  const dominantDiseases: Array<string | undefined> = [];

  for (const input of inputs) {
    const flags = input.flags || [];
    const activeCases = flags.length;
    activeCaseCounts.push(activeCases);

    let critical = 0;
    const diseaseCounts: Record<string, number> = {};
    for (const f of flags) {
      if (f.risk_level === 'critical') critical++;
      diseaseCounts[f.predicted_disease] = (diseaseCounts[f.predicted_disease] || 0) + 1;
    }
    criticalCounts.push(critical);

    let dominant: string | undefined;
    let maxDCount = 0;
    for (const [dis, c] of Object.entries(diseaseCounts)) {
      if (c > maxDCount) {
        maxDCount = c;
        dominant = dis;
      }
    }
    dominantDiseases.push(dominant);

    // Baseline registered animals if not populated (e.g. 500 baseline per district)
    const registered = Math.max(1, input.registeredAnimals ?? 500);
    const vaccinated = Math.min(registered, input.vaccinatedAnimals ?? Math.round(registered * 0.7));

    // CaseRate = active_flagged_cases / registered_animals
    rawCaseRates.push(activeCases / registered);

    // TrendSlope over 14 days
    rawSlopes.push(calculate14DayTrendSlope(flags));

    // VaccGap = 1 - (vaccinated / total)
    const vaccGap = Math.max(0, Math.min(1, 1 - vaccinated / registered));
    rawVaccGaps.push(vaccGap);

    // WeatherVector
    const weatherResult = computeWeatherVector(input.weather);
    rawWeatherScores.push(weatherResult.score);
    rawWeatherSummaries.push(weatherResult.summary);
    rawWeatherElevated.push(weatherResult.elevated);
  }

  // 2. Normalize CaseRate and TrendSlope across all districts to [0, 1]
  const normCaseRates = minMaxNormalize(rawCaseRates, 0.0);
  const normTrendSlopes = minMaxNormalize(rawSlopes, 0.0);

  // 3. Compute NeighborSpillover using Haversine distance within alertRadiusKm
  const rawNeighborSpillovers: number[] = [];
  for (let i = 0; i < districtCount; i++) {
    const distA = inputs[i].district;
    let spilloverDensity = 0;

    for (let j = 0; j < districtCount; j++) {
      if (i === j) continue;
      const distB = inputs[j].district;
      const distKm = haversineDistanceKm(distA.lat, distA.lng, distB.lat, distB.lng);

      if (distKm <= alertRadiusKm) {
        const neighborCases = activeCaseCounts[j];
        if (neighborCases > 0) {
          // Haversine-weighted case density
          spilloverDensity += neighborCases / Math.max(10, distKm);
        }
      }
    }
    rawNeighborSpillovers.push(spilloverDensity);
  }
  const normNeighborSpillovers = minMaxNormalize(rawNeighborSpillovers, 0.0);

  // 4. Calculate final composite RiskScore per district
  // Formula: 0.30*CaseRate + 0.20*TrendSlope + 0.15*VaccGap + 0.20*WeatherVector + 0.15*NeighborSpillover
  const intermediateScores: Array<{
    index: number;
    rawScore: number;
    score100: number;
    subscores: RiskSubscores;
  }> = [];

  for (let i = 0; i < districtCount; i++) {
    const cr = normCaseRates[i];
    const ts = normTrendSlopes[i];
    const vg = rawVaccGaps[i];
    const wv = rawWeatherScores[i];
    const ns = normNeighborSpillovers[i];

    const rawComposite =
      RISK_WEIGHTS.caseRate * cr +
      RISK_WEIGHTS.trendSlope * ts +
      RISK_WEIGHTS.vaccGap * vg +
      RISK_WEIGHTS.weatherVector * wv +
      RISK_WEIGHTS.neighborSpillover * ns;

    const boundedComposite = Math.min(1, Math.max(0, rawComposite));
    const score100 = Math.round(boundedComposite * 100);

    intermediateScores.push({
      index: i,
      rawScore: Math.round(boundedComposite * 1000) / 1000,
      score100,
      subscores: {
        caseRate: Math.round(cr * 1000) / 1000,
        trendSlope: Math.round(ts * 1000) / 1000,
        vaccGap: Math.round(vg * 1000) / 1000,
        weatherVector: Math.round(wv * 1000) / 1000,
        neighborSpillover: Math.round(ns * 1000) / 1000,
      },
    });
  }

  // 5. Compute dynamic PERCENTILE ranks across all districts in dataset
  // Sort by score ascending to compute exact percentiles
  const sortedScores = [...intermediateScores].sort((a, b) => a.score100 - b.score100);
  const percentileRanks = new Map<number, number>();
  const computedBuckets = new Map<number, RiskLevel>();

  for (let rank = 0; rank < sortedScores.length; rank++) {
    const item = sortedScores[rank];
    const pct = districtCount > 1 ? Math.round((rank / (districtCount - 1)) * 100) : 50;
    percentileRanks.set(item.index, pct);

    // Quartile percentiles: Low (<25th), Medium (25th–50th), High (50th–75th), Critical (>=75th top quartile)
    let bucket: RiskLevel = 'low';
    if (pct >= 75) {
      bucket = 'critical';
    } else if (pct >= 50) {
      bucket = 'high';
    } else if (pct >= 25) {
      bucket = 'medium';
    } else {
      bucket = 'low';
    }
    computedBuckets.set(item.index, bucket);
  }

  // 6. Build final DistrictRiskAssessment list with Admin Override logic
  const results: DistrictRiskAssessment[] = [];

  for (let i = 0; i < districtCount; i++) {
    const input = inputs[i];
    const inter = intermediateScores[i];
    const pctRank = percentileRanks.get(i) ?? 50;
    const computedBucket = computedBuckets.get(i) ?? 'low';

    // Check for admin override from district or input
    const override = input.adminOverrideLevel || input.district.risk_override_level || null;
    const isOverride = Boolean(override);
    const activeRiskLevel = override || computedBucket;

    results.push({
      district: input.district.name,
      riskLevel: activeRiskLevel,
      computedRiskLevel: computedBucket,
      riskScore: inter.score100,
      rawScore: inter.rawScore,
      subscores: inter.subscores,
      weights: RISK_WEIGHTS,
      percentileRank: pctRank,
      activeCaseCount: activeCaseCounts[i],
      criticalCaseCount: criticalCounts[i],
      registeredAnimals: Math.max(1, input.registeredAnimals ?? 500),
      vaccinatedAnimals: Math.min(
        Math.max(1, input.registeredAnimals ?? 500),
        input.vaccinatedAnimals ?? Math.round((input.registeredAnimals ?? 500) * 0.7)
      ),
      weatherElevatedRisk: rawWeatherElevated[i],
      dominantDisease: dominantDiseases[i],
      weatherSummary: rawWeatherSummaries[i],
      lastUpdated: new Date().toISOString(),
      isOverride,
      overrideLevel: override,
      overrideLabel: isOverride ? `Admin override — computed score: ${inter.score100}` : undefined,
    });
  }

  return results;
}

/**
 * Backward compatibility wrapper for single-district evaluation.
 */
export function calculateDistrictRisk(
  district: string,
  recentFlags: OutbreakFlagInput[],
  weather?: WeatherData
): DistrictRiskAssessment {
  const distInfo = MAHARASHTRA_DISTRICTS.find((d) => d.name.toLowerCase() === district.toLowerCase()) || {
    name: district,
    division: 'Pune',
    lat: 18.52,
    lng: 73.85,
  };

  const assessments = calculateAllDistrictsRisk([
    {
      district: distInfo,
      flags: recentFlags,
      weather,
    },
  ]);

  return assessments[0];
}
