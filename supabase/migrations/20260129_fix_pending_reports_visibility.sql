-- Allow users to see their own reports regardless of status (pending, approved, rejected)
-- This fixes the issue where a user submits a report and it "disappears" because it is pending.

CREATE POLICY "Users can read their own reports" ON field_reports
    FOR SELECT USING (auth.uid() = user_id);
