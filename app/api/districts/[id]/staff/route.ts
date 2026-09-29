import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { findDistrict } from '@/lib/constants/districts';
import { findUserById, upsertDistrictStaffAssignment } from '@/lib/persistent-store';
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
    const { userId, role } = body;

    if (!userId || typeof userId !== 'string') {
      return validationErrorResponse('Valid userId is required');
    }

    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      return validationErrorResponse('Role is required (e.g., Field Veterinarian, Surveillance Officer, Nodal Officer)');
    }

    const assignedUser = findUserById(userId);
    if (!assignedUser) {
      return validationErrorResponse(`User with ID '${userId}' does not exist`);
    }

    // Upsert into persistent store
    const assignment = upsertDistrictStaffAssignment(district.name, userId, role.trim());

    // Attempt Supabase synchronization
    try {
      const admin = createAdminClient();
      await (admin.from('district_staff_assignments') as any).upsert(
        {
          district_id: district.name,
          user_id: userId,
          role: role.trim(),
          assigned_at: assignment.assigned_at,
        },
        { onConflict: 'district_id,user_id' }
      );
    } catch {
      // Supabase is optional; persistent store is authoritative
    }

    return successResponse(
      {
        ...assignment,
        user: {
          id: assignedUser.id,
          full_name: assignedUser.full_name,
          email: assignedUser.email,
          role: assignedUser.role,
        },
      },
      { message: `Staff member assigned to ${district.name} successfully` }
    );
  } catch (err: any) {
    console.error('Error assigning district staff:', err);
    return internalErrorResponse(err.message || 'Failed to assign staff');
  }
}

