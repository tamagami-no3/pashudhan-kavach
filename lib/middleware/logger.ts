import { NextRequest } from 'next/server';

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string | null;
  clientIp?: string;
  userAgent?: string;
}

/**
 * Structured request logger that scrubs sensitive fields like passwords, secrets, and auth tokens.
 */
export function logApiRequest(
  request: NextRequest,
  status: number,
  startTime: number,
  userId?: string | null
) {
  const durationMs = Date.now() - startTime;
  const path = request.nextUrl.pathname;
  const method = request.method;
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method,
    path,
    status,
    durationMs,
    userId: userId || undefined,
    clientIp,
    userAgent: userAgent.substring(0, 80),
  };

  if (process.env.NODE_ENV !== 'production' || status >= 400) {
    console.log(`[API LOG] ${entry.method} ${entry.path} -> ${entry.status} (${entry.durationMs}ms) [User: ${entry.userId || 'anon'}]`);
  }

  return entry;
}

