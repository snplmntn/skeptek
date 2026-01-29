'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FocalAlignmentLoader } from '@/components/focal-alignment-loader'; 
import { LensInput } from '@/components/lens-input';
import { GlobalFeed } from '@/components/global-feed';
import { analyzeImage } from '@/app/actions/analyze';
import { Modal } from '@/components/ui/modal';
import { Camera, Search, AlertTriangle, Info, MessageSquarePlus, Radar } from 'lucide-react';
import { getFriendlyErrorMessage } from '@/lib/error-mapping';
import { getUserProfile } from '@/app/actions/user';

interface LensSearchProps {
  onSearch: (title: string, url: string, metadata?: { mode: 'text' | 'image', isVersus: boolean, isReview?: boolean }) => void;
  initialQuery?: string;
  initialMode?: 'text' | 'image';
  initialReviewMode?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const recentScans = [
  { name: 'Sony WH-1000XM5', score: 9.2, status: 'verified' },
  { name: 'AirPods Pro', score: 8.7, status: 'verified' },
  { name: 'Generic Blender', score: 2.1, status: 'rejected' },
  { name: 'iPhone 15 Pro', score: 8.9, status: 'verified' },
  { name: 'Budget Monitor', score: 4.3, status: 'caution' },
];

export function LensSearch({ onSearch, initialQuery, initialMode = 'text', initialReviewMode = false, user, error, onClearError }: LensSearchProps & { user?: { isGuest: boolean; rank: string; xp: number; nextRankXP: number } | null }) {
  const router = useRouter();
  // Auto-detect versus mode from initial query if present
  const isInitialVersus = initialQuery?.includes(' vs ') || false;
  const initialQueries = isInitialVersus && initialQuery ? initialQuery.split(' vs ') : (initialQuery ? [initialQuery] : ['']);

  const [queries, setQueries] = useState<string[]>(initialQueries);
  const [isVersusMode, setIsVersusMode] = useState(isInitialVersus);
  const [searchMode, setSearchMode] = useState<'text' | 'image'>(initialMode);
  const [reviewMode, setReviewMode] = useState(initialReviewMode);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [displayedScans, setDisplayedScans] = useState<typeof recentScans>([]);
  const [scanIndex, setScanIndex] = useState(0);
  
  // Background Nodes State - Fixes Hydration Mismatch
  const [bgNodes, setBgNodes] = useState<Array<{left: string, top: string, delay: string, opacity: number}>>([]);

  // Toast Error Handler
  // Toast Error Handler
  useEffect(() => {
    if (error) {
      const friendly = getFriendlyErrorMessage(error);
      const isNet = friendly.title === 'Connection Issue';
      
      toast.custom((t) => (
          <div className={`
              w-full max-w-md rounded-xl border backdrop-blur-md p-4 flex flex-col gap-3 shadow-2xl relative overflow-hidden
              ${isNet 
                  ? 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800' 
                  : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/50'}
          `}>
             <div className="flex items-start gap-4 z-10 relative">
                <div className={`p-2 rounded-full shrink-0 ${isNet ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isNet ? 'text-slate-700 dark:text-slate-300' : 'text-rose-700 dark:text-rose-400'}`}>
                        {friendly.title}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed ${isNet ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600/90 dark:text-rose-300/80'}`}>
                        {friendly.message}
                    </p>

                    {/* Dropshipping/Scam Insight Card */}
                    {!friendly.isTechnical && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex gap-2 mt-3 items-start">
                            <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
                            <span className="text-[11px] text-amber-800 dark:text-amber-200/80 font-mono leading-tight">
                               Potential white-label/dropshipped item.
                            </span>
                        </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => {
                                toast.dismiss(t);
                                onClearError?.();
                            }}
                            className={`
                                text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border transition-colors
                                ${isNet 
                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                                    : 'bg-white/50 border-rose-200 text-rose-700 hover:bg-white'}
                            `}
                        >
                            Dismiss
                        </button>

                         {friendly.originalError && (
                             <button
                                onClick={() => {
                                    navigator.clipboard.writeText(friendly.originalError || "");
                                    toast.success("Error log copied", { duration: 2000 });
                                }}
                                className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-muted-foreground transition-colors"
                             >
                                 <Info className="w-3 h-3" />
                                 Technical Log
                             </button>
                         )}
                    </div>
                </div>
                
                {/* Close X (Top Right) */}
                <button 
                    onClick={() => {
                        toast.dismiss(t);
                        onClearError?.();
                    }}
                    className="absolute -top-1 -right-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="sr-only">Dismiss</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
          </div>
      ), { duration: 10000, id: 'lens-error-toast' });
    }
  }, [error, onClearError]);

  const [bgNodesInitialized, setBgNodesInitialized] = useState(false); // To prevent re-running random gen
  useEffect(() => {
    if (!bgNodesInitialized) {
        setBgNodes([...Array(20)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.2
        })));
        setBgNodesInitialized(true);
    }
  }, [bgNodesInitialized]);

  // User Rank State - now derived from props
  const userRank = user;

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
      onSearch(finalQuery, `/product/${finalQuery.toLowerCase().replace(/\s+/g, '-')}`, { 
          mode: 'text', 
          isVersus: isVersusMode,
          isReview: reviewMode 
      });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 relative overflow-hidden">
      {/* --- SOTA FORENSIC BACKGROUND LAYER --- */}
      <div className="absolute inset-0 pointer-events-none">
          {/* 1. Deep Base Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          
          {/* 2. Animated Grid with scanning effect */}
          <div 
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]" 
            style={{ 
              backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
            }} 
          />
          
          {/* 3. Floating Blue Nebulae (Optimized Blur) - Increased Density */}
          <motion.div 
            animate={{ 
                x: [0, 80, -80, 0], 
                y: [0, -50, 50, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] mix-blend-screen opacity-40 dark:opacity-15" 
          />
          <motion.div 
            animate={{ 
                x: [0, -60, 60, 0], 
                y: [0, 80, -80, 0],
                rotate: [360, 180, 0],
                scale: [1.1, 0.9, 1.2, 1.1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 -right-40 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[160px] mix-blend-screen opacity-40 dark:opacity-15" 
          />
          <motion.div 
            animate={{ 
                x: [-100, 100, -100], 
                y: [100, -100, 100],
                scale: [0.8, 1.1, 0.8]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[180px] mix-blend-screen opacity-30 dark:opacity-10" 
          />
          <motion.div 
            animate={{ 
                x: [200, -200, 200], 
                y: [0, 150, 0],
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen opacity-20 dark:opacity-5" 
          />

          {/* 4. Scanning Line */}
          <motion.div 
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)] z-0"
          />

          {/* 5. Random Technical "Nodes" (Dust) */}
          <div className="absolute inset-0 opacity-20">
             {bgNodes.map((node, i) => (
                 <div 
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
                    style={{ 
                        left: node.left, 
                        top: node.top,
                        animationDelay: node.delay,
                        opacity: node.opacity
                    }}
                 />
             ))}
          </div>
      </div>

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
                   <div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100/50 dark:bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-crosshair">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                           {userRank?.isGuest ? (
                               <Link href="/login" className="hover:underline">Sign In / Register</Link>
                           ) : (
                               `Rank: ${userRank?.rank || 'Loading...'}`
                           )}
                       </span>
                       
                       {/* XP Progress Tooltip - Only for logged in users */}
                       {userRank && !userRank.isGuest && (
                           <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-32 bg-black/90 text-white p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                               <div className="flex justify-between mb-1">
                                   <span>XP</span>
                                   <span>{userRank.xp} / {userRank.nextRankXP}</span>
                               </div>
                               <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                   <div 
                                       className="h-full bg-cyan-400" 
                                       style={{ width: `${Math.min(100, (userRank.xp / userRank.nextRankXP) * 100)}%` }} 
                                   />
                               </div>
                           </div>
                       )}
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

        {/* Review Mode Toggle (New) */}
         <div className="mb-4 flex justify-center">
            <button 
                onClick={() => {
                    if (userRank?.isGuest) {
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

        {/* Massive Floating Search Bar Container */}
        <div className={`mb-12 rounded-2xl bg-white/95 dark:bg-white/5 p-2 forensic-glass shadow-[0_32px_64px_-16px_rgba(37,99,235,0.15)] dark:shadow-2xl relative z-10 group transition-all duration-500 flex flex-col gap-2 backdrop-blur-2xl border border-white/20 dark:border-white/10`}>
          <div className="absolute inset-0 bg-primary/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />

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
                                    placeholder={isVersusMode ? `Product ${idx+1}` : (reviewMode ? "Enter product name to verify..." : "Search product, paste link, or ask...")}
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
                             <button onClick={addProduct} className="flex-1 h-12 rounded-xl border-dashed border border-slate-300 dark:border-white/10 hover:border-primary/50 text-slate-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">+ Add Product</button>
                         )}
                        <Button
                            onClick={handleSearch}
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



        {/* Live Pulse Ticker (Global Watchtower) */}
        <GlobalFeed />


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

      </div>
    </div>
  );
}
