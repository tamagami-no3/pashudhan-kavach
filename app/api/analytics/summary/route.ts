import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

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

    // Parallel count queries
    const [
      { count: totalUsers },
      { count: totalFarmers },
      { count: totalAnimals },
      { count: totalReports },
      { count: activeFlags },
      { count: totalLabCases },
      { count: completedLabCases },
      { count: totalVaccinations },
    ] = await Promise.all([
      (admin.from('users') as any).select('*', { count: 'exact', head: true }),
      (admin.from('users') as any).select('*', { count: 'exact', head: true }).eq('role', 'farmer'),
      (admin.from('animals') as any).select('*', { count: 'exact', head: true }),
      (admin.from('symptom_reports') as any).select('*', { count: 'exact', head: true }),
      (admin.from('outbreak_flags') as any).select('*', { count: 'exact', head: true }),
      (admin.from('lab_cases') as any).select('*', { count: 'exact', head: true }),
      (admin.from('lab_cases') as any).select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      (admin.from('health_records') as any).select('*', { count: 'exact', head: true }).eq('record_type', 'vaccination'),
    ]);

    // Active cases by disease breakdown
    const { data: outbreakData } = await (admin.from('outbreak_flags') as any)
      .select('predicted_disease, risk_level');

    const diseaseDistribution: Record<string, number> = {};
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const flag of (outbreakData as any[]) || []) {
      diseaseDistribution[flag.predicted_disease] = (diseaseDistribution[flag.predicted_disease] || 0) + 1;
      if (flag.risk_level in riskDistribution) {
        riskDistribution[flag.risk_level as keyof typeof riskDistribution]++;
      }
    }

    return successResponse({
      summary: {
        total_users: totalUsers || 0,
        total_farmers: totalFarmers || 0,
        total_registered_livestock: totalAnimals || 0,
        total_symptom_reports: totalReports || 0,
        active_outbreak_flags: activeFlags || 0,
        total_lab_cases: totalLabCases || 0,
        completed_lab_cases: completedLabCases || 0,
        total_vaccination_records: totalVaccinations || 0,
      },
      disease_distribution: diseaseDistribution,
      risk_distribution: riskDistribution,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate analytics summary';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

