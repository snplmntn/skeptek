'use client';

import { Button } from '@/components/ui/button';

type ViewType = 'lens-search' | 'analysis' | 'versus' | 'discovery';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'lens-search', label: 'Search' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'versus', label: 'Versus' },
    { id: 'discovery', label: 'Trending' },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <button
          onClick={() => onViewChange('lens-search')}
          className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="text-xl font-bold text-slate-900">Skeptek</div>
        </button>

        <div className="flex gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`text-sm font-medium ${
                currentView === item.id
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              size="sm"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
