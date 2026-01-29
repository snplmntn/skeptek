-- Migration: Add Caching and Gamification Tables
-- Created: 2026-01-29

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
