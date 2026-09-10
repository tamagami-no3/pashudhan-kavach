import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

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
    .select('*, owner:users!animals_owner_id_fkey(id, full_name, email, district)')
    .eq('id', id)
    .single();

  if (error || !animal) {
    return notFoundResponse('Animal not found');
  }

  // IDOR check: Farmer can only view health card of own animal
  if (user.profile.role === 'farmer' && (animal as any).owner_id !== user.authId) {
    return forbiddenResponse('You do not have permission to view this animal health card');
  }

  // Fetch all health records (vaccinations, treatments, checkups)
  const { data: healthRecords } = await (admin.from('health_records') as any)
    .select('*, performer:users!health_records_performed_by_fkey(full_name, role)')
    .eq('animal_id', id)
    .order('performed_at', { ascending: false });

  // Separate vaccinations from treatments
  const vaccinations = ((healthRecords as any[]) || []).filter((r) => r.record_type === 'vaccination');
  const treatments = ((healthRecords as any[]) || []).filter((r) => r.record_type !== 'vaccination');

  // Fetch symptom reports
  const { data: symptomReports } = await (admin.from('symptom_reports') as any)
    .select('*, outbreak_flags(*)')
    .eq('animal_id', id)
    .order('reported_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return successResponse({
    passport: {
      tag_uid: animal.tag_uid,
      species: animal.species,
      breed: animal.breed,
      sex: animal.sex,
      dob: animal.dob,
      health_status: animal.health_status,
      district: animal.district,
      village: animal.village,
      gps_coordinates: {
        lat: animal.gps_lat,
        lng: animal.gps_lng,
      },
      owner_name: (animal.owner as any)?.full_name || 'Registered Owner',
      owner_district: (animal.owner as any)?.district || animal.district,
      qr_code_url: animal.qr_code_url,
      verification_url: `${appUrl}/api/public/verify/${animal.tag_uid}`,
      issued_at: animal.created_at,
    },
    vaccination_history: vaccinations,
    treatment_history: treatments,
    symptom_history: symptomReports || [],
  });
}

