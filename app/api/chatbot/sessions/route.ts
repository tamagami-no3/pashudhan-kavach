import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateChatbotSessionSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/api-response';
import { IN_MEMORY_SESSIONS } from '@/lib/chatbot-session-store';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay
    }

    const parsed = CreateChatbotSessionSchema.safeParse(body);
    const channel = parsed.success ? parsed.data.channel : 'inapp';

    // Try Supabase first
    try {
      const admin = createAdminClient();
      const { data: session, error } = await (admin.from('chatbot_sessions') as any)
        .insert({
          user_id: user ? user.authId : null,
          channel,
        })
        .select('*')
        .single();

      if (!error && session) {
        return successResponse(session, { message: 'Chatbot session initiated' }, 201);
      }
    } catch {
      // Supabase unavailable — fall through to in-memory
    }

    // Fallback: in-memory session
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = {
      id: sessionId,
      user_id: user ? user.authId : null,
      channel,
      created_at: new Date().toISOString(),
      messages: [],
    };
    IN_MEMORY_SESSIONS.set(sessionId, session);

    return successResponse(
      { id: sessionId, user_id: session.user_id, channel, created_at: session.created_at },
      { message: 'Chatbot session initiated' },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session creation failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
