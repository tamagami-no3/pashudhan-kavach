import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { userId } = params;

  // Authorization: Self only, unless Vet or Admin
  if (user.authId !== userId && !['vet', 'admin'].includes(user.profile.role)) {
    return forbiddenResponse('Cannot access another user context');
  }

  const admin = createAdminClient();

  const { data: targetUser, error } = await (admin.from('users') as any)
    .select('id, full_name, role, district, preferred_language')
    .eq('id', userId)
    .single();

  if (error || !targetUser) {
    return notFoundResponse('User not found');
  }

  // Fetch compact summary of user animals if farmer
  let animals: any[] = [];
  let openReports: any[] = [];
  let upcomingVaccines: any[] = [];

  if ((targetUser as any).role === 'farmer') {
    const { data: userAnimals } = await (admin.from('animals') as any)
      .select('id, tag_uid, species, health_status')
      .eq('owner_id', userId)
      .limit(10);

    animals = userAnimals || [];

    const { data: reports } = await (admin.from('symptom_reports') as any)
      .select('id, status, reported_at, animal:animals(tag_uid)')
      .eq('reported_by', userId)
      .in('status', ['pending', 'triaged', 'escalated'])
      .limit(5);

    openReports = ((reports as any[]) || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      animalTag: (r.animal as any)?.tag_uid,
      reportedAt: r.reported_at,
    }));

    const next14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: dueVaccs } = await (admin.from('health_records') as any)
      .select('description, next_due_at, animal:animals!inner(tag_uid, owner_id)')
      .eq('animal.owner_id', userId)
      .eq('record_type', 'vaccination')
      .lte('next_due_at', next14Days)
      .limit(5);

    upcomingVaccines = ((dueVaccs as any[]) || []).map((v: any) => ({
      animalTag: (v.animal as any)?.tag_uid,
      description: v.description,
      nextDueAt: v.next_due_at,
    }));
  }

  return successResponse({
    userId: targetUser.id,
    role: targetUser.role,
    district: targetUser.district,
    preferredLanguage: targetUser.preferred_language,
    animals,
    openReports,
    upcomingVaccinations: upcomingVaccines,
  });
}

