-- Consolidated Migration File
-- Generated on: 2026-02-01

-- ==========================================
-- 1. Create Scans Table
-- From: 20260128203518_create_scans_table.sql
-- ==========================================

-- Create the scans table
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  trust_score numeric,
  verdict text,
  status text check (status in ('verified', 'caution', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.scans enable row level security;

-- Create Policy: Allow Public Read Access (Hackathon Mode)
create policy "Enable read access for all users"
on public.scans for select
using (true);

-- Create Policy: Allow Public Insert Access (Hackathon Mode)
create policy "Enable insert for all users"
on public.scans for insert
with check (true);

-- Enable Realtime for this table
alter publication supabase_realtime add table public.scans;


-- ==========================================
-- 2. Caching and Gamification
-- From: 20260129_caching_gamification.sql
-- ==========================================

-- 1. Create product_cache table for caching analysis results
CREATE TABLE IF NOT EXISTS product_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_key TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for fast lookups by query_key
CREATE INDEX IF NOT EXISTS idx_product_cache_query_key ON product_cache(query_key);
-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_product_cache_expires_at ON product_cache(expires_at);

-- 2. Create field_reports table for community reviews
CREATE TABLE IF NOT EXISTS field_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    agreement_rating INTEGER NOT NULL CHECK (agreement_rating IN (-1, 0, 1)),
    comment TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Index for fast product lookups
CREATE INDEX IF NOT EXISTS idx_field_reports_product_name ON field_reports(product_name);
CREATE INDEX IF NOT EXISTS idx_field_reports_user_id ON field_reports(user_id);

-- 3. Update scans table to add category and image_url
ALTER TABLE scans 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Create profiles table if it doesn't exist (for user gamification)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0 NOT NULL CHECK (xp >= 0),
    rank TEXT DEFAULT 'Cadet' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to auto-update rank based on XP
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp >= 5000 THEN
        NEW.rank := 'Truth Seeker';
    ELSIF NEW.xp >= 2000 THEN
        NEW.rank := 'Detective';
    ELSIF NEW.xp >= 500 THEN
        NEW.rank := 'Investigator';
    ELSE
        NEW.rank := 'Cadet';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update rank when XP changes
DROP TRIGGER IF EXISTS trigger_update_rank ON profiles;
CREATE TRIGGER trigger_update_rank
    BEFORE UPDATE OF xp ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rank();

-- Enable Row Level Security
ALTER TABLE product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_cache (public read, no write)
CREATE POLICY "Anyone can read cache" ON product_cache
    FOR SELECT USING (true);

-- RLS Policies for field_reports
CREATE POLICY "Anyone can read approved reports" ON field_reports
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own reports" ON field_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON field_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can read all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);


-- ==========================================
-- 3. Expanded Ranks
-- From: 20260129_expanded_ranks.sql
-- ==========================================

CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp >= 100000 THEN
        NEW.rank := 'Skeptek God';
    ELSIF NEW.xp >= 50000 THEN
        NEW.rank := 'Grand Arbiter';
    ELSIF NEW.xp >= 25000 THEN
        NEW.rank := 'Truth Serum';
    ELSIF NEW.xp >= 12000 THEN
        NEW.rank := 'Hype Slayer';
    ELSIF NEW.xp >= 6000 THEN
        NEW.rank := 'Myth Buster';
    ELSIF NEW.xp >= 3000 THEN
        NEW.rank := 'Scam Spotter';
    ELSIF NEW.xp >= 1500 THEN
        NEW.rank := 'Deal Hunter';
    ELSIF NEW.xp >= 750 THEN
        NEW.rank := 'Review Reader';
    ELSIF NEW.xp >= 250 THEN
        NEW.rank := 'Label Reader';
    ELSE
        NEW.rank := 'Window Shopper';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 4. Fix Cache RLS
-- From: 20260129_fix_cache_rls.sql
-- ==========================================

-- Fix RLS policy for product_cache to allow server-side caching (via anon client)
CREATE POLICY "Anyone can insert cache" ON product_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update cache" ON product_cache
    FOR UPDATE USING (true);


-- ==========================================
-- 5. Fix Field Reports RLS
-- From: 20260129_fix_field_reports_rls.sql
-- ==========================================

-- Ensure users can update only their own reports (already exists, but reinforcing)
DROP POLICY IF EXISTS "Users can update their own reports" ON field_reports;
CREATE POLICY "Users can update their own reports" ON field_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Add DELETE policy for field_reports
DROP POLICY IF EXISTS "Users can delete their own reports" ON field_reports;
CREATE POLICY "Users can delete their own reports" ON field_reports
    FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 6. Fix Pending Reports Visibility
-- From: 20260129_fix_pending_reports_visibility.sql
-- ==========================================

create policy "Users can read their own reports" ON field_reports
    FOR SELECT USING (auth.uid() = user_id);


-- ==========================================
-- 7. Fix Profiles RLS
-- From: 20260129_fix_profiles_rls.sql
-- ==========================================

-- Allow users to create their own profile if it's missing (Lazy Creation)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);


-- ==========================================
-- 8. Real Metrics View
-- From: 20260129_real_metrics_view.sql
-- ==========================================

-- 1. Create a View to aggregate real-time metrics without heavy read cost
CREATE OR REPLACE VIEW product_metrics_view WITH (security_invoker = true) AS
SELECT 
    s.product_name,
    MAX(s.category) as category, -- Pick one if duplicates exist
    AVG(s.trust_score)::numeric(10,1) as avg_trust_score,
    COUNT(*) as scan_count,
    
    -- Trend: Count of scans in the last 72 hours (Hotness)
    COUNT(*) FILTER (WHERE s.created_at > NOW() - INTERVAL '72 hours') as recent_scans,
    
    -- Real Value Status (Derived from Score)
    CASE 
        WHEN AVG(s.trust_score) >= 80 THEN 'Excellent'
        WHEN AVG(s.trust_score) >= 60 THEN 'Fair'
        ELSE 'Poor'
    END as real_value_status,

    -- Bot/Anomaly Proxy: If trust score is very low, it's highly suspicious (Anomaly)
    CASE 
        WHEN AVG(s.trust_score) < 40 THEN 'High'
        WHEN AVG(s.trust_score) < 60 THEN 'Moderate'
        ELSE 'Low'
    END as anomaly_level,

    MAX(s.created_at) as last_scanned_at

FROM scans s
WHERE s.status != 'rejected' -- Only count valid scans
GROUP BY s.product_name;

-- 2. Grant access to public (view only)
GRANT SELECT ON product_metrics_view TO anon, authenticated, service_role;


-- ==========================================
-- 9. Expand Product Cache
-- From: 20260131_expand_product_cache.sql
-- ==========================================

-- 1. Add 'type' column to product_cache to distinguish scan types
ALTER TABLE product_cache
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'visual', 'compare', 'url', 'canonical'));

-- 2. Enable Write Access for All Users (Required for Cache Warming by Anon users)
CREATE POLICY "Enable insert for all users"
ON public.product_cache
FOR INSERT
WITH CHECK (true);

-- Allow updating existing cache entries (e.g. refreshing expiry)
CREATE POLICY "Enable update for all users"
ON public.product_cache
FOR UPDATE
USING (true);
