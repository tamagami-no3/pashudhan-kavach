-- ==============================================================================
-- Migration: 20260908000000_initial_schema.sql
-- Description: Complete Database Schema for Pashudhan Kavach (SIH26128)
-- Tables: users, farmers, animals, health_records, symptom_reports, outbreak_flags,
--         lab_cases, advisories, notification_log, community_posts, sync_queue_items
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'vet', 'paravet', 'lab', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE preferred_language AS ENUM ('en', 'hi', 'mr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_type AS ENUM ('vaccination', 'treatment', 'checkup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'triaged', 'escalated', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_status AS ENUM ('collected', 'in_transit', 'received', 'testing', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('inapp', 'email', 'sms', 'whatsapp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'applied', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES DEFINITIONS

-- 3.1 USERS (Profiles linked 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'farmer',
    preferred_language preferred_language NOT NULL DEFAULT 'en',
    district TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.2 FARMERS (Specific metadata for farmer role)
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    village TEXT NOT NULL,
    block TEXT NOT NULL,
    landline TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.3 ANIMALS
CREATE TABLE IF NOT EXISTS public.animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    tag_uid CHAR(12) NOT NULL UNIQUE,
    species TEXT NOT NULL,
    breed TEXT NOT NULL,
    sex TEXT NOT NULL,
    dob DATE,
    gps_lat DOUBLE PRECISION NOT NULL,
    gps_lng DOUBLE PRECISION NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    health_status TEXT NOT NULL DEFAULT 'healthy',
    qr_code_url TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_tag_uid_format CHECK (tag_uid ~ '^[0-9]{12}$'),
    CONSTRAINT check_gps_lat_india CHECK (gps_lat >= 6.0 AND gps_lat <= 38.0),
    CONSTRAINT check_gps_lng_india CHECK (gps_lng >= 68.0 AND gps_lng <= 98.0)
);

-- 3.4 HEALTH RECORDS
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    record_type record_type NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    next_due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.5 SYMPTOM REPORTS
CREATE TABLE IF NOT EXISTS public.symptom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    gps_lat DOUBLE PRECISION NOT NULL,
    gps_lng DOUBLE PRECISION NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_report_gps_lat CHECK (gps_lat >= 6.0 AND gps_lat <= 38.0),
    CONSTRAINT check_report_gps_lng CHECK (gps_lng >= 68.0 AND gps_lng <= 98.0)
);

-- 3.6 OUTBREAK FLAGS (Auto-generated by AI triage)
CREATE TABLE IF NOT EXISTS public.outbreak_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom_report_id UUID NOT NULL REFERENCES public.symptom_reports(id) ON DELETE CASCADE,
    predicted_disease TEXT NOT NULL,
    confidence_pct NUMERIC(5, 2) NOT NULL,
    severity_score NUMERIC(5, 2) NOT NULL,
    risk_level risk_level NOT NULL,
    district TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.7 LAB CASES
CREATE TABLE IF NOT EXISTS public.lab_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom_report_id UUID NOT NULL REFERENCES public.symptom_reports(id) ON DELETE CASCADE,
    sample_id TEXT NOT NULL UNIQUE,
    assigned_lab_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status lab_status NOT NULL DEFAULT 'collected',
    result TEXT,
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.8 ADVISORIES
CREATE TABLE IF NOT EXISTS public.advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_hi TEXT NOT NULL,
    body_mr TEXT NOT NULL,
    district TEXT NOT NULL,
    disease TEXT NOT NULL,
    severity risk_level NOT NULL DEFAULT 'medium',
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.9 NOTIFICATION LOG
CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL DEFAULT 'inapp',
    language preferred_language NOT NULL DEFAULT 'en',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.10 COMMUNITY POSTS (Anonymized auto-forward for high risk outbreaks)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_symptom_report_id UUID REFERENCES public.symptom_reports(id) ON DELETE SET NULL,
    district TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3.11 SYNC QUEUE ITEMS (Offline sync queue)
CREATE TABLE IF NOT EXISTS public.sync_queue_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    client_created_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    status sync_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. ATTACH UPDATED_AT TRIGGERS
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'users', 'farmers', 'animals', 'health_records', 'symptom_reports', 
            'outbreak_flags', 'lab_cases', 'advisories', 'notification_log', 
            'community_posts', 'sync_queue_items'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_%I_updated_at ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER tr_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t, t);
    END LOOP;
END $$;

-- 5. INDEXES FOR PERFORMANCE AND LOOKUPS
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_district ON public.users(district);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON public.farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_village ON public.farmers(village);

CREATE INDEX IF NOT EXISTS idx_animals_owner_id ON public.animals(owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_tag_uid ON public.animals(tag_uid);
CREATE INDEX IF NOT EXISTS idx_animals_district ON public.animals(district);
CREATE INDEX IF NOT EXISTS idx_animals_species ON public.animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON public.animals(health_status);

CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON public.health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_performed_by ON public.health_records(performed_by);
CREATE INDEX IF NOT EXISTS idx_health_records_performed_at ON public.health_records(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_symptom_reports_animal_id ON public.symptom_reports(animal_id);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_reported_by ON public.symptom_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_status ON public.symptom_reports(status);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_reported_at ON public.symptom_reports(reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_outbreak_flags_report_id ON public.outbreak_flags(symptom_report_id);
CREATE INDEX IF NOT EXISTS idx_outbreak_flags_district ON public.outbreak_flags(district);
CREATE INDEX IF NOT EXISTS idx_outbreak_flags_risk_level ON public.outbreak_flags(risk_level);
CREATE INDEX IF NOT EXISTS idx_outbreak_flags_created_at ON public.outbreak_flags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_cases_report_id ON public.lab_cases(symptom_report_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_sample_id ON public.lab_cases(sample_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_assigned_lab ON public.lab_cases(assigned_lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_status ON public.lab_cases(status);

CREATE INDEX IF NOT EXISTS idx_advisories_district ON public.advisories(district);
CREATE INDEX IF NOT EXISTS idx_advisories_disease ON public.advisories(disease);
CREATE INDEX IF NOT EXISTS idx_advisories_created_at ON public.advisories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON public.notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_district ON public.community_posts(district);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status ON public.sync_queue_items(user_id, status);

-- 6. ROW LEVEL SECURITY (RLS) HELPER & POLICIES

-- Helper to quickly fetch current user's role from public.users table
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all 11 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbreak_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue_items ENABLE ROW LEVEL SECURITY;

-- 6.1 USERS Policies
CREATE POLICY "Users can view their own profile or staff can view all"
    ON public.users FOR SELECT
    USING (auth.uid() = id OR public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- 6.2 FARMERS Policies
CREATE POLICY "Farmers view own profile or staff view all"
    ON public.farmers FOR SELECT
    USING (auth.uid() = user_id OR public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

CREATE POLICY "Farmers update own profile"
    ON public.farmers FOR UPDATE
    USING (auth.uid() = user_id);

-- 6.3 ANIMALS Policies
CREATE POLICY "Farmers view own animals or staff view all"
    ON public.animals FOR SELECT
    USING (auth.uid() = owner_id OR public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

CREATE POLICY "Farmers and Paravets insert animals"
    ON public.animals FOR INSERT
    WITH CHECK (
        (public.current_user_role() = 'farmer' AND auth.uid() = owner_id)
        OR public.current_user_role() IN ('paravet', 'admin')
    );

CREATE POLICY "Owner, Vet, or Admin update animal"
    ON public.animals FOR UPDATE
    USING (auth.uid() = owner_id OR public.current_user_role() IN ('vet', 'admin'));

-- 6.4 HEALTH RECORDS Policies
CREATE POLICY "View health records for visible animals"
    ON public.health_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.animals
            WHERE animals.id = health_records.animal_id
              AND (animals.owner_id = auth.uid() OR public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'))
        )
    );

CREATE POLICY "Staff insert health records"
    ON public.health_records FOR INSERT
    WITH CHECK (public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

-- 6.5 SYMPTOM REPORTS Policies
CREATE POLICY "Farmers view own reports or staff view all"
    ON public.symptom_reports FOR SELECT
    USING (auth.uid() = reported_by OR public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

CREATE POLICY "Farmers and Paravets insert symptom reports"
    ON public.symptom_reports FOR INSERT
    WITH CHECK (auth.uid() = reported_by OR public.current_user_role() IN ('farmer', 'paravet', 'admin'));

CREATE POLICY "Vets, Paravets, and Admins update symptom reports status"
    ON public.symptom_reports FOR UPDATE
    USING (public.current_user_role() IN ('vet', 'paravet', 'admin'));

-- 6.6 OUTBREAK FLAGS Policies
CREATE POLICY "Staff can view outbreak flags"
    ON public.outbreak_flags FOR SELECT
    USING (public.current_user_role() IN ('vet', 'paravet', 'lab', 'admin'));

-- 6.7 LAB CASES Policies
CREATE POLICY "Lab staff and vets can view lab cases"
    ON public.lab_cases FOR SELECT
    USING (public.current_user_role() IN ('vet', 'lab', 'admin'));

CREATE POLICY "Lab staff can update assigned lab cases"
    ON public.lab_cases FOR UPDATE
    USING (public.current_user_role() IN ('lab', 'admin'));

-- 6.8 ADVISORIES Policies
CREATE POLICY "Anyone authenticated can view advisories"
    ON public.advisories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can create advisories"
    ON public.advisories FOR INSERT
    WITH CHECK (public.current_user_role() IN ('vet', 'admin'));

-- 6.9 NOTIFICATION LOG Policies
CREATE POLICY "Users can view their own notification logs"
    ON public.notification_log FOR SELECT
    USING (auth.uid() = user_id);

-- 6.10 COMMUNITY POSTS Policies
CREATE POLICY "Anyone authenticated can view community posts"
    ON public.community_posts FOR SELECT
    TO authenticated
    USING (true);

-- 6.11 SYNC QUEUE ITEMS Policies
CREATE POLICY "Users can manage their own sync queue items"
    ON public.sync_queue_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. STORAGE BUCKETS SETUP (For SQL execution in Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('symptom-media', 'symptom-media', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-cards', 'health-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Authenticated users can upload symptom media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'symptom-media');

CREATE POLICY "Users can read symptom media"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'symptom-media');

CREATE POLICY "Public read for health card QR codes"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'health-cards');

CREATE POLICY "Authenticated users can upload health cards"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'health-cards');

