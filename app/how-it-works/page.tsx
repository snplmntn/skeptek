'use client';

import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Telescope, Microscope, ShieldCheck, Gavel, ScanSearch, ChevronRight, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Grounded Recon',
      icon: Telescope,
      desc: (
        <>
          We start by verifying the facts. Using <strong className="text-foreground">Google Search</strong>, we track down the product&apos;s original launch price (MSRP) and compare it to current prices across major retailers to ensure you aren&apos;t overpaying.
        </>
      ),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      id: 2,
      title: 'Visual & Audio Analysis',
      icon: Microscope,
      desc: (
        <>
          Our AI agents watch and listen to <strong className="text-foreground">YouTube</strong> reviews for you. We detect physical defects in video frames and analyze spoken audio to catch complaints that aren&apos;t in the description.
        </>
      ),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      id: 3,
      title: 'Community Intel',
      icon: ShieldCheck,
      desc: (
        <>
          We combine our own <strong className="text-foreground">Skeptek Field Reports</strong> with deep scans of <strong className="text-foreground">Reddit</strong> threads. Our system filters out fake &quot;bot&quot; reviews, leaving only the raw, honest truth from actual community members.
        </>
      ),
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20'
    },
    {
      id: 4,
      title: 'The Verdict',
      icon: Gavel,
      desc: (
        <>
          We combine every piece of data into a single <strong className="text-foreground">Truth Score</strong>. By enforcing strict price checks, we ensure our verdict is based on verified numbers, not AI guesses.
        </>
      ),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    }
  ];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-transparent to-background" />
        </div>

      <Navigation mode="static" />

      <div className="mx-auto max-w-7xl px-8 pt-16 pb-16 relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center mb-16 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20 text-[11px] font-mono uppercase tracking-widest mb-3">
                <ScanSearch className="w-4 h-4" /> System Architecture
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground mb-4">
                Inside the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Lens</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Skeptek cuts through the noise of affiliate marketing and sponsored bias to deliver the raw, data-backed truth.
            </p>
        </div>

        {/* The Analysis Pipeline */}
        <div className="relative flex-grow flex items-center">
            {/* Animated Connector Line (Desktop) */}
            <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-ml-px md:hidden" />
            <div className="hidden md:block absolute top-[50px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid md:grid-cols-4 gap-8 relative w-full">
                {steps.map((step, idx) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative group"
                    >
                        {/* Step Connector Node */}
                        <div className="hidden md:flex absolute -top-[58px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary z-20 items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        </div>

                        <div className={cn(
                            "relative h-full bg-card/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card",
                            step.border
                        )}>
                            {/* Number Watermark */}
                            <div className="absolute right-4 top-2 text-6xl font-black opacity-5 select-none">
                                {step.id}
                            </div>

                            {/* Icon Scanner */}
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl transition-transform group-hover:scale-110 duration-300 shadow-lg",
                                step.bg,
                                step.color
                            )}>
                                <step.icon className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                {step.desc}
                            </p>

                            {/* Active Scan Effect */}
                            <div className={cn(
                                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                                "bg-gradient-to-b from-transparent via-transparent to-primary/5"
                            )} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Gamification Section */}


        <div className="text-center mt-16">
            <Link href="/">
                <Button size="lg" className="h-16 px-10 rounded-full text-lg shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-1 group bg-primary hover:bg-primary/90">
                    <Fingerprint className="w-6 h-6 mr-3" />
                    Scan a Product
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
            <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Analysis takes seconds • No account required
            </p>
            
            {/* Gamification Section (Moved Below) */}
            <div className="mt-20 max-w-4xl mx-auto mb-16">
                <div className="relative p-8 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-black text-foreground mb-6 uppercase italic tracking-tighter">
                            Rise Through the <span className="text-primary">Ranks</span>
                        </h2>
                        
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="bg-background/40 p-5 rounded-xl border border-white/5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">1</span>
                                    Earn XP
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Get points for sharing your real experiences.
                                </p>
                            </div>

                            <div className="bg-background/40 p-5 rounded-xl border border-white/5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-purple-400">
                                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">2</span>
                                    Rank Up
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Level up from a newbie to a top-tier reviewer.
                                </p>
                            </div>

                            <div className="bg-background/40 p-5 rounded-xl border border-white/5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-amber-400">
                                    <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full">3</span>
                                    Influence
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Your reviews help others find the truth.
                                </p>
                            </div>
                        </div>

                        {/* Secondary Review Button */}
                        <div className="mt-8">
                             <Link href="/?action=review">
                                <Button variant="outline" className="gap-2 rounded-full border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all hover:scale-105">
                                    <span className="font-semibold">Review a Product</span>
                                    <span className="text-emerald-500/70">→</span>
                                </Button>
                             </Link>
                        </div>
                    </div>
                </div>
            </div>


        </div>
      </div>
    </main>
  );
}
