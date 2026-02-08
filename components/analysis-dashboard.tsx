'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, Play, HelpCircle, MessageSquare, AlertCircle, Shield, Plus, Search, ExternalLink, Mic2, Volume2, Zap } from 'lucide-react';

import { VerificationModule } from '@/components/verification-module';
import { BentoGrid, BentoGridItem } from '@/components/BentoGrid';
import { FairnessMeter } from '@/components/fairness-meter';

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
    recommendation: (data.recommendation || (data.score >= 80 ? 'BUY' : data.score >= 50 ? 'CONSIDER' : 'AVOID')) as 'BUY' | 'CONSIDER' | 'AVOID',
    verdict: data.verdict || "Analysis Inconclusive",
    verdictType: (data.score >= 80 ? 'BUY' : data.score >= 50 ? 'CONSIDER' : 'AVOID') as 'BUY' | 'CONSIDER' | 'AVOID',
    pros: data.pros || [],
    cons: data.cons || [],
  } : {
    name: search.title,
    rating: 8.2,
    recommendation: 'CONSIDER' as const,
    verdict: 'Good build quality and features, but the price is about 25% higher than it should be.',
    verdictType: 'CONSIDER' as const,
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
      case 'BUY':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-200';
      case 'CONSIDER':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-200';
      case 'AVOID':
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
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm md:text-xl font-black text-primary font-mono tracking-tighter italic">
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
                    stroke={product.verdictType === 'AVOID' ? '#f43f5e' : product.verdictType === 'BUY' ? '#10b981' : '#f59e0b'}
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
        
        <div className="mb-8" id="verification-module">
            <VerificationModule 
                productName={product.name} 
                currentTrustScore={product.rating} 
                userRank={userRank} 
                initialOpen={isReviewMode}
                aiConfidence={data?.confidence}
            />
        </div>

        {/* NEW: bento grid verdict */}
        <BentoGrid className="mb-12">
           <BentoGridItem
             title="The Verdict"
             description={<span className="text-sm font-medium leading-relaxed block mt-2 text-foreground/90">{product.verdict}</span>}
             header={<div className={`h-24 w-full rounded-xl p-4 flex items-center justify-center text-3xl md:text-4xl font-black uppercase tracking-[0.2em] ${getVerdictStyle()}`}>{product.recommendation}</div>}
             className="md:col-span-2"
             icon={<Shield className="h-4 w-4 text-neutral-500" />}
           />
           <BentoGridItem
             title="Score Analysis"
             description={<div className={`text-[10px] font-bold font-mono mt-2 px-2 py-0.5 rounded-full border w-fit ${
                product.verdictType === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                product.verdictType === 'CONSIDER' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
             }`}>{product.verdictType}</div>}
             header={
                <div className="h-24 w-full rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center border border-black/5 dark:border-white/5 shadow-inner">
                    <span className="text-5xl font-black tracking-tighter text-foreground drop-shadow-sm">{product.rating}</span>
                </div>
             }
             className="md:col-span-1"
             icon={<Zap className="h-4 w-4 text-neutral-500" />}
           />
           <BentoGridItem
             title="Merits"
             description={<ul className="space-y-2 mt-2">{product.pros.slice(0,4).map((p: string) => <li key={p} className="flex gap-2 text-xs items-start"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"/><span>{p}</span></li>)}</ul>}
             className="md:col-span-1"
             icon={<Check className="h-4 w-4 text-emerald-500" />}
           />
           <BentoGridItem
             title="Drawbacks"
             description={<ul className="space-y-2 mt-2">{product.cons.slice(0,4).map((c: string) => <li key={c} className="flex gap-2 text-xs items-start"><AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5"/><span>{c}</span></li>)}</ul>}
             className="md:col-span-1"
             icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
           />
           <BentoGridItem
             title="Market Status"
             description={fairnessData.current > fairnessData.fairValue.max ? "Price Warning: Overpriced" : "Fair Market Value Verified"}
             header={<div className={`h-24 w-full rounded-xl ${fairnessData.current > fairnessData.fairValue.max ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"} border flex items-center justify-center font-mono text-2xl font-bold opacity-50`}>${fairnessData.current}</div>}
             className="md:col-span-1"
             icon={<ExternalLink className="h-4 w-4 text-neutral-500" />}
           />
        </BentoGrid>

        {/* NEW: Community Intel (Generalized) */}
        {data?.audioInsights && data.audioInsights.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
               Community Intel
               <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] text-primary">SOURCE_DUMP</div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.audioInsights.map((insight: any, i: number) => {
                 const isReddit = insight.sourceUrl?.includes('reddit') || false;
                 
                 return (
                <div 
                    key={i} 
                    onClick={() => insight.sourceUrl && window.open(insight.sourceUrl, '_blank')}
                    className={`p-5 forensic-glass rounded-2xl border border-white/5 relative overflow-hidden group ${insight.sourceUrl ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      {isReddit ? <MessageSquare className="w-8 h-8" /> : <Mic2 className="w-8 h-8" />}
                  </div>
                  <div className="flex items-start gap-4 h-full">
                    <div className={`p-2 rounded-lg shrink-0 ${insight.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {insight.sentiment === 'negative' ? <Volume2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                               {insight.topic || 'General Info'}
                               {insight.sourceUrl && <ExternalLink className="w-3 h-3 opacity-50" />}
                           </span>
                           {insight.timestamp && insight.timestamp !== '0:00' && insight.timestamp.toUpperCase() !== 'N/A' && !isReddit && (
                               <span className="text-[10px] font-mono text-primary font-bold">{insight.timestamp}</span>
                           )}
                           {isReddit && (
                               <span className="text-[9px] font-mono text-slate-500 uppercase">Reddit Thread</span>
                           )}
                        </div>
                        <p className="text-sm font-medium italic text-foreground leading-relaxed">
                          "{insight.quote}"
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${insight.sentiment === 'negative' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">
                             Source Sentiment: {insight.sentiment}
                          </span>
                      </div>
                    </div>
                  </div>
                </div>
              )})} 
            </div>
          </div>
        )}

        {/* Video Reviews (Second) */}
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

        {/* Real User Discussions (Reddit Sources) - (Third) */}
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

        {/* Price Fairness Meter */}
        <FairnessMeter
          currentPrice={fairnessData.current}
          msrp={data?.sources?.market?.msrp ? parseFloat(data.sources.market.msrp.replace(/[^0-9.]/g, '')) : undefined}
          launchDate={data?.sources?.market?.launchDate}
          competitorPriceRange={data?.sources?.market?.competitorPriceRange ? {
            min: parseFloat(data.sources.market.competitorPriceRange.split('-')[0].replace(/[^0-9.]/g, '')),
            max: parseFloat(data.sources.market.competitorPriceRange.split('-')[1]?.replace(/[^0-9.]/g, '') || data.sources.market.competitorPriceRange.replace(/[^0-9.]/g, ''))
          } : undefined}
          qualityScore={product.rating}
          productUrl={fairnessData.url || undefined}
          className="mb-12"
        />

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
