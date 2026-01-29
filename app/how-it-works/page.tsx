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
      desc: 'Our Market Scout tracks live street prices and release dates, ensuring you don\'t buy "new" tech that\'s actually 4 years old.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      id: 2,
      title: 'Forensic Audio',
      icon: Microscope,
      desc: 'The Video Scout doesn\'t just watch; it listens. We analyze high-fidelity transcripts to catch "micro-complaints" reviewers try to hide.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      id: 3,
      title: 'Community Intel',
      icon: ShieldCheck,
      desc: 'Verified Field Reports from ranked users (Cadet to Oracle). We filter out astroturfing to show you raw, honest ownership experiences.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20'
    },
    {
      id: 4,
      title: 'The Verdict',
      icon: Gavel,
      desc: 'The Judge synthesizes all data into a 2026-calibrated Truth Score. It penalizes legacy hardware and rewards genuine value.',
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

      <div className="mx-auto max-w-6xl px-6 pt-12 pb-12 relative z-10">
        <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-widest mb-3">
                <ScanSearch className="w-3.5 h-3.5" /> System Architecture
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
                Inside the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Lens</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Skeptek cuts through the noise of affiliate marketing and sponsored bias to deliver the raw, data-backed truth.
            </p>
        </div>

        {/* The Analysis Pipeline */}
        <div className="relative">
            {/* Animated Connector Line (Desktop) */}
            <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-ml-px md:hidden" />
            <div className="hidden md:block absolute top-[50px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid md:grid-cols-4 gap-6 relative">
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
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl transition-transform group-hover:scale-110 duration-300 shadow-lg",
                                step.bg,
                                step.color
                            )}>
                                <step.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-xs">
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

        <div className="text-center mt-14">
            <Link href="/">
                <Button size="lg" className="h-14 px-10 rounded-full text-base shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-1 group bg-primary hover:bg-primary/90">
                    <Fingerprint className="w-5 h-5 mr-3" />
                    Start Your Investigation
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Analysis takes seconds • No account required
            </p>
        </div>
      </div>
    </main>
  );
}
