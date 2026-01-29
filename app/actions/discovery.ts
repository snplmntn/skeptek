'use server';

import { createClient } from '@/utils/supabase/server';

export interface TrendingScan {
  id: string; // View doesn't have ID, use product_name as key or generate one
  product_name: string;
  trust_score: number;
  verdict: string; // Computed
  rank: number;
  category: string;
  trend_label: string;
  anomaly_level: string;
  real_value: string;
}

    export async function getTrendingScans(categoryFilter: string = 'All') {
    try {
        const supabase = await createClient();
        
        let query = supabase
            .from('product_metrics_view')
            .select('*')
            .order('avg_trust_score', { ascending: false })
            .order('recent_scans', { ascending: false }); // Secondary sort by hotness
        
        if (categoryFilter !== 'All') {
            query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query.limit(5);

        if (error) throw error;

        if (!data) return { top: [], trap: null };

        // Process Data
        const top = data
            .filter((d: any) => d.avg_trust_score >= 60)
            .slice(0, 3)
            .map((item: any, i: number) => ({
                id: item.product_name, // Use name as ID since view groups by name
                product_name: item.product_name,
                trust_score: item.avg_trust_score,
                verdict: item.real_value_status,
                category: item.category || 'General',
                rank: i + 1,
                // Logic for UI Label
                trend_label: item.recent_scans > 2 ? 'Trending' : 'Stable',
                anomaly_level: item.anomaly_level,
                real_value: item.real_value_status
            }));

        // Find a Trap (Low Score)
        const trapRaw = data.find((d: any) => d.avg_trust_score < 50);
        const trap = trapRaw ? {
             id: trapRaw.product_name,
             product_name: trapRaw.product_name,
             trust_score: trapRaw.avg_trust_score,
             verdict: "Avoid",
             rank: 0,
             category: trapRaw.category || 'General',
             trend_label: "Warning",
             anomaly_level: trapRaw.anomaly_level,
             real_value: trapRaw.real_value_status
        } : null;

        return { top, trap };

    } catch (error) {
        console.error("Discovery API Error:", error);
        return { top: [], trap: null };
    }
}
