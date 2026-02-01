'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { LensBackground } from '@/components/lens-background';
import { GlobalFeed } from '@/components/global-feed';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { getFriendlyErrorMessage } from '@/lib/error-mapping';
import { LensSearchForm } from './lens-search-form'; // New import

interface LensSearchProps {
  onSearch: (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean, isReview?: boolean }) => void;
  initialQuery?: string;
  initialMode?: 'text' | 'image';
  initialReviewMode?: boolean;
  error?: string | null;
  onClearError?: () => void;
  user?: { isGuest: boolean; rank: string; xp: number; nextRankXP: number } | null;
}

export function LensSearch({ onSearch, initialQuery, initialMode = 'text', initialReviewMode = false, user, error, onClearError }: LensSearchProps) {
  
  // toast error handler
  useEffect(() => {
    if (error) {
      const friendly = getFriendlyErrorMessage(error);
      const isNet = friendly.title === 'Connection Issue';
      
      toast.custom((t) => (
          <div className={`
              w-full max-w-md rounded-xl border backdrop-blur-md p-4 flex flex-col gap-3 shadow-2xl relative overflow-hidden
              ${isNet 
                  ? 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800' 
                  : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/50'}
          `}>
             <div className="flex items-start gap-4 z-10 relative">
                <div className={`p-2 rounded-full shrink-0 ${isNet ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isNet ? 'text-slate-700 dark:text-slate-300' : 'text-rose-700 dark:text-rose-400'}`}>
                        {friendly.title}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed ${isNet ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600/90 dark:text-rose-300/80'}`}>
                        {friendly.message}
                    </p>

                    {/* dropshipping/scam insight card */}
                    {!friendly.isTechnical && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex gap-2 mt-3 items-start">
                            <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
                            <span className="text-[11px] text-amber-800 dark:text-amber-200/80 font-mono leading-tight">
                               Potential white-label/dropshipped item.
                            </span>
                        </div>
                    )}

                    {/* actions row */}
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => {
                                toast.dismiss(t);
                                onClearError?.();
                            }}
                            className={`
                                text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border transition-colors
                                ${isNet 
                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                                    : 'bg-white/50 border-rose-200 text-rose-700 hover:bg-white'}
                            `}
                        >
                            Dismiss
                        </button>

                         {friendly.originalError && (
                             <button
                                onClick={() => {
                                    navigator.clipboard.writeText(friendly.originalError || "");
                                    toast.success("Error log copied", { duration: 2000 });
                                }}
                                className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-muted-foreground transition-colors"
                             >
                                 <Info className="w-3 h-3" />
                                 Technical Log
                             </button>
                         )}
                    </div>
                </div>
                
                {/* close x (top right) */}
                <button 
                    onClick={() => {
                        toast.dismiss(t);
                        onClearError?.();
                    }}
                    className="absolute -top-1 -right-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="sr-only">Dismiss</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
          </div>
      ), { duration: 10000, id: 'lens-error-toast' });
    }
  }, [error, onClearError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 relative overflow-hidden">
      {/* --- forensic background layer --- */}
      <LensBackground />

      <div className="mx-auto w-full max-w-2xl relative">
        {/* decorative background elements */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* hero section */}
        <div className="mb-20 text-center relative z-10">
          <h1 className="mb-2 text-4xl md:text-6xl font-black tracking-tight text-foreground bg-gradient-to-b from-zinc-800 to-zinc-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent">
            Skeptek
          </h1>
          <p className="text-sm font-mono tracking-[0.2em] uppercase text-primary/80">
            Deep Product Analysis
          </p>

          <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                   <div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100/50 dark:bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-crosshair">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                           {user?.isGuest ? (
                               <Link href="/login" className="hover:underline">Sign In / Register</Link>
                           ) : (
                               `Rank: ${user?.rank || 'Loading...'}`
                           )}
                       </span>
                       
                       {/* xp progress tooltip - only for logged in users */}
                       {user && !user.isGuest && (
                           <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-32 bg-black/90 text-white p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                               <div className="flex justify-between mb-1">
                                   <span>XP</span>
                                   <span>{user.xp} / {user.nextRankXP}</span>
                               </div>
                               <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                   <div 
                                       className="h-full bg-cyan-400" 
                                       style={{ width: `${Math.min(100, (user.xp / user.nextRankXP) * 100)}%` }} 
                                   />
                               </div>
                           </div>
                       )}
                   </div>
          </div>
        </div>

        {/* form component */}
        <LensSearchForm 
            onSearch={onSearch} // Pass straight through
            initialQuery={initialQuery}
            initialMode={initialMode}
            initialReviewMode={initialReviewMode}
            user={user}
        />

        {/* live pulse ticker (global watchtower) */}
        <GlobalFeed />

        {/* minimalist footer */}
        <div className="border-t border-slate-200 pt-8 flex justify-center pb-8">
          <Link href="/how-it-works">
            <Button variant="outline" className="gap-2 rounded-full border-border/50 dark:border-white/10 bg-secondary/50 dark:bg-white/5 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary dark:hover:bg-white/10 hover:border-foreground/20 dark:hover:border-white/20 shadow-sm transition-all hover:scale-105">
              <span className="font-semibold">How Skeptek Works</span>
              <span className="text-primary/70">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
