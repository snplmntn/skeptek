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

  const getVerdictColor = () => {
    switch (product.verdictType) {
      case 'positive':
        return 'bg-emerald-50 border-emerald-200';
      case 'caution':
        return 'bg-amber-50 border-amber-200';
      case 'alert':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
    <div className="min-h-screen bg-slate-50 cursor-crosshair">
      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          </div>

          {/* Ring Chart Score */}
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={product.verdictType === 'alert' ? '#e11d48' : '#2563eb'}
                  strokeWidth="6"
                  strokeDasharray={`${(product.rating / 100) * 282.7} 282.7`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900 font-mono">{product.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Verdict Hero Card */}
        <Card className={`mb-8 p-8 border ${getVerdictColor()}`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-semibold text-slate-900">The Bottom Line</h2>
                  {getRecommendationBadge()}
              </div>
              <p className="text-slate-700 leading-relaxed">
                {product.verdict}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 mb-2">Verified Strengths</h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {product.pros.map((pro: string) => (
                    <li key={pro} className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Considerations</h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {product.cons.map((con: string) => (
                    <li key={con} className="flex gap-2 items-start">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Reddit Sources */}
        {data?.sources?.reddit?.sources && data.sources.reddit.sources.length > 0 && (
          <Card className="mb-8 p-6 border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Community Discussion Sources</h3>
            <div className="flex flex-wrap gap-3">
              {data.sources.reddit.sources.map((source: { title: string; url: string }) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50/50 text-slate-500 hover:text-orange-700 text-xs font-medium rounded-lg border border-slate-100 hover:border-orange-200 transition-all group"
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=32`} 
                    alt="site icon"
                    className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100"
                  />
                  <span className="max-w-[200px] truncate">{source.title}</span>
                  <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-orange-600">↗</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Forensic Video Reel */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Forensic Video</h2>
          {videos.length === 0 ? (
             <div className="p-6 bg-slate-100 rounded-lg text-center text-slate-500 text-sm">
                No video reviews analyzed for this product.
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
          <h2 className="mb-6 text-lg font-semibold text-slate-900 flex items-center gap-2">
            Fairness Meter
            <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl border border-slate-700">
                    <p className="font-semibold mb-1 text-emerald-400">How is this calculated?</p>
                    We analyze specs, build quality, and user sentiment. If a product has a low Trust Score (bad reputation), its "Fair Value" drops significantly, even if it's cheap.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800" />
                </div>
            </div>
          </h2>
          <Card className="p-6 border-slate-200">
            <div className="space-y-4">
              {/* Scale Labels */}
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>${fairnessData.min}</span>
                <span>${fairnessData.max}</span>
              </div>

              {/* Linear Gauge */}
              <div className="relative h-12 bg-slate-200 rounded-lg overflow-hidden">
                {/* Green Fair Value Zone */}
                <div
                  className="absolute h-full bg-emerald-200"
                  style={{
                    left: `${(fairnessData.fairValue.min / fairnessData.max) * 100}%`,
                    right: `${100 - (fairnessData.fairValue.max / fairnessData.max) * 100}%`,
                  }}
                />

                {/* Current Price Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
                  style={{ left: `${(fairnessData.current / fairnessData.max) * 100}%` }}
                >
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 font-mono whitespace-nowrap">
                    ${fairnessData.current}
                  </div>
                </div>

                {/* Markup Line - Red if outside fair value */}
                {(fairnessData.current > fairnessData.fairValue.max || fairnessData.current < fairnessData.fairValue.min) && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${(fairnessData.fairValue.max / fairnessData.max) * 100}%`}
                      y1="50%"
                      x2={`${(fairnessData.current / fairnessData.max) * 100}%`}
                      y2="50%"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  </svg>
                )}
              </div>

              {/* Legend with Tooltips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm group relative">
                  <div className="h-3 w-3 rounded-full bg-emerald-200 shrink-0" />
                  <span className="text-slate-600 border-b border-dotted border-slate-300 cursor-help">Estimated Fair Value</span>
                  <HelpCircle className="w-3 h-3 text-slate-300" />
                  
                  <span className="font-semibold text-slate-900">${fairnessData.fairValue.min}-${fairnessData.fairValue.max}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-slate-700">
                    What this product <span className="text-emerald-400 font-bold">should cost</span> based on its actual quality, specs, and competitor pricing.
                    <div className="absolute left-4 top-full border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="h-1 w-4 bg-blue-600 shrink-0" />
                  <span className="text-slate-600">Current Price: <span className="font-semibold text-blue-600">${fairnessData.current}</span></span>
                </div>

                {fairnessData.current > fairnessData.fairValue.max && (
                  <div className="flex items-center gap-2 text-sm group relative">
                    <div className="h-1 w-4 bg-rose-600 shrink-0" />
                    <span className="text-slate-600 border-b border-dotted border-slate-300 cursor-help">Overpriced by</span>
                    <span className="font-semibold text-rose-600">${(fairnessData.current - fairnessData.fairValue.max).toFixed(2)}</span>
                    
                     {/* Tooltip */}
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-slate-700">
                        The "Premium" you are paying purely for the brand (or due to shortages). <span className="text-rose-400 font-bold">High premium = Bad Deal.</span>
                        <div className="absolute left-4 top-full border-4 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* View Deal Button */}
              {fairnessData.url && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={() => window.open(fairnessData.url, '_blank')}
                  >
                    View Deal <span className="text-xs opacity-75">↗</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
