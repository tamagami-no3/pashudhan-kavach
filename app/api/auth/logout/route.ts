import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const response = successResponse({ logged_out: true }, { message: 'Logged out successfully' });
  response.cookies.delete('sb-access-token');
  response.cookies.delete('supabase-auth-token');
  return response;
}

