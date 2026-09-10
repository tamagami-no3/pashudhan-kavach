import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse('Not authenticated');
  }

  // For demo mode, skip Supabase farmer table lookup
  let farmerData = null;

  if (user.profile.role === 'farmer') {
    try {
      const { createAdminClient } = await import('@/lib/supabase/server');
      const admin = createAdminClient();
      const { data } = await admin.from('farmers').select('*').eq('user_id', user.authId).single();
      farmerData = data;
    } catch {
      // Supabase unavailable, that's fine for demo
    }
  }

  return successResponse({
    user: user.profile,
    farmer: farmerData,
  });
}
