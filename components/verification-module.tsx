'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Minus, MessageSquarePlus, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { submitFieldReport } from '@/app/actions/field-report';
import { toast } from 'sonner';

interface VerificationModuleProps {
  productName: string;
  currentTrustScore: number;
  userRank?: string; 
  initialOpen?: boolean;
  aiConfidence?: number;
}

export function VerificationModule({ productName, currentTrustScore, userRank = 'Guest', initialOpen = false, aiConfidence = 85 }: VerificationModuleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [agreement, setAgreement] = useState<number | null>(null); // -1, 0, 1
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center group">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-primary flex items-center justify-center gap-2">
           <MessageSquarePlus className="w-4 h-4" />
           Own this product?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Share your experience with <strong>{productName}</strong> to help others make better buying decisions.
        </p>
        <Button variant="default" size="sm" asChild className="bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20 px-6 font-mono text-[10px] tracking-widest uppercase">
          <a href="/login?mode=signup">Sign in to Review</a>
        </Button>
      </div>

  const handleSubmit = async () => {
    if (agreement === null) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('agreementRating', agreement.toString());
    formData.append('comment', comment);

    const result = await submitFieldReport(formData);

    if (result.success) {
      toast.success(result.message);
      setSubmitted(true);
      setIsOpen(false);
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  if (submitted) {
     return (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex items-center gap-4 animate-in fade-in">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-emerald-900 dark:text-white mb-1">Upload Complete</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80 font-mono mt-1">Thank you. Your review has been logged.</p>
            </div>
        </div>
     );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 dark:bg-black/20 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                    <FileText className="w-3.5 h-3.5" />
                    Community Review
                 </h3>
                 <p className="text-xs text-muted-foreground font-mono mt-1 max-w-md">
                    Analysis Data Coverage: <span className={aiConfidence < 70 ? 'text-rose-500' : 'text-emerald-500'}>{aiConfidence}%</span>. 
                    Your feedback helps improve our accuracy.
                 </p>
                 {/* confidence bar */}
                 <div className="mt-3 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${aiConfidence < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${aiConfidence}%` }}
                    />
                 </div>
            </div>
            {!isOpen && (
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="gap-2 text-xs font-mono uppercase tracking-widest">
                    <MessageSquarePlus className="w-4 h-4" />
                    Write a Review
                </Button>
            )}
        </div>

        {isOpen && (
            <div className="space-y-6 animate-in slide-in-from-top-2">
                {/* vote selection */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setAgreement(1)}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === 1 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-muted-foreground'}`}
                    >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Agree</span>
                    </button>
                    <button 
                         onClick={() => setAgreement(0)}
                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-muted-foreground'}`}
                    >
                        <Minus className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Neutral</span>
                    </button>
                    <button 
                         onClick={() => setAgreement(-1)}
                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === -1 ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-muted-foreground'}`}
                    >
                        <ThumbsDown className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Disagree</span>
                    </button>
                </div>

                {/* optional comment */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Field Notes (Optional)</label>
                    <Textarea 
                        placeholder="Share your specific experience with this product..."
                        className="bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/10 resize-none h-24 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                        value={comment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                    />
                </div>

                {/* actions */}
                <div className="flex gap-3 justify-end">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-mono uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button 
                        size="sm"
                        onClick={handleSubmit}
                        disabled={agreement === null || isSubmitting}
                        className="bg-primary hover:bg-blue-600 text-white gap-2 text-xs font-mono uppercase tracking-widest"
                    >
                        {isSubmitting ? 'Transmitting...' : 'Submit Report'}
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
}
