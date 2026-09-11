import type { UserRole } from '@/types/database.types';

/**
 * =============================================================================
 * RBAC Tab Configuration (LOCKED)
 * =============================================================================
 * Single source of truth for which dashboard tabs/features each role can see.
 * Navbar renders ONLY from this config. Server-side API routes enforce the
 * same rules independently (see requireRole calls in app/api/**) — hiding a
 * tab here is a UX measure, never the security boundary.
 *
 * NOTE: /animals (Livestock Registry) and /report-symptom (Report Symptoms)
 * are farmer/paravet ONLY per the locked RBAC spec. Vets/lab/admin must use
 * the dashboard triage queue instead. POST /api/animals and
 * POST /api/symptom-reports enforce this server-side.
 */
export type FeatureKey =
  | 'dashboard'
  | 'animals'
  | 'report-symptom'
  | 'heatmap'
  | 'community'
  | 'lab'
  | 'analytics';

export const ROLE_FEATURES: Record<UserRole, FeatureKey[]> = {
  farmer: ['dashboard', 'animals', 'report-symptom', 'heatmap', 'community'],
  paravet: ['dashboard', 'animals', 'report-symptom', 'heatmap', 'community'],
  vet: ['dashboard', 'heatmap', 'community', 'analytics'],
  lab: ['dashboard', 'heatmap', 'community', 'lab'],
  admin: ['dashboard', 'heatmap', 'community', 'analytics'],
};

/** Roles allowed to open the Livestock Registry page (nav + page guard). */
export const REGISTRY_ROLES: UserRole[] = ['farmer', 'paravet'];

/** Roles allowed to open the Report Symptoms page (nav + page guard). */
export const REPORT_SYMPTOM_ROLES: UserRole[] = ['farmer', 'paravet'];

export function roleCanAccess(role: UserRole | undefined | null, feature: FeatureKey): boolean {
  if (!role) return false;
  return ROLE_FEATURES[role]?.includes(feature) ?? false;
}
