'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BarChart2, Scale, Flame } from 'lucide-react';

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
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
             <div className="relative w-8 h-8 flex items-center justify-center rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 overflow-hidden">
                <img src="/logo.png" alt="Skeptek Logo" className="w-full h-full object-cover" />
             </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight group-hover:opacity-80 transition-opacity">
                Skeptek
            </span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {mode === 'app' && onViewChange && (
            <div className="flex bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as ViewType)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-out flex items-center gap-2 ${
                    currentView === item.id
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                    <item.icon className="w-4 h-4 opacity-70" />
                    <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'static' && (
             <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 font-medium">
                    ← Back to Search
                </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
