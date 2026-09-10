import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const since = searchParams.get('since');

  if (!since) {
    return errorResponse('Parameter "since" ISO timestamp is required', 'MISSING_SINCE', 400);
  }

  try {
    const admin = createAdminClient();

    // Query updated animals, advisories, and health records for the user
    let animalQuery = admin
      .from('animals')
      .select('*')
      .gte('updated_at', since);

    if (user.profile.role === 'farmer') {
      animalQuery = animalQuery.eq('owner_id', user.authId);
    }

    const { data: updatedAnimals } = await animalQuery;

    const { data: updatedAdvisories } = await admin
      .from('advisories')
      .select('*')
      .gte('updated_at', since);

    const { data: updatedReports } = await admin
      .from('symptom_reports')
      .select('*')
      .eq('reported_by', user.authId)
      .gte('updated_at', since);

    return successResponse({
      synced_at: new Date().toISOString(),
      since,
      changes: {
        animals: updatedAnimals || [],
        advisories: updatedAdvisories || [],
        symptom_reports: updatedReports || [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync pull failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

