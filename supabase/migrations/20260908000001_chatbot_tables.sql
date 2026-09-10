-- ==============================================================================
-- Migration: 20260908000001_chatbot_tables.sql
-- Description: Chatbot Sessions and Messages Schema for Pashudhan Kavach (Section 8)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'inapp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'system')),
    message TEXT NOT NULL,
    intent_matched TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Updated_at trigger for chatbot_sessions
DROP TRIGGER IF EXISTS tr_chatbot_sessions_updated_at ON public.chatbot_sessions;
CREATE TRIGGER tr_chatbot_sessions_updated_at
    BEFORE UPDATE ON public.chatbot_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_id ON public.chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session_id ON public.chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON public.chatbot_messages(created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Sessions RLS: Users can view their own sessions or anonymous sessions (user_id IS NULL)
CREATE POLICY "Users view own or public sessions"
    ON public.chatbot_sessions FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL OR public.current_user_role() = 'admin');

CREATE POLICY "Anyone can create chatbot sessions"
    ON public.chatbot_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Messages RLS: Visible if parent session is accessible
CREATE POLICY "Users view messages of accessible sessions"
    ON public.chatbot_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chatbot_sessions s
            WHERE s.id = chatbot_messages.session_id
              AND (s.user_id = auth.uid() OR s.user_id IS NULL OR public.current_user_role() = 'admin')
        )
    );

CREATE POLICY "Anyone can insert chatbot messages"
    ON public.chatbot_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chatbot_sessions s
            WHERE s.id = chatbot_messages.session_id
              AND (s.user_id = auth.uid() OR s.user_id IS NULL OR public.current_user_role() = 'admin')
        )
    );

