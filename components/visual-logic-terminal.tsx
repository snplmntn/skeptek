import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thinking';
}

interface VisualLogicTerminalProps {
  logs: LogEntry[];
  isVisible: boolean;
}

export function VisualLogicTerminal({ logs, isVisible }: VisualLogicTerminalProps) {
  const endRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[400px] z-50 font-mono text-xs">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden flex flex-col h-full"
      >
        {/* Header */}
        <div className="bg-cyan-950/30 border-b border-cyan-500/20 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-cyan-400 font-bold tracking-wider">GEMINI.REASONING_CORE</span>
          </div>
          <span className="text-cyan-700/50">v3.0-PRO</span>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-2 ${getColor(log.type)}`}
              >
                <span className="opacity-50">[{log.timestamp}]</span>
                <span>{log.message}</span>
                {log.type === 'thinking' && (
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      </motion.div>
    </div>
  );
}

function getColor(type: LogEntry['type']) {
  switch (type) {
    case 'info': return 'text-gray-300';
    case 'success': return 'text-green-400';
    case 'warning': return 'text-yellow-400';
    case 'error': return 'text-red-400';
    case 'thinking': return 'text-cyan-300';
    default: return 'text-gray-300';
  }
}
