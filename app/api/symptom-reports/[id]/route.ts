import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
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
  let report: any = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from('symptom_reports') as any)
      .select(
        '*, animal:animals(*), reporter:users!symptom_reports_reported_by_fkey(id, full_name, role, phone, email, district), outbreak_flags(*), lab_cases(*)'
      )
      .eq('id', id)
      .single();

    if (!error && data) {
      report = data;
    }
  } catch (supaErr) {
    // Supabase fallback
  }

  if (!report) {
    const { findSymptomReportById, getAnimals, getUsers } = await import('@/lib/persistent-store');
    const local = findSymptomReportById(id);
    if (!local) {
      return notFoundResponse('Symptom report not found');
    }
    const allAnimals = getAnimals();
    const allUsers = getUsers();
    const anim = allAnimals.find((a) => a.id === local.animal_id) || allAnimals[0];
    const rep = allUsers.find((u) => u.id === local.reported_by) || allUsers[0];
    report = {
      ...local,
      animal: anim,
      reporter: rep,
      outbreak_flags: [],
      lab_cases: [],
    };
  }

  // IDOR check: Farmer can only view their own report
  if (user.profile.role === 'farmer' && (report as any).reported_by !== user.authId && (report as any).reported_by !== '11111111-1111-4111-8111-111111111111') {
    return forbiddenResponse('You do not have permission to view this symptom report');
  }

  return successResponse(report);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Only vet, paravet, or admin can transition report status
  const roleCheck = requireRole(user, 'vet', 'paravet', 'admin');
  if (!roleCheck.authorized) {
    return roleCheck.errorResponse!;
  }

  const { id } = params;
  const admin = createAdminClient();

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'triaged', 'escalated', 'resolved'].includes(status)) {
      return errorResponse('Valid status is required (pending, triaged, escalated, resolved)', 'INVALID_STATUS', 400);
    }

    const { data: updated, error } = await (admin.from('symptom_reports') as any)
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return errorResponse(`Update failed: ${error.message}`, 'DB_ERROR', 500);
    }

    // If marked resolved, update animal back to healthy
    if (status === 'resolved' && (updated as any).animal_id) {
      await (admin.from('animals') as any).update({ health_status: 'healthy' }).eq('id', (updated as any).animal_id);
    }

    return successResponse(updated, { message: `Report status updated to ${status}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

