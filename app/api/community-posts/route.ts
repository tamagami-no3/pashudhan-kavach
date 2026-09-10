import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { parsePagination } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse } from '@/lib/api-response';
import { MOCK_COMMUNITY_POSTS } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { isValid, params, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  const { searchParams } = request.nextUrl;
  const district = searchParams.get('district');

  let posts = [...MOCK_COMMUNITY_POSTS];

  try {
    const admin = createAdminClient();
    let query = admin.from('community_posts').select('id, district, summary, summary_en, summary_hi, summary_mr, created_at');
    if (district) query = query.eq('district', district);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return successResponse(data, { total: data.length, limit: params.limit, offset: params.offset });
    }
  } catch (supaErr) {
    console.warn('Supabase community posts fallback to mock store');
  }

  if (district) {
    posts = posts.filter((p) => p.district.toLowerCase() === district.toLowerCase());
  }

  return successResponse(posts, {
    total: posts.length,
    limit: params.limit,
    offset: params.offset,
  });
}
