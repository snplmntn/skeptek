'use client';

import { useEffect, useRef, useState } from 'react';

const statuses = [
  '> MAGNIFYING_VIDEO_DETAILS...',
  '> INSPECTING_PIXEL_ARBITRAGE...',
  '> FOCUSING_ON_TRUTH...',
  '> FINALIZING_SCAN...',
];

interface ForensicLensLoaderProps {
  isFinishing?: boolean;
  onComplete?: () => void;
}

export function ForensicLensLoader({ isFinishing = false, onComplete }: ForensicLensLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusIndex, setStatusIndex] = useState(0);


  const finishStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      depth: number;
      revealed: boolean;
      color: string;
    }> = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        depth: Math.random(),
        revealed: false,
        color: '#94a3b8',
      });
    }

    let animationFrame: number;
    const startTime = Date.now();
    const noiseDuration = 1000;
    const investigationLoopDuration = 2500; 
    const clarityDuration = 1200;

    // Helper functions (drawGrid, drawMagnifyingGlass) need to be inside or reused
    // Copying over drawGrid and drawMagnifyingGlass
    const drawGrid = (opacity: number, scroll: number) => {
        ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
        ctx.lineWidth = 1;
        const gridSize = 40;
        
        for(let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        const offsetY = (Date.now() / 20) % gridSize;
        for(let y = -gridSize; y <= height + gridSize; y += gridSize) {
             ctx.beginPath();
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(width, y + offsetY);
            ctx.stroke();
        }
    }

    const drawMagnifyingGlass = (x: number, y: number, radius: number, progress: number) => {
      const glassGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      glassGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glassGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(37, 99, 235, ${0.8 + Math.sin(progress * Math.PI * 2) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(37, 99, 235, ${0.4 + Math.sin(progress * Math.PI * 2) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
      ctx.stroke();

      const handleAngle = Math.PI * 0.75;
      const handleStart = { x: x + Math.cos(handleAngle) * radius, y: y + Math.sin(handleAngle) * radius };
      const handleEnd = { x: handleStart.x + Math.cos(handleAngle) * 80, y: handleStart.y + Math.sin(handleAngle) * 80 };

      ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handleStart.x, handleStart.y);
      ctx.lineTo(handleEnd.x, handleEnd.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    };


    const animate = () => {
      const now = Date.now();
      
      // Determine Phase
      let currentPhase: 'noise' | 'investigation' | 'clarity' = 'noise';
      let phaseProgress = 0;
      let elapsed = 0;

      if (isFinishing) {
          if (!finishStartTimeRef.current) {
              finishStartTimeRef.current = now;
          }
          currentPhase = 'clarity';
          phaseProgress = (now - finishStartTimeRef.current) / clarityDuration;
          
          if (phaseProgress >= 1) {
              // Animation Complete
              if (onComplete) onComplete();
              // Keep drawing final state (verified) without asking for new frame to save resources? 
              // Or just return.
              // Let's keep one final frame.
              phaseProgress = 1;
          }
      } else {
          finishStartTimeRef.current = null; // Reset if we somehow go back (unlikely)
          elapsed = now - startTime;
          
          if (elapsed < noiseDuration) {
              currentPhase = 'noise';
              phaseProgress = elapsed / noiseDuration;
          } else {
              currentPhase = 'investigation';
              // Loop the investigation phase
              phaseProgress = ((elapsed - noiseDuration) % investigationLoopDuration) / investigationLoopDuration;
          }
      }


      // Draw
      ctx.fillStyle = '#f8fafb';
      ctx.fillRect(0, 0, width, height);
      drawGrid(0.05, 0);

      // Particles
      particles.forEach((particle) => {
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const alpha = particle.revealed ? 1 : 0.2 + (particle.depth * 0.4);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.5 + particle.depth), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });


      if (currentPhase === 'investigation') {
         // Continuous loop progress (0 -> infinity)
         const loopTime = (elapsed - noiseDuration) / investigationLoopDuration;
         
         // Smooth sine wave for scanning: Left -> Right -> Left
         const scanProgress = (1 + Math.sin(loopTime * Math.PI * 2 - Math.PI / 2)) / 2;

         // Scanning path
         const lensX = width * 0.1 + scanProgress * (width * 0.8);
         const lensY = height / 2 + Math.sin(loopTime * Math.PI * 4) * 60; // Vertical bobbing
         const lensRadius = 100;

         // Draw magnifying glass
         drawMagnifyingGlass(lensX, lensY, lensRadius, loopTime);

         // Reveal particles
         particles.forEach((particle) => {
            const dist = Math.hypot(particle.x - lensX, particle.y - lensY);
            if (dist < lensRadius) {
                particle.revealed = true;
                particle.color = '#2563eb';
            }
         });

         // Connections
         ctx.save();
         ctx.beginPath();
         ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
         ctx.clip();

         for (let i = 0; i < particles.length; i++) {
            if (particles[i].revealed) {
                if (Math.hypot(particles[i].x - lensX, particles[i].y - lensY) < lensRadius) {
                   for (let j = i + 1; j < particles.length; j++) {
                      if (particles[j].revealed) {
                         const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                         if (dist < 80) {
                            ctx.strokeStyle = `rgba(37, 99, 235, ${0.6 * (1 - dist / 80)})`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                         }
                      }
                   }
                }
            }
         }
         ctx.restore();
         
         // Labels (reused)
         const labels = ['Validating...', 'Checking Hashing...', 'Pixel Scan...', 'Analyzing Metadata...'];
         // Rotate labels based on loop time
         const labelIndex = Math.floor(loopTime * 1.5) % labels.length;
         ctx.fillStyle = 'rgba(37, 99, 235, 1)';
         ctx.font = 'bold 14px Inter';
         ctx.textAlign = 'center';
         ctx.fillText(labels[Math.abs(labelIndex)], lensX, lensY + lensRadius + 20);

      } else if (currentPhase === 'clarity') {
          const easedProgress = 1 - Math.pow(1 - phaseProgress, 3);
          const maxRadius = Math.hypot(width, height);
          const expandedRadius = 100 + easedProgress * maxRadius;

          ctx.save();
          ctx.beginPath();
          ctx.arc(width/2, height/2, expandedRadius, 0, Math.PI * 2);
          ctx.clip();

          ctx.fillStyle = '#fff';
          ctx.fillRect(0,0, width, height);
          drawGrid(0.1 + easedProgress * 0.1, 0);

          if (easedProgress > 0.5) {
             const iconScale = Math.min(1, (easedProgress - 0.5) * 4);
             ctx.translate(width/2, height/2);
             ctx.scale(iconScale, iconScale);
             
             ctx.fillStyle = '#eff6ff';
             ctx.beginPath();
             ctx.arc(0, 0, 60, 0, Math.PI * 2);
             ctx.fill();

             ctx.strokeStyle = '#2563eb';
             ctx.lineWidth = 4;
             ctx.beginPath();
             ctx.arc(0, 0, 60, 0, Math.PI * 2);
             ctx.stroke();

             ctx.beginPath();
             ctx.moveTo(-20, 0);
             ctx.lineTo(-5, 15);
             ctx.lineTo(25, -15);
             ctx.stroke();

             ctx.fillStyle = '#1e40af';
             ctx.font = 'bold 24px Inter';
             ctx.textAlign = 'center';
             ctx.fillText("VERIFIED", 0, 100);
          }
          ctx.restore();

        if (expandedRadius < maxRadius) {
            ctx.strokeStyle = `rgba(37, 99, 235, ${1 - phaseProgress})`;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(width/2, height/2, expandedRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
      }
      
      if (!(isFinishing && phaseProgress >= 1)) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 800);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(statusInterval);
    };
  }, [isFinishing, onComplete]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Forensic Lens</h1>
        <p className="text-sm tracking-widest uppercase text-slate-600 font-mono">Analyzing with Precision</p>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="mx-auto rounded-2xl shadow-2xl border border-slate-200 backdrop-blur-sm bg-white/40"
      />

      <div className="mt-12 text-center h-8">
        <p className="text-sm font-mono text-slate-600 transition-opacity duration-300">
          {statuses[statusIndex]}
        </p>
      </div>

      <div className="mt-8">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                i < statusIndex ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
