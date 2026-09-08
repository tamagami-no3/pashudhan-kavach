import { z } from 'zod';
import { NextRequest } from 'next/server';

export const UserRoleSchema = z.enum(['farmer', 'vet', 'paravet', 'lab', 'admin']);
export const PreferredLanguageSchema = z.enum(['en', 'hi', 'mr']);
export const RecordTypeSchema = z.enum(['vaccination', 'treatment', 'checkup']);
export const ReportStatusSchema = z.enum(['pending', 'triaged', 'escalated', 'resolved']);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export const LabStatusSchema = z.enum(['collected', 'in_transit', 'received', 'testing', 'completed']);

// India Bounding Box: Lat 6-38, Lng 68-98
export const GpsLatSchema = z
  .number()
  .min(6.0, { message: 'Latitude must be within India (>= 6.0)' })
  .max(38.0, { message: 'Latitude must be within India (<= 38.0)' });

export const GpsLngSchema = z
  .number()
  .min(68.0, { message: 'Longitude must be within India (>= 68.0)' })
  .max(98.0, { message: 'Longitude must be within India (<= 98.0)' });

// Tag UID must be exactly 12 digits
export const TagUidSchema = z
  .string()
  .regex(/^[0-9]{12}$/, { message: 'Tag UID must be exactly 12 digits (numbers only)' });

// Pagination Parser: default limit 20, max 100
export interface PaginationParams {
  limit: number;
  offset: number;
}

export function parsePagination(request: NextRequest): {
  isValid: boolean;
  params: PaginationParams;
  error?: string;
} {
  const searchParams = request.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  let limit = 20;
  let offset = 0;

  if (limitParam !== null) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return { isValid: false, params: { limit, offset }, error: 'Limit must be a positive integer' };
    }
    if (parsedLimit > 100) {
      return { isValid: false, params: { limit, offset }, error: 'Limit cannot exceed 100' };
    }
    limit = parsedLimit;
  }

  if (offsetParam !== null) {
    const parsedOffset = parseInt(offsetParam, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return { isValid: false, params: { limit, offset }, error: 'Offset must be a non-negative integer' };
    }
    offset = parsedOffset;
  }

  return {
    isValid: true,
    params: { limit, offset },
  };
}

