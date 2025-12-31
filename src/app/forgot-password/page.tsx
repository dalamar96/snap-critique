'use client'

import { forgotPassword } from '../auth/actions'
import { Check, AlertTriangle, ArrowLeft, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black border border-white/20 p-8 shadow-2xl relative overflow-hidden">
            
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
               </div>
               <h1 className="text-2xl font-bold font-mono text-white uppercase tracking-widest">
                 Reset Password
               </h1>
               <p className="text-slate-500 text-xs font-mono uppercase mt-2">
                 Enter your email to receive recovery instructions
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

            <form action={forgotPassword} className="space-y-6">
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

                 <button className="btn-primary w-full py-4 text-xs flex items-center justify-center gap-2">
                    Send Reset Link
                 </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-4">
               <Link href="/login" className="text-[10px] text-slate-500 hover:text-white font-mono uppercase flex items-center justify-center gap-2 transition-colors">
                 <ArrowLeft className="w-3 h-3" />
                 Back to Login
               </Link>
            </div>
        </div>
    </div>
  )
}
