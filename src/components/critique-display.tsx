'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, AlertTriangle, ArrowRight, Lock, Terminal, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { unlockAnalysis } from '@/app/analysis/actions'


interface AssessmentItem {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface AnalysisResult {
  title: string
  score: number
  description: string
  strengths: string[]
  improvements: AssessmentItem[]
  technical_assessment: string
  next_steps: string[]
  preview_summary: string
}

// ... (imports)

// ... (AssessmentItem, AnalysisResult interfaces)

export function CritiqueDisplay({ 
  analysis, 
  analysisId, 
  isUnlocked = false, 
  imageUrl,
  userCredits = 0,
  isGuest = true
}: { 
  analysis: AnalysisResult, 
  analysisId?: string, 
  isUnlocked?: boolean, 
  imageUrl?: string | null,
  userCredits?: number,
  isGuest?: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const handleUnlock = async () => {
     if (isGuest) {
         // Redirect to login with return path
         // We use window.location.pathname to return to this analysis page
         window.location.href = `/login?view=signup&next=${encodeURIComponent(window.location.pathname)}`
         return
     }

     if (userCredits < 1) {
         window.location.href = '/pricing'
         return
     }

     setIsLoading(true)
     try {
         if (analysisId) {
            const result = await unlockAnalysis(analysisId)
            if (result.error) {
                alert(result.error)
            }
         }
     } catch (e) {
         console.error(e)
         alert('Unlock failed')
     } finally {
         setIsLoading(false)
     }
  }

  const handlePrint = () => {
     window.print()
  }
  
  if (!isUnlocked) {
     return (
      <div className="space-y-8 relative font-mono">
        <div className="bg-black border border-white/10 p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-50">
              <Lock className="w-12 h-12 text-white/5" />
           </div>
           
           <div className="flex items-center gap-2 mb-4 border-b border-primary/30 pb-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Critique Preview</span>
           </div>
           <h2 className="text-2xl font-bold mb-2 uppercase text-white">{analysis.title}</h2>
           <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-primary/20 pl-4">{analysis.preview_summary}</p>
        </div>

        <div className="relative overflow-hidden border border-white/5 bg-black min-h-[400px]">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
           {imageUrl ? (
              <div className="absolute inset-0">
                  <img src={imageUrl} alt="Analysis Target" className="w-full h-full object-cover blur-sm opacity-50 grayscale" />
              </div>
           ) : (
             <div className="p-6 blur-md select-none opacity-30 space-y-6 grayscale">
                <div className="h-8 bg-white/20 w-1/3 rounded-none"></div>
                <div className="h-4 bg-white/20 w-full rounded-none"></div>
                <div className="h-4 bg-white/20 w-5/6 rounded-none"></div>
                <div className="h-32 bg-white/20 w-full rounded-none"></div>
             </div>
           )}
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-6 text-center border-t border-b border-primary/50 my-10 backdrop-blur-sm">
              <div className="bg-primary/20 text-primary p-4 rounded-full mb-4 border border-primary">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2 uppercase tracking-widest text-white">Full Report Locked</h3>
              <p className="text-slate-400 mb-6 max-w-sm text-xs font-mono uppercase">
                {isGuest ? (
                    <>Unlock your full analysis + get 5 free credits by creating an account.</>
                ) : (
                    <>Unlock to view {analysis.improvements.length} improvements & checklist.<br/>Balance: {userCredits} Credits</>
                )}
              </p>
              <button onClick={handleUnlock} disabled={isLoading} className="btn-primary text-xl py-6 px-10 hover:bg-primary hover:text-black disabled:opacity-50">
                {isLoading ? 'Processing...' : (
                    isGuest ? 'Sign Up to Unlock (Free)' : 
                    userCredits > 0 ? 'Unlock (1 Credit)' : 'Get Credits'
                )}
              </button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-mono print:space-y-4">
      {/* Header Score */}
      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between border-b border-white/20 pb-8 print:pb-4 print:border-black">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest mb-2 print:text-black">
             <Search className="w-4 h-4" />
             Analysis Complete
          </div>
          <h1 className="text-4xl font-bold text-white uppercase mb-4 print:text-black">{analysis.title}</h1>
          <p className="text-slate-400 max-w-xl border-l-2 border-white/10 pl-4 print:text-black print:border-black">{analysis.description}</p>
        </div>
        
        <div className="flex flex-col items-end gap-4">
            <div className="flex flex-col items-center border border-white/10 bg-white/5 p-6 min-w-[150px] print:border-black print:bg-transparent">
               <span className="text-xs uppercase tracking-widest text-slate-500 mb-2 print:text-black">Composition Score</span>
               <div className="text-6xl font-black text-primary print:text-black">{analysis.score}</div>
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 hover:text-white print:hidden">
                <Terminal className="w-4 h-4" /> Print / Save PDF
            </button>
        </div>
      </div>

      {imageUrl && (
        <div className="w-full h-64 md:h-96 border border-white/10 bg-black overflow-hidden group print:border-black relative">
            <img src={imageUrl} alt="Analysis Subject" className="w-full h-full object-contain" />
            <div className="absolute top-0 right-0 p-2 bg-black/50 backdrop-blur text-[10px] text-primary font-mono uppercase border-b border-l border-white/10">
                Analyzed Image
            </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 print:block print:gap-4 print:space-y-4">
        
        {/* Strengths */}
        <div className="border border-green-900/50 bg-green-900/5 p-6 print:border-black print:bg-transparent">
          <h3 className="text-green-500 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider border-b border-green-900/50 pb-2 print:text-black print:border-black">
            <Check className="w-5 h-5"/> Key Strengths
          </h3>
          <ul className="space-y-3">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex gap-3 text-slate-300 text-sm print:text-black">
                <span className="text-green-500 font-bold print:text-black">&gt;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Technical */}
        <div className="border border-white/10 bg-black p-6 print:border-black print:bg-transparent print:text-black">
           <h3 className="font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-slate-300 border-b border-white/10 pb-2 print:text-black print:border-black">
            <Star className="w-5 h-5 text-yellow-500 print:text-black"/> Technical Details
          </h3>
          <p className="text-slate-400 text-sm print:text-black">
            {analysis.technical_assessment}
          </p>
        </div>
      </div>

      {/* Improvements (Ranked & Focus Mode) */}
      <div className="print:break-before-auto">
        <h3 className="text-xl font-bold mb-6 uppercase tracking-widest text-white border-l-4 border-primary pl-4 print:text-black print:border-black">Areas for Improvement</h3>
        <div className="space-y-4">
          {analysis.improvements.map((item, i) => (
            <motion.div 
                key={i} 
                className={cn(
                    "bg-black border p-6 flex flex-col md:flex-row gap-6 transition-all group cursor-pointer print:border-black print:bg-transparent",
                    focusedIndex === i ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-white/10 hover:border-primary/50"
                )}
                onClick={() => setFocusedIndex(focusedIndex === i ? null : i)}
                animate={{ scale: focusedIndex === i ? 1.02 : 1 }}
            >
               <div className={cn(
                 "w-full md:w-1 h-1 md:h-auto shrink-0 print:hidden",
                 item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
               )} />
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg text-white uppercase group-hover:text-primary transition-colors print:text-black">{item.title}</h4>
                    {item.priority === 'high' && <span className="text-[10px] bg-red-900/30 text-red-500 px-2 py-0.5 border border-red-900 font-bold uppercase tracking-wider print:border-black print:text-red-600 print:bg-transparent">High Priority</span>}
                  </div>
                  <p className="text-slate-400 text-sm print:text-black">{item.description}</p>
                  
                  {/* Focus Mode Expansion */}
                  {focusedIndex === i && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-primary/20 text-primary text-xs uppercase tracking-widest print:block"
                      >
                          Focus on this visual element in your next shot.
                      </motion.div>
                  )}
               </div>
               <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                   <ArrowRight className="w-5 h-5" />
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-primary/5 p-8 border border-primary/20 print:bg-transparent print:border-black">
         <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-white print:text-black">
            <ArrowRight className="w-6 h-6 text-primary print:text-black"/> Action Plan
         </h3>
         <div className="grid gap-4">
           {analysis.next_steps.map((step, i) => (
             <div key={i} className="flex items-start gap-4 p-4 border border-white/5 bg-black md:hover:bg-white/5 transition-colors print:border-black print:bg-transparent">
                <div className="text-primary font-bold text-xl opacity-50 print:text-black">
                  0{i + 1}
                </div>
                <span className="font-medium pt-1 text-slate-300 text-sm print:text-black">{step}</span>
             </div>
           ))}
         </div>
      </div>

    </div>
  )
}
