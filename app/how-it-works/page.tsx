'use client';

import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Telescope, Microscope, ShieldCheck, Gavel } from 'lucide-react';

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navigation mode="static" />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                Inside the Lens
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Skeptek cuts through the noise of affiliate marketing and sponsored bias to deliver the raw, data-backed truth about any product.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Step 1: The Scout */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-bold text-blue-600">1</span>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 font-bold text-xl">
                   <Telescope className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Wide-Net Search</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                    Our <strong>Smart Scouts</strong> fan out across the web to gather official specs, price history, and real user discussions. We instantly filter thousands of comments to separate helpful reviews from paid bot spam.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-500 font-mono">
                    We read the fine print so you don't have to.
                </div>
            </div>

            {/* Step 2: The Watcher */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-bold text-emerald-600">2</span>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6 font-bold text-xl">
                   <Microscope className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2. Visual Forensics</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                    Our <strong>AI Vision</strong> watches video reviews frame-by-frame. It spots physical defects—like a wobbly hinge or cheap plastic—that text reviews often miss. We also reverse-search images to detect overpriced rebrands.
                </p>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium border border-emerald-100">
                    We spot the red flags—like dropshipping and defects—that glossy photos hide.
                </div>
            </div>

            {/* Step 3: Global Sentry */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-bold text-indigo-600">3</span>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6 font-bold text-xl">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Global Compatibility</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                    Buying internationally? Our <strong>Sentry System</strong> checks if the product will actually work in your country (voltage, region locks) and estimates hidden import taxes before you click buy.
                </p>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm font-medium border border-indigo-100">
                    Avoid expensive "paperweights" and surprise fees.
                </div>
            </div>

            {/* Step 4: The Verdict */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-bold text-purple-600">4</span>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 font-bold text-xl">
                   <Gavel className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">4. The Verdict</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                    We synthesize all this data into a single <strong>Trust Score</strong>. You get a clear, unbiased recommendation: is this product a hidden gem, or is it just great marketing?
                </p>
                <div className="bg-purple-50 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium border border-purple-100">
                    Get a final, data-backed verdict that weighs every pro and con so you can buy with total confidence.
                </div>
            </div>
        </div>

        <div className="text-center">
            <Link href="/">
                <Button size="lg" className="h-14 px-10 rounded-full text-lg shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 transition-all hover:-translate-y-0.5">
                    Start Your Investigation
                </Button>
            </Link>
            <p className="mt-4 text-sm text-slate-500">
                Analysis takes seconds • No account required
            </p>
        </div>
      </div>
    </main>
  );
}
