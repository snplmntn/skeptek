'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Plus, Check, Activity, ThumbsUp, AlertTriangle, AlertCircle, TrendingUp, Zap, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VersusArena() {
  const [selectedComparison, setSelectedComparison] = useState(0);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

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
        details?: ProductDetails; 
    }>;
    winReason: string;
    differences: Array<{ category: string; scores: Record<string, number> }>;
  }

  const comparisons: Comparison[] = [
    {
      id: 1,
      title: 'Flagship Phones',
      products: [
        { 
            id: 'p1', 
            name: 'Apple iPhone 15 Pro', 
            score: 8.5, 
            isWinner: true,
            details: {
                trustScore: { score: 9.8, label: 'High Trust' },
                sentiment: { positive: 85, neutral: 10, negative: 5 },
                pros: ['Exceptional Video Quality', 'Titanium Build', 'Action Button'],
                cons: ['Slow Charging', 'Expensive Repairs']
            }
        },
        { 
            id: 'p2', 
            name: 'Samsung Galaxy S24', 
            score: 7.8, 
            isWinner: false,
            details: {
                trustScore: { score: 8.5, label: 'Good' },
                sentiment: { positive: 70, neutral: 20, negative: 10 },
                pros: ['Amazing Screen', 'Galaxy AI Features', '7 Years Updates'],
                cons: ['Exynos Variance', 'Shutter Lag']
            }
        },
        { 
            id: 'p3', 
            name: 'Google Pixel 8 Pro', 
            score: 8.2, 
            isWinner: false,
            details: {
                trustScore: { score: 9.2, label: 'Very Good' },
                sentiment: { positive: 78, neutral: 15, negative: 7 },
                pros: ['Best Still Photos', 'Helpful Software', 'Screen Brightness'],
                cons: ['Battery Life', 'Tensor G3 Heat']
            }
        },
      ],
      winReason: 'Better Battery Life (+4hrs)',
      differences: [
        { category: 'Camera', scores: { p1: 9.1, p2: 8.7, p3: 8.9 } },
        { category: 'Battery', scores: { p1: 7.8, p2: 8.2, p3: 7.5 } },
        { category: 'Design', scores: { p1: 8.9, p2: 8.3, p3: 8.5 } },
        { category: 'Performance', scores: { p1: 9.0, p2: 8.8, p3: 8.6 } },
      ],
    },
    {
      id: 2,
      title: 'Pro Laptops',
      products: [
        { 
            id: 'p1', 
            name: 'MacBook Pro M3', 
            score: 8.6, 
            isWinner: true,
            details: {
                trustScore: { score: 9.9, label: 'Elite' },
                sentiment: { positive: 90, neutral: 8, negative: 2 },
                pros: ['Best-in-class Battery', 'Stunning Display'],
                cons: ['Pricey Upgrades', 'Notch']
            }
        },
        { 
            id: 'p2', 
            name: 'Dell XPS 15', 
            score: 8.1, 
            isWinner: false,
            details: {
                trustScore: { score: 8.8, label: 'Solid' },
                sentiment: { positive: 75, neutral: 15, negative: 10 },
                pros: ['InfinityEdge Display', 'Premium Build'],
                cons: ['Webcam Quality', 'Thermals']
            }
        },
      ],
      winReason: 'Superior Build Quality',
      differences: [
        { category: 'Performance', scores: { p1: 9.2, p2: 8.9 } },
        { category: 'Build Quality', scores: { p1: 9.0, p2: 8.4 } },
        { category: 'Battery', scores: { p1: 8.5, p2: 7.3 } },
        { category: 'Price Value', scores: { p1: 7.0, p2: 8.2 } },
      ],
    },
    {
      id: 3,
      title: 'Noise Cancelling Headphones',
      products: [
        { 
            id: 'p1', 
            name: 'Sony WH-1000XM5', 
            score: 8.9, 
            isWinner: true,
            details: {
                trustScore: { score: 9.5, label: 'Industry Leader' },
                sentiment: { positive: 88, neutral: 10, negative: 2 },
                pros: ['Features Count', 'Lightweight'],
                cons: ['No Folding', 'Fingerprints']
            }
        },
        { 
            id: 'p2', 
            name: 'Bose QC 45', 
            score: 8.2, 
            isWinner: false,
            details: {
                trustScore: { score: 9.0, label: 'Reliable' },
                sentiment: { positive: 80, neutral: 15, negative: 5 },
                pros: ['Comfort King', 'Simple Controls'],
                cons: ['Design Dated', 'Micro USB lol jk']
            }
        },
        { 
            id: 'p3', 
            name: 'AirPods Max', 
            score: 8.4, 
            isWinner: false, 
             details: {
                 trustScore: { score: 8.7, label: 'Premium' },
                 sentiment: { positive: 75, neutral: 15, negative: 10 },
                 pros: ['Build Quality', 'Transparency Mode'],
                 cons: ['Heavy', 'Case is a joke']
            }
        },
      ],
      winReason: 'Best Noise Cancellation',
      differences: [
        { category: 'Noise Cancellation', scores: { p1: 9.3, p2: 8.8, p3: 8.9 } },
        { category: 'Sound Quality', scores: { p1: 8.7, p2: 8.5, p3: 8.4 } },
        { category: 'Connectivity', scores: { p1: 8.8, p2: 8.2, p3: 9.0 } },
        { category: 'Comfort', scores: { p1: 8.5, p2: 8.9, p3: 8.1 } },
      ],
    },
  ];

  const comparisonRaw = comparisons[selectedComparison];
  const comparison = {
    ...comparisonRaw,
    products: [...comparisonRaw.products].sort((a, b) => b.score - a.score)
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 transition-colors duration-500">
      <div className="mx-auto max-w-7xl">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
        >
            <h1 className="mb-3 text-4xl font-black tracking-tighter text-foreground uppercase italic">
                Versus<span className="text-primary">Arena</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase opacity-70">
                Forensic Analysis Unit // Comparative Data
            </p>
        </motion.div>

        {/* Comparison Selector */}
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

        {/* Battle Station Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Product Cards */}
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
                            <div className={cn(
                                "relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-md transition-all duration-500",
                                product.isWinner 
                                    ? "border-primary/50 shadow-[0_0_40px_rgba(59,130,246,0.15)] h-[440px] dark:shadow-[0_0_50px_rgba(59,130,246,0.2)]" 
                                    : "border-border hover:border-primary/30 h-[400px]"
                            )}>
                                {/* Winner Glow Effect */}
                                {product.isWinner && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
                                )}

                                {/* Card Header */}
                                <div className="p-6 text-center relative z-10 flex flex-col h-full">
                                    {product.isWinner && (
                                        <div className="inline-flex mx-auto items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider mb-4 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse">
                                            <Crown className="w-3 h-3" /> Top Choice
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-foreground leading-tight mb-2 min-h-[3rem] flex items-center justify-center">
                                        {product.name}
                                    </h3>

                                    {/* Score Ring */}
                                    <div className="relative w-32 h-32 mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
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
                                                product.isWinner ? "text-primary" : "text-foreground"
                                            )}>
                                                {product.score.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Trust Score</span>
                                        </div>
                                    </div>

                                    {/* Mini Stats (Pushed to bottom) */}
                                    <div className="mt-auto grid grid-cols-2 gap-3 text-center">
                                         <div className="bg-muted/40 rounded-lg p-2 border border-border/50">
                                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Sentiment</div>
                                            <div className="text-sm font-bold text-emerald-500 font-mono">{product.details?.sentiment.positive}%</div>
                                         </div>
                                         <div className="bg-muted/40 rounded-lg p-2 border border-border/50">
                                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Reliability</div>
                                            <div className="text-sm font-bold text-blue-500">{product.details?.trustScore.label}</div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* RIGHT: Comparative Analytics */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Winner Insight */}
                {comparison.winReason && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={comparison.winReason}
                        className="bg-primary/5 border border-primary/20 p-5 rounded-2xl relative overflow-hidden group hover:bg-primary/10 transition-colors"
                    >
                        <div className="absolute -right-4 -top-4 text-primary/10 group-hover:text-primary/15 transition-colors">
                            <Sparkles className="w-24 h-24 rotate-12" />
                        </div>
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Competitive Edge
                        </h4>
                        <p className="text-foreground font-medium text-sm leading-relaxed relative z-10">
                            The <span className="text-primary font-bold">{comparison.products[0].name}</span> wins due to <span className="border-b-2 border-primary/30">{comparison.winReason}</span>.
                        </p>
                    </motion.div>
                )}

                {/* Specs Breakdown */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                         <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" /> Forensic Specs
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
                                    
                                    {/* Stat Bars */}
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
                                                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${(score / 10) * 100}%` }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-300",
                                                                isBest ? "bg-primary" : "bg-muted-foreground/30",
                                                                hoveredStat === item.category && isBest ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" : ""
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

        {/* Deep Dive Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
            {comparison.products.map((product, i) => product.details && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={product.id} className="space-y-4 p-4 rounded-xl hover:bg-muted/20 transition-colors"
                >
                     <h4 className={cn(
                        "text-xs font-black uppercase tracking-widest border-b pb-2 mb-4",
                        product.isWinner ? "text-primary border-primary" : "text-muted-foreground border-border"
                    )}>
                        {product.name}
                     </h4>
                     
                     <div className="space-y-6">
                         <div>
                             <div className="text-[10px] font-mono text-emerald-600 mb-2 flex items-center gap-1 font-bold">
                                <ThumbsUp className="w-3 h-3" /> STRENGTHS
                             </div>
                             <ul className="space-y-2">
                                 {product.details.pros.map((pro, idx) => (
                                     <li key={idx} className="text-xs text-foreground/70 flex items-start gap-2">
                                         <span className="text-emerald-500">•</span> {pro}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                         <div>
                             <div className="text-[10px] font-mono text-amber-600 mb-2 flex items-center gap-1 font-bold">
                                <AlertTriangle className="w-3 h-3" /> RISKS
                             </div>
                             <ul className="space-y-2">
                                 {product.details.cons.map((con, idx) => (
                                     <li key={idx} className="text-xs text-foreground/70 flex items-start gap-2">
                                         <span className="text-amber-500">•</span> {con}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
