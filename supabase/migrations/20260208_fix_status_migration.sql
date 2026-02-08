
-- 1. DROP the Constraint First
-- The old constraint 'scans_status_check' currently blocks 'BUY/CONSIDER/AVOID'.
ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_status_check;

-- 2. MIGRATE Data (now that constraint is gone)
UPDATE public.scans SET status = 'BUY' WHERE status = 'verified';
UPDATE public.scans SET status = 'CONSIDER' WHERE status = 'caution';
UPDATE public.scans SET status = 'AVOID' WHERE status = 'rejected';

-- 3. ADD the New Constraint
ALTER TABLE public.scans
ADD CONSTRAINT scans_status_check
CHECK (status IN ('BUY', 'CONSIDER', 'AVOID'));

-- 4. UPDATE Dependent View
-- The view relied on 'rejected' which no longer exists.
CREATE OR REPLACE VIEW product_metrics_view WITH (security_invoker = true) AS
SELECT 
    s.product_name,
    MAX(s.category) as category,
    AVG(s.trust_score)::numeric(10,1) as avg_trust_score,
    COUNT(*) as scan_count,
    COUNT(*) FILTER (WHERE s.created_at > NOW() - INTERVAL '72 hours') as recent_scans,
    CASE 
        WHEN AVG(s.trust_score) >= 80 THEN 'Excellent'
        WHEN AVG(s.trust_score) >= 60 THEN 'Fair'
        ELSE 'Poor'
    END as real_value_status,
    CASE 
        WHEN AVG(s.trust_score) < 40 THEN 'High'
        WHEN AVG(s.trust_score) < 60 THEN 'Moderate'
        ELSE 'Low'
    END as anomaly_level,
    MAX(s.created_at) as last_scanned_at
FROM scans s
WHERE s.status != 'AVOID' -- Use AVOID instead of rejected
GROUP BY s.product_name;
