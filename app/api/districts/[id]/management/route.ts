import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { findDistrict } from '@/lib/constants/districts';
import { fetchDistrictWeather } from '@/lib/services/weatherService';
import { calculateDistrictRisk } from '@/lib/services/riskEngine';
import {
  getOutbreakFlags,
  getAnimals,
  getHealthRecordsDue7Days,
  getDistrictStaffAssignments,
  getDistrictAdminActions,
  getDistrictLatestOverride,
  getUsers,
  findUserById,
} from '@/lib/persistent-store';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, notFoundResponse, internalErrorResponse, unauthorizedResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
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
    return notFoundResponse(`District '${districtParam}' not recognized among 36 Maharashtra districts`);
  }

  try {
    // 1. Fetch district outbreak flags (past 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    let flags: any[] = [];
    try {
      const admin = createAdminClient();
      const { data, error } = await (admin.from('outbreak_flags') as any)
        .select('*')
        .eq('district', district.name)
        .gte('created_at', fourteenDaysAgo);
      if (!error && data && data.length > 0) {
        flags = data;
      }
    } catch {
      // ignore, fall back to persistent store
    }

    if (flags.length === 0) {
      const storeFlags = getOutbreakFlags();
      flags = storeFlags.filter(
        (f) =>
          f.district.toLowerCase() === district.name.toLowerCase() &&
          new Date(f.created_at).getTime() >= Date.now() - 14 * 24 * 60 * 60 * 1000
      );
    }

    // 2. Fetch live or cached weather for district centroid
    const weather = await fetchDistrictWeather(district.lat, district.lng);

    // 3. Compute Risk Assessment
    const riskAssessment = calculateDistrictRisk(district.name, flags, weather);

    // 4. Fetch Staff assignments & enrich with user profiles
    const rawAssignments = getDistrictStaffAssignments(district.name);
    const allUsers = getUsers();
    const enrichedStaff = rawAssignments.map((a) => {
      const u = allUsers.find((userItem) => userItem.id === a.user_id);
      return {
        id: a.id,
        district_id: a.district_id,
        user_id: a.user_id,
        role: a.role,
        assigned_at: a.assigned_at,
        user: u
          ? {
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              role: u.role,
              phone: u.phone,
            }
          : null,
      };
    });

    // 5. Fetch Admin actions & enrich
    const rawActions = getDistrictAdminActions(district.name);
    const enrichedActions = rawActions.map((act) => {
      const adminUser = allUsers.find((u) => u.id === act.admin_id);
      return {
        id: act.id,
        district_id: act.district_id,
        admin_id: act.admin_id,
        action_type: act.action_type,
        notes: act.notes,
        override_level: act.override_level || null,
        created_at: act.created_at,
        admin: adminUser
          ? {
              id: adminUser.id,
              full_name: adminUser.full_name,
              email: adminUser.email,
            }
          : null,
      };
    });

    // 6. Available users that can be assigned (Veterinarians and Lab Technicians)
    const availableUsers = allUsers
      .filter((u) => u.role === 'vet' || u.role === 'lab' || u.role === 'admin')
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        district: u.district,
      }));

    return successResponse({
      district,
      riskAssessment,
      staffAssignments: enrichedStaff,
      adminActions: enrichedActions,
      availableUsers,
    });
  } catch (err: any) {
    console.error('Error fetching district management details:', err);
    return internalErrorResponse(err.message || 'Failed to fetch district management details');
  }
}

