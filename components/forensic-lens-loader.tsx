'use client';

import { useEffect, useRef, useState } from 'react';

const statuses = [
  '> MAGNIFYING_VIDEO_DETAILS...',
  '> INSPECTING_PIXEL_ARBITRAGE...',
  '> FOCUSING_ON_TRUTH...',
  '> FINALIZING_SCAN...',
];

export function ForensicLensLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [phase, setPhase] = useState<'noise' | 'investigation' | 'clarity'>('noise');

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
      blur: number;
      revealed: boolean;
      color: string;
    }> = [];

    // Initialize scattered particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 4 + 2,
        blur: Math.random() * 12 + 8,
        revealed: false,
        color: '#94a3b8',
      });
    }

    let animationFrame: number;
    let startTime = Date.now();
    const noiseDuration = 1000;
    const investigationDuration = 2000;
    const clarityDuration = 800;
    const totalDuration = noiseDuration + investigationDuration + clarityDuration;

    const drawMagnifyingGlass = (x: number, y: number, radius: number, progress: number) => {
      // Outer glass ring
      const glassGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      glassGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glassGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Glass border - prominent blue
      ctx.strokeStyle = `rgba(37, 99, 235, ${0.8 + Math.sin(progress * Math.PI * 2) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner blue glow
      ctx.strokeStyle = `rgba(37, 99, 235, ${0.4 + Math.sin(progress * Math.PI * 2) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
      ctx.stroke();

      // Handle (stem)
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

      // Center focal point
      ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = elapsed / totalDuration;

      ctx.fillStyle = '#f8fafb';
      ctx.fillRect(0, 0, width, height);

      // Phase transitions
      if (totalProgress < noiseDuration / totalDuration) {
        setPhase('noise');
      } else if (totalProgress < (noiseDuration + investigationDuration) / totalDuration) {
        setPhase('investigation');
      } else {
        setPhase('clarity');
      }

      // Draw particles
      particles.forEach((particle) => {
        // Bounce particles
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        particle.x += particle.vx;
        particle.y += particle.vy;

        ctx.filter = `blur(${particle.blur}px)`;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.filter = 'none';

      if (phase === 'investigation') {
        const phaseProgress = (totalProgress - noiseDuration / totalDuration) / (investigationDuration / totalDuration);

        // Scanning path - left to right
        const lensX = width * 0.1 + phaseProgress * (width * 0.8);
        const lensY = height / 2 + Math.sin(phaseProgress * Math.PI * 2) * 40;
        const lensRadius = 100;

        // Draw magnifying glass
        drawMagnifyingGlass(lensX, lensY, lensRadius, phaseProgress);

        // Reveal and connect particles inside lens
        particles.forEach((particle) => {
          const dist = Math.hypot(particle.x - lensX, particle.y - lensY);
          if (dist < lensRadius) {
            particle.revealed = true;
            particle.blur = 0;
            particle.color = '#2563eb';
          }
        });

        // Draw connecting lines between revealed particles
        for (let i = 0; i < particles.length; i++) {
          if (particles[i].revealed) {
            for (let j = i + 1; j < particles.length; j++) {
              if (particles[j].revealed) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 150) {
                  ctx.strokeStyle = `rgba(37, 99, 235, ${0.3 * (1 - dist / 150)})`;
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

        // Floating labels inside lens
        const labels = ['Defect Found', 'Bot Detected', 'Price Verified'];
        for (let i = 0; i < labels.length; i++) {
          const labelAngle = (phaseProgress * Math.PI * 2) + (i * (Math.PI * 2 / 3));
          const labelX = lensX + Math.cos(labelAngle) * 60;
          const labelY = lensY + Math.sin(labelAngle) * 60;

          ctx.fillStyle = 'rgba(37, 99, 235, 0.6)';
          ctx.font = 'bold 12px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], labelX, labelY);
        }
      } else if (phase === 'clarity') {
        const phaseProgress = (totalProgress - (noiseDuration + investigationDuration) / totalDuration) / (clarityDuration / totalDuration);

        // Expanding lens to fill screen
        const expandedRadius = 100 + phaseProgress * (width * 0.8);
        drawMagnifyingGlass(width / 2, height / 2, expandedRadius, phaseProgress);

        // Clear inside the expanding lens
        ctx.fillStyle = '#f8fafb';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, expandedRadius - 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    // Update status text
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 800);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(statusInterval);
    };
  }, []);

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
