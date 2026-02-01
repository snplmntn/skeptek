-- Migration: Expand Product Cache for Visual/Compare/Canonical Scans
-- Created: 2026-01-31

-- 1. Add 'type' column to product_cache to distinguish scan types
ALTER TABLE product_cache
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'visual', 'compare', 'url', 'canonical'));

-- 2. Enable Write Access for All Users (Required for Cache Warming by Anon users)
-- Note: In a production app, we might restrict this to server-side only (service_role),
-- but for this architecture where the client/server action triggers it, we ensure RLS passes.

CREATE POLICY "Enable insert for all users"
ON public.product_cache
FOR INSERT
WITH CHECK (true);

-- Allow updating existing cache entries (e.g. refreshing expiry)
CREATE POLICY "Enable update for all users"
ON public.product_cache
FOR UPDATE
USING (true);
