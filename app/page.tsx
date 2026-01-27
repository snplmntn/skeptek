'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { LensSearch } from '@/components/lens-search';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { VersusArena } from '@/components/versus-arena';
import { DiscoveryPodium } from '@/components/discovery-podium';

type ViewType = 'lens-search' | 'analysis' | 'versus' | 'discovery';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('lens-search');
  const [selectedSearch, setSelectedSearch] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const handleSearch = (title: string, url: string) => {
    setSelectedSearch({ title, url });
    setCurrentView('analysis');
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />
      
      <div className="relative">
        {currentView === 'lens-search' && (
          <LensSearch onSearch={handleSearch} />
        )}
        {currentView === 'analysis' && selectedSearch && (
          <AnalysisDashboard search={selectedSearch} onBack={() => setCurrentView('lens-search')} />
        )}
        {currentView === 'versus' && (
          <VersusArena />
        )}
        {currentView === 'discovery' && (
          <DiscoveryPodium />
        )}
      </div>
    </main>
  );
}
