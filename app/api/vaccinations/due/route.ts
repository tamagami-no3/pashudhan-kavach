import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();

  let query = admin
    .from('health_records')
    .select(
      '*, animal:animals!inner(id, tag_uid, species, breed, district, village, owner_id, owner:users!animals_owner_id_fkey(full_name, phone))'
    )
    .eq('record_type', 'vaccination')
    .not('next_due_at', 'is', null)
    .lte('next_due_at', next7Days)
    .gte('next_due_at', past30Days)
    .order('next_due_at', { ascending: true });

  if (user.profile.role === 'farmer') {
    query = query.eq('animal.owner_id', user.authId);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(`Failed to query due vaccinations: ${error.message}`, 'DB_ERROR', 500);
  }

  return successResponse(data || [], {
    count: data?.length || 0,
    window_days: 7,
    generated_at: new Date().toISOString(),
  });
}

