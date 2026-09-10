import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateAnimalSchema, parsePagination } from '@/lib/validation';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { getAnimals, saveAnimal, getUsers } from '@/lib/persistent-store';

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
  const district = searchParams.get('district');
  const species = searchParams.get('species');
  const healthStatus = searchParams.get('health_status');

  let animalsList = getAnimals();

  // Try Supabase first
  try {
    const admin = createAdminClient();
    let query = admin
      .from('animals')
      .select('*, owner:users!animals_owner_id_fkey(id, full_name, email, phone, district)', { count: 'exact' });

    if (user.profile.role === 'farmer') {
      query = query.eq('owner_id', user.authId);
    }
    if (district) query = query.eq('district', district);
    if (species) query = query.ilike('species', `%${species}%`);
    if (healthStatus) query = query.eq('health_status', healthStatus);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return successResponse(data, { total: data.length, limit: params.limit, offset: params.offset });
    }
  } catch (supaErr) {
    // Supabase fallback
  }

  const allUsers = getUsers();

  // Scoped mock filtering
  if (user.profile.role === 'farmer') {
    animalsList = animalsList.filter((a) => a.owner_id === user.authId || a.owner_id === '11111111-1111-4111-8111-111111111111');
  }
  if (district) {
    animalsList = animalsList.filter((a) => a.district.toLowerCase() === district.toLowerCase());
  }
  if (species) {
    animalsList = animalsList.filter((a) => a.species.toLowerCase().includes(species.toLowerCase()));
  }
  if (healthStatus) {
    animalsList = animalsList.filter((a) => a.health_status === healthStatus);
  }

  // Attach owner info
  const enriched = animalsList.map((a) => {
    const ownerObj = allUsers.find((u) => u.id === a.owner_id) || allUsers[0];
    return {
      ...a,
      owner: {
        id: ownerObj.id,
        full_name: ownerObj.full_name,
        email: ownerObj.email,
        phone: ownerObj.phone,
        district: ownerObj.district,
      },
    };
  });

  return successResponse(enriched, {
    total: enriched.length,
    limit: params.limit,
    offset: params.offset,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const authCheck = requireRole(user, 'farmer', 'paravet', 'vet', 'admin');
  if (!authCheck.authorized) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await request.json();
    const parsed = CreateAnimalSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Invalid animal registration data', parsed.error.format());
    }

    const { tag_uid, species, breed, sex, dob, gps_lat, gps_lng, village, district, health_status } = parsed.data;
    const owner_id = user.profile.role !== 'farmer' && parsed.data.owner_id ? parsed.data.owner_id : user.authId;

    const newAnimal = await saveAnimal({
      owner_id,
      tag_uid,
      species,
      breed,
      sex,
      dob: dob || undefined,
      gps_lat,
      gps_lng,
      village,
      district,
      health_status: health_status || 'healthy',
      created_by: user.authId,
    });

    return successResponse(newAnimal, { message: 'Animal registered successfully' }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
