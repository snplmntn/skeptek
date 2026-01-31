'use server';

import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export async function awardXP(amount: number, client?: SupabaseClient) {
    try {
        const supabase = client || await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) return null; // Guests don't get XP

        // Fetch current XP
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp')
            .eq('id', session.user.id)
            .single();

        if (!profile) return null;

        const newXP = (profile.xp || 0) + amount;

        // DB Update (Rank updated via Trigger)
        const { error } = await supabase
            .from('profiles')
            .update({ xp: newXP })
            .eq('id', session.user.id);

        if (error) throw error;

        console.log(`[Gamification] Awarded ${amount} XP to ${session.user.id} (Total: ${newXP})`);
        return newXP;

    } catch (error) {
        console.error("[Gamification] XP Award Failed:", error);
        return null;
    }
}
