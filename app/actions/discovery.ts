'use server';

import { supabase } from '@/lib/supabase';

export interface TrendingScan {
  id: number;
  product_name: string;
  trust_score: number;
  verdict: string;
  status: string;
  created_at: string;
  // Simulated fields for UI enrichment
  rank: number;
  trend: string; 
  category: string;
  reviews: number;
  sentiment: string;
  bot_activity: string;
  real_value: string;
}

export async function getTrendingScans() {
    try {
        // Fetch Top 3 High Scores (Gold, Silver, Bronze candidates)
        const { data: topData, error: topError } = await supabase
            .from('scans')
            .select('*')
            .gte('trust_score', 80)
            .order('trust_score', { ascending: false })
            .order('created_at', { ascending: false }) // Break ties with recency
            .limit(3);

        if (topError) throw topError;

        // Fetch One Recent "Trap" (Low Score / Risky)
        const { data: trapData, error: trapError } = await supabase
            .from('scans')
            .select('*')
            .lt('trust_score', 50)
            .order('created_at', { ascending: false })
            .limit(1);

        if (trapError) throw trapError;

        // Helper to garnish data with UI-only simulation
        const garnish = (item: any, index: number): TrendingScan => {
            const score = item.trust_score;
            const isHigh = score >= 80;
            
            // Derive metrics from score
            let botActivity = "Low";
            let realValue = "High";

            if (score < 50) {
                botActivity = "High";
                realValue = "Low";
            } else if (score < 70) {
                botActivity = "Moderate";
                realValue = "Average";
            }

            return {
                ...item,
                rank: index + 1,
                // Simulate "Trending" metric based on score + recency randomness
                trend: `+${Math.floor(Math.random() * 20) + 10}%`, 
                category: inferCategory(item.product_name),
                reviews: Math.floor(Math.random() * 5000) + 500,
                sentiment: isHigh ? 'Excellent' : 'Risky',
                bot_activity: botActivity,
                real_value: realValue
            };
        };

        return {
            top: topData?.map((item, i) => garnish(item, i)) || [],
            trap: trapData?.[0] ? { ...trapData[0], ...garnish(trapData[0], 0), isTrap: true } : null
        };
    } catch (error) {
        console.error("Discovery API Error:", error);
        return { top: [], trap: null };
    }
}

function inferCategory(name: string): string {
    const n = (name || "").toLowerCase();
    // Tech
    if (n.includes('phone') || n.includes('pixel') || n.includes('iphone') || n.includes('samsung') || n.includes('android')) return 'Smartphone';
    if (n.includes('headphone') || n.includes('sony') || n.includes('bose') || n.includes('bud') || n.includes('airpod') || n.includes('audio')) return 'Audio';
    if (n.includes('monitor') || n.includes('screen') || n.includes('display') || n.includes('tv') || n.includes('oled')) return 'Display';
    if (n.includes('watch') || n.includes('wearable') || n.includes('band')) return 'Wearable';
    if (n.includes('keyboard') || n.includes('mouse') || n.includes('peripheral') || n.includes('logitech')) return 'Peripheral';
    if (n.includes('laptop') || n.includes('macbook') || n.includes('notebook') || n.includes('computer')) return 'Computing';
    
    // Home & Lifestyle
    if (n.includes('coffee') || n.includes('brewer') || n.includes('blender') || n.includes('mixer') || n.includes('fryer')) return 'Kitchen';
    if (n.includes('vacuum') || n.includes('cleaner') || n.includes('dyson') || n.includes('robot')) return 'Home Appliance';
    
    // Health & Beauty
    if (n.includes('supple') || n.includes('vitamin') || n.includes('protein') || n.includes('health') || n.includes('tablet')) return 'Health';
    if (n.includes('skin') || n.includes('face') || n.includes('cream') || n.includes('lotion') || n.includes('serum') || n.includes('olay')) return 'Beauty';
    
    // Food & Drink
    if (n.includes('drink') || n.includes('energy') || n.includes('water') || n.includes('soda') || n.includes('tea') || n.includes('bull')) return 'Beverage';
    if (n.includes('snack') || n.includes('bar') || n.includes('food') || n.includes('chocolate')) return 'Food';

    return 'Gadget'; // Default Fallback
}
