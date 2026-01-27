'use client';

import { useEffect, useRef, useState } from 'react';

const messages = [
  'Gathering global reviews...',
  'Analyzing video clips for build quality...',
  'Checking price history...',
  'Finalizing reliability report.',
];

export function ClarifyingLensLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Animated blur particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      blurAmount: number;
      originalBlur: number;
      hue: number;
    }> = [];

    // Initialize particles in a chaotic cluster
    for (let i = 0; i < 16; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 35 + 15,
        blurAmount: Math.random() * 25 + 15,
        originalBlur: Math.random() * 25 + 15,
        hue: Math.random() * 40 + 200, // Blue hues
      });
    }

    let animationFrame: number;
    let startTime = Date.now();
    const totalDuration = 4000; // 4 seconds for the animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw blurred particles with motion
      particles.forEach((particle) => {
        const blurReduction = progress * particle.originalBlur;
        particle.blurAmount = particle.originalBlur - blurReduction;

        // Slight motion towards center during animation
        const centerPull = progress * 0.3;
        const dirX = (width / 2 - particle.x) * centerPull * 0.01;
        const dirY = (height / 2 - particle.y) * centerPull * 0.01;
        particle.x += dirX;
        particle.y += dirY;

        ctx.filter = `blur(${particle.blurAmount}px)`;
        ctx.fillStyle = `hsl(${particle.hue}, 45%, ${70 - progress * 20}%)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.filter = 'none';

      // Draw the lens ring - more prominent and sophisticated
      const lensX = width / 2;
      const lensY = height / 2;
      
      // Pulsating lens size based on progress
      const baseLensRadius = 140;
      const lensRadius = baseLensRadius + Math.sin(progress * Math.PI * 3) * 20;

      // Multiple lens rings for depth
      // Outer ring
      const outerGradient = ctx.createRadialGradient(lensX, lensY, 0, lensX, lensY, lensRadius * 1.2);
      outerGradient.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
      outerGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
      outerGradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = outerGradient;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Main lens gradient
      const gradient = ctx.createRadialGradient(lensX, lensY, 0, lensX, lensY, lensRadius);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
      gradient.addColorStop(0.6, 'rgba(37, 99, 235, 0.15)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright ring
      const innerGradient = ctx.createRadialGradient(lensX, lensY, lensRadius - 15, lensX, lensY, lensRadius);
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      innerGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
      innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
      ctx.fill();

      // Main lens border - sharp and prominent
      ctx.strokeStyle = `rgba(37, 99, 235, ${0.8 - progress * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary outer border for depth
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 - progress * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lensX, lensY, lensRadius * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      // Lens center dot
      ctx.fillStyle = `rgba(37, 99, 235, ${0.6 + Math.sin(progress * Math.PI * 2) * 0.2})`;
      ctx.beginPath();
      ctx.arc(lensX, lensY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Add multiple light flares for glass effect
      for (let i = 0; i < 3; i++) {
        const flareAngle = (progress * Math.PI * 2 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
        const flareX = lensX + Math.cos(flareAngle) * 80;
        const flareY = lensY + Math.sin(flareAngle) * 80;

        const flareGradient = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 50);
        flareGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 - progress * 0.2})`);
        flareGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.1 - progress * 0.05})`);
        flareGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = flareGradient;
        ctx.beginPath();
        ctx.arc(flareX, flareY, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the final shield with checkmark when animation completes
      if (progress > 0.65) {
        const fadeIn = Math.min((progress - 0.65) / 0.35, 1);
        ctx.globalAlpha = fadeIn;

        // Shield background circle
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.fill();

        // Shield border glow
        ctx.strokeStyle = `rgba(37, 99, 235, ${0.4 * fadeIn})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        // Checkmark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height / 2 + 5);
        ctx.lineTo(width / 2 - 5, height / 2 + 20);
        ctx.lineTo(width / 2 + 25, height / 2 - 15);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
      }
    };

    animate();

    // Update message every 1000ms
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1000);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mb-8 text-center">
        {/* Skeptek Branding */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Skeptek Lens</h1>
          <p className="text-slate-600 text-sm tracking-wide">ANALYSIS IN PROGRESS</p>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="mx-auto rounded-3xl shadow-2xl"
        />
      </div>

      {/* Status Message */}
      <div className="h-8 mt-8">
        <p className="text-center text-base font-medium text-slate-700 transition-opacity duration-300">
          {messages[messageIndex]}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < messageIndex ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {messageIndex + 1} of {messages.length}
        </span>
      </div>

      {/* Completion Message */}
      {animationComplete && (
        <div className="mt-12 text-center animate-fade-in">
          <p className="text-lg font-semibold text-blue-600">Analysis Complete</p>
          <p className="text-sm text-slate-600 mt-1">Redirecting to results...</p>
        </div>
      )}
    </div>
  );
}
