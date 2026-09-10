import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = params;
  const admin = createAdminClient();

  const { data: animal, error } = await (admin.from('animals') as any)
    .select('*, owner:users!animals_owner_id_fkey(id, full_name, email, phone, district)')
    .eq('id', id)
    .single();

  if (error || !animal) {
    return notFoundResponse('Animal not found');
  }

  // IDOR check: Farmer can only access their own animal
  if (user.profile.role === 'farmer' && (animal as any).owner_id !== user.authId) {
    return forbiddenResponse('You do not have permission to view this animal');
  }

  // Also fetch recent health records and symptom reports
  const { data: healthRecords } = await (admin.from('health_records') as any)
    .select('*, performer:users!health_records_performed_by_fkey(full_name, role)')
    .eq('animal_id', id)
    .order('performed_at', { ascending: false })
    .limit(10);

  const { data: symptomReports } = await (admin.from('symptom_reports') as any)
    .select('*, outbreak_flags(*)')
    .eq('animal_id', id)
    .order('reported_at', { ascending: false })
    .limit(5);

  return successResponse({
    animal,
    health_records: healthRecords || [],
    symptom_reports: symptomReports || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = params;
  const admin = createAdminClient();

  const { data: animal, error: fetchErr } = await (admin.from('animals') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !animal) {
    return notFoundResponse('Animal not found');
  }

  // Only owner, vet, or admin can update animal
  const isOwner = (animal as any).owner_id === user.authId;
  const isStaff = ['vet', 'admin'].includes(user.profile.role);

  if (!isOwner && !isStaff) {
    return forbiddenResponse('You do not have permission to update this animal');
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.health_status) updateData.health_status = body.health_status;
    if (body.breed) updateData.breed = body.breed;
    if (body.village) updateData.village = body.village;
    if (body.district) updateData.district = body.district;

    const { data: updated, error: updateErr } = await (admin.from('animals') as any)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      return errorResponse(`Update failed: ${updateErr.message}`, 'DB_ERROR', 500);
    }

    return successResponse(updated, { message: 'Animal updated successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

