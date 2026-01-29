'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function submitFieldReport(productName: string, verdict: 'verify' | 'dispute' | 'flag') {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // 1. Insert Report
        const { error } = await supabase.from('field_reports').insert({
            product_name: productName,
            verdict: verdict,
            user_id: userId, // Can be null for guests
            status: 'pending' // pending until trusted
        });

        if (error) throw error;

        // 2. Award XP if logged in
        if (userId) {
            let xpAmount = 10;
            if (verdict === 'dispute') xpAmount = 25; // Higher reward for critical thinking
            
            // Call RPC function to increment safely
            await supabase.rpc('award_xp', { 
                user_id: userId, 
                amount: xpAmount 
            });
        }

        return { success: true };

    } catch (error) {
        console.error("Field Report Error:", error);
        return { success: false, error: "Failed to submit report" };
    }
}
