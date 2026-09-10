import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from './supabase/server';
import { unauthorizedResponse, forbiddenResponse } from './api-response';
import type { UserProfile, UserRole } from '@/types/database.types';
import { findUserById } from './persistent-store';

export interface AuthenticatedUser {
  authId: string;
  profile: UserProfile;
}

// In-memory demo session store: maps demo-token → user id
const DEMO_SESSIONS = new Map<string, string>();

/**
 * Register a demo session (called from login route).
 */
export function registerDemoSession(token: string, userId: string) {
  DEMO_SESSIONS.set(token, userId);
}

// Hardcoded demo user profiles (must match login route DEMO_PROFILES)
const DEMO_USERS: Record<string, UserProfile> = {
  '11111111-1111-4111-8111-111111111111': {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'farmer.pune@pashudhan.gov.in',
    full_name: 'Ramesh Balasaheb Patil',
    role: 'farmer',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822099991',
    is_active: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  '22222222-2222-4222-8222-222222222222': {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'vet.nashik@pashudhan.gov.in',
    full_name: 'Dr. Vijay Shinde',
    role: 'vet',
    district: 'Nashik',
    preferred_language: 'en',
    phone: '9822033333',
    is_active: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  '33333333-3333-4333-8333-333333333333': {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'lab.nagpur@pashudhan.gov.in',
    full_name: 'Dr. Meera Joshi',
    role: 'lab',
    district: 'Nagpur',
    preferred_language: 'en',
    phone: '9822077777',
    is_active: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  '44444444-4444-4444-8444-444444444444': {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'admin@pashudhan.gov.in',
    full_name: 'Dr. Anand Deshmukh (State Admin)',
    role: 'admin',
    district: 'Pune',
    preferred_language: 'en',
    phone: '9822011111',
    is_active: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

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
 * Validates the Supabase session token OR demo token, fetches the user profile,
 * and returns the authenticated user or null.
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  // ---- DEMO TOKEN FAST PATH ---- //
  if (token.startsWith('demo-token-')) {
    // Look up the user id from the in-memory demo sessions
    const userId = DEMO_SESSIONS.get(token);
    if (userId) {
      // Check hardcoded demo users first
      const demoProfile = DEMO_USERS[userId];
      if (demoProfile) {
        return { authId: userId, profile: demoProfile };
      }
      // Check persistent store (for newly registered users)
      const storeUser = findUserById(userId);
      if (storeUser && storeUser.is_active) {
        return {
          authId: storeUser.id,
          profile: {
            id: storeUser.id,
            email: storeUser.email,
            full_name: storeUser.full_name,
            role: storeUser.role as UserRole,
            district: storeUser.district,
            preferred_language: storeUser.preferred_language as any,
            phone: storeUser.phone || null,
            is_active: storeUser.is_active,
            is_verified: storeUser.is_verified,
            created_at: storeUser.created_at,
          } as UserProfile,
        };
      }
    }

    // Fallback: try to get the demo user id from a cookie
    const demoUserIdCookie = request.cookies.get('pk-demo-user-id');
    if (demoUserIdCookie) {
      const uid = demoUserIdCookie.value;
      const demoProfile = DEMO_USERS[uid];
      if (demoProfile) {
        // Register this session for future lookups
        DEMO_SESSIONS.set(token, uid);
        return { authId: uid, profile: demoProfile };
      }
      const storeUser = findUserById(uid);
      if (storeUser && storeUser.is_active) {
        DEMO_SESSIONS.set(token, uid);
        return {
          authId: storeUser.id,
          profile: {
            id: storeUser.id,
            email: storeUser.email,
            full_name: storeUser.full_name,
            role: storeUser.role as UserRole,
            district: storeUser.district,
            preferred_language: storeUser.preferred_language as any,
            phone: storeUser.phone || null,
            is_active: storeUser.is_active,
            is_verified: storeUser.is_verified,
            created_at: storeUser.created_at,
          } as UserProfile,
        };
      }
    }

    // Demo token but no session found — could be stale
    return null;
  }

  // ---- REAL SUPABASE TOKEN PATH ---- //
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


