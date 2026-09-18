import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { findDistrict } from '@/lib/constants/districts';
import { saveDistrictAdminAction } from '@/lib/persistent-store';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, notFoundResponse, internalErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'admin', 'vet');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const districtParam = decodeURIComponent(params.id);
  const district = findDistrict(districtParam);

  if (!district) {
    return notFoundResponse(`District '${districtParam}' not found`);
  }

  try {
    const body = await request.json();
    const { action_type, notes, override_level } = body;

    if (!action_type || !['intervention', 'risk_override'].includes(action_type)) {
      return validationErrorResponse("action_type must be either 'intervention' or 'risk_override'");
    }

    if (!notes || typeof notes !== 'string' || notes.trim().length < 3) {
      return validationErrorResponse('Detailed notes or justification are required (minimum 3 characters)');
    }

    const validLevels = ['low', 'medium', 'high', 'critical', null, undefined];
    if (action_type === 'risk_override' && !validLevels.includes(override_level)) {
      return validationErrorResponse("override_level must be 'low', 'medium', 'high', 'critical', or null");
    }

    const newAction = saveDistrictAdminAction({
      district_id: district.name,
      admin_id: user.profile.id,
      action_type,
      notes: notes.trim(),
      override_level: action_type === 'risk_override' ? override_level : null,
    });

    // Attempt Supabase synchronization
    try {
      const admin = createAdminClient();
      await (admin.from('district_admin_actions') as any).insert({
        id: newAction.id,
        district_id: district.name,
        admin_id: user.profile.id,
        action_type,
        notes: notes.trim(),
        override_level: action_type === 'risk_override' ? override_level : null,
        created_at: newAction.created_at,
      });

      // If risk override, update district table as well
      if (action_type === 'risk_override') {
        await (admin.from('districts') as any)
          .update({ risk_override_level: override_level })
          .eq('name', district.name);
      }
    } catch {
      // Supabase is optional; persistent store is authoritative
    }

    return successResponse(
      {
        ...newAction,
        admin: {
          id: user.profile.id,
          full_name: user.profile.full_name,
          email: user.profile.email,
        },
      },
      { message: `Action recorded for ${district.name} successfully` }
    );
  } catch (err: any) {
    console.error('Error recording district admin action:', err);
    return internalErrorResponse(err.message || 'Failed to record action');
  }
}

