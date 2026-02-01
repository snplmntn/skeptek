"use client";

import React, { useState, useCallback, memo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Scan } from "lucide-react";
// reusable input component for the lens interface
import { cn } from "@/lib/utils";

interface LensInputProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
}

export const LensInput = memo(function LensInput({ onFileSelect, onClear }: LensInputProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (onClear) onClear();
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-xl transition-all duration-500 cursor-pointer overflow-hidden",
        "border-zinc-200 dark:border-zinc-800 bg-secondary/5 dark:bg-black/60 hover:border-cyan-500/60 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)]",
        isDragActive && "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 shadow-[0_0_40px_-5px_rgba(6,182,212,0.6)]",
        "group"
      )}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full h-full p-4 flex flex-col items-center">
          <div className="relative group/preview">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 w-auto object-contain rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            />
            <button
              onClick={clearPreview}
              className="absolute -top-2 -right-2 p-1.5 bg-background dark:bg-zinc-900 border border-red-500/50 text-red-500 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-cyan-600 dark:text-cyan-400 animate-pulse font-mono">
            Evidence Captured - Ready for Analysis
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <div className="p-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:border-cyan-500/50 transition-all duration-300">
            <Scan className="w-8 h-8 text-muted-foreground group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-all duration-500" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-cyan-700 dark:group-hover:text-cyan-100">SMART VISUAL ANALYSIS</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
              Drag images of ads or social shop listings to debunk scams
            </p>
          </div>
        </div>
      )}

      {/* Cyberpunk Scan Line */}
      <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 shadow-[0_0_8px_#06b6d4] pointer-events-none animate-scanline" />
      
      {/* HUD Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-300 dark:border-zinc-800 group-hover:border-cyan-500 transition-colors" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-300 dark:border-zinc-800 group-hover:border-cyan-500 transition-colors" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-300 dark:border-zinc-800 group-hover:border-cyan-500 transition-colors" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-300 dark:border-zinc-800 group-hover:border-cyan-500 transition-colors" />

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline { animation: scanline 4s linear infinite; }
      `}</style>
    </div>
  );
});
