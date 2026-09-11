import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateSymptomReportSchema, parsePagination } from '@/lib/validation';
import { runDiseaseTriage } from '@/lib/services/triageEngine';
import { sendNotification } from '@/lib/services/notify';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import {
  getSymptomReports,
  saveSymptomReport,
  getAnimals,
  getUsers,
} from '@/lib/persistent-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { isValid, params, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  let reports = getSymptomReports();

  // Try Supabase first
  try {
    const admin = createAdminClient();
    let query = admin
      .from('symptom_reports')
      .select('*, animal:animals(id, tag_uid, species, breed, district, village), reporter:users!symptom_reports_reported_by_fkey(id, full_name, role), outbreak_flags(*), lab_cases(*)');

    if (user.profile.role === 'farmer') {
      query = query.eq('reported_by', user.authId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return successResponse(data, { total: data.length, limit: params.limit, offset: params.offset });
    }
  } catch (supaErr) {
    // Supabase fallback
  }

  const allAnimals = getAnimals();
  const allUsers = getUsers();

  // Scoped mock filtering
  if (user.profile.role === 'farmer') {
    reports = reports.filter((r) => r.reported_by === user.authId || r.reported_by === '11111111-1111-4111-8111-111111111111');
  }

  const enriched = reports.map((r) => {
    const animalObj = allAnimals.find((a) => a.id === r.animal_id) || allAnimals[0];
    const reporterObj = allUsers.find((u) => u.id === r.reported_by) || allUsers[0];

    return {
      ...r,
      animal: animalObj,
      reporter: reporterObj,
    };
  });

  return successResponse(enriched, {
    total: enriched.length,
    limit: params.limit,
    offset: params.offset,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Locked RBAC spec: symptom report submission is farmer/paravet ONLY.
  const authCheck = requireRole(user, 'farmer', 'paravet');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const rate = checkRateLimit(`symptom-report:${user.authId}`, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rate.allowed) {
    return errorResponse(`Too many reports. Please wait ${rate.retryAfterSeconds}s`, 'RATE_LIMITED', 429);
  }

  try {
    const body = await request.json();
    const parsed = CreateSymptomReportSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Invalid symptom report data', parsed.error.format());
    }

    const { animal_id, symptoms, media_urls, gps_lat, gps_lng } = parsed.data;

    // 1. Run automated disease triage
    const triageResult = runDiseaseTriage(symptoms);
    const initialReportStatus = triageResult.riskLevel === 'critical' ? 'escalated' : 'triaged';

    // 2. Insert symptom report in persistent store
    const result = saveSymptomReport({
      animal_id,
      reported_by: user.authId,
      symptoms,
      media_urls: media_urls || [],
      gps_lat,
      gps_lng,
      status: initialReportStatus as any,
    });

    const allAnimals = getAnimals();
    const animal = allAnimals.find((a) => a.id === animal_id) || allAnimals[0];

    // 3. Dispatch in-app notification
    await sendNotification({
      userId: user.authId,
      channel: 'inapp',
      language: user.profile.preferred_language,
      template: 'outbreak_alert',
      params: {
        disease: triageResult.predictedDisease,
        district: animal.district,
        animalTag: animal.tag_uid,
      },
    });

    return successResponse(
      {
        report: result.report,
        triage: triageResult,
        outbreak_flag: result.outbreak_flag,
        lab_case: result.lab_case,
        community_post: result.community_post,
      },
      { message: 'Symptom report submitted and triaged successfully' },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Symptom report submission failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
