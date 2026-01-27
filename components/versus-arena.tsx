'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Plus, Check, Activity, ThumbsUp, AlertTriangle, AlertCircle } from 'lucide-react';

export function VersusArena() {
  const [selectedComparison, setSelectedComparison] = useState(0);

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
  // Sort products by score descending to organize them
  const comparison = {
    ...comparisonRaw,
    products: [...comparisonRaw.products].sort((a, b) => b.score - a.score)
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Versus Arena</h1>
        <p className="mb-8 text-slate-600">Compare products side by side to find the clear winner</p>

        {/* Comparison Selector */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {comparisons.map((comp, idx) => (
            <Button
              key={comp.id}
              variant={selectedComparison === idx ? 'default' : 'outline'}
              onClick={() => setSelectedComparison(idx)}
              className="whitespace-nowrap text-sm"
            >
              {comp.title}
            </Button>
          ))}
        </div>

        {/* Dynamic Product Grid */}
        <div className={`grid gap-6 mb-8 ${
            comparison.products.length === 2 ? 'md:grid-cols-2' : 
            comparison.products.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
        }`}>
          {comparison.products.map((product) => (
            <div
              key={product.id}
              className={`transition-all duration-300 ${
                product.isWinner ? 'scale-105 z-10' : 'hover:scale-[1.02]'
              }`}
            >
              <Card className={`relative p-6 h-full border-2 flex flex-col items-center ${
                product.isWinner ? 'border-blue-600 shadow-xl bg-white' : 'border-slate-200 shadow-sm hover:shadow-md bg-white'
              }`}>
                {product.isWinner && (
                  <div className="absolute -top-4 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                    <Crown className="w-3 h-3 text-yellow-300" /> Top Pick
                  </div>
                )}

                <div className="text-center w-full">
                  <h3 className="mb-6 text-lg font-bold text-slate-900 min-h-[3rem] flex items-center justify-center">
                    {product.name}
                  </h3>
                  
                  <div className="relative h-28 w-28 mx-auto mb-6">
                    <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={product.isWinner ? "#2563eb" : "#64748b"}
                        strokeWidth="8"
                        strokeDasharray={`${(product.score / 10) * 282.7} 282.7`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold font-mono ${product.isWinner ? 'text-blue-600' : 'text-slate-700'}`}>
                        {product.score.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {/* Add Product Button Prototype */}
           <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group min-h-[300px]">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                </div>
                 <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700">Add Product</span>
           </div>
        </div>

        {/* Why It Won Chip */}
        {comparison.winReason && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-2 rounded-full font-medium text-sm shadow-sm">
              <Check className="w-4 h-4" />
              <span>Winner Distinction: {comparison.winReason}</span>
            </div>
          </div>
        )}

        {/* Smart Diff Table */}
        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-lg font-semibold text-slate-900">Detailed Breakdown</h2>
          </div>

          <div className="divide-y divide-slate-100">
             {/* Header Row */}
             <div className="flex items-center bg-slate-50/80 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="w-1/4">Category</div>
                {comparison.products.map(p => (
                    <div key={p.id} className="flex-1 text-center truncate px-2">{p.name}</div>
                ))}
             </div>

            {/* Rows */}
            {comparison.differences.map((item, idx) => {
              // Find max score for this category to highlight
              const maxScore = Math.max(...comparison.products.map(p => item.scores[p.id] || 0));

              return (
                <div key={idx} className="flex items-center px-4 py-4 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-700 w-1/4">{item.category}</span>
                  
                  {comparison.products.map(product => {
                    const score = item.scores[product.id] || 0;
                    const isBest = score === maxScore;

                    return (
                        <div key={product.id} className="flex-1 flex justify-center items-center">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isBest ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}>
                                <span className="font-mono text-sm">{score.toFixed(1)}</span>
                            </div>
                        </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Deep Dive Analysis Section */}
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Deep Dive Analysis</h2>
            
            <div className={`grid gap-6 ${
                comparison.products.length === 2 ? 'md:grid-cols-2' : 
                comparison.products.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
            }`}>
              {comparison.products.map(product => product.details && (
                <Card key={product.id} className="p-8 border-slate-200 bg-white shadow-sm flex flex-col h-full">
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 text-lg mb-2">{product.name}</h3>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold px-3 py-1 rounded-md ${
                                product.details.trustScore.score >= 9 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                product.details.trustScore.score >= 8 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                                {product.details.trustScore.label}
                            </span>
                             <span className="text-sm font-mono text-slate-500 font-semibold">{product.details.trustScore.score}/10</span>
                        </div>
                    </div>

                    {/* Sentiment Analysis (Simplified) */}
                     <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Sentiment
                            </h4>
                        </div>
                        
                        <div className="h-2 flex rounded-full overflow-hidden w-full bg-slate-100">
                            <div style={{ width: `${product.details.sentiment.positive}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${product.details.sentiment.neutral}%` }} className="bg-slate-300" />
                            <div style={{ width: `${product.details.sentiment.negative}%` }} className="bg-rose-500" />
                        </div>
                         <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                             <span>{product.details.sentiment.positive}% Positive</span>
                             <span>{product.details.sentiment.negative}% Negative</span>
                         </div>
                    </div>

                    {/* Pros & Cons (Spaced out) */}
                    <div className="space-y-6 flex-1">
                        <div>
                            <h4 className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                <ThumbsUp className="w-3 h-3" /> Strengths
                            </h4>
                            <ul className="space-y-3">
                                {product.details.pros.map((pro, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> 
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                <AlertTriangle className="w-3 h-3" /> Considerations
                            </h4>
                            <ul className="space-y-3">
                                {product.details.cons.map((con, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}
