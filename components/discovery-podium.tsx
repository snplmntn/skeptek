'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export function DiscoveryPodium() {
  const [hoveredRating, setHoveredRating] = useState<string | null>(null);

  const trendingProducts = [
    { rank: 1, name: 'Sony WH-1000XM5', category: 'Headphones', score: 9.2, trend: '+18%', sentiment: 'Excellent', reviews: 4200 },
    { rank: 2, name: 'AirPods Pro', category: 'Earbuds', score: 8.7, trend: '+12%', sentiment: 'Very Positive', reviews: 3800 },
    { rank: 3, name: 'Bose QC45', category: 'Headphones', score: 8.2, trend: '+8%', sentiment: 'Very Positive', reviews: 2900 },
    { rank: 4, name: 'Generic Budget Phone', category: 'Smartphone', score: 3.2, amazonRating: 4.8, sentiment: 'Popular but Risky', reviews: 8500, isTrap: true },
  ];

  const regular = trendingProducts.slice(0, 3);
  const trapProduct = trendingProducts.find((p) => p.isTrap);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Discovery Podium</h1>
        <p className="mb-12 text-slate-600">Trending products with verified reliability ratings</p>

        {/* Podium Layout - 2nd, 1st, 3rd */}
        <div className="mb-16 flex items-end justify-center gap-6 md:gap-8">
          {/* 2nd Place - Silver */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-left-4 duration-500">
            <Card className="mb-4 w-32 border-slate-200 p-4 text-center">
              <p className="text-xs font-mono uppercase text-slate-600 mb-1">Score</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{regular[1].score.toFixed(1)}</p>
            </Card>
            <div className="w-32 h-32 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-lg border-4 border-slate-400 flex items-end justify-center pb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-600">2</div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Silver</p>
              </div>
            </div>
            <div className="mt-4 w-32 text-center">
              <p className="font-semibold text-slate-900 text-sm truncate">{regular[1].name}</p>
              <p className="text-xs text-slate-600">{regular[1].category}</p>
            </div>
          </div>

          {/* 1st Place - Gold */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="relative mb-4">
              <Card className="w-32 border-2 border-amber-400 shadow-xl p-4 text-center bg-gradient-to-b from-amber-50 to-white">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-md">
                  Skeptek Choice
                </div>
                <p className="text-xs font-mono uppercase text-slate-600 mb-1 mt-2">Score</p>
                <p className="text-2xl font-bold text-blue-600 font-mono">{regular[0].score.toFixed(1)}</p>
              </Card>
            </div>
            <div className="w-32 h-40 bg-gradient-to-b from-amber-300 to-amber-400 rounded-t-lg border-4 border-amber-400 flex items-end justify-center pb-4 shadow-lg">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-700">1</div>
                <p className="text-xs font-semibold text-amber-700 uppercase">Gold</p>
              </div>
            </div>
            <div className="mt-4 w-32 text-center">
              <p className="font-semibold text-slate-900 text-sm truncate">{regular[0].name}</p>
              <p className="text-xs text-slate-600">{regular[0].category}</p>
            </div>
          </div>

          {/* 3rd Place - Bronze */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="mb-4 w-32 border-slate-200 p-4 text-center">
              <p className="text-xs font-mono uppercase text-slate-600 mb-1">Score</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{regular[2].score.toFixed(1)}</p>
            </Card>
            <div className="w-32 h-24 bg-gradient-to-b from-orange-300 to-orange-400 rounded-t-lg border-4 border-orange-400 flex items-end justify-center pb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">3</div>
                <p className="text-xs font-semibold text-orange-700 uppercase">Bronze</p>
              </div>
            </div>
            <div className="mt-4 w-32 text-center">
              <p className="font-semibold text-slate-900 text-sm truncate">{regular[2].name}</p>
              <p className="text-xs text-slate-600">{regular[2].category}</p>
            </div>
          </div>
        </div>

        {/* All Products List */}
        <Card className="mb-8 border-slate-200 p-6 animate-in fade-in blur-0 duration-500 delay-200">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Top Verified Products</h2>

          <div className="space-y-3">
            {regular.map((product) => (
              <div
                key={product.rank}
                onMouseEnter={() => setHoveredRating(`product-${product.rank}`)}
                onMouseLeave={() => setHoveredRating(null)}
                className="group relative flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 hover:bg-blue-50 transition-colors cursor-help"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 text-center">
                    <span className="text-lg font-bold text-blue-600">#{product.rank}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-600">{product.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Score</p>
                    <p className="text-base font-bold text-blue-600 font-mono">{product.score.toFixed(1)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-600">Trend</p>
                    <p className="text-base font-bold text-emerald-600 font-mono">{product.trend}</p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                      ✓ {product.sentiment}
                    </span>
                  </div>
                </div>

                {/* Hover Tooltip - Breakdown */}
                {hoveredRating === `product-${product.rank}` && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none font-mono">
                    {product.reviews.toLocaleString()} verified reviews
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Detected Junk - Trap Card with Hazard Striping */}
        {trapProduct && (
          <div className="relative animate-in fade-in blur-0 duration-500 delay-300">
            <Card className="relative p-6 border-4 overflow-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px)',
              }}
            >
              {/* Filtered by Skeptek Stamp Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute transform -rotate-45 border-4 border-rose-600 px-8 py-3 bg-rose-600/10 backdrop-blur-sm">
                  <span className="text-sm font-bold text-rose-700 tracking-widest">FILTERED BY SKEPTEK</span>
                </div>
              </div>

              {/* Content - slightly faded behind stamp */}
              <div className="relative z-0 opacity-90">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-rose-600 text-white font-bold text-lg">
                      ✕
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">Detected Junk</h3>
                    <p className="text-xs font-semibold text-rose-700 tracking-wide uppercase">Rating Manipulation Alert</p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                  <span className="font-semibold text-slate-900">{trapProduct.name}</span> shows massive discrepancy between platform ratings ({trapProduct.amazonRating}★ from {trapProduct.reviews.toLocaleString()} reviews) and Skeptek's independent assessment ({trapProduct.score.toFixed(1)}/10). High volume of reviews with potential bot activity or incentivized feedback detected.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div className="rounded-lg bg-white/60 p-3 border border-rose-200">
                    <p className="text-slate-600 text-xs font-semibold mb-1">PLATFORM RATING</p>
                    <p className="text-2xl font-bold text-amber-600">{trapProduct.amazonRating}★</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 border border-rose-200">
                    <p className="text-slate-600 text-xs font-semibold mb-1">SKEPTEK SCORE</p>
                    <p className="text-2xl font-bold text-rose-600">{trapProduct.score.toFixed(1)}/10</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-rose-200">
                  <p className="text-xs text-slate-600 font-semibold uppercase">Red Flags:</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="text-rose-600">●</span>
                      <span>Unusually high review volume relative to market share</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-600">●</span>
                      <span>Suspicious positive sentiment clustering</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-600">●</span>
                      <span>Long-term durability data contradicts short-term reviews</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
