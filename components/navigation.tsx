'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, Flame, LogIn, LogOut, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';

type ViewType = 'lens-search' | 'analysis' | 'versus' | 'discovery' | 'my-reports';

interface NavigationProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  mode?: 'app' | 'static';
  user?: { isGuest: boolean; rank: string; xp: number; email?: string | null; nextRankXP?: number } | null;
}

import { signOutAction } from '@/app/actions/auth';

// ... (imports remain same except I will remove unused ones if easier, but replace block is simpler)

export function Navigation({ currentView = 'lens-search', onViewChange, mode = 'app', user }: NavigationProps) {
  const router = useRouter();

  const handleLogout = async () => {
      await signOutAction();
      toast.success("Successfully logged out");
  };

  const navItems = [
    { id: 'lens-search', label: 'Search', icon: Search },
    { id: 'discovery', label: 'Trending', icon: Flame },
  ];

  // Calculate XP Progress
  const currentXP = user?.xp || 0;
  const nextXP = user?.nextRankXP || 1000;
  const progressPercent = Math.min(100, (currentXP / nextXP) * 100);

  return (
    <nav className="border-b border-slate-200 dark:border-white/5 forensic-glass sticky top-0 z-[100]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* Logo Section */}
        <div className="flex items-center gap-8">
            <Link 
                href="/" 
                onClick={(e) => {
                    if (onViewChange) {
                        e.preventDefault();
                        onViewChange('lens-search');
                    }
                }}
                className="flex items-center gap-3 group"
            >
                 <div className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                    <img src="/icon.png" alt="Skeptek Icon" className="w-8 h-8 object-contain relative z-10 brightness-110" />
                 </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-foreground tracking-tighter group-hover:text-primary transition-colors leading-none uppercase italic">
                      Skeptek
                  </span>
                  <span className="text-[7px] font-mono tracking-[0.4em] text-muted-foreground uppercase mt-0.5">ANALYSIS_ENGINE</span>
                </div>
            </Link>

            {mode === 'static' && (
                <Link href="/">
                    <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground font-medium text-xs uppercase tracking-wider gap-2">
                        <span>←</span> Back
                    </Button>
                </Link>
            )}
        </div>
        
        <div className="flex items-center gap-4">
             <ThemeToggle />
          {mode === 'app' && onViewChange && (
            <div className="flex bg-muted/20 p-1 rounded-xl border border-border ring-1 ring-black/5 dark:ring-white/5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as ViewType)}
                  className={`relative px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ease-out flex items-center gap-2 group/btn ${
                    currentView === item.id
                      ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                    <item.icon className={`w-3.5 h-3.5 transition-transform ${currentView === item.id ? 'scale-110' : 'opacity-50'}`} />
                    <span className="hidden md:inline">{item.label}</span>
                    {currentView === item.id && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 bg-primary rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                </button>
              ))}
            </div>
          )}

          {/* User Auth Section */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>
          
          {user?.isGuest ? (
              <Link href="/login">
                  <Button variant="ghost" size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] uppercase font-bold tracking-wider rounded-lg h-9 gap-2">
                      <LogIn className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sign In</span>
                  </Button>
              </Link>
          ) : (
             <div className="flex items-center gap-3">
                 
                 <Popover>
                    <PopoverTrigger asChild>
                         <button className="flex items-center gap-3 group outline-none">
                             <div className="flex flex-col items-end hidden sm:flex">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-primary group-hover:text-primary/80 transition-colors">
                                     {user?.rank || 'Window Shopper'}
                                 </span>
                                 <span className="text-[9px] font-mono text-muted-foreground">
                                     XP: {user?.xp || 0}
                                 </span>
                             </div>
                             <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:ring-2 ring-primary/20 transition-all">
                                <User className="w-4 h-4" />
                             </div>
                         </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border" align="end">
                        <div className="p-4 border-b border-border/50 bg-muted/20">
                            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Account Details</h4>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                                {user?.email || "User"}
                            </p>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {/* Rank Info */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Current Level</span>
                                <span className="text-sm font-black text-primary uppercase">{user?.rank || 'Window Shopper'}</span>
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full bg-primary/5 border-primary/20 hover:bg-primary/20 text-primary font-bold uppercase tracking-widest text-[10px] gap-2 h-10"
                                onClick={() => onViewChange?.('my-reports')}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                My Reviews
                            </Button>

                            {/* Progress Section */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                    <span>XP PROGRESS</span>
                                    <span>{currentXP} / {nextXP}</span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                            </div>

                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="w-full mt-2 text-xs font-bold uppercase tracking-widest gap-2"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-3 h-3" />
                                Log Out
                            </Button>
                        </div>
                    </PopoverContent>
                 </Popover>
             </div>
          )}


        </div>
      </div>
    </nav>
  );
}
