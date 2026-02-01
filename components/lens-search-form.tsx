'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FocalAlignmentLoader } from '@/components/focal-alignment-loader'; 
import { LensInput } from '@/components/lens-input';
import { analyzeImage } from '@/app/actions/analyze';
import { Camera, Search } from 'lucide-react';

interface LensSearchFormProps {
  onSearch: (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean, isReview?: boolean }) => void;
  initialQuery?: string;
  initialMode?: 'text' | 'image';
  initialReviewMode?: boolean;
  user?: { isGuest: boolean; rank: string; xp: number; nextRankXP: number } | null;
}

export function LensSearchForm({ onSearch, initialQuery, initialMode = 'text', initialReviewMode = false, user }: LensSearchFormProps) {
  const router = useRouter();
  
  // auto-detect versus mode from initial query if present
  const isInitialVersus = initialQuery?.includes(' vs ') || false;
  const initialQueries = isInitialVersus && initialQuery ? initialQuery.split(' vs ') : (initialQuery ? [initialQuery] : ['']);

  const [queries, setQueries] = useState<string[]>(initialQueries);
  const [isVersusMode, setIsVersusMode] = useState(isInitialVersus);
  const [searchMode, setSearchMode] = useState<'text' | 'image'>(initialMode);
  const [reviewMode, setReviewMode] = useState(initialReviewMode);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const handleImageAnalysis = useCallback(async (file: File) => {
      setIsAnalyzingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const result = await analyzeImage(formData);
        if (result.success && result.data) {
           const productName = result.data.productName;
           // gamification: xp gain
           toast("🔍 Evidence Analyzed", {
             description: "XP +50 | Rank Progress: [====--]",
             action: {
               label: "View",
               onClick: () => {} // no-op for now
             }
           });
           
           // auto-trigger search with the identified product
           onSearch(productName, `/product/${productName.toLowerCase().replace(/\s+/g, '-')}`, { mode: 'image', isVersus: false });
        } else {
           console.error("Image Analysis Failed", result.error);
           toast.error("Analysis Failed", {
               description: result.error || "Could not identify product from image."
           });
        }
      } catch (e) {
         console.error(e);
         toast.error("Analysis Error", {
            description: (e as Error).message
         });
      } finally {
         setIsAnalyzingImage(false);
      }
  }, [onSearch]);

  const toggleMode = useCallback(() => {
       if (!isVersusMode) {
           setQueries(prev => [prev[0], '']);
           setIsVersusMode(true);
       } else {
           setQueries(prev => [prev[0]]);
           setIsVersusMode(false);
       }
  }, [isVersusMode]);

  const updateQuery = useCallback((index: number, val: string) => {
       setQueries(prev => {
           const newQueries = [...prev];
           newQueries[index] = val;
           return newQueries;
       });
  }, []);

  const addProduct = useCallback(() => {
      setQueries(prev => {
          if (prev.length < 4) {
              return [...prev, ''];
          }
          return prev;
      });
  }, []);

  const removeProduct = useCallback((index: number) => {
      setQueries(prev => {
          if (prev.length > 2) {
              return prev.filter((_, i) => i !== index);
          }
          return prev;
      });
  }, []);

  const handleSearchClick = useCallback(() => {
    // filter empty strings
    const validQueries = queries.map(q => q.trim()).filter(q => q.length > 0);
    
    if (validQueries.length === 0) return;

    let finalQuery = validQueries[0];
    if (isVersusMode && validQueries.length > 1) {
         finalQuery = validQueries.join(' vs ');
    }

    if (finalQuery) {
      onSearch(finalQuery, `/product/${finalQuery.toLowerCase().replace(/\s+/g, '-')}`, { 
          mode: 'text', 
          isVersus: isVersusMode,
          isReview: reviewMode 
      });
    }
  }, [queries, isVersusMode, reviewMode, onSearch]);

  // derived state for checks
  const canSearch = queries.some(q => q.trim().length > 0);

  return (
    <>
        {/* mode toggle (text vs image) */}
        <div className="mb-4 flex justify-center gap-4">
             {/* text/versus toggle */}
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

             {/* visual mode toggle */}
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

        {/* review mode toggle (new) */}
         <div className="mb-4 flex justify-center">
            <button 
                onClick={() => {
                    if (user?.isGuest) {
                        router.push('/login?next=' + encodeURIComponent('/?action=review'));
                        return;
                    }
                    setReviewMode(!reviewMode);
                }}
                className={`
                    text-[10px] font-mono uppercase tracking-widest transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full border
                    ${reviewMode 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                        : 'border-transparent text-muted-foreground hover:bg-white/5'}
                `}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${reviewMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span>{reviewMode ? 'Review Mode Active' : 'Write a Review?'}</span>
            </button>
         </div>

        {/* massive floating search bar container */}
        <div className={`mb-12 rounded-2xl bg-white/95 dark:bg-white/5 p-2 forensic-glass shadow-[0_32px_64px_-16px_rgba(37,99,235,0.15)] dark:shadow-2xl relative z-10 group transition-all duration-500 flex flex-col gap-2 backdrop-blur-2xl border border-white/20 dark:border-white/10`}>
          <div className="absolute inset-0 bg-primary/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />

          {/* input area */}
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
                                    placeholder={isVersusMode ? `Product ${idx+1}` : (reviewMode ? "Enter product name to verify..." : "Search product, paste link, or ask...")}
                                    value={q}
                                    onChange={(e) => updateQuery(idx, e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                    className="flex-1 h-16 bg-transparent text-base font-mono placeholder:text-slate-600 focus:outline-none text-foreground relative pr-4"
                                    autoFocus={isVersusMode && idx === queries.length - 1}
                                />
                                {isVersusMode && queries.length > 2 && (
                                     <button onClick={() => removeProduct(idx)} className="w-10 h-16 flex items-center justify-center text-rose-500/50 hover:text-rose-500 opacity-0 group-hover/input:opacity-100">✕</button>
                                )}
                            </div>
                         ))}
                    </div>
                    
                    {/* actions footer */}
                    <div className="flex gap-2 mt-2">
                         {isVersusMode && queries.length < 4 && (
                             <button onClick={addProduct} className="flex-1 h-12 rounded-xl border-dashed border border-slate-300 dark:border-white/10 hover:border-primary/50 text-slate-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">+ Add Product</button>
                         )}
                        <Button
                            onClick={handleSearchClick}
                            disabled={!canSearch}
                            className={`flex-none h-12 px-8 rounded-xl font-bold text-sm tracking-widest uppercase text-white shadow-lg transition-all duration-300 relative overflow-hidden group/btn ml-auto w-full md:w-auto ${
                                reviewMode ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-primary hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                            }`}
                        >
                            <span className="relative z-10">{reviewMode ? 'Find & Review' : (isVersusMode ? 'COMPARE' : 'SEARCH')}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </div>
                  </>
              ) : (
                  <div className="p-2 relative">
                       {/* close / return to text mode */}
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
                               <FocalAlignmentLoader 
                                  status="Analyzing Visual Evidence..." 
                                  mode={reviewMode ? 'review' : 'single'}
                               />
                           </div>
                       ) : (
                           <LensInput onFileSelect={handleImageAnalysis} />
                       )}
                  </div>
              )}
          </div>
        </div>
    </>
  );
}
