-- SUPABASE SCHEMA SETUP 
-- Run this in the SQL Editor of your Supabase Project

-- 1. Create Tables

-- Day Data summary (daily analytics)
CREATE TABLE IF NOT EXISTS public.day_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_active_time INTEGER DEFAULT 0,
    focus_score INTEGER DEFAULT 0,
    distractions_blocked INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Site usage details
CREATE TABLE IF NOT EXISTS public.site_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    domain TEXT NOT NULL,
    time_spent INTEGER DEFAULT 0,
    visits INTEGER DEFAULT 0,
    category TEXT,
    last_visited TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date, domain)
);

-- Focus sessions
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    distractions_blocked INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_session_duration INTEGER DEFAULT 25,
    blocked_sites TEXT[] DEFAULT '{}',
    incognito_blocker BOOLEAN DEFAULT true,
    notion_token TEXT,
    notion_database_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.day_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Users can only see/edit their own data
CREATE POLICY "user_data_owner" ON public.day_data
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_sites_owner" ON public.site_usage
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_owner" ON public.focus_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_settings_owner" ON public.settings
    FOR ALL USING (auth.uid() = user_id);

-- 4. Set up Realtime
-- Enable realtime for settings updates
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
