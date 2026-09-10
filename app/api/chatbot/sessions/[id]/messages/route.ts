import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { SendChatMessageSchema, parsePagination } from '@/lib/validation';
import { respond, ChatbotContext } from '@/lib/services/chatbotPlaceholder';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { getAnimals } from '@/lib/persistent-store';
import { getOrInitSession } from '@/lib/chatbot-session-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id: sessionId } = params;
  const user = await getCurrentUser(request);

  const { isValid, params: pagParams, error: pagError } = parsePagination(request);
  if (!isValid) {
    return validationErrorResponse(pagError || 'Invalid pagination');
  }

  // Try Supabase first
  try {
    const admin = createAdminClient();
    const { data: session, error: sessErr } = await (admin.from('chatbot_sessions') as any)
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessErr && session) {
      if (
        (session as any).user_id &&
        (!user || ((session as any).user_id !== user.authId && user.profile.role !== 'admin'))
      ) {
        return forbiddenResponse('Cannot view messages from another user session');
      }

      const { data: messages, count, error } = await (admin.from('chatbot_messages') as any)
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .range(pagParams.offset, pagParams.offset + pagParams.limit - 1);

      if (!error) {
        return successResponse(messages || [], {
          total: count || 0,
          session_id: sessionId,
        });
      }
    }
  } catch {
    // Fall through to in-memory
  }

  // In-memory fallback
  const localSession = getOrInitSession(sessionId);
  if (!localSession) {
    return notFoundResponse('Chatbot session not found');
  }

  return successResponse(localSession.messages || [], {
    total: (localSession.messages || []).length,
    session_id: sessionId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id: sessionId } = params;
  const user = await getCurrentUser(request);

  try {
    const body = await request.json();
    const parsed = SendChatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse('Message cannot be empty', parsed.error.format());
    }

    const { message } = parsed.data;

    // Build context
    const context: ChatbotContext = {
      userId: user ? user.authId : null,
      role: user?.profile.role,
      district: user?.profile.district,
      preferredLanguage: user?.profile.preferred_language || 'en',
    };

    if (user && user.profile.role === 'farmer') {
      const allAnimals = getAnimals();
      context.animals = allAnimals
        .filter(
          (a) =>
            a.owner_id === user.authId ||
            a.owner_id === '11111111-1111-4111-8111-111111111111'
        )
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          tag_uid: a.tag_uid,
          species: a.species,
          health_status: a.health_status,
        }));
    }

    // Try Supabase first
    try {
      const admin = createAdminClient();
      const { data: session, error: sessErr } = await (admin.from('chatbot_sessions') as any)
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!sessErr && session) {
        if (
          (session as any).user_id &&
          (!user ||
            ((session as any).user_id !== user.authId && user.profile.role !== 'admin'))
        ) {
          return forbiddenResponse('Cannot post in another user chat session');
        }

        const { data: userMsg, error: userMsgErr } = await (admin.from('chatbot_messages') as any)
          .insert({ session_id: sessionId, sender: 'user', message })
          .select('*')
          .single();

        if (!userMsgErr && userMsg) {
          const botResult = await respond(message, context);

          const { data: botMsg, error: botMsgErr } = await (
            admin.from('chatbot_messages') as any
          )
            .insert({
              session_id: sessionId,
              sender: 'bot',
              message: botResult.reply,
              intent_matched: botResult.intent_matched || null,
            })
            .select('*')
            .single();

          if (!botMsgErr && botMsg) {
            return successResponse({
              user_message: userMsg,
              bot_message: botMsg,
              suggestions: botResult.suggestions || [],
            });
          }
        }
      }
    } catch {
      // Supabase unavailable — fall through to in-memory
    }

    // In-memory fallback (always reached if Supabase did not return above)
    const localSession = getOrInitSession(sessionId);
    if (!localSession) {
      return notFoundResponse('Chatbot session not found');
    }

    const now = new Date().toISOString();
    const userMsg = {
      id: `msg-${Date.now()}-u`,
      session_id: sessionId,
      sender: 'user' as const,
      message,
      created_at: now,
    };
    localSession.messages.push(userMsg);

    const botResult = await respond(message, context);

    const botMsg = {
      id: `msg-${Date.now()}-b`,
      session_id: sessionId,
      sender: 'bot' as const,
      message: botResult.reply,
      intent_matched: botResult.intent_matched || null,
      created_at: new Date().toISOString(),
    };
    localSession.messages.push(botMsg);

    return successResponse({
      user_message: userMsg,
      bot_message: botMsg,
      suggestions: botResult.suggestions || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Message exchange failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
