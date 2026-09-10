import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'admin');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const { searchParams } = request.nextUrl;
  const entity = searchParams.get('entity') || 'animals';

  const admin = createAdminClient();

  if (entity === 'outbreaks') {
    const { data: flags } = await (admin.from('outbreak_flags') as any)
      .select('id, district, predicted_disease, confidence_pct, severity_score, risk_level, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    const headers = 'ID,District,Predicted_Disease,Confidence_Pct,Severity_Score,Risk_Level,Created_At\n';
    const rows = ((flags as any[]) || [])
      .map(
        (f) =>
          `"${f.id}","${f.district}","${f.predicted_disease}",${f.confidence_pct},${f.severity_score},"${f.risk_level}","${f.created_at}"`
      )
      .join('\n');

    const csvContent = headers + rows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="outbreak_flags_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Default: Animals export
  const { data: animals } = await (admin.from('animals') as any)
    .select('id, tag_uid, species, breed, sex, dob, district, village, health_status, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  const headers = 'ID,Tag_UID,Species,Breed,Sex,DOB,District,Village,Health_Status,Registered_At\n';
  const rows = ((animals as any[]) || [])
    .map(
      (a) =>
        `"${a.id}","${a.tag_uid}","${a.species}","${a.breed}","${a.sex}","${a.dob || ''}","${a.district}","${a.village}","${a.health_status}","${a.created_at}"`
    )
    .join('\n');

  const csvContent = headers + rows;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="animals_registry_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

