import { NextRequest, NextResponse } from 'next/server';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';
import { calculateDistrictRisk } from '@/lib/services/riskEngine';
import { getOutbreakFlags, saveCommunityPost } from '@/lib/persistent-store';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'pashudhan_cron_secret_2026';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');

  const isAuthorized =
    authHeader === `Bearer ${CRON_SECRET}` || secretParam === CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    const allFlags = getOutbreakFlags();
    const generatedAlerts: any[] = [];

    // Evaluate risk across all 36 districts
    for (const dist of MAHARASHTRA_DISTRICTS) {
      const distFlags = allFlags.filter(
        (f) => f.district.toLowerCase() === dist.name.toLowerCase()
      );

      const assessment = calculateDistrictRisk(dist.name, distFlags);

      // Trigger alerts for High or Critical districts
      if (assessment.riskLevel === 'critical' || assessment.riskLevel === 'high') {
        const disease = assessment.dominantDisease || 'लंपी / लाळ्या-खुरकूत';
        const isUrgent = assessment.riskLevel === 'critical';

        const advisory = {
          district: dist.name,
          title: `🚨 ${dist.name} जिल्हा: ${disease} संसर्ग पूर्वसूचना`,
          summary: `${dist.name} जिल्ह्यात प्रादुर्भाव निर्देशांक वाढला आहे (${assessment.riskScore}/100, ${assessment.percentileRank}th percentile). पशुपालकांनी तातडीने जनावरांचे विलगीकरण करावे व जनावरांची बाजारातील ने-आण थांबवावी. आपत्कालीन मदत: 1962`,
          severity: isUrgent ? 'urgent' : 'caution',
          disease,
          risk_score: assessment.riskScore,
          created_at: new Date().toISOString(),
        };

        // 1. Persist to local community store
        saveCommunityPost({
          district: dist.name,
          summary: advisory.summary,
          source_symptom_report_id: undefined,
        });

        // 2. Attempt Supabase advisories table insert
        try {
          const admin = createAdminClient();
          await (admin.from('advisories') as any).insert({
            title: advisory.title,
            message: advisory.summary,
            district: dist.name,
            disease,
            severity: advisory.severity,
            created_by: '44444444-4444-4444-8444-444444444444',
            created_at: advisory.created_at,
          });
        } catch {
          // ignore
        }

        generatedAlerts.push(advisory);
      }
    }

    return NextResponse.json({
      success: true,
      evaluated_districts: MAHARASHTRA_DISTRICTS.length,
      alerts_count: generatedAlerts.length,
      alerts: generatedAlerts,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Village alert cron worker error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
