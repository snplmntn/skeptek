'use server';

import { createClient } from '@/utils/supabase/server';

const RANKS = [
    { name: 'Skeptek God', min: 100000 },
    { name: 'Grand Arbiter', min: 50000 },
    { name: 'Truth Serum', min: 25000 },
    { name: 'Hype Slayer', min: 12000 },
    { name: 'Myth Buster', min: 6000 },
    { name: 'Scam Spotter', min: 3000 },
    { name: 'Deal Hunter', min: 1500 },
    { name: 'Review Reader', min: 750 },
    { name: 'Label Reader', min: 250 },
    { name: 'Window Shopper', min: 0 }
];

function getRankName(xp: number) {
    return RANKS.find(r => xp >= r.min)?.name || 'Window Shopper';
}

export async function getUserProfile() {
    try {
        const supabase = await createClient();
        
        // 1. Get current user (Secure)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        console.log("[getUserProfile] Auth Check:", { 
            hasUser: !!user, 
            userId: user?.id, 
            email: user?.email,
            userError 
        });

        if (!user) {
            // Return default "Guest" profile
            return {
                isGuest: true,
                xp: 0,
                rank: 'Window Shopper',
                nextRankXP: 300
            };
        }

        // 2. Fetch Profile from DB
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('xp')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            // Profile missing? Create default but keep identity.
            return {
                isGuest: false,
                email: user.email,
                xp: 0,
                rank: 'Window Shopper',
                nextRankXP: 300
            };
        }

        // Calculate next rank threshold
        let nextRankXP = 300;
        if (profile.xp >= 100000) nextRankXP = 200000; // God level cap
        else if (profile.xp >= 50000) nextRankXP = 100000;
        else if (profile.xp >= 25000) nextRankXP = 50000;
        else if (profile.xp >= 12000) nextRankXP = 25000;
        else if (profile.xp >= 6000) nextRankXP = 12000;
        else if (profile.xp >= 3000) nextRankXP = 6000;
        else if (profile.xp >= 1500) nextRankXP = 3000;
        else if (profile.xp >= 750) nextRankXP = 1500;
        else if (profile.xp >= 300) nextRankXP = 750;

        return {
            isGuest: false,
            email: user.email,
            xp: profile.xp,
            rank: getRankName(profile.xp), // FORCED FRONTEND CALCULATION
            nextRankXP
        };

    } catch (e) {
        console.error("User Profile Error:", e);
        return { isGuest: true, email: null, xp: 0, rank: 'Error', nextRankXP: 0 };
    }
}
