import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'admin', 'vet');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  try {
    const admin = createAdminClient();

    // Query all animals, flags, and health records grouped by district
    const [{ data: animals }, { data: flags }, { data: vaccinations }] = await Promise.all([
      (admin.from('animals') as any).select('id, district'),
      (admin.from('outbreak_flags') as any).select('id, district, risk_level, predicted_disease'),
      (admin.from('health_records') as any).select('id, animal:animals(district)').eq('record_type', 'vaccination'),
    ]);

    const districtStats: Record<
      string,
      {
        livestock_count: number;
        outbreak_count: number;
        critical_count: number;
        vaccination_count: number;
      }
    > = {};

    for (const dist of MAHARASHTRA_DISTRICTS) {
      districtStats[dist.name] = {
        livestock_count: 0,
        outbreak_count: 0,
        critical_count: 0,
        vaccination_count: 0,
      };
    }

    for (const a of animals || []) {
      if (districtStats[a.district]) districtStats[a.district].livestock_count++;
    }

    for (const f of flags || []) {
      if (districtStats[f.district]) {
        districtStats[f.district].outbreak_count++;
        if (f.risk_level === 'critical') districtStats[f.district].critical_count++;
      }
    }

    for (const v of vaccinations || []) {
      const dist = (v.animal as any)?.district;
      if (dist && districtStats[dist]) {
        districtStats[dist].vaccination_count++;
      }
    }

    const rankings = MAHARASHTRA_DISTRICTS.map((dist) => {
      const stats = districtStats[dist.name] || {
        livestock_count: 0,
        outbreak_count: 0,
        critical_count: 0,
        vaccination_count: 0,
      };

      const coveragePct =
        stats.livestock_count > 0
          ? Math.min(100, Math.round((stats.vaccination_count / stats.livestock_count) * 100))
          : 0;

      // Risk score: critical * 30 + outbreak * 10 - (coverage * 0.2)
      const rawRisk = stats.critical_count * 30 + stats.outbreak_count * 12;
      const riskScore = Math.min(100, Math.max(0, rawRisk));

      let riskTier = 'Low';
      if (stats.critical_count > 0 || riskScore >= 60) riskTier = 'Critical';
      else if (stats.outbreak_count >= 2 || riskScore >= 40) riskTier = 'High';
      else if (stats.outbreak_count >= 1 || riskScore >= 15) riskTier = 'Medium';

      return {
        district: dist.name,
        division: dist.division,
        registered_livestock: stats.livestock_count,
        active_outbreaks: stats.outbreak_count,
        critical_alerts: stats.critical_count,
        vaccination_coverage_pct: coveragePct,
        calculated_risk_score: riskScore,
        risk_tier: riskTier,
        mortality_rate_note: 'Mortality rate is not directly modeled as a standalone field; derived from sudden_death symptom frequencies.',
      };
    });

    // Sort by risk score descending
    rankings.sort((a, b) => b.calculated_risk_score - a.calculated_risk_score);

    return successResponse(rankings, {
      total_ranked_districts: rankings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ranking calculation failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

