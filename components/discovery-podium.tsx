import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertOctagon, CheckCircle2, Award, ArrowUpRight, CloudLightning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrendingScans, getCategories, TrendingScan } from '@/app/actions/discovery';

export function DiscoveryPodium() {
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [data, setData] = useState<{ top: TrendingScan[], trap: TrendingScan | null }>({ top: [], trap: null });

  useEffect(() => {
    async function init() {
        setLoading(true);
        // Load Categories + Initial Data Parallel
        const [cats, [scanData]] = await Promise.all([
            getCategories(),
            Promise.all([
                 getTrendingScans('All'),
                 new Promise(r => setTimeout(r, 600)) // Min wait
            ])
        ]);

        if (cats && cats.length > 0) {
            setCategories(['All', ...cats]);
        }
        setData(scanData);
        setLoading(false);
    }
    init();
  }, []);

  const loadCategory = async (cat: string) => {
      setLoading(true);
      setActiveCategory(cat);
      
      // minimum mock delay if data load is too fast (prevents layout flicker)
      const [result] = await Promise.all([
          getTrendingScans(cat),
          new Promise(r => setTimeout(r, 400)) 
      ]);
      setData(result);
      setLoading(false);
  };

  const { top, trap } = data;
  const gold = top[0];
  const silver = top[1];
  const bronze = top[2];

  return (
    <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden">
       {/* background grid decoration */}
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
        >
            <h1 className="mb-2 text-4xl font-black tracking-tighter text-foreground uppercase italic">
                Discovery<span className="text-primary">Podium</span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm tracking-widest">
                VERIFIED PRODUCT FEED
            </p>
        </motion.div>

        {/* category filter bubbles */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => loadCategory(cat)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                        "hover:scale-105 active:scale-95",
                        activeCategory === cat 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                            : "bg-card/50 text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* content area: either loader or data */}
        {loading ? (
             <div className="w-full animate-pulse">
                 {/* podium skeleton */}
                 <div className="flex items-end justify-center gap-4 md:gap-8 mb-24 h-64">
                     <div className="w-32 h-40 bg-slate-200 dark:bg-slate-800 rounded-t-2xl opacity-50" />
                     <div className="w-40 h-56 bg-slate-200 dark:bg-slate-800 rounded-t-2xl opacity-70" />
                     <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-t-2xl opacity-50" />
                 </div>

                 {/* grid skeleton */}
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl opacity-50" />
                     <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl opacity-50" />
                 </div>
             </div>
        ) : (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCategory} // trigger re-animation on category change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {top.length === 0 ? (
                        // empty state
                        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-12 relative">
                            <CloudLightning className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground mb-2">System Initializing</h2>
                            <p className="text-sm text-slate-500 font-mono">
                                Global feed is calibrating for <span className="text-primary">{activeCategory}</span>. Be the first to scan a product to claim the podium.
                            </p>
                        </div>
                    ) : (
                        <>
                        {/* podium layout - 3d effect */}
                        <div className="mb-24 flex items-end justify-center gap-4 md:gap-8 perspective-1000 min-h-[300px]">
                        
                        {/* 2nd Place - Silver */}
                        {silver && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center group"
                        >
                            <div className="mb-12 text-center transform group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-sm font-semibold text-muted-foreground mb-1">{silver.category}</div>
                                <div className="font-bold text-foreground text-lg truncate max-w-[140px]">{silver.product_name}</div>
                            </div>
                            
                            <div className="w-32 md:w-40 relative">
                                {/* Score Card */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-xl shadow-lg z-20 flex flex-col items-center min-w-[100px]">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
                                    <span className="text-2xl font-black text-slate-500 font-mono">{silver.trust_score}</span>
                                </div>

                                {/* Podium Block */}
                                <div className="h-40 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-t-2xl border-x border-t border-white/20 relative shadow-2xl flex items-end justify-center pb-6">
                                    <div className="text-6xl font-black text-slate-500/20 absolute top-10">2</div>
                                    <div className="w-full text-center">
                                        <div className="inline-block px-3 py-1 rounded-full bg-slate-500/20 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                                            Silver
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )}

                        {/* 1st Place - Gold */}
                        {gold && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="flex flex-col items-center group z-10"
                        >
                            {/* Crown */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="mb-6"
                            >
                                <Award className="w-12 h-12 text-amber-400 drop-shadow-lg" />
                            </motion.div>

                            <div className="mb-14 text-center transform group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-sm font-semibold text-amber-500 mb-1">Top Choice</div>
                                <div className="font-bold text-foreground text-2xl truncate max-w-[180px]">{gold.product_name}</div>
                            </div>

                            <div className="w-40 md:w-48 relative">
                                {/* Score Card */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-amber-500/30 px-6 py-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] z-20 flex flex-col items-center min-w-[120px]">
                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500">Trust Score</span>
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600 font-mono">{gold.trust_score}</span>
                                </div>

                                {/* Podium Block */}
                                <div className="h-56 bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-950/80 rounded-t-2xl border-x border-t border-amber-400/30 relative shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-end justify-center pb-8 backdrop-blur-md">
                                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                                    <div className="text-7xl font-black text-amber-600/10 absolute top-12">1</div>
                                    <div className="w-full text-center">
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500 text-white shadow-lg text-sm font-black uppercase tracking-wider">
                                            Gold
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )}

                        {/* 3rd Place - Bronze */}
                        {bronze && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col items-center group"
                        >
                            <div className="mb-12 text-center transform group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-sm font-semibold text-muted-foreground mb-1">{bronze.category}</div>
                                <div className="font-bold text-foreground text-lg truncate max-w-[140px]">{bronze.product_name}</div>
                            </div>

                            <div className="w-32 md:w-40 relative">
                                {/* Score Card */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-xl shadow-lg z-20 flex flex-col items-center min-w-[100px]">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
                                    <span className="text-2xl font-black text-orange-700/70 font-mono">{bronze.trust_score}</span>
                                </div>

                                {/* Podium Block */}
                                <div className="h-32 bg-gradient-to-b from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-950/40 rounded-t-2xl border-x border-t border-orange-400/20 relative shadow-xl flex items-end justify-center pb-6">
                                    <div className="text-6xl font-black text-orange-800/10 absolute top-6">3</div>
                                    <div className="w-full text-center">
                                        <div className="inline-block px-3 py-1 rounded-full bg-orange-800/10 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
                                            Bronze
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )}
                        </div>
                        </>
                    )}

                    {/* bento grid layout for lists - only show if we have data */}
                    {top.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                        
                        {/* Top Verified List */}
                        <Card className="p-6 border-border/60 bg-card/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-6 text-foreground">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <h2 className="font-bold uppercase tracking-tight">Verified Excellence</h2>
                            </div>
                            
                            <div className="space-y-4">
                                {top.map((product) => (
                                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl bg-background/50 border border-transparent hover:border-primary/20 transition-all hover:bg-background group">
                                        <div className="font-mono text-sm text-muted-foreground w-6">#{product.rank}</div>
                                        <div className="flex-1">
                                            <div className="font-bold text-foreground text-sm">{product.product_name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{product.category}</span>
                                                {/* REAL METRIC: Trend derived from 72h scan volume */}
                                                <span className={cn(
                                                    "font-medium flex items-center gap-0.5",
                                                    product.trend_label === 'Trending' ? "text-emerald-500" : "text-slate-400"
                                                )}>
                                                    <TrendingUp className="w-3 h-3" /> {product.trend_label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-primary font-mono bg-primary/10 px-2 py-1 rounded-lg">
                                                {product.trust_score.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Trap/Junk Detection Card */}
                        {trap && (
                            <Card className="relative p-6 overflow-hidden border-rose-500/30 bg-rose-500/5">
                                {/* ... (Background Logic Intact) ... */}
                                <div className="absolute inset-0 opacity-10" 
                                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'}} 
                                />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-6 text-rose-600 animate-pulse">
                                        <AlertOctagon className="w-5 h-5" />
                                        <h2 className="font-bold uppercase tracking-tight">Detection Alert</h2>
                                    </div>

                                    <div className="bg-card/80 backdrop-blur-md p-5 rounded-xl border border-rose-200 dark:border-rose-900 shadow-sm relative">
                                        {/* Glitch Overlay Effect */}
                                        <div className="absolute -right-2 top-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rotate-3 shadow-md">
                                            Manipulated
                                        </div>

                                        <h3 className="font-bold text-lg text-foreground mb-1">{trap.product_name}</h3>
                                        <p className="text-xs text-rose-600 font-mono uppercase mb-4">Anomaly Detected</p>

                                        <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                                            Massive discrepancy between <span className="text-amber-500 font-bold">Marketing Claims</span> and our <span className="text-rose-600 font-bold">{trap.trust_score} verified score</span>.
                                        </p>

                                        {/* REAL METRICS: Driven by DB View Aggregation */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-center">
                                                <div className="text-[10px] font-bold text-rose-600 mb-0.5">ANOMALY LEVEL</div>
                                                <div className="text-lg font-black text-rose-700 dark:text-rose-400">{trap.anomaly_level}</div>
                                            </div>
                                            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-center">
                                                <div className="text-[10px] font-bold text-rose-600 mb-0.5">REAL VALUE</div>
                                                <div className="text-lg font-black text-rose-700 dark:text-rose-400">{trap.real_value}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                    )}
                </motion.div>
            </AnimatePresence>
        )}
      </div>
    </div>
  );
}
