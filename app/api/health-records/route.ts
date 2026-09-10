import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateHealthRecordSchema, parsePagination } from '@/lib/validation';
import { sendNotification } from '@/lib/services/notify';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { isValid, params, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  const { searchParams } = request.nextUrl;
  const animalId = searchParams.get('animal_id');
  const recordType = searchParams.get('record_type');

  const admin = createAdminClient();
  let query = (admin.from('health_records') as any)
    .select(
      '*, animal:animals(id, tag_uid, species, breed, owner_id), performer:users!health_records_performed_by_fkey(id, full_name, role)',
      { count: 'exact' }
    );

  if (animalId) {
    query = query.eq('animal_id', animalId);
  }
  if (recordType) {
    query = query.eq('record_type', recordType);
  }

  query = query
    .order('performed_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return errorResponse(`Failed to fetch health records: ${error.message}`, 'DB_ERROR', 500);
  }

  // If user is farmer, filter only their own animal records
  let filteredData = data || [];
  if (user.profile.role === 'farmer') {
    filteredData = filteredData.filter((r: any) => r.animal?.owner_id === user.authId);
  }

  return successResponse(filteredData, {
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

  // Strict role separation: Vet, Paravet, Admin ONLY. (Lab is strictly forbidden)
  const authCheck = requireRole(user, 'vet', 'paravet', 'admin');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await request.json();
    const parsed = CreateHealthRecordSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Invalid health record payload', parsed.error.format());
    }

    const { animal_id, record_type, description, performed_at, next_due_at } = parsed.data;
    const admin = createAdminClient();

    // Verify animal exists
    const { data: animal, error: animalErr } = await (admin.from('animals') as any)
      .select('id, tag_uid, owner_id')
      .eq('id', animal_id)
      .single();

    if (animalErr || !animal) {
      return notFoundResponse('Animal not found');
    }

    const { data: record, error: insertErr } = await (admin.from('health_records') as any)
      .insert({
        animal_id,
        record_type,
        description,
        performed_by: user.authId,
        performed_at: performed_at || new Date().toISOString(),
        next_due_at: next_due_at || null,
      })
      .select('*')
      .single();

    if (insertErr || !record) {
      return errorResponse(`Failed to create health record: ${insertErr?.message}`, 'DB_ERROR', 500);
    }

    // If next_due_at is scheduled (for vaccination reminder), notify owner
    if (record_type === 'vaccination' && next_due_at && (animal as any).owner_id) {
      const { data: owner } = await (admin.from('users') as any).select('preferred_language').eq('id', (animal as any).owner_id).single();
      const formattedDate = new Date(next_due_at).toLocaleDateString('en-IN');

      await sendNotification({
        userId: animal.owner_id,
        channel: 'inapp',
        language: owner?.preferred_language || 'en',
        template: 'vaccination_reminder',
        params: {
          animalTag: animal.tag_uid,
          vaccineName: description,
          dueDate: formattedDate,
        },
      });
    }

    return successResponse(record, { message: 'Health record registered successfully' }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record health event';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

