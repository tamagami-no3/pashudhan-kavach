/**
 * Shared in-memory chatbot session store.
 * Used by both the sessions and messages API routes as a Supabase fallback.
 */

interface InMemoryMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'bot';
  message: string;
  intent_matched?: string | null;
  created_at: string;
}

interface InMemorySession {
  id: string;
  user_id: string | null;
  channel: string;
  created_at: string;
  messages: InMemoryMessage[];
}

export const IN_MEMORY_SESSIONS = new Map<string, InMemorySession>();

export function getOrInitSession(sessionId: string): InMemorySession | null {
  if (IN_MEMORY_SESSIONS.has(sessionId)) {
    return IN_MEMORY_SESSIONS.get(sessionId)!;
  }
  // Auto-create on-the-fly for locally-generated session IDs
  if (sessionId.startsWith('chat-')) {
    const session: InMemorySession = {
      id: sessionId,
      user_id: null,
      channel: 'inapp',
      created_at: new Date().toISOString(),
      messages: [],
    };
    IN_MEMORY_SESSIONS.set(sessionId, session);
    return session;
  }
  return null;
}

