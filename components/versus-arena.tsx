'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Plus, Check, Activity, ThumbsUp, AlertTriangle, AlertCircle, TrendingUp, Zap, Shield, Sparkles, ShoppingCart, MessageCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';


// local type definitions
  interface ProductDetails {
    trustScore: { score: number; label: string };
    sentiment: { positive: number; neutral: number; negative: number };
    pros: string[];
    cons: string[];
  }

  interface Comparison {
    id: number;
    title: string;
    products: Array<{ 
        id: string; 
        name: string; 
        score: number; 
        isWinner: boolean;
        recommendation?: 'BUY' | 'CONSIDER' | 'AVOID';
    verdictType?: 'BUY' | 'CONSIDER' | 'AVOID';
        verdict?: string;
        details?: ProductDetails; 
        sources?: {
            market?: { productUrl: string; price: string };
            reddit?: { relevantThreads: string[] };
            video?: { videoId: string; title: string; url?: string; thumbnail?: string }[];
        };
    }>;
    winReason: string;
    differences: Array<{ category: string; scores: Record<string, number> }>;
  }

  // --- mock data (fallback) ---
  const MOCK_COMPARISONS: Comparison[] = [
    {
      id: 1,
      title: 'Flagship Phones',
      products: [
        { 
            id: 'p1', 
            name: 'Apple iPhone 15 Pro', 
            score: 8.5, 
            isWinner: true,
            recommendation: 'BUY',
            verdictType: 'BUY',
            verdict: 'The gold standard for mobile cinematography and performance.',
            details: {
                trustScore: { score: 9.8, label: 'High Trust' },
                sentiment: { positive: 85, neutral: 10, negative: 5 },
                pros: ['Exceptional Video Quality', 'Titanium Build', 'Action Button'],
                cons: ['Slow Charging', 'Expensive Repairs']
            },
            sources: {
                market: { productUrl: 'https://apple.com/iphone', price: '$999' },
                reddit: { sources: [{ title: 'Reddit Thread', url: 'https://reddit.com/r/apple' }] } as any,
                video: [{ videoId: 'dQw4w9WgXcQ', title: 'Video Review', url: 'https://youtube.com' }] as any
            }
        },
      ],
      winReason: 'Better Battery Life',
      differences: [] 
    }
  ];

interface VersusArenaProps {
    data?: Comparison; // the real data from backend (optional)
    onBack?: () => void;
}

export function VersusArena({ data, onBack }: VersusArenaProps) {
  // if real data is passed (comparison mode active), use it. 
  // otherwise default to the first mock item for "discovery" mode.
  
  // transform backend data format to internal format if necessary or use directly if schema matches.
  // the schema from analyze.ts matches 'comparison' interface reasonably well, but key names need alignment.
  
  const activeComparison = data || MOCK_COMPARISONS[0];
  
  // sort products by score for layout
  const comparison = {
    ...activeComparison,
    products: [...activeComparison.products].sort((a, b) => b.score - a.score)
  };

  const [selectedComparison, setSelectedComparison] = useState(0);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // if using real data, we don't need the mock selector at the top
  const showSelector = !data;
  const comparisons = MOCK_COMPARISONS; // use mock list for selector if in discovery mode

  const getRecommendationBadge = (recommendation: string) => {
    const styles = {
       BUY: 'bg-emerald-600 text-white shadow-emerald-200',
       CONSIDER: 'bg-amber-500 text-white shadow-amber-200',
       AVOID: 'bg-rose-600 text-white shadow-rose-200' 
    };
    
    return (
      <span className={cn(
        "px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] shadow-lg inline-block uppercase",
        styles[recommendation as keyof typeof styles]
      )}>
          {recommendation}
      </span>
    );
  };

  const getVerdictStyle = (verdictType?: string) => {
    switch (verdictType) {
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

  return (
    <div className="min-h-screen bg-background px-6 py-12 transition-colors duration-500">
      <div className="mx-auto max-w-7xl">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
        >
            <h1 className="mb-3 text-4xl font-black tracking-tighter text-foreground uppercase italic pb-2">
                Comparison<span className="text-primary">Matrix</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase opacity-70">
                Deep Analysis Unit // Comparative Data
            </p>
        </motion.div>


        {/* comparison selector - only show in discovery/demo mode */}
        {showSelector && (
            <div className="mb-12 flex justify-center gap-4 flex-wrap">
            {comparisons.map((comp, idx) => (
                <button
                key={comp.id}
                onClick={() => setSelectedComparison(idx)}
                className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border backdrop-blur-sm",
                    selectedComparison === idx 
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105" 
                        : "bg-background/50 hover:bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
                >
                {comp.title}
                </button>
            ))}
            </div>
        )}

        {/* battle station grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* left: product cards */}
            <div className="lg:col-span-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {comparison.products.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ duration: 0.4, delay: i * 0.1, type: "spring", bounce: 0.3 }}
                            className={cn(
                                "relative group perspective-1000",
                                product.isWinner ? "z-10 md:-mt-4 lg:-mt-8" : ""
                            )}
                        >
                            <a 
                                href={product.sources?.market?.productUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn(
                                    "relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-md transition-all duration-500 block",
                                    product.isWinner 
                                        ? "border-primary/50 shadow-[0_0_40px_rgba(59,130,246,0.15)] h-[480px] dark:shadow-[0_0_50px_rgba(59,130,246,0.2)]" 
                                        : "border-border hover:border-primary/30 h-[440px]"
                                )}
                            >
                                {/* winner glow effect */}
                                {product.isWinner && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
                                )}

                                {/* card header */}
                                <div className="p-6 text-center relative z-10 flex flex-col h-full">
                                    {product.isWinner && (
                                        <div className="inline-flex mx-auto items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider mb-4 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse">
                                            <Crown className="w-3 h-3" /> Top Choice
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-foreground leading-snug mb-3 min-h-[3.5rem] flex items-center justify-center px-2">
                                        {product.name}
                                    </h3>

                                    {/* smart verdict badge */}
                                    {product.recommendation && (
                                        <div className="mb-6">
                                            {getRecommendationBadge(product.recommendation)}
                                        </div>
                                    )}

                                    {/* score ring */}
                                    <div className="relative w-28 h-28 mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
                                        <svg className="h-full w-full -rotate-90 text-muted/20" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke={product.isWinner ? "var(--primary)" : "var(--muted-foreground)"}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: product.score / 10 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={cn(
                                                "text-3xl font-black font-mono tracking-tighter",
                                                product.isWinner ? "text-primary" : "text-foreground dark:text-white"
                                            )}>
                                                {product.score.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1 group-hover:text-primary transition-colors">Trust Score</span>
                                        </div>
                                    </div>


                                    {/* card footer: price & source */}
                                    {(product.sources?.market?.price && product.sources.market.price !== 'Unknown' && product.sources.market.productUrl) && (
                                        <div className="mt-auto pt-6 border-t border-border/30">
                                            <div className="text-xl font-black text-primary font-mono tracking-tighter mb-1">
                                                {product.sources.market.price}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-60 flex items-center justify-center gap-1.5 group-hover:text-primary transition-colors">
                                                View Deal <ExternalLink className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </a>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* right: comparative analytics */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* winner insight */}
                {comparison.winReason && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={comparison.winReason}
                        className="bg-primary/5 border border-primary/20 p-5 rounded-2xl relative overflow-hidden group hover:bg-primary/10 transition-all duration-500 shadow-[0_0_30px_rgba(59,130,246,0.05)] border-l-4 border-l-primary"
                    >
                        {/* holographic glow layer */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute -right-4 -top-4 text-primary/10 group-hover:text-primary/15 transition-colors">
                            <Sparkles className="w-24 h-24 rotate-12" />
                        </div>
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                            <Zap className="w-3.5 h-3.5" /> Competitive Edge
                        </h4>
                        <p className="text-foreground/90 font-medium text-[13px] leading-relaxed relative z-10">
                            The <span className="text-primary font-bold">{comparison.products[0].name}</span> wins due to:
                        </p>
                        <div className="mt-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs leading-relaxed relative z-10 shadow-inner">
                            {comparison.winReason}
                        </div>
                    </motion.div>
                )}

                {/* specs breakdown */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                         <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" /> Technical Specs
                         </h3>
                    </div>
                    <div className="p-3 space-y-1">
                        {comparison.differences.map((item, idx) => {
                             const maxScore = Math.max(...comparison.products.map(p => item.scores[p.id] || 0));
                             
                             return (
                                <motion.div 
                                    key={idx}
                                    onHoverStart={() => setHoveredStat(item.category)}
                                    onHoverEnd={() => setHoveredStat(null)}
                                    className="p-3 hover:bg-muted/50 rounded-xl transition-colors cursor-default group/stat"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-muted-foreground group-hover/stat:text-foreground uppercase tracking-wide">{item.category}</span>
                                    </div>
                                    
                                    {/* stat bars */}
                                    <div className="space-y-3">
                                        {comparison.products.map(product => {
                                            const score = item.scores[product.id] || 0;
                                            const isBest = score === maxScore;

                                            return (
                                                <div key={product.id} className="relative">
                                                    <div className="flex justify-between text-[10px] mb-1">
                                                        <span className={cn(
                                                            "truncate max-w-[120px]",
                                                            isBest ? "font-bold text-foreground" : "text-muted-foreground",
                                                            hoveredStat === item.category && isBest ? "text-primary" : ""
                                                        )}>
                                                            {product.name}
                                                        </span>
                                                        <span className={cn(
                                                            "font-mono",
                                                            isBest ? "text-primary font-bold" : "text-muted-foreground"
                                                        )}>
                                                            {score.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${(score / 10) * 100}%` }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-300",
                                                                isBest ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-muted-foreground/30",
                                                                hoveredStat === item.category && isBest ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-y-110" : ""
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                             );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* deep dive section */}
        <div className={cn(
            "mt-16 grid gap-6",
            comparison.products.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-3"
        )}>
            {comparison.products.map((product, i) => product.details && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={product.id} className="space-y-4 p-5 rounded-2xl border border-transparent hover:border-border/50 bg-card/30 hover:bg-card/50 transition-all"
                >
                     <h4 className={cn(
                        "text-xs font-black uppercase tracking-widest border-b pb-3 mb-4 flex items-center justify-between",
                        product.isWinner ? "text-primary border-primary" : "text-muted-foreground border-border"
                    )}>
                        {product.name}
                        {product.isWinner && <Crown className="w-4 h-4" />}
                     </h4>
                     
                     <div className="space-y-6">
                         <div>
                             <div className="text-[10px] font-mono text-emerald-500 mb-3 flex items-center gap-2 font-bold uppercase tracking-wider">
                                <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                             </div>
                             <ul className="space-y-2.5">
                                 {product.details.pros.map((pro, idx) => (
                                     <li key={idx} className="text-xs text-foreground/80 flex items-start gap-2.5 leading-relaxed">
                                         <span className="text-emerald-500 mt-0.5">●</span> {pro}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                         <div>
                             <div className="text-[10px] font-mono text-amber-500 mb-3 flex items-center gap-2 font-bold uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                             </div>
                             <ul className="space-y-2.5">
                                 {product.details.cons.map((con, idx) => (
                                     <li key={idx} className="text-xs text-foreground/80 flex items-start gap-2.5 leading-relaxed">
                                         <span className="text-amber-500 mt-0.5">●</span> {con}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                         
                         {/* verdict panel */}
                         <div className={cn("p-4 rounded-xl border transition-all duration-300", getVerdictStyle(product.verdictType))}>
                            <div className="text-[10px] font-mono mb-2 flex items-center gap-2 font-black uppercase tracking-widest opacity-80">
                                <Shield className="w-3.5 h-3.5" /> Smart Verdict
                            </div>
                            <p className="text-xs leading-relaxed font-bold mb-1">
                                {product.details.trustScore.label}
                            </p>
                            <p className="text-[11px] leading-relaxed opacity-90">
                                {product.verdict || "Recommendation pending further analysis."}
                            </p>
                         </div>

                         {/* sources panel */}
                         {/* data source verification */}
                         {product.sources && (
                            ((product.sources.market?.productUrl && product.sources.market.price !== 'Unknown') || 
                             ((product.sources.reddit as any)?.sources?.length > 0) || 
                             (product.sources.video?.length ?? 0) > 0)
                         ) && (
                             <div className="mt-6 pt-5 border-t border-border/50">
                                 <div className="text-[9px] font-mono text-muted-foreground mb-3 flex items-center gap-2 font-bold uppercase tracking-wider opacity-70">
                                     <Activity className="w-3 h-3" /> Evidence Sources
                                 </div>
                                 <div className="grid gap-2">
                                     {/* 1. market source (view deal) */}
                                     {(product.sources.market?.productUrl && product.sources.market.price !== 'Unknown') && (
                                         <a 
                                            href={product.sources.market.productUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-xl transition-all group/deal shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                         >
                                             <div className="flex items-center gap-3">
                                                 <div className="bg-primary/20 p-1.5 rounded-lg group-hover/deal:scale-110 transition-transform">
                                                     <ShoppingCart className="w-4 h-4 text-primary" />
                                                 </div>
                                                 <div>
                                                     <div className="text-[10px] uppercase font-bold tracking-wider text-primary">Market Listing</div>
                                                     <div className="text-sm font-bold text-foreground truncate max-w-[150px]">{product.sources.market.productUrl.replace('https://', '').split('/')[0]}</div>
                                                 </div>
                                             </div>
                                             <div className="text-right">
                                                <div className="text-[10px] font-bold text-primary font-mono">{product.sources.market.price}</div>
                                                <ExternalLink className="w-3.5 h-3.5 text-primary opacity-50 group-hover/deal:opacity-100 ml-auto mt-1" />
                                             </div>
                                         </a>
                                     )}

                                     {/* 2. evidence sources (social/video) */}
                                     <div className="grid gap-2">
                                         {/* reddit sources */}
                                         {(product.sources.reddit as any)?.sources && (product.sources.reddit as any).sources.map((source: any, idx: number) => (
                                             <a 
                                                key={idx}
                                                href={source.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 transition-all hover:border-orange-500/30 group/social"
                                             >
                                                <div className="relative w-4 h-4 flex-shrink-0">
                                                    <MessageCircle className="absolute inset-0 w-full h-full text-orange-500 opacity-20" />
                                                    <img 
                                                        src={`https://www.google.com/s2/favicons?domain=reddit.com&sz=32`} 
                                                        alt="Reddit"
                                                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition-transform"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] uppercase font-black tracking-widest text-orange-500/80 mb-0.5">Reddit Thread</div>
                                                    <div className="text-[10px] font-bold text-foreground truncate">{source.title || "Community Consensus"}</div>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-30 group-hover/social:opacity-100 transition-opacity" />
                                             </a>
                                         ))}
                                         
                                         {/* video sources */}
                                         {product.sources.video && product.sources.video.map((video: any, idx: number) => (
                                              <a 
                                                key={idx}
                                                href={video.url || `https://www.youtube.com/watch?v=${video.videoId}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="relative group/video overflow-hidden rounded-xl border border-border/40 bg-foreground/5 dark:bg-white/5 hover:border-red-500/30 transition-all"
                                              >
                                                 <div className="flex items-center p-2.5 gap-3">
                                                    <div className="relative w-16 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-white/5">
                                                        {video.thumbnail ? (
                                                            <img 
                                                                src={video.thumbnail} 
                                                                alt={video.title}
                                                                className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 group-hover/video:scale-110 transition-all duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-red-500/10">
                                                                <PlayCircle className="w-4 h-4 text-red-500" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <PlayCircle className="w-4 h-4 text-white shadow-xl" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <div className="text-[9px] uppercase font-black tracking-widest text-red-500/80 mb-0.5">Video Review</div>
                                                        <div className="text-[10px] font-bold text-foreground truncate">{video.title || "User Verification"}</div>
                                                        {video.moment && video.moment !== "0:00" && (
                                                            <div className="text-[8px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <Activity className="w-2.5 h-2.5" /> Found at {video.moment}
                                                            </div>
                                                        )}
                                                    </div>
                                                 </div>
                                              </a>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>
                </motion.div>
            ))}
        </div>

        {/* quick nav: search again */}
        <div className="mt-20 mb-24 flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
            <Button
                onClick={onBack}
                className="bg-primary hover:bg-blue-500 text-white px-12 py-8 rounded-2xl gap-4 group transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(59,130,246,0.2)]"
            >
                <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-70">Ready for Next Investigation</p>
                    <p className="text-lg font-black uppercase tracking-tighter italic">Search Again</p>
                </div>
            </Button>
        </div>
      </div>
    </div>
  );
}
