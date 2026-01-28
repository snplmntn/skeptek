'use client';

import { useEffect, useRef, useState } from 'react';

const statuses = [
  'RESOLVING_VIDEO_PHYSICS...',
  'CALCULATING_FAIR_VALUE...',
  'VERIFYING_SELLER_HISTORY...',
  'COMPILING_FINAL_ANALYSIS...',
];

export function FocalAlignmentLoader({ status }: { status?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [phase, setPhase] = useState<'scatter' | 'scan' | 'resolve'>('scatter');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Particles for scatter phase
    const particles: Array<{
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      vx: number;
      vy: number;
      size: number;
      gridX: number;
      gridY: number;
    }> = [];

    // Generate hexagonal grid
    const hexSize = 12;
    const cols = Math.ceil(width / (hexSize * 1.5));
    const rows = Math.ceil(height / (hexSize * 1.3));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const targetX = 100 + col * hexSize * 1.5;
        const targetY = 100 + row * hexSize * 1.3 + (col % 2) * (hexSize * 0.65);

        if (targetX < width - 100 && targetY < height - 100) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            targetX,
            targetY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: 3,
            gridX: col,
            gridY: row,
          });
        }
      }
    }

    let animationFrame: number;
    let startTime = Date.now();
    const scatterDuration = 800;
    const scanDuration = 1200;
    const resolveDuration = 1000;
    const totalDuration = scatterDuration + scanDuration + resolveDuration;

    const drawHexagon = (x: number, y: number, size: number, filled: boolean) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (filled) ctx.fill();
      else ctx.stroke();
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = Math.min(elapsed / totalDuration, 1);

      // Clear canvas (Transparent)
      ctx.clearRect(0, 0, width, height);

      // Phase 1: Scatter (0 - 0.33)
      if (totalProgress < scatterDuration / totalDuration) {
        setPhase('scatter');
        const progress = totalProgress / (scatterDuration / totalDuration);

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off walls
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          // Keep in bounds
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));

          // Theme-aware particle color (cyan/blue based)
          ctx.fillStyle = `rgba(6, 182, 212, ${0.6 * (1 - progress * 0.5)})`; // Cyan-500 base
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // Phase 2: Scan (0.33 - 0.66)
      else if (totalProgress < (scatterDuration + scanDuration) / totalDuration) {
        setPhase('scan');
        const phaseProgress = (totalProgress - scatterDuration / totalDuration) / (scanDuration / totalDuration);

        // Draw faded scattered particles
        particles.forEach((p) => {
          ctx.fillStyle = `rgba(148, 163, 184, ${0.2})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw laser line
        const laserX = width * phaseProgress;
        ctx.strokeStyle = `rgba(37, 99, 235, 0.8)`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(37, 99, 235, 0.6)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(laserX, 0);
        ctx.lineTo(laserX, height);
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        // Glow effect around laser
        const glowGradient = ctx.createLinearGradient(laserX - 40, 0, laserX + 40, 0);
        glowGradient.addColorStop(0, 'rgba(37, 99, 235, 0)');
        glowGradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.3)');
        glowGradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(laserX - 40, 0, 80, height);
      }
      // Phase 3: Resolve (0.66 - 1.0)
      else {
        setPhase('resolve');
        const phaseProgress = (totalProgress - (scatterDuration + scanDuration) / totalDuration) / (resolveDuration / totalDuration);

        // Draw resolved hexagonal grid with particles snapping into place
        particles.forEach((p) => {
          const moveProgress = Math.min(phaseProgress * 1.5, 1);
          const easeProgress = moveProgress < 0.5 ? 2 * moveProgress * moveProgress : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

          p.x = p.x + (p.targetX - p.x) * easeProgress;
          p.y = p.y + (p.targetY - p.y) * easeProgress;

          const opacity = Math.max(0.3, 1 - phaseProgress * 0.5);
          ctx.fillStyle = `rgba(37, 99, 235, ${opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + 1, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw shield with checkmark
        if (phaseProgress > 0.3) {
          const shieldProgress = Math.min((phaseProgress - 0.3) / 0.7, 1);
          const shieldScale = 0.5 + shieldProgress * 0.5;
          const shieldX = width / 2;
          const shieldY = height / 2;
          const shieldSize = 60 * shieldScale;

          ctx.fillStyle = `rgba(37, 99, 235, ${shieldProgress * 0.9})`;
          ctx.beginPath();
          ctx.arc(shieldX, shieldY, shieldSize, 0, Math.PI * 2);
          ctx.fill();

          // Shield border glow
          ctx.strokeStyle = `rgba(37, 99, 235, ${shieldProgress * 0.5})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(37, 99, 235, 0.6)';
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(shieldX, shieldY, shieldSize, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowColor = 'transparent';

          // Checkmark
          if (shieldProgress > 0.5) {
            const checkProgress = (shieldProgress - 0.5) / 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(shieldX - 15, shieldY + 5);
            const midX = shieldX - 3;
            const midY = shieldY + 15;
            const endX = shieldX + 20;
            const endY = shieldY - 10;

            ctx.lineTo(midX * checkProgress + (shieldX - 15) * (1 - checkProgress), midY * checkProgress + (shieldY + 5) * (1 - checkProgress));
            ctx.lineTo(midX + (endX - midX) * (checkProgress - 0.5) * 2, midY + (endY - midY) * (checkProgress - 0.5) * 2);
            ctx.stroke();
          }
        }
      }

      if (totalProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();

    // Cycle through status messages
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, totalDuration / statuses.length);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Canvas - Responsive Container */}
      <div className="relative w-full max-w-[320px] aspect-square mb-4">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="w-full h-full rounded-full border border-border/50 bg-background/50 dark:bg-black/20 shadow-inner"
          />
      </div>

      {/* Status Text - Monospaced */}
      <div className="font-mono text-xs font-medium text-muted-foreground animate-pulse text-center">
        <span className="text-cyan-500 mr-2">&gt;</span>
        {status || statuses[statusIndex]}
      </div>

      {/* Phase Indicator */}
      <div className="mt-4 flex gap-1.5">
        {['scatter', 'scan', 'resolve'].map((p) => (
          <div
            key={p}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              phase === p ? 'bg-cyan-500 scale-125' : 'bg-muted/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
