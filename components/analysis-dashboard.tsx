'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, Play, HelpCircle, MessageSquare, AlertCircle, Shield, Plus, Search, ExternalLink, Mic2, Volume2, Zap } from 'lucide-react';

import { VerificationModule } from '@/components/verification-module';

interface AnalysisDashboardProps {
  search: { title: string; url: string };
  data?: any; // Accepting the AI result
  onBack: () => void;
  userRank?: string; // New Prop
  isReviewMode?: boolean; // New Prop
}

export function AnalysisDashboard({ search, data, onBack, userRank = 'Guest', isReviewMode = false }: AnalysisDashboardProps) {
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  
  // Auto-scroll to review section if in Review Mode
  React.useEffect(() => {
    if (isReviewMode) {
        const element = document.getElementById('verification-module');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [isReviewMode]);

  // Use real data if available, otherwise fallback to mock (or empty)
  const product = data ? {
    name: data.productName || search.title,
    rating: data.score || 0,
    recommendation: (data.recommendation || (data.score > 80 ? 'BUY' : data.score > 50 ? 'CONSIDER' : 'AVOID')) as 'BUY' | 'CONSIDER' | 'AVOID',
    verdict: data.verdict || "Analysis Inconclusive",
    verdictType: (data.score > 80 ? 'positive' : data.score > 60 ? 'caution' : 'alert') as 'positive' | 'caution' | 'alert',
    pros: data.pros || [],
    cons: data.cons || [],
  } : {
    name: search.title,
    rating: 8.2,
    recommendation: 'CONSIDER' as const,
    verdict: 'Good build quality and features, but the price is about 25% higher than it should be.',
    verdictType: 'positive' as const,
    pros: ['Durable Build', 'Fast Performance', 'Premium Materials'],
    cons: ['Slightly Overpriced', 'Takes time to learn'],
  };

  // Use real video data if available from the Video Scout
  const videos = data?.sources?.video?.length > 0 ? data.sources.video.map((v: { id: string; title: string; url: string; thumbnail: string; moment: string; tag: string; tagType: 'success' | 'warning' | 'alert' }) => ({
    id: v.id,
    title: v.title,
    moment: v.moment,
    tag: v.tag,
    tagType: v.tagType,
    thumbnail: v.thumbnail,
    url: v.url
  })) : [];

  // Use real Price Analysis if available
  const fairnessData = data?.priceAnalysis ? {
    min: 0,
    max: data.priceAnalysis.fairValueMax * 1.5,
    fairValue: { 
        min: data.priceAnalysis.fairValueMin, 
        max: data.priceAnalysis.fairValueMax 
    },
    current: data.priceAnalysis.currentPrice,
    url: data.priceAnalysis.sourceUrl,
  } : {
    min: 0,
    max: 100,
    fairValue: { min: 30, max: 40 },
    current: 50,
    url: null,
  };

  const getVerdictStyle = () => {
    switch (product.verdictType) {
      case 'positive':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-200';
      case 'caution':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-200';
      case 'alert':
        return 'border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-200';
      default:
        return 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-200';
    }
  };

  const getRecommendationBadge = () => {
      const styles = {
         BUY: 'bg-emerald-600 text-white shadow-emerald-200',
         CONSIDER: 'bg-amber-500 text-white shadow-amber-200',
         AVOID: 'bg-rose-600 text-white shadow-rose-200' 
      };
      
      return (
        <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg ${styles[product.recommendation]}`}>
            {product.recommendation}
        </span>
      );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMagnifierPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="min-h-screen bg-background cursor-crosshair text-foreground relative">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-full scanline" />
      </div>

      {/* Sticky Glass Header */}
      {/* Sticky Glass Header */}
      <div className="sticky top-[68px] z-40 forensic-glass border-b border-foreground/5 dark:border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 text-muted-foreground hover:text-foreground text-xs font-mono uppercase tracking-widest gap-2 pl-0"
            >
              <span className="opacity-50 group-hover:-translate-x-1 transition-transform">←</span> Back to Search
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white">{product.name}</h1>
              {data?.isLowConfidence && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  PROVISIONAL ANALYSIS
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Price, Deal & Score */}
          <div className="flex items-center gap-6">
            {fairnessData.current > 0 && (
              <div className="hidden md:flex flex-col items-end gap-1">
                <span className="text-xl font-black text-primary font-mono tracking-tighter italic">
                  ${fairnessData.current}
                </span>
                {fairnessData.url && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    onClick={() => window.open(fairnessData.url, '_blank')}
                  >
                    View Deal <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Ring Chart Score */}
            <div className="flex flex-col items-center">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="6" className="text-foreground" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={product.verdictType === 'alert' ? '#f43f5e' : product.verdictType === 'positive' ? '#10b981' : '#f59e0b'}
                    strokeWidth="6"
                    strokeDasharray={`${(product.rating / 100) * 282.7} 282.7`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-foreground dark:text-white font-mono leading-none tracking-tighter">{product.rating.toFixed(1)}</span>
                  <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        
        {/* NEW: Verification Module */}
        <div className="mb-8" id="verification-module">
            <VerificationModule 
                productName={product.name} 
                currentTrustScore={product.rating} 
                userRank={userRank} 
                initialOpen={isReviewMode}
                aiConfidence={data?.confidence}
            />
        </div>

        {/* Verdict Hero Card */}
        <div className={`mb-8 p-8 border-l-4 forensic-glass ${getVerdictStyle()}`}>
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-slate-400">Verdict</h2>
                  {getRecommendationBadge()}
              </div>
              <p className="text-lg font-medium leading-relaxed font-sans text-foreground dark:text-slate-100">
                {product.verdict}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-500/80 mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-sm" />
                   Merits
                </h3>
                <ul className="space-y-2 text-sm text-foreground/80 dark:text-slate-300">
                  {product.pros.map((pro: string) => (
                    <li key={pro} className="flex gap-3 items-center">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-xs text-foreground dark:text-slate-200">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500/80 mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 glow-sm" />
                   The Bad
                </h3>
                <ul className="space-y-2 text-sm text-foreground/80 dark:text-slate-300">
                  {product.cons.map((con: string) => (
                    <li key={con} className="flex gap-3 items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-xs text-foreground dark:text-slate-200">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Real User Discussions (Reddit Sources) */}
        {data?.sources?.reddit?.sources && data.sources.reddit.sources.length > 0 && (
          <div className="mb-8 p-6 forensic-glass rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-4">Real User Discussions</h3>
            <div className="flex flex-wrap gap-3">
              {data.sources.reddit.sources.map((source: { title: string; url: string }) => {
                 let hostname = '';
                 try { hostname = new URL(source.url).hostname; } catch (e) { hostname = 'reddit.com'; }
                 return (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  className="inline-flex items-center gap-3 px-4 py-2 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:hover:text-white text-[11px] font-mono rounded-lg border border-foreground/5 dark:border-white/5 hover:border-primary/50 transition-all group"
                >
                  <div className="relative w-3.5 h-3.5 flex-shrink-0">
                      <MessageSquare className="absolute inset-0 w-full h-full text-slate-600" />
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=reddit.com&sz=32`} 
                        alt="icon"
                        className="absolute inset-0 w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { e.currentTarget.style.opacity = '0'; }} 
                      />
                  </div>
                  <span className="max-w-[180px] truncate">{source.title}</span>
                  <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary">↗</span>
                </a>
              )})}
            </div>
          </div>
        )}

        {/* Video Reviews - Only show if videos exist */}
        {videos.length > 0 && (
          <div className="mb-8">
             <h2 className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Video Reviews</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {videos.map((video: { id: string; title: string; url: string; thumbnail: string; moment: string; tag: string; tagType: string }) => (
                <button
                  key={video.id}
                  onClick={() => window.open(video.url, '_blank')}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer shadow-sm"
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                       <Play className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                  </div>
                  {video.moment && video.moment !== "0:00" && (
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
                      <Play className="w-2.5 h-2.5 fill-current" /> {video.moment}
                    </div>
                  )}
                  <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${
                    video.tagType === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                    video.tagType === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {video.tag}
                  </div>
                  <div className="absolute inset-0 bg-slate-900/60 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">{video.title}</p>
                  </div>
                  {hoveredVideo === video.id && (
                    <div
                      className="absolute pointer-events-none"
                      style={{ left: magnifierPos.x - 40, top: magnifierPos.y - 40 }}
                    >
                      <div className="w-20 h-20 rounded-full border-4 border-blue-500 bg-blue-100/20 backdrop-blur-sm shadow-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="11" cy="11" r="8" strokeWidth="2" />
                          <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Deep Audio Insights */}
        {data?.audioInsights && data.audioInsights.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
               Deep Audio Log
               <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] text-primary">TRANSCRIPT_DUMP</div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.audioInsights.map((insight: any, i: number) => (
                <div key={i} className="p-5 forensic-glass rounded-2xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Mic2 className="w-8 h-8" />
                  </div>
                  <div className="flex items-start gap-4 h-full">
                    <div className={`p-2 rounded-lg shrink-0 ${insight.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {insight.sentiment === 'negative' ? <Volume2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{insight.topic || 'General Info'}</span>
                           <span className="text-[10px] font-mono text-primary font-bold">{insight.timestamp || '0:00'}</span>
                        </div>
                        <p className="text-sm font-medium italic text-foreground leading-relaxed">
                          "{insight.quote}"
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${insight.sentiment === 'negative' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">
                             Audio Sentiment: {insight.sentiment}
                          </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Fairness Meter */}
        <div className="mb-12">
          <h2 className="mb-6 text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
             Price Analysis
            <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 forensic-glass text-slate-300 text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10 font-mono leading-relaxed">
                    <p className="font-bold mb-1 text-primary">HOW WE CHECK PRICE</p>
                    WE COMPARE SPECS, BUILD QUALITY, AND USER REVIEWS. IF A PRODUCT HAS ISSUES, ITS "FAIR PRICE" IS LOWER THAN WHAT STORES CHARGE.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-[6px] border-transparent border-t-white/10" />
                </div>
            </div>
          </h2>
          <div className="p-8 forensic-glass rounded-2xl border border-white/5 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            
            {/* Visual Guide to the Graph */}
            <div className="mb-6 flex items-end justify-between px-2">
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Scale Start</p>
                  <p className="text-lg font-mono text-foreground">$0</p>
                </div>
                 {/* Legend (Middle) */}
                 <div className="flex gap-6 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400">Fair Price</span>
                    </div>
                    {fairnessData.current > fairnessData.fairValue.max && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] uppercase tracking-widest text-rose-500 dark:text-rose-400">Overpriced</span>
                        </div>
                    )}
                 </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Scale End</p>
                  <p className="text-lg font-mono text-foreground">${Math.round(fairnessData.max)}</p>
                </div>
            </div>

            {/* The Main Connective Bar - Added mx-12 to prevent label clipping */}
            <div className="relative h-6 bg-slate-200 dark:bg-slate-800/50 rounded-full mb-32 mt-8 mx-12">
                
                {/* Fair Value Zone (Green Pill) */}
                <div 
                    className="absolute top-0 bottom-0 bg-emerald-500/20 rounded-full border border-emerald-500/30"
                    style={{
                        left: `${(fairnessData.fairValue.min / fairnessData.max) * 100}%`,
                        width: `${((fairnessData.fairValue.max - fairnessData.fairValue.min) / fairnessData.max) * 100}%`
                    }}
                >
                     {/* Label Below */}
                     <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 flex flex-col items-center">
                        <div className="w-px h-2 bg-emerald-500/50" />
                        <div className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-500/50 dark:text-emerald-200 border px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xl">
                            FAIR: ${fairnessData.fairValue.min}-${fairnessData.fairValue.max}
                        </div>
                     </div>
                </div>

                {/* Current Price Marker (Blue Dot) */}
                 <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] z-30 transition-all duration-1000"
                    style={{ left: `${Math.min(100, (fairnessData.current / fairnessData.max) * 100)}%`, marginLeft: '-10px' }}
                >
                    {/* Label Below - Staggered further down */}
                    <div className="absolute top-full mt-12 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center z-40">
                        <div className="w-px h-12 bg-blue-500/50 mb-[-2px] absolute bottom-full left-1/2 -translate-x-1/2" />
                        <div className={`px-4 py-2.5 rounded-xl border-2 shadow-2xl text-center flex flex-col gap-1 min-w-[100px] ${
                            fairnessData.current > fairnessData.fairValue.max 
                            ? 'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-950 dark:text-rose-100' 
                            : 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-950 dark:text-white'
                        }`}>
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">You Pay</span>
                            <span className="text-xl font-black font-mono tracking-tight">${fairnessData.current}</span>
                        </div>
                    </div>
                </div>

                {/* Red Overpriced Zone (Connects Fair Max to Current if higher) */}
                {fairnessData.current > fairnessData.fairValue.max && (
                     <div 
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0 dashed-line"
                        style={{
                            left: `${(fairnessData.fairValue.max / fairnessData.max) * 100}%`,
                            width: `${Math.min(100 - ((fairnessData.fairValue.max / fairnessData.max) * 100), ((fairnessData.current - fairnessData.fairValue.max) / fairnessData.max) * 100)}%`
                        }}
                     />
                )}
            </div>
              
            {/* Price Health Summary & View Deal */}
            <div className="mt-8 mb-4 flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-foreground/5 border border-foreground/5 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl shrink-0 ${fairnessData.current > fairnessData.fairValue.max ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {fairnessData.current > fairnessData.fairValue.max ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-widest mb-1.5 ${fairnessData.current > fairnessData.fairValue.max ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {fairnessData.current > fairnessData.fairValue.max ? 'Price Alert: Overpriced' : 'Verified: Fair Market Value'}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                            {fairnessData.current > fairnessData.fairValue.max 
                            ? `Current pricing is $${fairnessData.current - fairnessData.fairValue.max} above the identified fair market valuation. Recommended to wait for a discount or explore alternatives with higher utility-to-cost ratios.`
                            : `The current list price of $${fairnessData.current} aligns with our analysis model. This represents a transparent transaction with no identified "skeptic" red flags.`
                            }
                        </p>
                    </div>
                </div>

                {/* Integrated View Deal Button */}
                {fairnessData.url && (
                    <Button 
                        size="sm"
                        className="shrink-0 bg-primary hover:bg-blue-500 text-white gap-3 rounded-xl px-6 font-mono text-[10px] tracking-widest uppercase h-12 shadow-lg shadow-blue-500/20"
                        onClick={() => window.open(fairnessData.url, '_blank')}
                    >
                        <img 
                            src={`https://www.google.com/s2/favicons?domain=${(() => {
                                try { return new URL(fairnessData.url).hostname; }
                                catch { return 'google.com'; }
                            })()}&sz=64`}
                            className="w-5 h-5 rounded bg-white p-0.5 object-contain"
                            alt="store"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        View Deal <span className="text-xs opacity-50">↗</span>
                    </Button>
                )}
            </div>
          </div>

        </div>

        {/* Quick Nav: Search Again */}
        <div className="mt-12 mb-24 flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
            <Button
                onClick={onBack}
                className="bg-primary hover:bg-blue-500 text-white px-12 py-8 rounded-2xl gap-4 group transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(59,130,246,0.2)] border-none"
            >
                <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-70">Analysis Complete</p>
                    <p className="text-lg font-black uppercase tracking-tighter italic">Search Again</p>
                </div>
            </Button>
        </div>
      </div>
    </div>
  );
}
