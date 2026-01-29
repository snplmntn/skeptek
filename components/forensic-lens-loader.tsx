'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Search, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';

const statuses = [
  'Gathering Market Data...',
  'Reading User Reviews...',
  'Analyzing Video Reviews...',
  'Finalizing Verdict...',
];

interface ForensicLensLoaderProps {
  isFinishing: boolean;
  onComplete: () => void;
  status?: string;
  mode?: 'single' | 'versus' | 'review';
}

export function ForensicLensLoader({ isFinishing, onComplete, status, mode = 'single' }: ForensicLensLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalStatusIndex, setInternalStatusIndex] = useState(0);
  
  // Refs for smooth lerp movement
  const lensPosRef = useRef({ x: 300, y: 200, targetX: 300, targetY: 200 });
  const versusLensRefs = useRef([ 
    { x: 200, y: 100, targetX: 200, targetY: 100, nextUpdate: 0 },
    { x: 400, y: 300, targetX: 400, targetY: 300, nextUpdate: 0 }
  ]);
  const finishStartTimeRef = useRef<number | null>(null);

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  // Use refs for props to avoid restarting the effect
  const isFinishingRef = useRef(isFinishing);
  const onCompleteRef = useRef(onComplete);
  const modeRef = useRef(mode);

  useEffect(() => { isFinishingRef.current = isFinishing; }, [isFinishing]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Theme Config
    const colors = {
        background: theme === 'dark' ? '#0a0c10' : '#ffffff',
        particle: theme === 'dark' ? '#334155' : '#cbd5e1',
        particleRevealed: theme === 'dark' ? '#3b82f6' : '#2563eb',
        grid: theme === 'dark' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.05)',
        lensRing: theme === 'dark' ? 'rgba(37, 99, 235, 0.8)' : 'rgba(37, 99, 235, 0.9)',
        text: theme === 'dark' ? '#3b82f6' : '#2563eb'
    };

    // Create particles with random depth and drift
    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 2 + 1,
      depth: Math.random(),
      revealed: false,
    }));

    let animationFrame: number;
    const startTime = Date.now();
    const noiseDuration = 1000;
    const investigationLoopDuration = 4000; // Slower for premium feel
    const clarityDuration = 1200;

    const drawGrid = () => {
      ctx.strokeStyle = colors.grid;
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

    const animate = () => {
      const now = Date.now();
      let elapsed = now - startTime;
      
      // Determine effective phase
      const canFinish = isFinishingRef.current;

      let currentPhase: 'noise' | 'investigation' | 'clarity' = 'noise';
      let phaseProgress = 0;

      if (canFinish) {
        if (!finishStartTimeRef.current) finishStartTimeRef.current = now;
        currentPhase = 'clarity';
        phaseProgress = (now - finishStartTimeRef.current) / clarityDuration;
        if (phaseProgress >= 1) {
          onCompleteRef.current();
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
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    drawGrid();

    // Particle update
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      const alpha = p.revealed ? 0.9 : 0.05 + (p.depth * 0.1);
      ctx.fillStyle = p.revealed ? colors.particleRevealed : colors.particle;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + p.depth), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    if (currentPhase === 'investigation') {
      const loopTime = (elapsed - noiseDuration) / investigationLoopDuration;
      const currentMode = modeRef.current;
      
      // --- Specialized Mode Drawing ---
      if (currentMode === 'versus') {
          // Dynamic Random Wandering for Versus Mode
          versusLensRefs.current.forEach((lens, i) => {
              if (now > lens.nextUpdate) {
                  // Pick new random target within safe bounds
                  lens.targetX = width * 0.15 + Math.random() * (width * 0.7);
                  lens.targetY = height * 0.15 + Math.random() * (height * 0.7);
                  // Randomize speed of decision
                  lens.nextUpdate = now + 1500 + Math.random() * 2000;
              }
              // Smooth lerp
              lens.x += (lens.targetX - lens.x) * 0.03;
              lens.y += (lens.targetY - lens.y) * 0.03;
          });

          // Draw Connection Beam first (so it's behind lenses)
          const p1 = versusLensRefs.current[0];
          const p2 = versusLensRefs.current[1];
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          ctx.setLineDash([]);

          // Draw Lenses
          versusLensRefs.current.forEach((lens, i) => {
              const lx = lens.x;
              const ly = lens.y;
              const r = 70;
              
              // Glow
              const g = ctx.createRadialGradient(lx, ly, r-10, lx, ly, r+20);
              g.addColorStop(0, theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)');
              g.addColorStop(1, 'transparent');
              ctx.fillStyle = g;
              ctx.beginPath(); ctx.arc(lx, ly, r+20, 0, Math.PI * 2); ctx.fill();

              // Ring
              ctx.strokeStyle = `rgba(59, 130, 246, ${0.7 + Math.sin(loopTime * 5 + i) * 0.2})`;
              ctx.lineWidth = 3;
              ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.stroke();
              
              // Technical ID
              ctx.fillStyle = colors.text;
              ctx.font = 'bold 8px "Geist Mono"';
              ctx.textAlign = 'center'; 
              ctx.fillText(`PROBE_${i+1}`, lx, ly - r - 10);

              particles.forEach(p => {
                  if (Math.hypot(p.x - lx, p.y - ly) < r) p.revealed = true;
              });
          });
      } else if (currentMode === 'review') {
          // Verification Stamp / Document Flow
          const centerX = width / 2;
          const centerY = height / 2;
          const stampRadius = 100 + Math.sin(loopTime * 10) * 10;
          
          // Outer Ring
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          ctx.beginPath(); ctx.arc(centerX, centerY, stampRadius, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);

          // Scanning Square (Document View)
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.lineWidth = 2;
          const squareSize = 140;
          ctx.strokeRect(centerX - squareSize/2, centerY - squareSize/2, squareSize, squareSize);
          
          // "Read" progress line
          const scanY = centerY - squareSize/2 + ((loopTime * 2) % 1) * squareSize;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.beginPath(); ctx.moveTo(centerX - squareSize/2, scanY); ctx.lineTo(centerX + squareSize/2, scanY); ctx.stroke();

          particles.forEach(p => {
              if (Math.abs(p.x - centerX) < squareSize/2 && Math.abs(p.y - centerY) < squareSize/2) p.revealed = true;
          });

          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.font = '900 12px "Geist Mono"';
          ctx.fillText("V_CHECK_IN_PROGRESS", centerX, centerY + squareSize/2 + 25);
      } else {
          // Standard Single Lens
          const scanProgress = (1 + Math.sin(loopTime * Math.PI * 2 - Math.PI / 2)) / 2;
          lensPosRef.current.targetX = width * 0.15 + scanProgress * (width * 0.7);
          lensPosRef.current.targetY = height / 2 + Math.sin(loopTime * Math.PI * 4) * 50;

          lensPosRef.current.x += (lensPosRef.current.targetX - lensPosRef.current.x) * 0.08;
          lensPosRef.current.y += (lensPosRef.current.targetY - lensPosRef.current.y) * 0.08;

          const { x, y } = lensPosRef.current;
          const radius = 90;

          // Lens Glow (Neon)
          const glow = ctx.createRadialGradient(x, y, radius - 10, x, y, radius + 30);
          const glowColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)';
          glow.addColorStop(0, glowColor);
          glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(x, y, radius + 30, 0, Math.PI * 2); ctx.fill();

          // Sharp Chrome Ring
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.8 + Math.sin(loopTime * Math.PI * 2) * 0.1})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
          
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, radius - 6, 0, Math.PI * 2); ctx.stroke();

          // Handle (Technical)
          const handleAngle = Math.PI * 0.75;
          const handleStart = { x: x + Math.cos(handleAngle) * radius, y: y + Math.sin(handleAngle) * radius };
          const handleEnd = { x: handleStart.x + Math.cos(handleAngle) * 60, y: handleStart.y + Math.sin(handleAngle) * 60 };

          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.lineWidth = 12;
          ctx.lineCap = 'butt'; // Sharp ends
          ctx.beginPath();
          ctx.moveTo(handleStart.x, handleStart.y);
          ctx.lineTo(handleEnd.x, handleEnd.y);
          ctx.stroke();

          particles.forEach((p) => {
            if (Math.hypot(p.x - x, p.y - y) < radius) p.revealed = true;
          });

          ctx.fillStyle = colors.text;
          ctx.font = 'bold 10px "Geist Mono", monospace';
          ctx.textAlign = 'center';
          const lensLabels = ['SCANNING', 'VERIFYING', 'FILTERING SPAM', 'EXTRACTING TRUTH'];
          const labelIdx = Math.floor(loopTime * 1.5) % lensLabels.length;
          ctx.fillText(`STATUS: ${lensLabels[labelIdx]}`, x, y + radius + 25);
      }

    } else if (currentPhase === 'clarity') {
      const ease = 1 - Math.pow(1 - phaseProgress, 4);
      const maxR = Math.hypot(width, height);
      const r = 90 + ease * maxR;

      ctx.save();
      ctx.beginPath(); ctx.arc(width/2, height/2, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = colors.grid; 
      // Reuse drawGrid logic for clarity phase but with ease opacity if desired, 
      // or just call drawGrid() if we update logic to take arg or stick to color object.
      // Re-implementing simplified grid draw for transparency support if needed, but existing drawGrid uses colors.grid
      drawGrid(); 

      if (ease > 0.4) {
        const iconAlpha = Math.min(1, (ease - 0.4) * 3);
        ctx.translate(width/2, height/2);
        ctx.globalAlpha = iconAlpha;
        
        const isError = status?.toLowerCase().includes('error') || status?.toLowerCase().includes('failed');
        const mainColor = isError ? '#f43f5e' : '#3b82f6'; // Rose-500 vs Blue-500

        ctx.fillStyle = isError ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        if (isError) {
             // Red X
             const s = 25;
             ctx.moveTo(-s, -s); ctx.lineTo(s, s);
             ctx.moveTo(s, -s); ctx.lineTo(-s, s);
        } else {
             // Blue Check
             ctx.moveTo(-25, 0); ctx.lineTo(-5, 20); ctx.lineTo(35, -20);
        }
        ctx.stroke();

        ctx.fillStyle = theme === 'dark' ? '#fff' : '#0f172a';
        ctx.font = 'bold 24px "Geist Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(isError ? "ANALYSIS_FAILED" : "DECISION_REACHED", 0, 115);
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
}, [theme]);

// Determine the effective index for the progress dots
const getEffectiveIndex = () => {
  if (!status) return internalStatusIndex;
  
  const s = status.toLowerCase();
  if (s.includes('launching')) return 0;
  if (s.includes('market')) return 1;
  if (s.includes('reddit')) return 2;
  if (s.includes('video')) return 3;
  if (s.includes('deliberating') || s.includes('analyzing')) return 3;
  return internalStatusIndex;
};

const effectiveIndex = getEffectiveIndex();

const getStatusIcon = () => {
  if (!status) return <Search className="w-5 h-5 text-primary animate-pulse" />;
  
  const s = status.toLowerCase();
  if (s.includes('launching')) return <Rocket className="w-5 h-5 text-primary" />;
  if (s.includes('analyzing')) return <Search className="w-5 h-5 text-primary" />;
  if (s.includes('deliberating')) return <Scale className="w-5 h-5 text-blue-400" />;
  if (mode === 'review') return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
  if (mode === 'versus') return <Scale className="w-5 h-5 text-primary" />;
  if (s.includes('unstable') || s.includes('error') || s.includes('failed')) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
  if (isFinishing) {
     return (s.includes('error') || s.includes('failed')) 
        ? <AlertTriangle className="w-5 h-5 text-rose-500" />
        : <ShieldCheck className="w-5 h-5 text-emerald-500" />;
  }
  
  return <Search className="w-5 h-5 text-primary" />;
};

return (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 overflow-hidden relative">
    {/* Header with Float Animation */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12 text-center"
    >
      <h1 className="mb-2 text-4xl font-black text-foreground tracking-tighter uppercase italic">Analysis Lens</h1>
      <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-primary/30" />
          <p className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold font-mono">Autonomous Analysis Pipeline</p>
          <span className="h-px w-8 bg-primary/30" />
      </div>
    </motion.div>

    {/* Main Canvas with Neural Glow wrapper */}
    <div className="relative group">
      <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000" />
      <canvas
        ref={canvasRef}
        width={640}
        height={400}
        className="relative mx-auto rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.1)] border border-border bg-background/40 ring-1 ring-white/10 backdrop-blur-xl"
      />
    </div>

    {/* FIXED HEIGHT Status Box */}
    <div className="mt-16 w-full max-w-lg h-24 flex flex-col items-center justify-start pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={status || internalStatusIndex}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <span className="px-5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/5 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status?.toLowerCase().includes('error') || status?.toLowerCase().includes('failed') ? 'bg-rose-500' : 'bg-primary'} animate-pulse`} />
            {isFinishing 
              ? (status?.toLowerCase().includes('error') || status?.toLowerCase().includes('failed') ? 'Analysis Halted' : 'Verdict Ready') 
              : 'Active Scan'}
          </span>
          <div className="flex items-center gap-4">
             {getStatusIcon()}
             <p className="text-xl font-mono text-foreground tracking-tighter text-center max-w-md uppercase">
               {status || statuses[internalStatusIndex]}
             </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Premium Progress Indicators */}
    <div className="mt-4 flex items-center gap-4">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: effectiveIndex === i ? [1, 1.25, 1] : 1,
              opacity: effectiveIndex === i ? 1 : 0.2
            }}
            className={`h-[3px] w-8 rounded-full ${
              effectiveIndex >= i ? 'bg-primary' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);
}

