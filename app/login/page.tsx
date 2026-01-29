'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Loader2, Link as LinkIcon, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const supabase = createClient();

  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            toast.success("Authentication successful");
            router.push(next || '/');
            router.refresh();
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        rank: 'Novice',
                        xp: 0
                    }
                }
            });
            if (error) throw error;
            
            // Explicit Success Handling
            if (data.user && !data.session) {
                setSuccessMessage("Account created successfully. Please check your email inbox to verify your account.");
            } else if (data.session) {
                toast.success("Account created and logged in!");
                router.push(next || '/');
                router.refresh();
            }
        }
    } catch (error: any) {
        console.error("Auth Error:", error);
        toast.error(error.message || "An unexpected validation error occurred.");
    } finally {
        setLoading(false);
    }
  };

  if (successMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
             <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 forensic-glass backdrop-blur-xl bg-black/40 shadow-2xl text-center">
                 <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Verification Required</h2>
                 <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                     {successMessage}
                 </p>
                 <Button 
                    onClick={() => setIsLogin(true)}
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 text-slate-300"
                 >
                     Return to Sign In
                 </Button>
             </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 p-8 rounded-2xl border border-white/10 forensic-glass backdrop-blur-xl bg-black/40 shadow-2xl">
         {/* Toggle Headers */}
         <div className="flex gap-8 mb-8 border-b border-white/5 pb-2">
             <button
                onClick={() => setIsLogin(true)}
                className={`text-lg font-bold uppercase tracking-widest transition-colors pb-2 -mb-2.5 border-b-2 ${isLogin ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
             >
                 Sign In
             </button>
             <button
                onClick={() => setIsLogin(false)}
                className={`text-lg font-bold uppercase tracking-widest transition-colors pb-2 -mb-2.5 border-b-2 ${!isLogin ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
             >
                 Register
             </button>
         </div>

         <div className="mb-6">
             <h1 className="text-2xl font-black text-white mb-2">
                 {isLogin ? 'Welcome Back' : 'Create Account'}
             </h1>
             <p className="text-sm text-slate-400 font-mono">
                 {isLogin ? 'Enter your credentials to access the platform.' : 'Join to track your scans, discovery history, and create reviews.'}
             </p>
         </div>

         <form onSubmit={handleAuth} className="space-y-4">
             <div className="space-y-2">
                 <Label htmlFor="email" className="text-xs uppercase tracking-wider text-slate-500 font-bold">Email Address</Label>
                 <Input 
                    id="email"
                    type="email" 
                    placeholder="name@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-colors h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                 />
             </div>
             
             <div className="space-y-2">
                 <Label htmlFor="password" className="text-xs uppercase tracking-wider text-slate-500 font-bold">Password</Label>
                 <div className="relative">
                    <Input 
                        id="password"
                        type={showPassword ? "text" : "password"} 
                        placeholder={isLogin ? "••••••••" : "Choose a strong password"}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-colors h-12 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
             </div>

             <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold uppercase tracking-widest mt-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)] group"
             >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                     <span className="flex items-center gap-2">
                         {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </span>
                 )}
             </Button>
         </form>

         <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
             <Link href="/" className="text-xs font-mono text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                 <LinkIcon className="w-3 h-3" /> Back to Search
             </Link>
             <span className="text-xs text-slate-600 flex items-center gap-1">
                 <Lock className="w-3 h-3" /> Secure Connection
             </span>
         </div>
      </div>
    </div>
  );
}
