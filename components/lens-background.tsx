'use client';

import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

export const LensBackground = memo(function LensBackground() {
  const [bgNodes, setBgNodes] = useState<Array<{left: string, top: string, delay: string, opacity: number}>>([]);
  const [bgNodesInitialized, setBgNodesInitialized] = useState(false);

  useEffect(() => {
    if (!bgNodesInitialized) {
        // Reduced from 20 to 12 for mobile performance
        setBgNodes([...Array(12)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.2
        })));
        setBgNodesInitialized(true);
    }
  }, [bgNodesInitialized]);

  return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden content-visibility-auto">
          {/* 1. Deep Base Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          
          {/* 2. Animated Grid - Static on initial load, low opacity */}
          <div 
            className="absolute inset-0 opacity-[0.10] dark:opacity-[0.05]" 
            style={{ 
              backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
              backgroundSize: '60px 60px', // Larger grid = fewer lines = more perf
              maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
            }} 
          />
          
          {/* 3. Floating Nebulae - Reduced Blur & Count */}
          <motion.div 
            animate={{ 
                x: [0, 50, -50, 0], 
                y: [0, -30, 30, 0],
                rotate: [0, 180, 360],
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }} // "linear" is cheaper than "easeInOut"
            className="absolute top-0 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[80px] mix-blend-screen opacity-30 dark:opacity-10 will-change-transform" 
          />
          <motion.div 
            animate={{ 
                x: [0, -40, 40, 0], 
                y: [0, 50, -50, 0],
                rotate: [360, 180, 0],
            }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[90px] mix-blend-screen opacity-30 dark:opacity-10 will-change-transform" 
          />

          {/* 4. Scanning Line - Slower, minimal impact */}
          <motion.div 
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent z-0 opacity-50"
          />

          {/* 5. Nodes - Reduced count handled by state */}
          <div className="absolute inset-0 opacity-20">
             {bgNodes.map((node, i) => (
                 <div 
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
                    style={{ 
                        left: node.left, 
                        top: node.top,
                        animationDelay: node.delay,
                        opacity: node.opacity,
                        willChange: 'opacity'
                    }}
                 />
             ))}
          </div>
      </div>
  );
});
