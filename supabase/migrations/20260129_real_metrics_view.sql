-- Migration: Real Product Metrics View
-- Created: 2026-01-29

-- 1. Create a View to aggregate real-time metrics without heavy read cost
-- This view calculates trends based on actual scan frequency and scores.

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
