import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Admin, Vet, Paravet only
  const authCheck = requireRole(user, 'admin', 'vet', 'paravet');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return errorResponse('Search query "q" must be at least 2 characters', 'QUERY_TOO_SHORT', 400);
  }

  try {
    const admin = createAdminClient();
    const queryPattern = `%${q}%`;

    // 1. Search animals by tag_uid or species
    const { data: animals } = await (admin.from('animals') as any)
      .select('id, tag_uid, species, breed, district, health_status')
      .or(`tag_uid.ilike.${queryPattern},species.ilike.${queryPattern},breed.ilike.${queryPattern}`)
      .limit(5);

    // 2. Search users by full_name or email
    const { data: users } = await (admin.from('users') as any)
      .select('id, full_name, email, role, district')
      .or(`full_name.ilike.${queryPattern},email.ilike.${queryPattern}`)
      .limit(5);

    // 3. Search districts in Maharashtra
    const matchedDistricts = MAHARASHTRA_DISTRICTS.filter(
      (d) =>
        d.name.toLowerCase().includes(q.toLowerCase()) ||
        (d.aliases && d.aliases.some((a) => a.toLowerCase().includes(q.toLowerCase())))
    ).slice(0, 5);

    // 4. Search symptom reports by ID if UUID format or partial
    let reports: any[] = [];
    if (q.length >= 4) {
      const { data: repData } = await (admin.from('symptom_reports') as any)
        .select('id, status, reported_at, animal:animals(tag_uid, species, district)')
        .limit(5);
      reports = ((repData as any[]) || []).filter((r: any) => r.id.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
    }

    return successResponse({
      query: q,
      results: {
        animals: animals || [],
        users: users || [],
        districts: matchedDistricts,
        symptom_reports: reports,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

