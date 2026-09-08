import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from './supabase/server';
import { unauthorizedResponse, forbiddenResponse } from './api-response';
import type { UserProfile, UserRole } from '@/types/database.types';

export interface AuthenticatedUser {
  authId: string;
  profile: UserProfile;
}

/**
 * Extracts Bearer token from request Authorization header or Cookie.
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to cookie if present
  const tokenCookie = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Validates the Supabase session token, fetches the user profile from `public.users`,
 * and returns the authenticated user or null.
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  try {
    const supabase = createServerClient(token);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Fetch user profile from public.users table using admin client to guarantee access
    const admin = createAdminClient();
    const { data, error: profileError } = await admin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    const profile = data as UserProfile | null;

    if (profileError || !profile || !profile.is_active) {
      return null;
    }

    return {
      authId: user.id,
      profile,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * RBAC Helper: checks if user has one of the allowed roles.
 * Returns null if allowed, or a 401/403 NextResponse if denied.
 */
export function requireRole(
  user: AuthenticatedUser | null,
  ...allowedRoles: UserRole[]
): { authorized: boolean; errorResponse?: NextResponse } {
  if (!user) {
    return {
      authorized: false,
      errorResponse: unauthorizedResponse('Authentication required'),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.profile.role)) {
    return {
      authorized: false,
      errorResponse: forbiddenResponse(
        `Forbidden: Role '${user.profile.role}' is not authorized for this resource`
      ),
    };
  }

  return { authorized: true };
}

