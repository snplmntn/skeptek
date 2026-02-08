'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, ExternalLink, HelpCircle } from 'lucide-react';

export interface FairnessMeterProps {
  currentPrice: number;
  msrp?: number;
  launchDate?: string;
  competitorPriceRange?: { min: number; max: number };
  qualityScore?: number; // 0-100 scale
  productUrl?: string;
  className?: string;
}

interface FMVResult {
  min: number;
  max: number;
  baseFMV: number;
  depreciationFactor: number;
  ageInMonths: number;
}

/**
 * Calculate product age in months from launch date
 */
function calculateAge(launchDate?: string): number {
  if (!launchDate) return 12; // Default to 1 year if unknown
  
  try {
    const launch = new Date(launchDate);
    const now = new Date();
    const diffMs = now.getTime() - launch.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average month length
    return Math.max(0, Math.round(diffMonths));
  } catch {
    return 12;
  }
}

/**
 * Calculate Fair Market Value using MSRP, age, quality, and competitor data
 */
function calculateFMV(params: {
  msrp?: number;
  currentPrice: number;
  launchDate?: string;
  competitorPriceRange?: { min: number; max: number };
  qualityScore?: number;
}): FMVResult {
  const { msrp, currentPrice, launchDate, competitorPriceRange, qualityScore } = params;
  
  // 1. Calculate age-based depreciation
  const ageInMonths = calculateAge(launchDate);
  // Tech depreciates ~2% per month, minimum 50% of original value
  const depreciationFactor = Math.max(0.5, 1 - (ageInMonths * 0.02));
  
  // 2. Base FMV from MSRP (or use current price as fallback)
  let baseFMV = msrp ? msrp * depreciationFactor : currentPrice;
  
  // 3. Quality adjustment (poor quality = lower fair value)
  const qualityAdjustment = qualityScore ? (qualityScore / 100) : 1.0;
  baseFMV *= qualityAdjustment;
  
  // 4. Market reality check using competitor prices
  if (competitorPriceRange) {
    // Clamp FMV within competitor range
    baseFMV = Math.max(
      competitorPriceRange.min,
      Math.min(baseFMV, competitorPriceRange.max)
    );
  }
  
  // 5. Return range with ±10% tolerance
  return {
    min: Math.round(baseFMV * 0.9),
    max: Math.round(baseFMV * 1.1),
    baseFMV: Math.round(baseFMV),
    depreciationFactor,
    ageInMonths
  };
}

export function FairnessMeter({
  currentPrice,
  msrp,
  launchDate,
  competitorPriceRange,
  qualityScore,
  productUrl,
  className = ''
}: FairnessMeterProps) {
  
  // Calculate Fair Market Value
  const fmv = calculateFMV({
    msrp,
    currentPrice,
    launchDate,
    competitorPriceRange,
    qualityScore
  });
  
  // Determine if overpriced or TGTBT (Too Good To Be True)
  const isOverpriced = currentPrice > fmv.max;
  const isTGTBT = currentPrice < (fmv.min * 0.4); // < 40% of Fair Value Min = Suspicious
  const isFair = currentPrice >= fmv.min && currentPrice <= fmv.max;
  const isUnderpriced = currentPrice < fmv.min && !isTGTBT;
  
  // Calculate scale max (150% of max value for visual spacing)
  const scaleMax = Math.max(currentPrice, fmv.max) * 1.5;
  
  return (
    <div className={className}>
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
      
      <div className={`p-8 forensic-glass rounded-2xl border relative overflow-hidden transition-colors duration-500 ${isTGTBT ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none ${isTGTBT ? 'bg-amber-500/10' : 'bg-primary/5'}`} />
        
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
            {isOverpriced && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] uppercase tracking-widest text-rose-500 dark:text-rose-400">Overpriced</span>
              </div>
            )}
            {isTGTBT && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Suspiciously Low</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Scale End</p>
            <p className="text-lg font-mono text-foreground">${Math.round(scaleMax)}</p>
          </div>
        </div>

        {/* The Main Connective Bar */}
        <div className="relative h-6 bg-slate-200 dark:bg-slate-800/50 rounded-full mb-32 mt-8 mx-4 md:mx-12">
          
          {/* Fair Value Zone (Green Pill) */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/20 rounded-full border border-emerald-500/30"
            style={{
              left: `${(fmv.min / scaleMax) * 100}%`,
              width: `${((fmv.max - fmv.min) / scaleMax) * 100}%`
            }}
          >
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 flex flex-col items-center">
              <div className="w-px h-2 bg-emerald-500/50" />
              <div className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-500/50 dark:text-emerald-200 border px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xl">
                FAIR: ${fmv.min}-${fmv.max}
              </div>
            </div>
          </div>

          {/* Current Price Marker */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] z-30 transition-all duration-1000 ${
                isTGTBT ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]'
            }`}
            style={{ left: `${Math.min(100, (currentPrice / scaleMax) * 100)}%`, marginLeft: '-10px' }}
          >
            {/* Label Below */}
            <div className="absolute top-full mt-12 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center z-40">
              <div className={`w-px h-12 mb-[-2px] absolute bottom-full left-1/2 -translate-x-1/2 ${isTGTBT ? 'bg-amber-500' : 'bg-blue-500/50'}`} />
              <div className={`px-4 py-2.5 rounded-xl border-2 shadow-2xl text-center flex flex-col gap-1 min-w-[100px] ${
                isOverpriced 
                  ? 'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-950 dark:text-rose-100' 
                  : isTGTBT
                  ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                  : 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-950 dark:text-white'
              }`}>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">You Pay</span>
                <span className="text-xl font-black font-mono tracking-tight">${currentPrice}</span>
              </div>
            </div>
          </div>

          {/* Red Overpriced Zone */}
          {isOverpriced && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0 dashed-line"
              style={{
                left: `${(fmv.max / scaleMax) * 100}%`,
                width: `${Math.min(100 - ((fmv.max / scaleMax) * 100), ((currentPrice - fmv.max) / scaleMax) * 100)}%`
              }}
            />
          )}
        </div>
        
        {/* Price Health Summary */}
        <div className={`mt-8 mb-4 flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 duration-700 ${
            isTGTBT ? 'bg-amber-500/10 border-amber-500/20' : 'bg-foreground/5 border-foreground/5'
        }`}>
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl shrink-0 ${
                isOverpriced ? 'bg-rose-500/10 text-rose-500' : 
                isTGTBT ? 'bg-amber-500/20 text-amber-500' : 
                'bg-emerald-500/10 text-emerald-500'
            }`}>
              {isOverpriced ? <AlertTriangle className="w-6 h-6" /> : isTGTBT ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-widest mb-1.5 ${
                  isOverpriced ? 'text-rose-500' : 
                  isTGTBT ? 'text-amber-500' : 
                  'text-emerald-500'
              }`}>
                {isOverpriced ? 'Price Alert: Overpriced' : isTGTBT ? 'ANOMALY DETECTED: EXTREME DISCOUNT' : isFair ? 'Verified: Fair Market Value' : 'Deal Alert: Below Market'}
              </h4>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {isOverpriced 
                  ? `Current pricing is $${(currentPrice - fmv.max).toFixed(2)} above the identified fair market valuation.${msrp ? ` (MSRP: $${msrp})` : ''} Recommended to wait for a discount.`
                  : isTGTBT
                  ? `CAUTION: This item is priced ${(100 - (currentPrice / fmv.min * 100)).toFixed(0)}% BELOW fair market value. This is statistically improbable. It is either a SCAM/FAKE or the DEAL OF A LIFETIME. Verify the seller reputation immediately.`
                  : isUnderpriced
                  ? `Excellent value! Current price is $${(fmv.min - currentPrice).toFixed(2)} below fair market value.${msrp ? ` (MSRP: $${msrp})` : ''} This represents a strong deal opportunity.`
                  : `The current list price of $${currentPrice.toFixed(2)} aligns with our analysis model.${msrp ? ` (MSRP: $${msrp})` : ''} This represents a transparent transaction.`
                }
              </p>
            </div>
          </div>

          {/* View Deal Button */}
          {productUrl && (
            <Button 
              size="sm"
              className="shrink-0 bg-primary hover:bg-blue-500 text-white gap-3 rounded-xl px-6 font-mono text-[10px] tracking-widest uppercase h-12 shadow-lg shadow-blue-500/20"
              onClick={() => window.open(productUrl, '_blank')}
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${(() => {
                  try { return new URL(productUrl).hostname; }
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
  );
}
