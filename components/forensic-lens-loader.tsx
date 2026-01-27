'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Search, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

const statuses = [
  '> SCOUTING_MARKET_DATA...',
  '> SCANNING_REDDIT_THREADS...',
  '> ANALYZING_VIDEO_FEEDS...',
  '> SYNTHESIZING_NEURAL_PATHWAYS...',
];

interface ForensicLensLoaderProps {
  isFinishing: boolean;
  onComplete: () => void;
  status?: string;
}

export function ForensicLensLoader({ isFinishing, onComplete, status }: ForensicLensLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalStatusIndex, setInternalStatusIndex] = useState(0);
  
  // Refs for smooth lerp movement
  const lensPosRef = useRef({ x: 300, y: 200, targetX: 300, targetY: 200 });
  const finishStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create particles with random depth and drift
    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 2 + 1,
      depth: Math.random(),
      revealed: false,
      color: '#94a3b8',
    }));

    let animationFrame: number;
    const startTime = Date.now();
    const noiseDuration = 1000;
    const investigationLoopDuration = 4000; // Slower for premium feel
    const clarityDuration = 1200;

    const drawGrid = (opacity: number) => {
      ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      const offsetY = (Date.now() / 40) % gridSize;
      const offsetX = (Date.now() / 60) % gridSize;

      // Vertical lines
      for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, 0);
        ctx.lineTo(x + offsetX, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + offsetY);
        ctx.lineTo(width, y + offsetY);
        ctx.stroke();
      }
    };

    const drawMagnifyingGlass = (x: number, y: number, radius: number, loopTime: number) => {
      // Outer glow
      const glow = ctx.createRadialGradient(x, y, radius - 10, x, y, radius + 20);
      glow.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
      glow.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Glass surface
      const glassGradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
      glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      glassGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = glassGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Main Chrome Ring
      ctx.strokeStyle = `rgba(37, 99, 235, ${0.8 + Math.sin(loopTime * Math.PI * 2) * 0.1})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner decorative ring
      ctx.strokeStyle = `rgba(37, 99, 235, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
      ctx.stroke();

      // Handle
      const handleAngle = Math.PI * 0.75;
      const handleStart = { x: x + Math.cos(handleAngle) * radius, y: y + Math.sin(handleAngle) * radius };
      const handleEnd = { x: handleStart.x + Math.cos(handleAngle) * 60, y: handleStart.y + Math.sin(handleAngle) * 60 };

      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handleStart.x, handleStart.y);
      ctx.lineTo(handleEnd.x, handleEnd.y);
      ctx.stroke();

      // Handle tip
      ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      const now = Date.now();
      let currentPhase: 'noise' | 'investigation' | 'clarity' = 'noise';
      let phaseProgress = 0;
      let elapsed = now - startTime;

      if (isFinishing) {
        if (!finishStartTimeRef.current) finishStartTimeRef.current = now;
        currentPhase = 'clarity';
        phaseProgress = (now - finishStartTimeRef.current) / clarityDuration;
        if (phaseProgress >= 1) {
          onComplete();
          phaseProgress = 1;
        }
      } else {
        finishStartTimeRef.current = null;
        if (elapsed < noiseDuration) {
          currentPhase = 'noise';
          phaseProgress = elapsed / noiseDuration;
        } else {
          currentPhase = 'investigation';
          phaseProgress = ((elapsed - noiseDuration) % investigationLoopDuration) / investigationLoopDuration;
        }
      }

      // Background
      ctx.fillStyle = '#f8fafb';
      ctx.fillRect(0, 0, width, height);
      drawGrid(0.04);

      // Particle update
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const alpha = p.revealed ? 0.9 : 0.1 + (p.depth * 0.2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + p.depth), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      if (currentPhase === 'investigation') {
        const loopTime = (elapsed - noiseDuration) / investigationLoopDuration;
        
        // Use sine for target, but LERP for movement to eliminate "jumping"
        const scanProgress = (1 + Math.sin(loopTime * Math.PI * 2 - Math.PI / 2)) / 2;
        lensPosRef.current.targetX = width * 0.15 + scanProgress * (width * 0.7);
        lensPosRef.current.targetY = height / 2 + Math.sin(loopTime * Math.PI * 4) * 50;

        // Smooth Lerp: pos = pos + (target - pos) * 0.1
        lensPosRef.current.x += (lensPosRef.current.targetX - lensPosRef.current.x) * 0.08;
        lensPosRef.current.y += (lensPosRef.current.targetY - lensPosRef.current.y) * 0.08;

        const { x, y } = lensPosRef.current;
        const radius = 90;

        drawMagnifyingGlass(x, y, radius, loopTime);

        // Reveal effect within radius
        particles.forEach((p) => {
          if (Math.hypot(p.x - x, p.y - y) < radius) {
            p.revealed = true;
            p.color = '#2563eb';
          }
        });

        // Connection Web within lens
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          if (particles[i].revealed && Math.hypot(particles[i].x - x, particles[i].y - y) < radius) {
            for (let j = i + 1; j < Math.min(i + 15, particles.length); j++) {
              if (particles[j].revealed) {
                const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (d < 60) {
                  ctx.strokeStyle = `rgba(37, 99, 235, ${0.4 * (1 - d/60)})`;
                  ctx.beginPath();
                  ctx.moveTo(particles[i].x, particles[i].y);
                  ctx.lineTo(particles[j].x, particles[j].y);
                  ctx.stroke();
                }
              }
            }
          }
        }
        ctx.restore();

        // Lens Title
        const lensLabels = ['Scanning Artifacts', 'Verifying Sources', 'Neural Filtering', 'Truth Extraction'];
        const labelIdx = Math.floor(loopTime * 1.2) % lensLabels.length;
        ctx.fillStyle = 'rgba(37, 99, 235, 1)';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(lensLabels[labelIdx], x, y + radius + 25);

      } else if (currentPhase === 'clarity') {
        const ease = 1 - Math.pow(1 - phaseProgress, 4);
        const maxR = Math.hypot(width, height);
        const r = 90 + ease * maxR;

        ctx.save();
        ctx.beginPath();
        ctx.arc(width/2, height/2, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        drawGrid(0.08 + ease * 0.12);

        if (ease > 0.4) {
          const iconAlpha = Math.min(1, (ease - 0.4) * 3);
          const iconScale = 0.8 + Math.min(0.2, (ease - 0.4) * 0.5);
          ctx.translate(width/2, height/2);
          ctx.scale(iconScale, iconScale);
          ctx.globalAlpha = iconAlpha;
          
          ctx.fillStyle = '#eff6ff';
          ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();

          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-25, 0); ctx.lineTo(-5, 20); ctx.lineTo(35, -20);
          ctx.stroke();

          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 28px Inter';
          ctx.textAlign = 'center';
          ctx.fillText("DECISION_REACHED", 0, 110);
        }
        ctx.restore();
      }

      if (!(isFinishing && phaseProgress >= 1)) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();
    const intv = setInterval(() => setInternalStatusIndex(p => (p + 1) % statuses.length), 1000);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(intv);
    };
  }, [isFinishing, onComplete]);

  // Determine the effective index for the progress dots
  const getEffectiveIndex = () => {
    if (!status) return internalStatusIndex;
    
    // Map keywords to dot indices
    const s = status.toLowerCase();
    if (s.includes('launching')) return 0;
    if (s.includes('market')) return 1;
    if (s.includes('reddit')) return 2;
    if (s.includes('video')) return 3;
    if (s.includes('deliberating') || s.includes('analyzing')) return 3; // Stay at last dot for synthesis
    return internalStatusIndex;
  };

  const effectiveIndex = getEffectiveIndex();

  // Determine Icon based on status
  const getStatusIcon = () => {
    if (!status) return <Search className="w-5 h-5 text-blue-500 animate-pulse" />;
    
    const s = status.toLowerCase();
    if (s.includes('launching')) return <Rocket className="w-5 h-5 text-blue-500" />;
    if (s.includes('analyzing')) return <Search className="w-5 h-5 text-blue-500" />;
    if (s.includes('deliberating')) return <Scale className="w-5 h-5 text-purple-500" />;
    if (s.includes('unstable') || s.includes('error')) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    if (isFinishing) return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    
    return <Search className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 overflow-hidden">
      {/* Header with Float Animation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="mb-2 text-4xl font-extrabold text-slate-900 tracking-tight">Forensic Lens</h1>
        <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-blue-600/30" />
            <p className="text-xs tracking-[0.3em] uppercase text-blue-600 font-bold">Autonomous Analysis Pipeline</p>
            <span className="h-px w-8 bg-blue-600/30" />
        </div>
      </motion.div>

      {/* Main Canvas with Neural Glow wrapper */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="relative mx-auto rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.15)] border border-white/50 bg-white/40 ring-1 ring-slate-200 backdrop-blur-md"
        />
      </div>

      {/* FIXED HEIGHT Status Box - Eliminates Jumpy Layout shifts */}
      <div className="mt-16 w-full max-w-lg h-24 flex flex-col items-center justify-start pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={status || internalStatusIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-blue-500/30 flex items-center gap-2">
              {isFinishing ? 'VERDICT_READY' : 'ACTIVE_SCOUT'}
            </span>
            <div className="flex items-center gap-3">
               {getStatusIcon()}
               <p className="text-lg font-mono text-slate-800 tracking-tight text-center max-w-md">
                 {status || statuses[internalStatusIndex]}
               </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Premium Progress Indicators */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: effectiveIndex === i ? [1, 1.2, 1] : 1,
                opacity: effectiveIndex === i ? 1 : 0.3
              }}
              className={`h-1.5 w-6 rounded-full ${
                effectiveIndex >= i ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

