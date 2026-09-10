import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * Haversine formula to calculate distance between two coordinates in kilometers.
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const radiusStr = searchParams.get('radius_km');

  if (!latStr || !lngStr) {
    return errorResponse('Parameters "lat" and "lng" are required', 'MISSING_PARAMS', 400);
  }

  const centerLat = parseFloat(latStr);
  const centerLng = parseFloat(lngStr);
  const radiusKm = Math.min(150, Math.max(1, parseFloat(radiusStr || '25')));

  if (isNaN(centerLat) || isNaN(centerLng)) {
    return errorResponse('Invalid coordinates provided', 'INVALID_COORDINATES', 400);
  }

  try {
    const admin = createAdminClient();

    // Query recent symptom reports (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: reports, error } = await (admin.from('symptom_reports') as any)
      .select('*, animal:animals(id, tag_uid, species, breed, district, village), outbreak_flags(*)')
      .gte('reported_at', thirtyDaysAgo);

    if (error) {
      return errorResponse(`Failed to query nearby reports: ${error.message}`, 'DB_ERROR', 500);
    }

    const nearbyResults = ((reports as any[]) || [])
      .map((report: any) => {
        const distance = haversineDistanceKm(centerLat, centerLng, report.gps_lat, report.gps_lng);
        return {
          ...report,
          distance_km: Math.round(distance * 10) / 10,
        };
      })
      .filter((report) => report.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    return successResponse(nearbyResults, {
      center: { lat: centerLat, lng: centerLng },
      radius_km: radiusKm,
      total_found: nearbyResults.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Distance calculation failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

