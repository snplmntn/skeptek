'use client';

import { useState, useEffect, Suspense } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { useSearchParams } from 'next/navigation';
import { analyzeProduct } from '@/app/actions/analyze';
import { Navigation } from '@/components/navigation';
import { LensSearch } from '@/components/lens-search';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { VersusArena } from '@/components/versus-arena';
import { DiscoveryPodium } from '@/components/discovery-podium';
import { ForensicLensLoader } from '@/components/forensic-lens-loader';
import { ProfileReportsView } from '@/components/profile-reports-view';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
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
  
  // Error Handling State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'data' | 'network'>('data');
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  // User Rank State
  const [userRank, setUserRank] = useState<{ isGuest: boolean; rank: string; xp: number; nextRankXP: number; email?: string | null } | null>(null);

  useEffect(() => {
    getUserProfile().then(setUserRank);
  }, []);

  const handleSearch = async (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean, isReview?: boolean }) => {
    // 1. Enter Analysis Mode (Loader)
    setSelectedSearch({ title, url, mode: metadata?.mode, isReview: metadata?.isReview });
    setCurrentView('analyzing');
    setIsAnalysisFinishing(false);
    setAnalysisStatus("INITIALIZING_ANALYSIS...");
    setAnalysisResult(null);
    setErrorMsg(null);


    // 2. Call the Server Action (Orchestrator)
    try {
        const { status, result } = await analyzeProduct(title, { isReviewMode: metadata?.isReview });

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

        // Check for Backend Reports Errors (like 429s or No Data)
        if (finalData.isError || finalData.error) {
             // Handle gracefully without throwing (avoids console noise)
             setErrorMsg(finalData.error || "Analysis was halted due to a system error.");
             setErrorType('data'); // Application level error
             setIsErrorOpen(true);
             setCurrentView('lens-search');
             return;
        }

        // Trigger finish animation only after we have data
        setIsAnalysisFinishing(true);

    } catch (error) {
        console.error("Unexpected System Error", error);
        // Fallback for unexpected crashes (e.g. network fail)
        setErrorMsg((error as Error).message);
        setErrorType('network'); // Transport level error
        setIsErrorOpen(true);
        setCurrentView('lens-search');
    }
  };

  const handleAnalysisComplete = () => {
        if (!selectedSearch || !analysisResult) return; 
        
        // STRICT GATEKEEPER: Ensure we have actual data before showing results
        // This prevents "Ghost Pages" where the backend returns success but empty data
        
        let isValidData = false;

        if (analysisResult.type === 'comparison') {
             // For comparisons, check if we hit the fallback "Data Unavailable" state
             // The backend sets winReason="Data Unavailable" and pros=["Simulation"] on failure
             const isFallback = analysisResult.winReason === "Data Unavailable" || 
                                analysisResult.products?.some((p: any) => p.details?.pros?.includes("Simulation"));
             isValidData = !isFallback && (analysisResult.products && analysisResult.products.length > 0);
        } else {
             // For single products, check if it's explicitly marked as simulated or missing name
             const isSimulated = analysisResult.isSimulated || false;
             // SOTA: In Review Mode, we allow simulated/basic data because the USER is the verifier.
             const allowSimulation = selectedSearch?.isReview;
             
             // Guard: If analysisResult is empty/null, it's invalid.
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

        // Check for specific backend signal first
        if (analysisResult.type === 'comparison') {
             setCurrentView('versus');
             return;
        }

        const lowerTitle = selectedSearch.title.toLowerCase();
        // Fallback intent check
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
       // Just go back to search view, pre-filling is handled by passing selectedSearch.title prop
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
          />
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
            userRank={userRank?.rank}
            isReviewMode={selectedSearch?.isReview}
          />
        )}
        {currentView === 'versus' && (
          <VersusArena 
            data={analysisResult} 
            onBack={() => setCurrentView('lens-search')}
          />
        )}
        {currentView === 'discovery' && (
          <DiscoveryPodium />
        )}
        {currentView === 'my-reports' && (
          <ProfileReportsView onBack={() => setCurrentView('lens-search')} />
        )}
      </div>

      {/* Error Modal */}
      <Modal 
        isOpen={isErrorOpen} 
        onClose={() => setIsErrorOpen(false)}
        title={errorMsg ? getFriendlyErrorMessage(errorMsg).title : "Analysis Failed"}
      >
        {(() => {
            const friendly = getFriendlyErrorMessage(errorMsg || "");
            const isNet = friendly.title === 'Connection Issue';
            
            return (
                <div className="flex flex-col gap-6">
                    {/* Main Error Alert */}
                    <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                        isNet 
                        ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                    }`}>
                        <div className={`p-1 rounded-full shrink-0 ${isNet ? 'bg-slate-200 dark:bg-slate-700' : 'bg-rose-100 dark:bg-rose-500/20'}`}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                        <p className="text-sm font-bold uppercase tracking-wider mb-1">
                            {friendly.title}
                        </p>
                        <p className="text-sm font-medium opacity-90 leading-relaxed">
                             {friendly.message}
                        </p>
                        </div>
                    </div>
                    
                    {/* Technical Log (Hidden by default) */}
                    {friendly.originalError && (
                       <details className="group">
                           <summary className="cursor-pointer text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-foreground flex items-center gap-2 select-none transition-colors">
                               <Info className="w-3 h-3" />
                               <span>Technical Details</span>
                           </summary>
                           <div className="mt-2 bg-slate-100 dark:bg-black/30 rounded-md p-3 border border-slate-200 dark:border-white/5 overflow-hidden">
                                <code className="text-[10px] text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap break-words block" style={{ overflowWrap: 'anywhere' }}>
                                    {friendly.originalError}
                                </code>
                           </div>
                       </details>
                    )}
                    
                    {/* Warning Box (Only for Non-Technical / Data Errors) */}
                    {!friendly.isTechnical && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-lg flex gap-3">
                            <div className="text-amber-600 dark:text-amber-500 shrink-0">⚠️</div>
                            <p className="text-xs text-amber-800 dark:text-amber-200/80 font-mono leading-relaxed">
                                <strong>Warning:</strong> A complete lack of digital footprint often indicates a 
                                <span className="text-amber-900 dark:text-amber-100 font-bold"> very new listing</span> or a 
                                <span className="text-amber-900 dark:text-amber-100 font-bold"> potential scam/dropshipping product</span>. 
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <Button 
                        variant="outline" 
                        onClick={() => setIsErrorOpen(false)}
                        className="rounded-xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                        >
                            Dismiss
                        </Button>
                        <Button 
                        onClick={handleRetry}
                        className="rounded-xl bg-primary hover:bg-blue-500 text-white shadow-lg shadow-primary/20"
                        >
                            {isNet ? "Retry Connection" : "Search Again"}
                        </Button>
                    </div>
                </div>
            );
        })()}
      </Modal>
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
