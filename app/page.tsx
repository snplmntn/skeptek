'use client';

import { useState, useEffect, Suspense } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { useSearchParams } from 'next/navigation';
import { analyzeProduct } from '@/app/actions/analyze';
import { Navigation } from '@/components/navigation';
import { LensSearch } from '@/components/lens-search';
import { Modal } from '@/components/ui/modal';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AnalysisDashboard = dynamic(() => import('@/components/analysis-dashboard').then(mod => mod.AnalysisDashboard), { 
    loading: () => <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>,
    ssr: false 
});
const VersusArena = dynamic(() => import('@/components/versus-arena').then(mod => mod.VersusArena), { ssr: false });
const DiscoveryPodium = dynamic(() => import('@/components/discovery-podium').then(mod => mod.DiscoveryPodium), { ssr: false });
const ForensicLensLoader = dynamic(() => import('@/components/forensic-lens-loader').then(mod => mod.ForensicLensLoader), { ssr: false });
const ProfileReportsView = dynamic(() => import('@/components/profile-reports-view').then(mod => mod.ProfileReportsView), { ssr: false });
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';
import { getFriendlyErrorMessage } from '@/lib/error-mapping';
import { getUserProfile } from '@/app/actions/user';

type ViewType = 'lens-search' | 'analyzing' | 'analysis' | 'versus' | 'discovery' | 'my-reports';

function HomeContent() {
  const searchParams = useSearchParams();
  const initialReviewMode = searchParams.get('action') === 'review';

  const [currentView, setCurrentView] = useState<ViewType>('lens-search');
  const [selectedSearch, setSelectedSearch] = useState<{
    title: string;
    url: string;
    mode?: 'text' | 'image';
    isReview?: boolean;
  } | null>(null);
  
  const [isAnalysisFinishing, setIsAnalysisFinishing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // error handling state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'data' | 'network'>('data');
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  // user rank state
  const [userRank, setUserRank] = useState<{ isGuest: boolean; rank: string; xp: number; nextRankXP: number; email?: string | null } | null>(null);

  useEffect(() => {
    getUserProfile().then(setUserRank);
  }, []);

  const handleSearch = async (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean, isReview?: boolean }) => {
    // 1. enter analysis mode (loader)
    setSelectedSearch({ title, url, mode: metadata?.mode, isReview: metadata?.isReview });
    setCurrentView('analyzing');
    setIsAnalysisFinishing(false);
    setAnalysisStatus("INITIALIZING_ANALYSIS...");
    setAnalysisResult(null);
    setErrorMsg(null);


    // 2. call the server action (orchestrator)
    try {
        const { status, result } = await analyzeProduct(title, { isReviewMode: metadata?.isReview });

        // stream the status updates (fan-out progress)
        for await (const message of readStreamableValue(status)) {
            if (message) setAnalysisStatus(message as string);
        }

        // stream the final result (fan-in synthesis)
        let finalData = null;
        for await (const data of readStreamableValue(result)) {
             setAnalysisResult(data);
             finalData = data;
        }

        if (!finalData) {
            throw new Error("No data received");
        }

        // check for backend reports errors (like 429s or no data)
        if (finalData.isError || finalData.error) {
             // handle gracefully without throwing
             setErrorMsg(finalData.error || "Analysis was halted due to a system error.");
             setErrorType('data');
             setAnalysisStatus("Analysis Failed"); // update status text
             // do not switch view yet. let animation finish.
             setIsAnalysisFinishing(true);
             return;
        }

        // trigger finish animation only after we have data
        setIsAnalysisFinishing(true);

    } catch (error) {
        console.error("Unexpected System Error", error);
        // fallback for unexpected crashes (e.g. network fail)
        setErrorMsg((error as Error).message);
        setErrorType('network');
        setAnalysisStatus("System Error"); // update status text
        // do not switch view yet. let animation finish.
        setIsAnalysisFinishing(true);
    }
  };

  const handleAnalysisComplete = () => {
        // error handling gate: if an error was caught during fetch, show it now
        if (errorMsg) {
             setIsErrorOpen(true);
             setCurrentView('lens-search');
             return;
        }

        if (!selectedSearch || !analysisResult) return; 
        
        // strict gatekeeper: ensure we have actual data before showing results
        // this prevents "ghost pages" where the backend returns success but empty data
        
        let isValidData = false;

        if (analysisResult.type === 'comparison') {
             // for comparisons, check if we hit the fallback "data unavailable" state
             // the backend sets winreason="data unavailable" and pros=["simulation"] on failure
             const isFallback = analysisResult.winReason === "Data Unavailable" || 
                                analysisResult.products?.some((p: any) => p.details?.pros?.includes("Simulation"));
             isValidData = !isFallback && (analysisResult.products && analysisResult.products.length > 0);
        } else {
             // for single products, check if it's explicitly marked as simulated or missing name
             const isSimulated = analysisResult.isSimulated || false;
             // if in review mode, we allow simulated/basic data because the user is the verifier.
             const allowSimulation = selectedSearch?.isReview;
             
             // guard: if analysisresult is empty/null, it's invalid.
             const hasName = !!analysisResult.productName;
             
             isValidData = (allowSimulation || !isSimulated) && hasName;
        }
        
        if (!isValidData) {
             console.error("Analysis Validation Failed", { isSimulated: analysisResult?.isSimulated, hasName: !!analysisResult?.productName, result: analysisResult });
             setErrorMsg("We could not verify this product's identity. Please try a more specific name.");
             setErrorType('data');
             setIsErrorOpen(true);
             setCurrentView('lens-search');
             return;
        }

        // check for specific backend signal first
        if (analysisResult.type === 'comparison') {
             setCurrentView('versus');
             return;
        }

        const lowerTitle = selectedSearch.title.toLowerCase();
        // fallback intent check
        if (lowerTitle.includes(' vs ') || lowerTitle.includes(' versus ') || lowerTitle.includes(' compare ') || lowerTitle.includes(' or ')) {
            setCurrentView('versus');
        } else {
             setCurrentView('analysis');
        }
  };
    
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleRetry = () => {
       setIsErrorOpen(false);
       // just go back to search view, pre-filling is handled by passing selectedSearch.title prop
       setCurrentView('lens-search');
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView === 'analyzing' ? 'lens-search' : currentView as any} 
        onViewChange={handleViewChange} 
        user={userRank}
      />

      <div className="relative">
        {currentView === 'lens-search' && (
          <LensSearch 
            onSearch={handleSearch} 
            initialQuery={selectedSearch?.title} 
            initialMode={selectedSearch?.mode}
            initialReviewMode={initialReviewMode}
            user={userRank}
            error={errorMsg}
            onClearError={() => {
              setIsErrorOpen(false);
              setErrorMsg(null);
            }}
          />
        )}
        
        {/* loader state */}
        {currentView === 'analyzing' && (
             <div className="fixed inset-0 z-50 bg-background">
                <ForensicLensLoader 
                    status={analysisStatus || "Initializing Analysis..."}
                    isFinishing={isAnalysisFinishing}
                    onComplete={handleAnalysisComplete}
                    mode={selectedSearch?.isReview ? 'review' : (selectedSearch?.title.includes(' vs ') ? 'versus' : 'single')}
                    productNames={selectedSearch?.title.includes(' vs ') ? selectedSearch.title.split(' vs ').map(s => s.trim()) : [selectedSearch?.title || 'Unknown']}
                />
             </div>
        )}

        {/* results states */}
        {currentView === 'analysis' && (
          <AnalysisDashboard 
            search={selectedSearch || { title: "Demo Product Analysis", url: "#" }} 
            data={analysisResult}
            onBack={() => {
                setSelectedSearch(null); // clear input on back
                setCurrentView('lens-search');
            }} 
            userRank={userRank?.rank}
            isReviewMode={selectedSearch?.isReview}
          />
        )}
        {currentView === 'versus' && (
          <VersusArena 
            data={analysisResult} 
            onBack={() => {
                setSelectedSearch(null); // clear input on back
                setCurrentView('lens-search');
            }}
          />
        )}
        {currentView === 'discovery' && (
          <DiscoveryPodium />
        )}
        {currentView === 'my-reports' && (
          <ProfileReportsView onBack={() => setCurrentView('lens-search')} />
        )}
      </div>


    </main>
  );
}

export default function Home() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
}
