import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function errorResponse(message: string, code = 'BAD_REQUEST', status = 400, details?: unknown) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function unauthorizedResponse(message = 'Authentication required') {
  return errorResponse(message, 'UNAUTHORIZED', 401);
}

export function forbiddenResponse(message = 'You do not have permission to perform this action') {
  return errorResponse(message, 'FORBIDDEN', 403);
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 'NOT_FOUND', 404);
}

export function validationErrorResponse(message = 'Validation failed', details?: unknown) {
  return errorResponse(message, 'VALIDATION_ERROR', 422, details);
}

export function internalErrorResponse(message = 'Internal server error', details?: unknown) {
  return errorResponse(message, 'INTERNAL_SERVER_ERROR', 500, details);
}

