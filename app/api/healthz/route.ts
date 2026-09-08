import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = 'unreachable';

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (!error) {
      dbStatus = 'connected';
    } else {
      // Table might not exist yet if migration hasn't been run, but DB connection is responding
      dbStatus = `responding (${error.message})`;
    }
  } catch (err: unknown) {
    dbStatus = err instanceof Error ? err.message : 'connection_failed';
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp,
    database: dbStatus,
    version: '1.0.0',
    service: 'Pashudhan Kavach API',
  });
}

