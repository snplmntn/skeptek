'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BarChart2, Scale, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

type ViewType = 'lens-search' | 'analysis' | 'versus' | 'discovery';

interface NavigationProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  mode?: 'app' | 'static';
}

export function Navigation({ currentView = 'lens-search', onViewChange, mode = 'app' }: NavigationProps) {
  const navItems = [
    { id: 'lens-search', label: 'Search', icon: Search },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    { id: 'versus', label: 'Versus', icon: Scale },
    { id: 'discovery', label: 'Trending', icon: Flame },
  ];

  return (
    <nav className="border-b border-white/5 forensic-glass sticky top-0 z-[100]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* Logo Section */}
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
              <span className="text-[7px] font-mono tracking-[0.4em] text-muted-foreground uppercase mt-0.5">Forensic_Unit</span>
            </div>
        </Link>
        
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

          {mode === 'static' && (
             <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                    ← Back to Search
                </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
