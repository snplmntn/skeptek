'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface AnalysisDashboardProps {
  search: { title: string; url: string };
  data?: any; // Accepting the AI result
  onBack: () => void;
}

export function AnalysisDashboard({ search, data, onBack }: AnalysisDashboardProps) {
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

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
    verdict: 'Exceptional build quality with premium features, but pricing is 25% above fair market value.',
    verdictType: 'positive' as const,
    pros: ['Superior durability', 'Industry-leading performance', 'Premium materials'],
    cons: ['Price premium justified', 'Steeper learning curve'],
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
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200';
      case 'caution':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-200';
      case 'alert':
        return 'border-rose-500/30 bg-rose-500/5 text-rose-200';
      default:
        return 'border-blue-500/30 bg-blue-500/5 text-blue-200';
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
      <div className="sticky top-0 z-40 forensic-glass border-b border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest gap-2 pl-0"
            >
              <span className="opacity-50">←</span> Back to HQ
            </Button>
            <h1 className="text-3xl font-black tracking-tight text-white">{product.name}</h1>
          </div>

          {/* Ring Chart Score */}
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20">
              <svg className="h-full w-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
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
                <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter">{product.rating.toFixed(1)}</span>
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Verdict Hero Card */}
        <div className={`mb-8 p-8 border-l-4 forensic-glass ${getVerdictStyle()}`}>
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-slate-400">Forensic Verdict</h2>
                  {getRecommendationBadge()}
              </div>
              <p className="text-lg font-medium leading-relaxed font-sans text-slate-100">
                {product.verdict}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80 mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-sm" />
                   Verified Assets
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {product.pros.map((pro: string) => (
                    <li key={pro} className="flex gap-3 items-center">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-xs">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80 mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 glow-sm" />
                   Detected Risks
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {product.cons.map((con: string) => (
                    <li key={con} className="flex gap-3 items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-xs">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Reddit Sources */}
        {data?.sources?.reddit?.sources && data.sources.reddit.sources.length > 0 && (
          <div className="mb-8 p-6 forensic-glass rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-4">Community Reconnaissance</h3>
            <div className="flex flex-wrap gap-3">
              {data.sources.reddit.sources.map((source: { title: string; url: string }) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] font-mono rounded-lg border border-white/5 hover:border-primary/50 transition-all group"
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=32`} 
                    alt="site icon"
                    className="w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100"
                  />
                  <span className="max-w-[180px] truncate">{source.title}</span>
                  <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
           <h2 className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Forensic Video Reel</h2>
          {videos.length === 0 ? (
             <div className="p-8 forensic-glass rounded-2xl border border-white/5 text-center text-slate-400 text-xs font-mono">
                NO VIDEO ANALYSIS DATA FOR THIS CASE.
             </div>
          ) : (
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
                {/* Thumbnail Image */}
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                     <Play className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                </div>

                {/* Timestamp Badge */}
                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs font-mono px-2 py-1 rounded">
                  {video.moment}
                </div>

                {/* Status Tag */}
                <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${
                  video.tagType === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : video.tagType === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {video.tag}
                </div>

                {/* Video Title - appears on hover */}
                <div className="absolute inset-0 bg-slate-900/60 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{video.title}</p>
                </div>

                {/* Magnifying Glass Lens Effect - appears on hover */}
                {hoveredVideo === video.id && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: magnifierPos.x - 40,
                      top: magnifierPos.y - 40,
                    }}
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
          )}
        </div>

        {/* Fairness Meter */}
        <div className="mb-12">
          <h2 className="mb-6 text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
             Fairness Audit
            <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 forensic-glass text-slate-300 text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10 font-mono leading-relaxed">
                    <p className="font-bold mb-1 text-primary">AUDIT METHODOLOGY</p>
                    WE ANALYZE MARKET SPECS, BUILD INTEGRITY, AND COMMUNITY SENTIMENT. IF TRUST SCORE IS LOW, THE PRODUCT'S "FAIR VALUE" DROPS REGARDLESS OF MARKET ASKING PRICE.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-[6px] border-transparent border-t-white/10" />
                </div>
            </div>
          </h2>
          <div className="p-8 forensic-glass rounded-2xl border border-white/5 relative overflow-hidden group/meter">
            {/* Background scanner line animation */}
            <div className="absolute inset-0 bg-primary/2 h-[1px] scanline opacity-0 group-hover/meter:opacity-100 transition-opacity" />

            <div className="space-y-6 relative z-10">
              {/* Scale Labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                <span>Min Asset Value: ${fairnessData.min}</span>
                <span>Max Asset Value: ${Math.round(fairnessData.max)}</span>
              </div>

              {/* Linear Gauge */}
              <div className="relative h-14 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                {/* Green Fair Value Zone */}
                <div
                  className="absolute h-full bg-emerald-500/20 border-x border-emerald-500/20"
                  style={{
                    left: `${(fairnessData.fairValue.min / fairnessData.max) * 100}%`,
                    right: `${100 - (fairnessData.fairValue.max / fairnessData.max) * 100}%`,
                  }}
                />

                {/* Current Price Marker */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-primary shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
                  style={{ left: `${(fairnessData.current / fairnessData.max) * 100}%` }}
                >
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-sm font-black text-primary font-mono whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    ${fairnessData.current}
                  </div>
                </div>

                {/* Markup Line - Red if outside fair value */}
                {(fairnessData.current > fairnessData.fairValue.max || fairnessData.current < fairnessData.fairValue.min) && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-rose-500/30 border-t border-dashed border-rose-500/50"
                     style={{
                        left: `${Math.min((fairnessData.fairValue.max / fairnessData.max) * 100, (fairnessData.current / fairnessData.max) * 100)}%`,
                        width: `${Math.abs((fairnessData.current - fairnessData.fairValue.max) / fairnessData.max) * 100}%`
                     }}
                  />
                )}
              </div>

              {/* Legend with Tooltips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-6 border-t border-white/5">
                <div className="flex flex-col gap-2 group relative">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500/50 shrink-0" />
                     <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 cursor-help border-b border-dotted border-slate-700">Fair Asset Value</span>
                  </div>
                  <span className="font-mono text-xl font-black text-white leading-none">${fairnessData.fairValue.min}—${fairnessData.fairValue.max}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                     <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Current Market Price</span>
                  </div>
                  <span className="font-mono text-xl font-black text-primary leading-none">${fairnessData.current}</span>
                </div>

                {fairnessData.current > fairnessData.fairValue.max && (
                  <div className="flex flex-col gap-2 group relative">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
                       <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500/70 border-b border-dotted border-rose-900 cursor-help">Market Inefficiency</span>
                    </div>
                    <span className="font-mono text-xl font-black text-rose-500 leading-none">+${(fairnessData.current - fairnessData.fairValue.max).toFixed(0)}</span>
                  </div>
                )}
              </div>
              
              {/* View Deal Button */}
              {fairnessData.url && (
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                  <Button 
                    size="sm"
                    className="bg-primary hover:bg-blue-500 text-white gap-3 rounded-xl px-6 font-mono text-[10px] tracking-widest uppercase py-6"
                    onClick={() => window.open(fairnessData.url, '_blank')}
                  >
                    Explore Case Data <span className="text-xs opacity-50">↗</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
