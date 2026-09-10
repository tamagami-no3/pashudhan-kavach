import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateAdvisorySchema, parsePagination } from '@/lib/validation';
import { sendNotification } from '@/lib/services/notify';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const { isValid, params, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  const { searchParams } = request.nextUrl;
  const district = searchParams.get('district');
  const disease = searchParams.get('disease');
  const severity = searchParams.get('severity');

  const admin = createAdminClient();
  let query = admin
    .from('advisories')
    .select('*, creator:users!advisories_created_by_fkey(full_name, role)', { count: 'exact' });

  if (district) {
    query = query.eq('district', district);
  }
  if (disease) {
    query = query.ilike('disease', `%${disease}%`);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return errorResponse(`Failed to query advisories: ${error.message}`, 'DB_ERROR', 500);
  }

  return successResponse(data || [], {
    total: count || 0,
    limit: params.limit,
    offset: params.offset,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Only Vet and Admin can publish official veterinary advisories
  const authCheck = requireRole(user, 'vet', 'admin');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await request.json();
    const parsed = CreateAdvisorySchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Invalid advisory data', parsed.error.format());
    }

    const { title, body_en, body_hi, body_mr, district, disease, severity } = parsed.data;
    const admin = createAdminClient();

    const { data: advisory, error: insertErr } = await (admin.from('advisories') as any)
      .insert({
        title,
        body_en,
        body_hi,
        body_mr,
        district,
        disease,
        severity,
        created_by: user.authId,
      })
      .select('*')
      .single();

    if (insertErr || !advisory) {
      return errorResponse(`Failed to create advisory: ${insertErr?.message}`, 'DB_ERROR', 500);
    }

    // Fan-out notifications to users in this district
    const { data: districtUsers } = await (admin.from('users') as any)
      .select('id, preferred_language, email, phone')
      .eq('district', district)
      .limit(100);

    for (const target of (districtUsers as any[]) || []) {
      await sendNotification({
        userId: target.id,
        channel: 'inapp',
        language: target.preferred_language,
        template: 'advisory_broadcast',
        params: {
          district,
          advisoryTitle: title,
        },
      });
    }

    return successResponse(
      advisory,
      {
        message: 'Advisory published and distributed to district users',
        notified_users_count: districtUsers?.length || 0,
      },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to publish advisory';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

