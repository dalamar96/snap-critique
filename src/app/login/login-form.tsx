'use client'

import { login, signup } from '../auth/actions'
import { Check, Shield, Lock, UserPlus, LogIn, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export function LoginForm() {
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('view') === 'signup')
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="w-full max-w-md bg-black border border-white/20 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 p-2 text-[10px] text-primary/40 font-mono">SECURE LOGIN</div>
        <div className="absolute top-0 left-0 p-2 text-[10px] text-primary/40 font-mono">MODE: {isSignUp ? 'REGISTER' : 'LOGIN'}</div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
           </div>
           <h1 className="text-3xl font-bold font-mono text-white uppercase tracking-widest">
             {isSignUp ? 'Create Account' : 'Welcome Back'}
           </h1>
           <p className="text-slate-500 text-xs font-mono uppercase mt-2">
             {isSignUp ? 'Join the community' : 'Enter details to access your critiques'}
           </p>
        </div>

        {/* Alerts */}
        {error && (
            <div className="bg-red-900/20 border border-red-900/50 p-3 mb-6 text-center">
                <p className="text-red-500 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </p>
            </div>
        )}
        {message && (
            <div className="bg-primary/10 border border-primary/30 p-3 mb-6 text-center">
                 <p className="text-primary text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> {message}
                </p>
            </div>
        )}

        {/* Toggle */}
        <div className="flex bg-white/5 border border-white/10 p-1 mb-8 rounded">
            <button 
                onClick={() => setIsSignUp(false)}
                className={cn(
                    "flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded",
                    !isSignUp ? "bg-primary text-black font-bold" : "text-slate-400 hover:text-white"
                )}
            >
                Log In
            </button>
            <button 
                onClick={() => setIsSignUp(true)}
                className={cn(
                    "flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded",
                    isSignUp ? "bg-primary text-black font-bold" : "text-slate-400 hover:text-white"
                )}
            >
                Sign Up
            </button>
        </div>

        <form>
          <input type="hidden" name="next" value={next || ''} />
          <div className="space-y-4 mb-8">
             <div className="relative group">
                <label className="text-[10px] font-mono text-slate-500 uppercase absolute -top-2 left-2 bg-black px-1 group-focus-within:text-primary transition-colors">Email Address</label>
                <input 
                  name="email" 
                  type="email" 
                  required
                  className="w-full bg-black border border-white/20 p-4 font-mono text-white focus:border-primary outline-none transition-all placeholder:text-slate-800"
                  placeholder="photographer@example.com"
                />
             </div>
             
             <div className="relative group">
                <label className="text-[10px] font-mono text-slate-500 uppercase absolute -top-2 left-2 bg-black px-1 group-focus-within:text-primary transition-colors">Password</label>
                <input 
                  name="password" 
                  type="password" 
                  required
                  className="w-full bg-black border border-white/20 p-4 font-mono text-white focus:border-primary outline-none transition-all placeholder:text-slate-800"
                  placeholder="••••••••"
                />
             </div>
             <div className="text-right">
                <Link href="/forgot-password" className="text-[10px] text-slate-500 hover:text-primary transition-colors font-mono uppercase tracking-wider">
                    Forgot Password?
                </Link>
             </div>
          </div>

          <div className="flex flex-col gap-4">
             {isSignUp ? (
                <>
                 <button formAction={signup} className="btn-primary py-4 text-xs flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Create Account
                 </button>
                 <div className="text-[10px] text-slate-500 text-center">
                    By signing up, you agree to our <Link href="/terms" className="underline hover:text-white">Terms</Link> and <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
                 </div>
                </>
             ) : (
                 <button formAction={login} className="btn-primary py-4 text-xs flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" /> Log In &gt;&gt;
                 </button>
             )}
          </div>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-4">
           <p className="text-[10px] text-slate-600 font-mono uppercase">
             <Lock className="w-3 h-3 inline mr-1" />
             Secure Authentication
           </p>
        </div>
    </div>
  )
}
