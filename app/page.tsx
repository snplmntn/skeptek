'use client';

import { useState } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { analyzeProduct } from '@/app/actions/analyze';
import { Navigation } from '@/components/navigation';
import { LensSearch } from '@/components/lens-search';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { VersusArena } from '@/components/versus-arena';
import { DiscoveryPodium } from '@/components/discovery-podium';
import { ForensicLensLoader } from '@/components/forensic-lens-loader';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

type ViewType = 'lens-search' | 'analyzing' | 'analysis' | 'versus' | 'discovery';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('lens-search');
  const [selectedSearch, setSelectedSearch] = useState<{
    title: string;
    url: string;
  } | null>(null);
  const [isAnalysisFinishing, setIsAnalysisFinishing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Error Handling State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const handleSearch = async (title: string, url: string) => {
    // 1. Enter Analysis Mode (Loader)
    setSelectedSearch({ title, url });
    setCurrentView('analyzing');
    setIsAnalysisFinishing(false);
    setAnalysisStatus("INITIALIZING_AGENTS...");
    setAnalysisResult(null);
    setErrorMsg(null);


    // 2. Call the Server Action (Orchestrator)
    try {
        const { status, result } = await analyzeProduct(title);

        // Stream the status updates (Fan-Out progress)
        for await (const message of readStreamableValue(status)) {
            if (message) setAnalysisStatus(message as string);
        }

        // Stream the final result (Fan-In synthesis)
        let finalData = null;
        for await (const data of readStreamableValue(result)) {
             setAnalysisResult(data);
             finalData = data;
        }

        if (!finalData) {
            throw new Error("No data received");
        }

        // Trigger finish animation only after we have data
        setIsAnalysisFinishing(true);

    } catch (error) {
        console.error("Analysis Failed", error);
        // Improved Error Handling: Show Modal instead of Alert
        setErrorMsg((error as Error).message);
        setIsErrorOpen(true);
        setCurrentView('lens-search');
    }
  };

  const handleAnalysisComplete = () => {
        if (!selectedSearch || !analysisResult) return; 
        
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
    <main className="min-h-screen bg-background">
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
             <div className="fixed inset-0 z-50 bg-background">
                <ForensicLensLoader 
                    isFinishing={isAnalysisFinishing}
                    onComplete={handleAnalysisComplete}
                    status={analysisStatus}
                />
             </div>
        )}

        {/* Results States */}
        {currentView === 'analysis' && (
          <AnalysisDashboard 
            search={selectedSearch || { title: "Demo Product Analysis", url: "#" }} 
            data={analysisResult}
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

      {/* Error Modal */}
      <Modal 
        isOpen={isErrorOpen} 
        onClose={() => setIsErrorOpen(false)}
        title="Analysis Paused"
      >
        <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 text-rose-500 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                   <p className="text-sm font-bold uppercase tracking-wider mb-1">Insufficient Data</p>
                   <p className="text-sm text-rose-400 font-medium">{errorMsg || "An unknown error occurred."}</p>
                </div>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed font-mono">
                We couldn't verify enough reliable data sources regarding this product to generate a confident verdict. 
                To ensure accuracy, the analysis was paused. Please try a different product or specific model name.
            </p>

            <div className="flex justify-end gap-3 mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsErrorOpen(false)}
                  className="rounded-xl border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                >
                    Dismiss
                </Button>
                <Button 
                  onClick={() => setIsErrorOpen(false)}
                  className="rounded-xl bg-primary hover:bg-blue-500 text-white shadow-lg shadow-primary/20"
                >
                    Try New Search
                </Button>
            </div>
        </div>
      </Modal>
    </main>
  );
}
