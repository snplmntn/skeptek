'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Minus, MessageSquarePlus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { submitFieldReport } from '@/app/actions/field-report';
import { toast } from 'sonner';

interface VerificationModuleProps {
  productName: string;
  currentTrustScore: number;
  userRank?: string; // Made optional to fix strict type check if passed undefined
  initialOpen?: boolean;
}

export function VerificationModule({ productName, currentTrustScore, userRank = 'Guest', initialOpen = false }: VerificationModuleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [agreement, setAgreement] = useState<number | null>(null); // -1, 0, 1
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If user is Guest, show "Sign In" CTA instead of form
  if (userRank === 'Guest') {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-muted-foreground">Community Verification</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Do you own <strong>{productName}</strong>? Sign in to verify our analysis and earn XP.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/login?mode=signup">Sign In / Register</a>
        </Button>
      </div>
    );
  }

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
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Verification Recorded</h4>
                <p className="text-xs text-emerald-400/80 font-mono mt-1">Thank you, Agent. Your field report has been logged.</p>
            </div>
        </div>
     );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
            <div>
                 <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    Verify Intelligence
                 </h3>
                 <p className="text-xs text-muted-foreground font-mono mt-1 max-w-md">
                    Our AI gives this a Trust Score of <span className="text-primary font-bold">{currentTrustScore.toFixed(0)}</span>. 
                    Based on your real-world usage, is this accurate?
                 </p>
            </div>
            {!isOpen && (
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="gap-2 text-xs font-mono uppercase tracking-widest">
                    <MessageSquarePlus className="w-4 h-4" />
                    Add Report
                </Button>
            )}
        </div>

        {isOpen && (
            <div className="space-y-6 animate-in slide-in-from-top-2">
                {/* Vote Selection */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setAgreement(1)}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === 1 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'}`}
                    >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Agree</span>
                    </button>
                    <button 
                         onClick={() => setAgreement(0)}
                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'}`}
                    >
                        <Minus className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Neutral</span>
                    </button>
                    <button 
                         onClick={() => setAgreement(-1)}
                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${agreement === -1 ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'}`}
                    >
                        <ThumbsDown className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Disagree</span>
                    </button>
                </div>

                {/* Optional Comment */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Field Notes (Optional)</label>
                    <Textarea 
                        placeholder="Share your specific experience with this product..."
                        className="bg-black/20 border-white/10 resize-none h-24 text-sm"
                        value={comment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                    />
                </div>

                {/* Actions */}
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
