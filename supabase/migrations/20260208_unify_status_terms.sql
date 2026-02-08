
-- Migration to unify status terminology to BUY, CONSIDER, AVOID

-- 1. Drop existing check constraint if it exists (it was named implicitly or we need to find it, but usually we can just drop the constraint by name if we knew it. Since we defined it inline, it likely has an auto-generated name. We can try to alter the column type to text first to drop constraint, or just add a new one.)
-- Actually, the safest way on Supabase/Postgres to change a check constraint is to drop it and add a new one.
-- Finding the constraint name might be tricky without inspecting, but we can try to just DROP CONSTRAINT scnas_status_check if that's the standard naming, or we can use a DO block to find and drop it.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.scans'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%status%verified%'
    LOOP
        EXECUTE 'ALTER TABLE public.scans DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 2. Migrate existing data
UPDATE public.scans SET status = 'BUY' WHERE status = 'verified';
UPDATE public.scans SET status = 'CONSIDER' WHERE status = 'caution';
UPDATE public.scans SET status = 'AVOID' WHERE status = 'rejected';

-- 3. Add new check constraint
ALTER TABLE public.scans
ADD CONSTRAINT scans_status_check
CHECK (status IN ('BUY', 'CONSIDER', 'AVOID'));
