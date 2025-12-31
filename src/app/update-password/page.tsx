'use client'

import { updatePassword } from '../auth/actions'
import { AlertTriangle, Lock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black border border-white/20 p-8 shadow-2xl relative overflow-hidden">
            
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
               </div>
               <h1 className="text-2xl font-bold font-mono text-white uppercase tracking-widest">
                 New Password
               </h1>
               <p className="text-slate-500 text-xs font-mono uppercase mt-2">
                 Secure your account with a new password
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

            <form action={updatePassword} className="space-y-6">
                 <div className="relative group">
                    <label className="text-[10px] font-mono text-slate-500 uppercase absolute -top-2 left-2 bg-black px-1 group-focus-within:text-primary transition-colors">New Password</label>
                    <input 
                      name="password" 
                      type="password" 
                      required
                      minLength={6}
                      className="w-full bg-black border border-white/20 p-4 font-mono text-white focus:border-primary outline-none transition-all placeholder:text-slate-800"
                      placeholder="••••••••"
                    />
                 </div>

                 <div className="relative group">
                    <label className="text-[10px] font-mono text-slate-500 uppercase absolute -top-2 left-2 bg-black px-1 group-focus-within:text-primary transition-colors">Confirm Password</label>
                    <input 
                      name="confirmPassword" 
                      type="password" 
                      required
                      minLength={6}
                      className="w-full bg-black border border-white/20 p-4 font-mono text-white focus:border-primary outline-none transition-all placeholder:text-slate-800"
                      placeholder="••••••••"
                    />
                 </div>

                 <button className="btn-primary w-full py-4 text-xs flex items-center justify-center gap-2">
                    Update Password
                 </button>
            </form>
        </div>
    </div>
  )
}
