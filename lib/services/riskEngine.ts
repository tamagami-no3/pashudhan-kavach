import type { RiskLevel } from '@/types/database.types';
import { WeatherData } from './weatherService';

export interface DistrictRiskAssessment {
  district: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 to 100
  activeCaseCount: number;
  criticalCaseCount: number;
  weatherElevatedRisk: boolean;
  dominantDisease?: string;
  weatherSummary: string;
  lastUpdated: string;
}

/**
 * Computes district risk index by combining outbreak flag density (last 14 days)
 * with real-time or fallback meteorological factors.
 */
export function calculateDistrictRisk(
  district: string,
  recentFlags: Array<{ risk_level: RiskLevel; predicted_disease: string; created_at: string }>,
  weather?: WeatherData
): DistrictRiskAssessment {
  const activeCaseCount = recentFlags.length;
  let criticalCaseCount = 0;
  let highCaseCount = 0;
  let mediumCaseCount = 0;

  const diseaseCounts: Record<string, number> = {};

  for (const flag of recentFlags) {
    if (flag.risk_level === 'critical') criticalCaseCount++;
    else if (flag.risk_level === 'high') highCaseCount++;
    else if (flag.risk_level === 'medium') mediumCaseCount++;

    diseaseCounts[flag.predicted_disease] = (diseaseCounts[flag.predicted_disease] || 0) + 1;
  }

  // Find dominant disease
  let dominantDisease: string | undefined;
  let maxCount = 0;
  for (const [disease, count] of Object.entries(diseaseCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantDisease = disease;
    }
  }

  // Base score from case density
  // Critical = 30 pts each, High = 15 pts each, Medium = 8 pts each
  let baseScore = criticalCaseCount * 30 + highCaseCount * 15 + mediumCaseCount * 8;

  // Weather risk modifier
  let weatherBonus = 0;
  let weatherElevatedRisk = false;
  let weatherSummary = 'Standard climatic risk';

  if (weather && weather.status === 'available') {
    if (weather.isHighHumidity && weather.isRecentRain) {
      weatherBonus += 15;
      weatherElevatedRisk = true;
      weatherSummary = 'Elevated vector risk (High humidity + recent rainfall)';
    } else if (weather.isHighHumidity || weather.isRecentRain) {
      weatherBonus += 8;
      weatherElevatedRisk = true;
      weatherSummary = 'Moderate moisture risk for pathogen persistence';
    } else if (weather.temperature && weather.temperature > 38) {
      weatherBonus += 5;
      weatherSummary = 'Heat stress vulnerability';
    }
  } else {
    weatherSummary = 'Weather data unavailable (default model)';
  }

  let finalScore = Math.min(100, Math.max(0, baseScore + weatherBonus));

  // Determine categorical risk level
  let riskLevel: RiskLevel = 'low';
  if (criticalCaseCount > 0 || finalScore >= 65) {
    riskLevel = 'critical';
  } else if (highCaseCount >= 2 || finalScore >= 45) {
    riskLevel = 'high';
  } else if (activeCaseCount >= 1 || finalScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    district,
    riskLevel,
    riskScore: Math.round(finalScore),
    activeCaseCount,
    criticalCaseCount,
    weatherElevatedRisk,
    dominantDisease,
    weatherSummary,
    lastUpdated: new Date().toISOString(),
  };
}

