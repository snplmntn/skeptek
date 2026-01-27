'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VersusArena() {
  const [selectedComparison, setSelectedComparison] = useState(0);

  const comparisons = [
    {
      id: 1,
      product1: { name: 'Apple iPhone 15 Pro', score: 8.5 },
      product2: { name: 'Samsung Galaxy S24', score: 7.8 },
      winner: 'p1',
      winReason: 'Better Battery Life (+4hrs)',
      differences: [
        { category: 'Camera', p1: 9.1, p2: 8.7 },
        { category: 'Battery', p1: 7.8, p2: 8.2 },
        { category: 'Design', p1: 8.9, p2: 8.3 },
        { category: 'Performance', p1: 9.0, p2: 8.8 },
      ],
    },
    {
      id: 2,
      product1: { name: 'MacBook Pro M3', score: 8.6 },
      product2: { name: 'Dell XPS 15', score: 8.1 },
      winner: 'p1',
      winReason: 'Superior Build Quality',
      differences: [
        { category: 'Performance', p1: 9.2, p2: 8.9 },
        { category: 'Build Quality', p1: 9.0, p2: 8.4 },
        { category: 'Battery', p1: 8.5, p2: 7.3 },
        { category: 'Price Value', p1: 7.0, p2: 8.2 },
      ],
    },
    {
      id: 3,
      product1: { name: 'Sony WH-1000XM5', score: 8.9 },
      product2: { name: 'Bose QuietComfort 45', score: 8.2 },
      winner: 'p1',
      winReason: 'Best Noise Cancellation',
      differences: [
        { category: 'Noise Cancellation', p1: 9.3, p2: 8.8 },
        { category: 'Sound Quality', p1: 8.7, p2: 8.5 },
        { category: 'Connectivity', p1: 8.8, p2: 8.2 },
        { category: 'Comfort', p1: 8.5, p2: 8.9 },
      ],
    },
  ];

  const comparison = comparisons[selectedComparison];
  const isP1Winner = comparison.winner === 'p1';

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Head-to-Head</h1>
        <p className="mb-8 text-slate-600">Compare products side by side</p>

        {/* Comparison Selector */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {comparisons.map((comp, idx) => (
            <Button
              key={comp.id}
              variant={selectedComparison === idx ? 'default' : 'outline'}
              onClick={() => setSelectedComparison(idx)}
              className="whitespace-nowrap text-sm"
            >
              {comp.product1.name.split(' ')[0]} vs {comp.product2.name.split(' ')[0]}
            </Button>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          {/* Product 1 */}
          <div
            className={`transition-all duration-500 ${
              isP1Winner ? 'md:scale-105 md:z-10 md:shadow-2xl' : 'md:blur-sm md:opacity-75'
            }`}
          >
            <Card className={`relative p-8 border-2 ${
              isP1Winner ? 'border-blue-600 shadow-lg' : 'border-slate-200'
            }`}>
              {isP1Winner && (
                <div className="absolute -top-4 right-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span>👑</span> Skeptek Pick
                </div>
              )}

              <div className="text-center">
                <h3 className="mb-4 text-xl font-bold text-slate-900">{comparison.product1.name}</h3>
                <div className="relative h-24 w-24 mx-auto mb-6">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="6"
                      strokeDasharray={`${(comparison.product1.score / 10) * 282.7} 282.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 font-mono">{comparison.product1.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Product 2 */}
          <div
            className={`transition-all duration-500 ${
              !isP1Winner ? 'md:scale-105 md:z-10 md:shadow-2xl' : 'md:blur-sm md:opacity-75'
            }`}
          >
            <Card className={`relative p-8 border-2 ${
              !isP1Winner ? 'border-blue-600 shadow-lg' : 'border-slate-200'
            }`}>
              {!isP1Winner && (
                <div className="absolute -top-4 right-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span>👑</span> Skeptek Pick
                </div>
              )}

              <div className="text-center">
                <h3 className="mb-4 text-xl font-bold text-slate-900">{comparison.product2.name}</h3>
                <div className="relative h-24 w-24 mx-auto mb-6">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="6"
                      strokeDasharray={`${(comparison.product2.score / 10) * 282.7} 282.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 font-mono">{comparison.product2.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Why It Won Chip */}
        {comparison.winReason && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm">
              <span>✓</span>
              <span>Winner: {comparison.winReason}</span>
            </div>
          </div>
        )}

        {/* Smart Diff Table with Glassmorphism */}
        <Card className="border-slate-200 p-6 backdrop-blur-sm bg-white/50">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Key Differences</h2>

          <div className="space-y-3">
            {comparison.differences.map((item, idx) => {
              const p1Wins = item.p1 > item.p2;
              const margin = Math.abs(item.p1 - item.p2);

              return (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-900 flex-1">{item.category}</span>

                  <div className="flex items-center gap-6">
                    {/* Product 1 Indicator */}
                    <div className="flex items-center gap-2">
                      {p1Wins ? (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={`text-sm font-mono font-semibold ${p1Wins ? 'text-blue-600' : 'text-slate-500'}`}>
                        {item.p1.toFixed(1)}
                      </span>
                    </div>

                    {/* Margin Badge */}
                    {margin > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        +{margin.toFixed(1)}
                      </span>
                    )}

                    {/* Product 2 Indicator */}
                    <div className="flex items-center gap-2">
                      {!p1Wins ? (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={`text-sm font-mono font-semibold ${!p1Wins ? 'text-blue-600' : 'text-slate-500'}`}>
                        {item.p2.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
