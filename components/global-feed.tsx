'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Initialize Client (Anon Key is safe for public subscription)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

interface Scan {
  id: string;
  product_name: string;
  trust_score: number;
  status: 'verified' | 'caution' | 'rejected';
  created_at: string;
}

export function GlobalFeed() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial Fetch (Get last 5)
    supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setScans(data as Scan[]);
        setLoading(false);
      });

    // Realtime Subscription
    const channel = supabase
      .channel('global-watchtower')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scans' },
        (payload) => {
          setIsLive(true);
          const newScan = payload.new as Scan;
          setScans((prev) => [newScan, ...prev].slice(0, 5));
          
          // Flash "Live" indicator
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loading && scans.length === 0) {
      return null;
  }

  return (
    <div className="mb-12 relative z-10 w-full max-w-6xl mx-auto px-6 pause-on-hover">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
        <p className="text-center text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Global Feed
        </p>
      </div>
      
      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden mask-gradient-x">
        {/* Animated Track - Duplicated content for seamless loop */}
        <div className="animate-horizontal-marquee flex items-center w-max gap-4">
            {scans.length > 0 ? [...scans, ...scans, ...scans, ...scans].map((scan, idx) => ( // Quadrupled for seamless loop & width safety
            <div
                key={`${scan.id}-${idx}`}
                className="group flex items-center justify-between p-3 gap-6 rounded-xl border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default min-w-[300px]"
            >
                {/* Product Info */}
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0 ${
                         scan.status === 'verified' ? 'bg-emerald-500 text-emerald-500' :
                         scan.status === 'caution' ? 'bg-amber-500 text-amber-500' :
                         'bg-rose-500 text-rose-500'
                    }`} />
                    
                    <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate max-w-[140px]" title={scan.product_name}>
                            {scan.product_name}
                        </h4>
                        <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground uppercase tracking-wider">
                           <span>{new Date(scan.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Score Badge */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Status Pill */}
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        scan.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        scan.status === 'caution' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    }`}>
                        {scan.status}
                    </div>

                    {/* Trust Score */}
                    <div className="flex flex-col items-end leading-none">
                         <span className={`text-lg font-black tabular-nums tracking-tighter ${
                            scan.status === 'verified' ? 'text-emerald-500' :
                            scan.status === 'caution' ? 'text-amber-500' :
                            'text-rose-500'
                         }`}>
                             {scan.trust_score.toFixed(0)}
                         </span>
                    </div>
                </div>
            </div>
            )) : (
                 <div className="min-w-[300px] p-4 text-center text-xs font-mono text-muted-foreground">
                    Listening for incoming signals...
                 </div>
            )}
        </div>
        
        {/* Mask Gradients for fade effect */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

         {(loading) && (
              <div className="flex justify-center py-4 absolute inset-0 items-center bg-background/50 backdrop-blur-sm z-20">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Feed...</span>
              </div>
        )}
      </div>
    </div>
  );
}
