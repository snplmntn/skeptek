'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FocalAlignmentLoader } from '@/components/focal-alignment-loader'; // Import FocalAlignmentLoader

interface LensSearchProps {
  onSearch: (title: string, url: string) => void;
}


const recentScans = [
  { name: 'Sony WH-1000XM5', score: 9.2, status: 'verified' },
  { name: 'AirPods Pro', score: 8.7, status: 'verified' },
  { name: 'Generic Blender', score: 2.1, status: 'rejected' },
  { name: 'iPhone 15 Pro', score: 8.9, status: 'verified' },
  { name: 'Budget Monitor', score: 4.3, status: 'caution' },
];

export function LensSearch({ onSearch }: LensSearchProps) {
  const [query, setQuery] = useState('');
  const [displayedScans, setDisplayedScans] = useState<typeof recentScans>([]);
  const [scanIndex, setScanIndex] = useState(0);

  useEffect(() => {
    // Cycle through scans
    const interval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % recentScans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show scans in sequence
    const displayed = [];
    for (let i = 0; i < 3; i++) {
      displayed.push(recentScans[(scanIndex + i) % recentScans.length]);
    }
    setDisplayedScans(displayed);
  }, [scanIndex]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query, `/product/${query.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    // Add small delay to let state update reflect in UI inputs if needed, 
    // or just call immediately. Calling immediately for responsiveness.
    onSearch(example, `/product/${example.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <h1 className="mb-2 text-5xl font-bold tracking-tight text-slate-900">
            Skeptek
          </h1>
          <p className="text-base font-medium text-slate-600">
            Precision Optics for Product Intelligence
          </p>
        </div>

        {/* Massive Floating Search Bar */}
        <div className="mb-12 flex gap-3 rounded-2xl bg-white p-2 shadow-xl">
          {/* Lens Icon */}
          <div className="flex h-16 w-16 items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Paste link, model, or ask..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent text-base font-medium placeholder:text-slate-400 focus:outline-none text-slate-900"
          />

          {/* Scan Button */}
          <Button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="h-16 px-8 rounded-xl font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white"
          >
            Scan
          </Button>
        </div>

        {/* Live Pulse Ticker */}
        <div className="mb-16 space-y-2">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-slate-500">
            Recent Scans
          </p>
          <div className="flex gap-3 overflow-hidden">
            {displayedScans.map((scan, idx) => (
              <div
                key={`${scan.name}-${idx}`}
                className="flex-1 rounded-lg bg-white px-4 py-3 border border-slate-200 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <p className="text-xs font-medium text-slate-900 truncate">{scan.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className={`text-xs font-mono font-semibold tabular-nums ${
                    scan.status === 'verified' ? 'text-emerald-600' :
                    scan.status === 'caution' ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {scan.score.toFixed(1)}/10
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    scan.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    scan.status === 'caution' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {scan.status === 'verified' ? '✓ Verified' :
                     scan.status === 'caution' ? '⚠ Caution' :
                     '✕ Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mb-12 space-y-3">
          <p className="text-center text-xs font-medium text-slate-500">
            Try analyzing:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Sony WH-1000XM5',
              'Budget Coffee Maker',
              'iPhone vs Pixel',
            ].map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-slate-400 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Footer */}
        <div className="border-t border-slate-200 pt-8 flex justify-center pb-8">
          <Link href="/how-it-works">
            <Button variant="outline" className="gap-2 rounded-full border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all">
              <span className="font-semibold">How Skeptek Works</span>
              <span className="text-slate-400">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
