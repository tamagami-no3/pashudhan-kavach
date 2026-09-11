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
import { getLabCases, updateLabCase, getSymptomReports, getAnimals, getUsers } from '@/lib/persistent-store';

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

    return successResponse(updated, { message: `Lab case status updated` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
