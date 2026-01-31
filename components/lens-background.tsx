'use client';

import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

export const LensBackground = memo(function LensBackground() {
  const [bgNodes, setBgNodes] = useState<Array<{left: string, top: string, delay: string, opacity: number}>>([]);
  const [bgNodesInitialized, setBgNodesInitialized] = useState(false);

  useEffect(() => {
    if (!bgNodesInitialized) {
        setBgNodes([...Array(20)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.2
        })));
        setBgNodesInitialized(true);
    }
  }, [bgNodesInitialized]);

  return (
      <div className="absolute inset-0 pointer-events-none">
          {/* 1. Deep Base Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          
          {/* 2. Animated Grid with scanning effect */}
          <div 
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]" 
            style={{ 
              backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
            }} 
          />
          
          {/* 3. Floating Blue Nebulae (Optimized Blur) - Increased Density */}
          <motion.div 
            animate={{ 
                x: [0, 80, -80, 0], 
                y: [0, -50, 50, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] mix-blend-screen opacity-40 dark:opacity-15" 
          />
          <motion.div 
            animate={{ 
                x: [0, -60, 60, 0], 
                y: [0, 80, -80, 0],
                rotate: [360, 180, 0],
                scale: [1.1, 0.9, 1.2, 1.1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 -right-40 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[160px] mix-blend-screen opacity-40 dark:opacity-15" 
          />
          <motion.div 
            animate={{ 
                x: [-100, 100, -100], 
                y: [100, -100, 100],
                scale: [0.8, 1.1, 0.8]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[180px] mix-blend-screen opacity-30 dark:opacity-10" 
          />
          <motion.div 
            animate={{ 
                x: [200, -200, 200], 
                y: [0, 150, 0],
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen opacity-20 dark:opacity-5" 
          />

          {/* 4. Scanning Line */}
          <motion.div 
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)] z-0"
          />

          {/* 5. Random Technical "Nodes" (Dust) */}
          <div className="absolute inset-0 opacity-20">
             {bgNodes.map((node, i) => (
                 <div 
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
                    style={{ 
                        left: node.left, 
                        top: node.top,
                        animationDelay: node.delay,
                        opacity: node.opacity
                    }}
                 />
             ))}
          </div>
      </div>
  );
});
