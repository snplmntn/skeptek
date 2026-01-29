-- Migration: Fix Field Reports RLS (Add Delete and Scoped Update)
-- Created: 2026-01-29

-- Ensure users can update only their own reports (already exists, but reinforcing)
DROP POLICY IF EXISTS "Users can update their own reports" ON field_reports;
CREATE POLICY "Users can update their own reports" ON field_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Add DELETE policy for field_reports
DROP POLICY IF EXISTS "Users can delete their own reports" ON field_reports;
CREATE POLICY "Users can delete their own reports" ON field_reports
    FOR DELETE USING (auth.uid() = user_id);
