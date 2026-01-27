'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, Play } from 'lucide-react';

interface AnalysisDashboardProps {
  search: { title: string; url: string };
  onBack: () => void;
}

export function AnalysisDashboard({ search, onBack }: AnalysisDashboardProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const product = {
    name: search.title,
    rating: 8.2,
    verdict: 'Exceptional build quality with premium features, but pricing is 25% above fair market value.',
    verdictType: 'positive', // positive, caution, alert
    pros: ['Superior durability', 'Industry-leading performance', 'Premium materials'],
    cons: ['Price premium justified', 'Steeper learning curve'],
  };

  const videos = [
    { id: 'hinge', name: 'Hinge Durability', timestamp: '02:45', tag: '✅ Confirmed', tagType: 'success' },
    { id: 'water', name: 'Waterproof Test', timestamp: '04:12', tag: '✅ Passed', tagType: 'success' },
    { id: 'drop', name: 'Drop Test 6ft', timestamp: '01:30', tag: '⚠ Minor Issue', tagType: 'warning' },
    { id: 'screen', name: 'Scratch Resistance', timestamp: '03:05', tag: '✅ Excellent', tagType: 'success' },
  ];

  const fairnessData = {
    min: 0,
    max: 100,
    fairValue: { min: 30, max: 40 },
    current: 50,
  };

  const getVerdictColor = () => {
    switch (product.verdictType) {
      case 'positive':
        return 'bg-emerald-50 border-emerald-200';
      case 'caution':
        return 'bg-amber-50 border-amber-200';
      case 'alert':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMagnifierPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 cursor-crosshair">
      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          </div>

          {/* Ring Chart Score */}
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="6"
                  strokeDasharray={`${(product.rating / 10) * 282.7} 282.7`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900 font-mono">{product.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Verdict Hero Card */}
        <Card className={`mb-8 p-8 border ${getVerdictColor()}`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">The Bottom Line</h2>
              <p className="text-slate-700 leading-relaxed">
                {product.verdict}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 mb-2">Verified Strengths</h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {product.pros.map((pro) => (
                    <li key={pro} className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Considerations</h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {product.cons.map((con) => (
                    <li key={con} className="flex gap-2 items-start">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Forensic Video Reel */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Forensic Video</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video.id)}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
                className="group relative aspect-video rounded-lg overflow-hidden bg-slate-200 hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer"
              >
                {/* Placeholder for video thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-600 opacity-80" fill="currentColor" />
                </div>

                {/* Timestamp Badge */}
                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs font-mono px-2 py-1 rounded">
                  {video.timestamp}
                </div>

                {/* Status Tag */}
                <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${
                  video.tagType === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : video.tagType === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {video.tag}
                </div>

                {/* Video Name - appears on hover */}
                <div className="absolute inset-0 bg-slate-900/60 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{video.name}</p>
                </div>

                {/* Magnifying Glass Lens Effect - appears on hover */}
                {hoveredVideo === video.id && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: magnifierPos.x - 40,
                      top: magnifierPos.y - 40,
                    }}
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-blue-500 bg-blue-100/20 backdrop-blur-sm shadow-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fairness Meter */}
        <div className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Fairness Meter</h2>
          <Card className="p-6 border-slate-200">
            <div className="space-y-4">
              {/* Scale Labels */}
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>${fairnessData.min}</span>
                <span>${fairnessData.max}</span>
              </div>

              {/* Linear Gauge */}
              <div className="relative h-12 bg-slate-200 rounded-lg overflow-hidden">
                {/* Green Fair Value Zone */}
                <div
                  className="absolute h-full bg-emerald-200"
                  style={{
                    left: `${(fairnessData.fairValue.min / fairnessData.max) * 100}%`,
                    right: `${100 - (fairnessData.fairValue.max / fairnessData.max) * 100}%`,
                  }}
                />

                {/* Current Price Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
                  style={{ left: `${(fairnessData.current / fairnessData.max) * 100}%` }}
                >
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 font-mono whitespace-nowrap">
                    ${fairnessData.current}
                  </div>
                </div>

                {/* Markup Line - Red if outside fair value */}
                {(fairnessData.current > fairnessData.fairValue.max || fairnessData.current < fairnessData.fairValue.min) && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${(fairnessData.fairValue.max / fairnessData.max) * 100}%`}
                      y1="50%"
                      x2={`${(fairnessData.current / fairnessData.max) * 100}%`}
                      y2="50%"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  </svg>
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-emerald-200" />
                  <span className="text-slate-600">Estimated Fair Value: <span className="font-semibold text-slate-900">${fairnessData.fairValue.min}-${fairnessData.fairValue.max}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-1 w-4 bg-blue-600" />
                  <span className="text-slate-600">Current Price: <span className="font-semibold text-blue-600">${fairnessData.current}</span></span>
                </div>
                {fairnessData.current > fairnessData.fairValue.max && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-1 w-4 bg-rose-600" />
                    <span className="text-slate-600">Premium: <span className="font-semibold text-rose-600">${fairnessData.current - fairnessData.fairValue.max}</span></span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
