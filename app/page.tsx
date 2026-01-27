'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { LensSearch } from '@/components/lens-search';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { VersusArena } from '@/components/versus-arena';
import { DiscoveryPodium } from '@/components/discovery-podium';
import { ForensicLensLoader } from '@/components/forensic-lens-loader';

type ViewType = 'lens-search' | 'analyzing' | 'analysis' | 'versus' | 'discovery';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('lens-search');
  const [selectedSearch, setSelectedSearch] = useState<{
    title: string;
    url: string;
  } | null>(null);
  const [isAnalysisFinishing, setIsAnalysisFinishing] = useState(false);

  const handleSearch = (title: string, url: string) => {
    // 1. Enter Analysis Mode (Loader)
    setSelectedSearch({ title, url });
    setCurrentView('analyzing');
    setIsAnalysisFinishing(false);

    // 2. Simulate Analysis Work (Variable Duration)
    // Test: Longer duration for specific example to verify looping
    const isLongTest = title.toLowerCase().includes('iphone') && title.toLowerCase().includes('pixel');
    const analysisDuration = isLongTest ? 8000 : 3000;

    // The loader will loop "investigation" until this timeout fires.
    setTimeout(() => {
        setIsAnalysisFinishing(true);
    }, analysisDuration); // 3s normal, 8s for test example
  };

  const handleAnalysisComplete = () => {
        if (!selectedSearch) return;
        
        const lowerTitle = selectedSearch.title.toLowerCase();
        // Check for comparison intent
        if (lowerTitle.includes(' vs ') || lowerTitle.includes(' versus ') || lowerTitle.includes(' compare ')) {
            setCurrentView('versus');
        } else {
             setCurrentView('analysis');
        }
  };
    
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navigation 
        currentView={currentView === 'analyzing' ? 'lens-search' : currentView as any} 
        onViewChange={handleViewChange} 
      />
      
      <div className="relative">
        {currentView === 'lens-search' && (
          <LensSearch onSearch={handleSearch} />
        )}
        
        {/* Loader State */}
        {currentView === 'analyzing' && (
             <div className="fixed inset-0 z-50 bg-white">
                <ForensicLensLoader 
                    isFinishing={isAnalysisFinishing}
                    onComplete={handleAnalysisComplete}
                />
             </div>
        )}

        {/* Results States */}
        {currentView === 'analysis' && (
          <AnalysisDashboard 
            search={selectedSearch || { title: "Demo Product Analysis", url: "#" }} 
            onBack={() => setCurrentView('lens-search')} 
          />
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
