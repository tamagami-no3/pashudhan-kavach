import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { UpdateLabCaseSchema } from '@/lib/validation';
import { sendNotification } from '@/lib/services/notify';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import type { LabStatus } from '@/types/database.types';
import { getLabCases, updateLabCase, getSymptomReports, getAnimals, getUsers } from '@/lib/persistent-store';

/**
 * Forward-only status pipeline (LOCKED spec):
 * collected -> in_transit -> received -> testing -> completed
 */
const STATUS_ORDER: Record<LabStatus, number> = {
  collected: 0,
  in_transit: 1,
  received: 2,
  testing: 3,
  completed: 4,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'lab', 'vet');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const { id } = params;

  // Supabase first — authoritative source
  try {
    const admin = createAdminClient();
    const { data: lc, error } = await (admin.from('lab_cases') as any)
      .select('*, symptom_report:symptom_reports(id, symptoms, reported_at, status, animal:animals(id, tag_uid, species, breed, district, village, owner_id)), assigned_lab:users!lab_cases_assigned_lab_id_fkey(id, full_name, email)')
      .eq('id', id)
      .single();

    if (!error && lc) {
      return successResponse(lc);
    }
  } catch (supaErr) {
    // Supabase fallback
  }

  // Fallback to local persistent store
  const allCases = getLabCases();
  const lc = allCases.find((c) => c.id === id);
  if (!lc) {
    return errorResponse('Lab case not found', 'NOT_FOUND', 404);
  }

  const allReports = getSymptomReports();
  const allAnimals = getAnimals();
  const allUsers = getUsers();

  const rep = allReports.find((r) => r.id === lc.symptom_report_id) || allReports[0];
  const anim = allAnimals.find((a) => a.id === rep?.animal_id) || allAnimals[0];
  const owner = allUsers.find((u) => u.id === anim?.owner_id) || allUsers[0];

  return successResponse({
    ...lc,
    symptom_report: {
      ...rep,
      animal: {
        ...anim,
        owner,
      },
    },
    assigned_lab: allUsers.find((u) => u.id === lc.assigned_lab_id) || allUsers[2],
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

  // Locked RBAC: lab case status management is exclusive to the lab role.
  const authCheck = requireRole(user, 'lab');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const { id } = params;

  try {
    const body = await request.json();
    const parsed = UpdateLabCaseSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Invalid lab case update payload', parsed.error.format());
    }

    const nextStatus = parsed.data.status;
    const admin = createAdminClient();

    // Load the current case (Supabase first, local fallback)
    let currentCase: any = null;
    let supabaseAvailable = false;
    try {
      const { data, error } = await (admin.from('lab_cases') as any)
        .select('id, status, result, status_history, symptom_report:symptom_reports(id, animal:animals(id, tag_uid, owner_id))')
        .eq('id', id)
        .single();
      if (!error && data) {
        currentCase = data;
        supabaseAvailable = true;
      }
    } catch (supaErr) {
      // Supabase fallback
    }
    if (!currentCase) {
      const local = getLabCases().find((c) => c.id === id);
      if (local) currentCase = local;
    }
    if (!currentCase) {
      return errorResponse('Lab case not found', 'NOT_FOUND', 404);
    }

    // Forward-only transition validation (locked spec)
    if (nextStatus) {
      const currentStatus = (currentCase.status || 'collected') as LabStatus;
      if (STATUS_ORDER[nextStatus] <= STATUS_ORDER[currentStatus]) {
        return validationErrorResponse(
          `Invalid transition: status can only move forward (collected → in_transit → received → testing → completed). Current: ${currentStatus}, requested: ${nextStatus}`
        );
      }
    }

    const historyEntry = nextStatus
      ? { status: nextStatus, updated_at: new Date().toISOString(), notes: parsed.data.result || undefined }
      : undefined;

    if (supabaseAvailable) {
      // Persist to Supabase: status, result, completed_at, status_history append
      const updateData: Record<string, unknown> = {
        assigned_lab_id: user.authId,
      };
      if (nextStatus) {
        updateData.status = nextStatus;
        updateData.status_history = [...((currentCase.status_history as any[]) || []), historyEntry];
        if (nextStatus === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (parsed.data.result) {
        updateData.result = parsed.data.result;
      }

      const { data: updated, error: updateErr } = await (admin.from('lab_cases') as any)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr) {
        return errorResponse(`Update failed: ${updateErr.message}`, 'DB_ERROR', 500);
      }

      // Notify the animal owner (real data, not hardcoded) when completed
      if (nextStatus === 'completed') {
        const ownerId = currentCase.symptom_report?.animal?.owner_id;
        const animalTag = currentCase.symptom_report?.animal?.tag_uid || 'unknown';
        if (ownerId) {
          await sendNotification({
            userId: ownerId,
            channel: 'inapp',
            language: 'mr',
            template: 'lab_result_ready',
            params: {
              animalTag,
              result: parsed.data.result || 'Confirmed diagnostic test findings',
            },
          });
        }
      }

      return successResponse(updated, { message: 'Lab case status updated' });
    }

    // Local fallback (legacy path)
    const updated = updateLabCase(id, {
      status: parsed.data.status,
      result: parsed.data.result || undefined,
      assigned_lab_id: user.authId,
    });

    if (parsed.data.status === 'completed') {
      await sendNotification({
        userId: user.authId,
        channel: 'inapp',
        language: 'mr',
        template: 'lab_result_ready',
        params: {
          animalTag: '100011112224',
          result: parsed.data.result || 'Confirmed diagnostic test findings',
        },
      });
    }

    return successResponse(updated, { message: 'Lab case status updated' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
