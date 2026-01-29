-- Fix RLS policy for product_cache to allow server-side caching (via anon client)
-- This allows anyone with the API key to write to the cache, which is necessary
-- since we are running the cache logic on the server using the public client.

CREATE POLICY "Anyone can insert cache" ON product_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update cache" ON product_cache
    FOR UPDATE USING (true);
