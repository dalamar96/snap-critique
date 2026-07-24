'use client'
import { User } from '@supabase/supabase-js'

import { useState } from 'react'
import { Check, Zap, Shield, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function PricingContent({ user }: { user: User | null }) {
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const router = useRouter()

  const handlePurchase = async (pkgId: string) => {
      if (!user) {
          router.push('/login?view=signup')
          return
      }
      setLoadingPkg(pkgId)
      try {
          const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packageId: pkgId })
          })
          const data = await res.json()
          if (data.url) {
              window.open(data.url, '_blank')
              setLoadingPkg(null)
          } else {
              alert('Checkout Error')
              setLoadingPkg(null)
          }
      } catch (e) {
          console.error(e)
          setLoadingPkg(null)
      }
  }

  const tiers = [
      {
          id: 'starter',
          name: 'Starter',
          credits: 5,
          price: 4.99,
          features: ['5 Full Critiques', 'Complete AI Analysis', 'Composition Scoring', 'Actionable Improvements'],
          popular: false
      },
      {
          id: 'pro',
          name: 'Pro',
          credits: 20,
          price: 14.99,
          features: ['20 Full Critiques', 'Complete AI Analysis', 'Composition Scoring', 'Actionable Improvements'],
          popular: true
      },
      {
          id: 'power',
          name: 'Power',
          credits: 50,
          price: 29.99,
          features: ['50 Full Critiques', 'Complete AI Analysis', 'Composition Scoring', 'Actionable Improvements'],
          popular: false
      }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black py-24 px-4">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest">
                    Upgrade Your Eye
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Credit Packages
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto text-lg">
                    Purchase credits to unlock deep AI analysis for your photos. 
                    <br/>Unused credits never expire.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
                {tiers.map((tier) => (
                    <motion.div 
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={cn(
                            "relative bg-white dark:bg-slate-950 border p-8 rounded-2xl transition-all duration-300",
                            tier.popular 
                                ? "border-primary shadow-2xl shadow-primary/10 scale-105 z-10" 
                                : "border-slate-200 dark:border-white/10 hover:border-primary/50"
                        )}
                    >
                        {tier.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest border-4 border-black">
                                Best Value
                            </div>
                        )}

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase mb-2">
                           {tier.name}
                        </h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">${tier.price}</span>
                            <span className="text-slate-500 font-mono text-sm">/ One-time</span>
                        </div>

                        <div className="space-y-4 mb-8">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                     <Zap className="w-5 h-5 text-primary" />
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="font-bold text-slate-900 dark:text-white">{tier.credits} Credits</span>
                                     <span className="text-xs text-slate-500">${(tier.price / tier.credits).toFixed(2)} per critique</span>
                                 </div>
                             </div>
                        </div>

                        <ul className="space-y-3 mb-8 border-t border-slate-100 dark:border-white/10 pt-8">
                            {tier.features.map(f => (
                                <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => handlePurchase(tier.id)}
                            disabled={!!loadingPkg}
                            className={cn(
                                "w-full py-4 text-center font-bold uppercase tracking-wider text-sm transition-all rounded-lg flex items-center justify-center gap-2",
                                tier.popular 
                                    ? "bg-primary text-black hover:bg-primary/90" 
                                    : "bg-slate-900 dark:bg-white/10 text-white hover:bg-black dark:hover:bg-white/20"
                            )}
                        >
                            {loadingPkg === tier.id ? 'Processing...' : (
                                <>Get {tier.name} <ArrowRight className="w-4 h-4"/></>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-16 text-center border-t border-slate-200 dark:border-white/10 pt-16">
                 <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
                     <Shield className="w-4 h-4" /> Secure Payment via Stripe. 100% Satisfaction Guarantee.
                 </div>
            </div>
        </div>
    </div>
  )
}
