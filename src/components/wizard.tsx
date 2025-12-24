'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WizardState, UserGoal, PhotographyCategory } from '@/types/wizard'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronLeft, Check, Camera, Lightbulb, User, Terminal } from 'lucide-react'

// Steps: 0 = Upload (handled locally or passed in), 1 = Category, 2 = Goals, 3 = Context

export function QuestionnaireWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPath = searchParams.get('path')

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<WizardState>({
    file: null, 
    category: null,
    goals: [],
    context: ''
  })
  
  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const toggleGoal = (goal: UserGoal) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const setCategory = (cat: PhotographyCategory) => {
    setState(prev => ({ ...prev, category: cat }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
       const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             imagePath: initialPath, 
             category: state.category,
             goals: state.goals,
             context: state.context
          })
       })
       
       const data = await res.json()
       
       if (data.success) {
          router.push(`/analysis/${data.id}`) 
       } else {
          alert('Analysis failed: ' + data.error)
          setIsSubmitting(false)
       }

    } catch (e) {
       console.error(e)
       alert('System Error')
       setIsSubmitting(false)
    }
 }

  if (isSubmitting) {
      return (
          <div className="w-full max-w-2xl mx-auto p-12 text-center font-mono space-y-6">
              <div className="text-primary animate-pulse text-6xl mb-4">
                  <Terminal className="w-24 h-24 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold uppercase text-white">Analysis in Progress</h2>
              <div className="w-full bg-white/10 h-1 overflow-hidden">
                  <div className="h-full bg-primary animate-progress-indeterminate" />
              </div>
              <p className="text-slate-400 uppercase tracking-widest text-xs">
                  Deciphering Pixels... Extracting Metadata... Formulating Critique...
              </p>
          </div>
      )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 font-mono">
       
       {/* Header HUD */}
       <div className="flex justify-between items-end border-b border-white/20 pb-4 mb-8">
          <div>
            <h1 className="text-sm text-primary uppercase tracking-widest mb-1">Critique Setup</h1>
            <div className="text-2xl font-bold bg-black inline-block text-white">
               STEP 0{step} / 03
            </div>
          </div>
          <div className="flex gap-1">
             {[1, 2, 3].map((i) => (
               <div 
                 key={i} 
                 className={cn("w-12 h-2 skew-x-[-20deg]", i <= step ? "bg-primary" : "bg-white/10")}
               />
             ))}
          </div>
       </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: CATEGORY */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold uppercase">What kind of shot?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as PhotographyCategory)}
                  className={cn(
                    "p-6 border text-left transition-all hover:border-primary group relative overflow-hidden",
                    state.category === cat.id 
                      ? "border-primary bg-primary/10" 
                      : "border-white/10 bg-black"
                  )}
                >
                  <div className={cn("absolute top-0 right-0 p-1 bg-primary text-black text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity", state.category === cat.id && "opacity-100")}>
                    SEL
                  </div>
                  <span className="text-2xl block mb-2 grayscale group-hover:grayscale-0">{cat.emoji}</span>
                  <span className="font-bold uppercase text-sm tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex justify-end pt-8">
              <button 
                onClick={nextStep}
                disabled={!state.category}
                className="btn-primary"
              >
                PROCEED &gt;&gt;
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: GOALS */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold uppercase">Your Goals</h2>
            <p className="text-slate-500 uppercase tracking-widest text-xs">What were you going for?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id as UserGoal)}
                  className={cn(
                    "p-4 border flex items-center justify-between transition-all hover:border-primary/50 group",
                    state.goals.includes(goal.id as UserGoal)
                      ? "border-primary bg-primary/5"
                      : "border-white/10 bg-black"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 border border-white/20 group-hover:border-primary text-white", state.goals.includes(goal.id as UserGoal) && "border-primary text-primary bg-primary/20")}>
                        {goal.icon}
                    </div>
                    <span className="font-bold uppercase tracking-wider text-sm text-left">{goal.label}</span>
                  </div>
                  {state.goals.includes(goal.id as UserGoal) && <div className="w-3 h-3 bg-primary box-shadow-glow" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-8 border-t border-white/10 mt-8">
              <button onClick={prevStep} className="text-slate-500 hover:text-white uppercase tracking-widest text-xs"> &lt; Back</button>
              <button 
                onClick={nextStep}
                disabled={state.goals.length === 0}
                className="btn-primary"
              >
                Confirm Goals &gt;&gt;
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CONTEXT */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
          >
             <h2 className="text-3xl font-bold uppercase">Any Context?</h2>
             <p className="text-slate-500 uppercase tracking-widest text-xs">Tell us a bit more about the situation.</p>

             <div className="relative">
                <div className="absolute top-0 right-0 text-[10px] text-primary/50 p-2 font-mono">TEXT</div>
                <textarea
                    value={state.context}
                    onChange={(e) => setState(p => ({ ...p, context: e.target.value }))}
                    placeholder="E.g. Shot on iPhone at sunset, was rushing..."
                    className="w-full h-40 p-4 border border-white/20 bg-black font-mono text-sm text-white placeholder:text-slate-700 focus:border-primary outline-none"
                />
             </div>

            <div className="flex justify-between pt-8 border-t border-white/10">
              <button onClick={prevStep} className="text-slate-500 hover:text-white uppercase tracking-widest text-xs"> &lt; Back</button>
              <button 
                onClick={handleSubmit}
                className="btn-primary w-full md:w-auto text-lg py-6"
              >
                GET FEEDBACK
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

const CATEGORIES = [
  { id: 'portrait', label: 'Portrait', emoji: '👤' },
  { id: 'landscape', label: 'Landscape', emoji: '🏔️' },
  { id: 'street', label: 'Street', emoji: '🏙️' },
  { id: 'wildlife', label: 'Wildlife', emoji: '🦁' },
  { id: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { id: 'macro', label: 'Macro/Detail', emoji: '🌺' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

const GOALS = [
    { id: 'composition', label: 'Composition', icon: <Camera className="w-5 h-5"/> },
    { id: 'lighting', label: 'Lighting / Mood', icon: <Lightbulb className="w-5 h-5"/> },
    { id: 'posing', label: 'Subject Posing', icon: <User className="w-5 h-5"/> },
    { id: 'technical', label: 'Tech / Settings', icon: <Camera className="w-5 h-5"/> },
]
