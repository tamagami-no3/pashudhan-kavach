import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { parsePagination } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getLabCases, getSymptomReports, getAnimals, getUsers } from '@/lib/persistent-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'lab', 'vet', 'admin');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  const { isValid, params, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const district = searchParams.get('district');
  const sampleId = searchParams.get('sample_id'); // QR scan check-in lookup

  let cases = getLabCases(status || undefined);

  try {
    const admin = createAdminClient();
    let query = admin
      .from('lab_cases')
      .select('*, symptom_report:symptom_reports(id, symptoms, reported_at, animal:animals(id, tag_uid, species, breed, district, village, owner_id)), assigned_lab:users!lab_cases_assigned_lab_id_fkey(id, full_name, email)');

    if (status) query = query.eq('status', status);
    if (sampleId) query = query.eq('sample_id', sampleId);
    const { data, error } = await query;
    if (!error && data) {
      let rows = data as any[];
      // District filter (nested relation) — filter in JS for alias safety
      if (district) {
        rows = rows.filter((c) => c.symptom_report?.animal?.district === district);
      }
      // Supabase is authoritative — return its result even when empty
      return successResponse(rows, { total: rows.length, limit: params.limit, offset: params.offset });
    }
  } catch (supaErr) {
    // Supabase fallback
  }

  const allReports = getSymptomReports();
  const allAnimals = getAnimals();
  const allUsers = getUsers();

  const enriched = cases.map((c) => {
    const rep = allReports.find((r) => r.id === c.symptom_report_id) || allReports[0];
    const anim = allAnimals.find((a) => a.id === rep?.animal_id) || allAnimals[0];
    const labTech = allUsers.find((u) => u.id === c.assigned_lab_id) || allUsers[2];

    return {
      ...c,
      symptom_report: {
        id: rep?.id,
        symptoms: rep?.symptoms,
        reported_at: rep?.reported_at,
        animal: anim,
      },
      assigned_lab: labTech,
    };
  });

  return successResponse(enriched, {
    total: enriched.length,
    limit: params.limit,
    offset: params.offset,
  });
}
