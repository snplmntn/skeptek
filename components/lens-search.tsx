'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { FocalAlignmentLoader } from '@/components/focal-alignment-loader'; 
import { LensInput } from '@/components/lens-input';
import { GlobalFeed } from '@/components/global-feed';
import { analyzeImage } from '@/app/actions/analyze';
import { Modal } from '@/components/ui/modal';
import { Camera, Search, AlertTriangle, Info } from 'lucide-react';
import { getFriendlyErrorMessage } from '@/lib/error-mapping';

interface LensSearchProps {
  onSearch: (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean }) => void;
  initialQuery?: string;
  initialMode?: 'text' | 'image';
}

const recentScans = [
  { name: 'Sony WH-1000XM5', score: 9.2, status: 'verified' },
  { name: 'AirPods Pro', score: 8.7, status: 'verified' },
  { name: 'Generic Blender', score: 2.1, status: 'rejected' },
  { name: 'iPhone 15 Pro', score: 8.9, status: 'verified' },
  { name: 'Budget Monitor', score: 4.3, status: 'caution' },
];

export function LensSearch({ onSearch, initialQuery, initialMode = 'text' }: LensSearchProps) {
  // Auto-detect versus mode from initial query if present
  const isInitialVersus = initialQuery?.includes(' vs ') || false;
  const initialQueries = isInitialVersus && initialQuery ? initialQuery.split(' vs ') : (initialQuery ? [initialQuery] : ['']);

  const [queries, setQueries] = useState<string[]>(initialQueries);
  const [isVersusMode, setIsVersusMode] = useState(isInitialVersus);
  const [searchMode, setSearchMode] = useState<'text' | 'image'>(initialMode);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [displayedScans, setDisplayedScans] = useState<typeof recentScans>([]);
  const [scanIndex, setScanIndex] = useState(0);
  
  // Error Modal State
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Cycle through scans
    const interval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % recentScans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show scans in sequence
    const displayed = [];
    for (let i = 0; i < 3; i++) {
      displayed.push(recentScans[(scanIndex + i) % recentScans.length]);
    }
    setDisplayedScans(displayed);
  }, [scanIndex]);

  const handleImageAnalysis = async (file: File) => {
      setIsAnalyzingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const result = await analyzeImage(formData);
        if (result.success && result.data) {
           const productName = result.data.productName;
           // Gamification: XP Gain
           toast("🔍 Evidence Analyzed", {
             description: "XP +50 | Rank Progress: [====--]",
             action: {
               label: "View",
               onClick: () => console.log("XP Clicked")
             }
           });
           
           // Auto-trigger search with the identified product
           onSearch(productName, `/product/${productName.toLowerCase().replace(/\s+/g, '-')}`, { mode: 'image', isVersus: false });
        } else {
           console.error("Image Analysis Failed", result.error);
           setErrorMsg(result.error || "Could not identify product from image.");
           setIsErrorOpen(true);
        }
      } catch (e) {
         console.error(e);
         setErrorMsg((e as Error).message);
         setIsErrorOpen(true);
      } finally {
         setIsAnalyzingImage(false);
      }
  };

  // Toggle Logic: 
  // If Going to Versus -> Ensure at least 2 inputs
  // If Going to Single -> Reset to 1 input (keep first value)
  const toggleMode = () => {
       if (!isVersusMode) {
           setQueries([queries[0], '']); // Start with 2 slots
           setIsVersusMode(true);
       } else {
           setQueries([queries[0]]); // Back to single
           setIsVersusMode(false);
       }
  };

  const updateQuery = (index: number, val: string) => {
       const newQueries = [...queries];
       newQueries[index] = val;
       setQueries(newQueries);
  };

  const addProduct = () => {
      if (queries.length < 4) {
          setQueries([...queries, '']);
      }
  };

  const removeProduct = (index: number) => {
      if (queries.length > 2) {
          const newQueries = queries.filter((_, i) => i !== index);
          setQueries(newQueries);
      }
  };

  const handleSearch = () => {
    // Filter empty strings
    const validQueries = queries.map(q => q.trim()).filter(q => q.length > 0);
    
    if (validQueries.length === 0) return;

    let finalQuery = validQueries[0];
    if (isVersusMode && validQueries.length > 1) {
         finalQuery = validQueries.join(' vs ');
    }

    if (finalQuery) {
      onSearch(finalQuery, `/product/${finalQuery.toLowerCase().replace(/\s+/g, '-')}`, { mode: 'text', isVersus: isVersusMode });
    }
  };

  const handleExampleClick = (example: string) => {
    if (example.includes(' vs ')) {
         setIsVersusMode(true);
         const parts = example.split(' vs ');
         setQueries(parts);
         // Auto-search or let user see? Let's just fill it.
         onSearch(example, `/product/${example.toLowerCase().replace(/\s+/g, '-')}`, { mode: 'text', isVersus: true });
         return;
    }

    setIsVersusMode(false);
    setQueries([example]);
    onSearch(example, `/product/${example.toLowerCase().replace(/\s+/g, '-')}`, { mode: 'text', isVersus: false });
  };

  // derived state for checks
  const canSearch = queries.some(q => q.trim().length > 0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-2xl relative">
        {/* Decorative Background Elements */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Section */}
        <div className="mb-20 text-center relative z-10">
          <h1 className="mb-2 text-6xl font-black tracking-tight text-foreground bg-gradient-to-b from-zinc-800 to-zinc-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent">
            Skeptek
          </h1>
          <p className="text-sm font-mono tracking-[0.2em] uppercase text-primary/80">
            Deep Product Analysis
          </p>
          <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100/50 dark:bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-crosshair">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Rank: Smart Shopper</span>
               </div>
          </div>
        </div>

        {/* Mode Toggle (Text vs Image) */}
        <div className="mb-4 flex justify-center gap-4">
             {/* Text/Versus Toggle */}
             {searchMode === 'text' && (
             <button 
                onClick={toggleMode}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-300
                    ${isVersusMode 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                `}
             >
                 <span className={!isVersusMode ? "opacity-100 font-black text-foreground" : "opacity-50"}>single</span>
                 <div className="w-8 h-4 rounded-full bg-foreground/10 relative mx-1 shadow-inner">
                     <div className={`absolute top-0.5 bottom-0.5 w-3 rounded-full shadow-sm transition-all duration-300 ${isVersusMode ? 'left-4 bg-primary' : 'left-1 bg-foreground'}`} />
                 </div>
                 <span className={isVersusMode ? "opacity-100 font-black text-primary" : "opacity-50"}>Compare</span>
             </button>
             )}

             {/* Visual Mode Toggle */}
             <button
                onClick={() => setSearchMode(prev => prev === 'text' ? 'image' : 'text')}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-300
                    ${searchMode === 'image'
                        ? 'bg-cyan-100/50 dark:bg-cyan-950/30 border-cyan-500 text-cyan-700 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50'}
                `}
             >
                <Camera className="w-4 h-4" />
                <span>{searchMode === 'image' ? 'Visual Mode Active' : 'Visual Scan'}</span>
             </button>
        </div>

        {/* Massive Floating Search Bar Container */}
        <div className={`mb-12 rounded-2xl bg-white/80 dark:bg-white/5 p-2 forensic-glass shadow-2xl relative z-10 group transition-all duration-500 flex flex-col gap-2`}>
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />

          {/* Input Area */}
          <div className="relative">
              {searchMode === 'text' ? (
                  <>
                    <div className={`flex flex-col gap-0 overflow-hidden rounded-xl ${isVersusMode ? 'divide-y divide-border/50 dark:divide-white/5 bg-secondary/30 dark:bg-black/20' : ''}`}>
                         {queries.map((q, idx) => (
                            <div key={idx} className="flex items-center relative group/input">
                                {(idx === 0 || !isVersusMode) && (
                                    <div className="flex h-16 w-12 items-center justify-center flex-shrink-0 relative">
                                        <Search className="w-5 h-5 text-primary opacity-70" />
                                    </div>
                                )}
                                {isVersusMode && idx > 0 && (
                                    <div className="flex h-16 w-12 items-center justify-center flex-shrink-0 text-xs font-black text-primary/50 italic">VS</div>
                                )}
                                <input
                                    type="text"
                                    placeholder={isVersusMode ? `Product ${idx+1}` : "Search product, paste link, or ask..."}
                                    value={q}
                                    onChange={(e) => updateQuery(idx, e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 h-16 bg-transparent text-base font-mono placeholder:text-slate-600 focus:outline-none text-foreground relative pr-4"
                                    autoFocus={isVersusMode && idx === queries.length - 1}
                                />
                                {isVersusMode && queries.length > 2 && (
                                     <button onClick={() => removeProduct(idx)} className="w-10 h-16 flex items-center justify-center text-rose-500/50 hover:text-rose-500 opacity-0 group-hover/input:opacity-100">✕</button>
                                )}
                            </div>
                         ))}
                    </div>
                    
                    {/* Actions Footer */}
                    <div className="flex gap-2 mt-2">
                         {isVersusMode && queries.length < 4 && (
                             <button onClick={addProduct} className="flex-1 h-12 rounded-xl border-dashed border border-white/10 hover:border-primary/50 text-slate-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">+ Add Product</button>
                         )}
                        <Button
                            onClick={handleSearch}
                            disabled={!canSearch}
                            className="flex-none h-12 px-8 rounded-xl font-bold text-sm tracking-widest uppercase bg-primary hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 relative overflow-hidden group/btn ml-auto w-full md:w-auto"
                        >
                            <span className="relative z-10">{isVersusMode ? 'COMPARE' : 'SCAN'}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </div>
                  </>
              ) : (
                  <div className="p-2 relative">
                       {/* Close / Return to Text Mode */}
                       {!isAnalyzingImage && (
                         <button 
                           onClick={() => setSearchMode('text')}
                           className="absolute top-4 right-4 z-20 p-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-all"
                           title="Close Visual Mode"
                         >
                           <span className="sr-only">Close</span>
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                         </button>
                       )}

                       {isAnalyzingImage ? (
                           <div className="min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/50 rounded-xl bg-cyan-950/10">
                               <FocalAlignmentLoader status="Analyzing Visual Evidence..." />
                           </div>
                       ) : (
                           <LensInput onFileSelect={handleImageAnalysis} />
                       )}
                  </div>
              )}
          </div>
        </div>

        {/* Live Pulse Ticker (Global Watchtower) */}
        <GlobalFeed />

        {/* Quick Examples */}
        <div className="mb-12 space-y-4 relative z-10">
          <p className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Recent Scans:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Sony WH-1000XM5',
              'Budget Coffee Maker',
              'iPhone vs Pixel',
            ].map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="rounded-lg bg-secondary/30 dark:bg-white/5 px-4 py-2 text-xs font-mono text-muted-foreground dark:text-slate-400 border border-border/50 dark:border-white/5 hover:border-primary/50 hover:text-primary transition-all duration-300 shadow-sm hover:bg-secondary/50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Footer */}
        <div className="border-t border-slate-200 pt-8 flex justify-center pb-8">
          <Link href="/how-it-works">
            <Button variant="outline" className="gap-2 rounded-full border-border/50 dark:border-white/10 bg-secondary/50 dark:bg-white/5 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary dark:hover:bg-white/10 hover:border-foreground/20 dark:hover:border-white/20 shadow-sm transition-all hover:scale-105">
              <span className="font-semibold">How Skeptek Works</span>
              <span className="text-primary/70">→</span>
            </Button>
          </Link>
        </div>
        {/* Error Modal */}
        <Modal 
          isOpen={isErrorOpen} 
          onClose={() => setIsErrorOpen(false)}
          title={errorMsg ? getFriendlyErrorMessage(errorMsg).title : "Analysis Failed"}
        >
          {(() => {
             const friendly = getFriendlyErrorMessage(errorMsg || "");
             return (
               <div className="flex flex-col gap-6">
                   <div className="flex items-start gap-4 text-rose-500 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                      <div className="p-1 rounded-full bg-rose-500/20 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold uppercase tracking-wider mb-1">{friendly.title}</p>
                         <p className="text-sm text-rose-400 font-medium leading-relaxed">
                            {friendly.message}
                         </p>
                      </div>
                   </div>
                   
                   {/* Technical Details Accordion */}
                   {friendly.isTechnical && friendly.originalError && (
                       <details className="group">
                           <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-2 select-none">
                               <Info className="w-3 h-3" />
                               <span>Technical Details</span>
                           </summary>
                           <div className="mt-2 bg-black/40 rounded-md p-3 border border-white/10 overflow-hidden">
                                <code className="text-[10px] text-rose-300/80 font-mono whitespace-pre-wrap break-words block" style={{ overflowWrap: 'anywhere' }}>
                                    {friendly.originalError}
                                </code>
                           </div>
                       </details>
                   )}

                   {/* Only show "Dropshipping Insight" if it's NOT a technical API error */}
                   {!friendly.isTechnical && (
                       <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3">
                            <div className="text-amber-500 shrink-0">⚠️</div>
                            <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
                               <strong>Insight:</strong> If this looks like a generic product, the lack of visual match might indicate a 
                               <span className="text-amber-100 font-bold"> white-label/dropshipped item</span> with no established brand presence.
                            </p>
                       </div>
                   )}
    
                   <div className="flex justify-end gap-3 mt-2">
                       <Button 
                         onClick={() => setIsErrorOpen(false)}
                         className="rounded-xl bg-primary hover:bg-blue-500 text-white shadow-lg shadow-primary/20"
                       >
                           Try Again
                       </Button>
                   </div>
               </div>
             );
          })()}
        </Modal>
      </div>
    </div>
  );
}
