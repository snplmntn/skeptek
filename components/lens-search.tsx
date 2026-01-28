'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FocalAlignmentLoader } from '@/components/focal-alignment-loader'; // Import FocalAlignmentLoader

interface LensSearchProps {
  onSearch: (title: string, url: string) => void;
}


const recentScans = [
  { name: 'Sony WH-1000XM5', score: 9.2, status: 'verified' },
  { name: 'AirPods Pro', score: 8.7, status: 'verified' },
  { name: 'Generic Blender', score: 2.1, status: 'rejected' },
  { name: 'iPhone 15 Pro', score: 8.9, status: 'verified' },
  { name: 'Budget Monitor', score: 4.3, status: 'caution' },
];

export function LensSearch({ onSearch }: LensSearchProps) {
  const [queries, setQueries] = useState<string[]>(['']);
  const [isVersusMode, setIsVersusMode] = useState(false);
  const [displayedScans, setDisplayedScans] = useState<typeof recentScans>([]);
  const [scanIndex, setScanIndex] = useState(0);

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
      onSearch(finalQuery, `/product/${finalQuery.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  const handleExampleClick = (example: string) => {
    if (example.includes(' vs ')) {
         setIsVersusMode(true);
         const parts = example.split(' vs ');
         setQueries(parts);
         // Auto-search or let user see? Let's just fill it.
         onSearch(example, `/product/${example.toLowerCase().replace(/\s+/g, '-')}`);
         return;
    }

    setIsVersusMode(false);
    setQueries([example]);
    onSearch(example, `/product/${example.toLowerCase().replace(/\s+/g, '-')}`);
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
          <h1 className="mb-2 text-6xl font-black tracking-tight text-foreground bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            Skeptek
          </h1>
          <p className="text-sm font-mono tracking-[0.2em] uppercase text-primary/80">
            Forensic Product Analysis
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-4 flex justify-center">
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
        </div>

        {/* Massive Floating Search Bar Container */}
        <div className={`mb-12 rounded-2xl bg-white/5 p-2 forensic-glass shadow-2xl relative z-10 group transition-all duration-500 flex flex-col gap-2`}>
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />

          {/* Input List */}
          <div className={`flex flex-col gap-0 overflow-hidden rounded-xl ${isVersusMode ? 'divide-y divide-white/5 bg-black/20' : ''}`}>
             
             {queries.map((q, idx) => (
                <div key={idx} className="flex items-center relative group/input">
                    
                    {/* Lens Icon (Only on first item or if Single) */}
                    {(idx === 0 || !isVersusMode) && (
                        <div className="flex h-16 w-12 items-center justify-center flex-shrink-0 relative">
                           <svg className="h-5 w-5 text-primary opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <circle cx="11" cy="11" r="8" strokeWidth="2" />
                             <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                           </svg>
                        </div>
                    )}
                    
                    {/* VS Icon (between items) */}
                    {isVersusMode && idx > 0 && (
                        <div className="flex h-16 w-12 items-center justify-center flex-shrink-0 text-xs font-black text-primary/50 italic">
                             VS
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder={isVersusMode ? `Product ${idx+1} (e.g. ${idx===0?'iPhone 15':'Pixel 8'})` : "Search product, paste link, or ask..."}
                        value={q}
                        onChange={(e) => updateQuery(idx, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 h-16 bg-transparent text-base font-mono placeholder:text-slate-600 focus:outline-none text-foreground relative pr-4"
                        autoFocus={isVersusMode && idx === queries.length - 1}
                    />

                    {/* Remove Button (if multiple in Versus Mode) */}
                    {isVersusMode && queries.length > 2 && (
                         <button 
                            onClick={() => removeProduct(idx)}
                            className="w-10 h-16 flex items-center justify-center text-rose-500/50 hover:text-rose-500 transition-colors opacity-0 group-hover/input:opacity-100"
                        >
                            ✕
                        </button>
                    )}
                </div>
             ))}
          </div>
          
          {/* Actions Footer (Inside Card) */}
          <div className="flex gap-2">
             {/* Add Product Button */}
             {isVersusMode && queries.length < 4 && (
                 <button 
                    onClick={addProduct}
                    className="flex-1 h-12 rounded-xl border-dashed border border-white/10 hover:border-primary/50 text-slate-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    + Add Product
                </button>
             )}

            {/* Scan Button */}
            <Button
                onClick={handleSearch}
                disabled={!canSearch}
                className="flex-none h-12 px-8 rounded-xl font-bold text-sm tracking-widest uppercase bg-primary hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 relative overflow-hidden group/btn ml-auto w-full md:w-auto"
            >
                <span className="relative z-10">{isVersusMode ? 'COMPARE' : 'SCAN'}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </Button>
          </div>
        </div>

        {/* Live Pulse Ticker */}
        <div className="mb-16 space-y-4 relative z-10">
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
            Live Forensic Feed
          </p>
          <div className="flex gap-4 overflow-hidden">
            {displayedScans.map((scan, idx) => (
              <div
                key={`${scan.name}-${idx}`}
                className="flex-1 rounded-xl bg-white/5 p-4 border border-white/5 forensic-glass animate-in fade-in slide-in-from-right-4 duration-700"
              >
                <p className="text-[11px] font-mono text-slate-300 uppercase tracking-tighter truncate mb-1">{scan.name}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xl font-black tabular-nums ${
                    scan.status === 'verified' ? 'text-emerald-500' :
                    scan.status === 'caution' ? 'text-amber-500' :
                    'text-rose-500'
                  }`}>
                    {scan.score.toFixed(1)}
                  </span>
                  <div className={`h-1 w-12 rounded-full overflow-hidden bg-slate-800`}>
                      <div 
                        className={`h-full ${
                             scan.status === 'verified' ? 'bg-emerald-500' :
                             scan.status === 'caution' ? 'bg-amber-500' :
                             'bg-rose-500'
                        }`}
                        style={{ width: `${scan.score * 10}%` }}
                      />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mb-12 space-y-4 relative z-10">
          <p className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Case Files:
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
                className="rounded-lg bg-white/5 px-4 py-2 text-xs font-mono text-slate-400 border border-white/5 hover:border-primary/50 hover:text-primary transition-all duration-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Footer */}
        <div className="border-t border-slate-200 pt-8 flex justify-center pb-8">
          <Link href="/how-it-works">
            <Button variant="outline" className="gap-2 rounded-full border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 shadow-sm transition-all hover:scale-105">
              <span className="font-semibold">How Skeptek Works</span>
              <span className="text-primary/70">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
